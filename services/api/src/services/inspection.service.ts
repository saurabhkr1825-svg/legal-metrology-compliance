import { v4 as uuidv4 } from 'uuid';
import { query } from '../db';
import { Inspection, InspectionStatus, InspectionResult, VALID_STATUS_TRANSITIONS, ImageMetadata, GeoLocation, Declaration } from '@slm/shared';
import { logAuditEvent } from './audit.service';
import { AuditAction } from '@slm/shared';

export interface CreateInspectionData {
  clientUuid: string;
  officerId: string;
  status: InspectionStatus;
  imageUrl?: string;
  imageMetadata?: ImageMetadata;
  capturedAt: Date;
  location?: GeoLocation;
  notes?: string;
}

export interface UpdateInspectionStatusData {
  inspectionId: string;
  newStatus: InspectionStatus;
  userId: string;
}

export interface ListInspectionsFilters {
  officerId?: string;
  status?: InspectionStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ReviewInspectionData {
  inspectionId: string;
  reviewerId: string;
  reviewedDeclaration: Declaration;
  result: InspectionResult;
  notes?: string;
}

function mapRowToInspection(row: any): Inspection {
  return {
    id: row.id,
    clientUuid: row.client_uuid,
    officerId: row.officer_id,
    status: row.status as InspectionStatus,
    result: row.result as InspectionResult | undefined,
    imageUrl: row.image_url,
    imageMetadata: row.image_metadata,
    rawOcrData: row.raw_ocr_data,
    declaration: row.declaration,
    reviewedDeclaration: row.reviewed_declaration,
    violations: row.violations || [],
    ruleVersion: row.rule_version,
    capturedAt: row.captured_at,
    uploadedAt: row.uploaded_at,
    processedAt: row.processed_at,
    reviewedAt: row.reviewed_at,
    completedAt: row.completed_at,
    location: row.location,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createInspection(data: CreateInspectionData): Promise<Inspection> {
  const res = await query(
    `INSERT INTO inspections (client_uuid, officer_id, status, image_url, image_metadata, captured_at, location, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.clientUuid,
      data.officerId,
      data.status,
      data.imageUrl || null,
      data.imageMetadata ? JSON.stringify(data.imageMetadata) : null,
      data.capturedAt,
      data.location ? JSON.stringify(data.location) : null,
      data.notes || null,
    ]
  );

  const inspection = mapRowToInspection(res.rows[0]);

  // Log audit event
  await logAuditEvent({
    userId: data.officerId,
    action: AuditAction.INSPECTION_CREATED,
    resourceType: 'inspection',
    resourceId: inspection.id,
    metadata: { clientUuid: data.clientUuid, status: data.status },
  });

  return inspection;
}

export async function getInspectionById(id: string): Promise<Inspection | null> {
  const res = await query('SELECT * FROM inspections WHERE id = $1', [id]);
  if (res.rows.length === 0) return null;
  return mapRowToInspection(res.rows[0]);
}

export async function getInspectionByClientUuid(clientUuid: string): Promise<Inspection | null> {
  const res = await query('SELECT * FROM inspections WHERE client_uuid = $1', [clientUuid]);
  if (res.rows.length === 0) return null;
  return mapRowToInspection(res.rows[0]);
}

export async function getInspectionsByOfficer(
  officerId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ items: Inspection[]; total: number }> {
  return listInspections({ officerId, limit, offset });
}

export async function listInspections(
  filters: ListInspectionsFilters = {}
): Promise<{ items: Inspection[]; total: number }> {
  const { officerId, status, startDate, endDate, limit = 20, offset = 0 } = filters;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (officerId) {
    conditions.push(`officer_id = $${paramIndex++}`);
    params.push(officerId);
  }

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }

  if (startDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM inspections ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const queryParams = [...params, limit, offset];
  const dataRes = await query(
    `SELECT * FROM inspections ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    queryParams
  );

  const items = dataRes.rows.map(mapRowToInspection);
  return { items, total };
}

export async function reviewInspection(data: ReviewInspectionData): Promise<Inspection | null> {
  const current = await getInspectionById(data.inspectionId);
  if (!current) return null;

  // Review can only be applied to inspections in REVIEW_REQUIRED or PROCESSING status
  if (current.status !== InspectionStatus.REVIEW_REQUIRED && current.status !== InspectionStatus.PROCESSING) {
    throw new Error(
      `Cannot review inspection in ${current.status} status. Must be REVIEW_REQUIRED or PROCESSING.`
    );
  }

  const res = await query(
    `UPDATE inspections
     SET status = $1,
         result = $2,
         reviewed_declaration = $3,
         notes = COALESCE($4, notes),
         reviewed_at = NOW(),
         completed_at = NOW(),
         updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [
      InspectionStatus.COMPLETED,
      data.result,
      JSON.stringify(data.reviewedDeclaration),
      data.notes || null,
      data.inspectionId,
    ]
  );

  if (res.rows.length === 0) return null;

  const updated = mapRowToInspection(res.rows[0]);

  await logAuditEvent({
    userId: data.reviewerId,
    action: AuditAction.INSPECTION_REVIEWED,
    resourceType: 'inspection',
    resourceId: data.inspectionId,
    changes: { from: current.status, to: InspectionStatus.COMPLETED, result: data.result },
  });

  return updated;
}

export async function updateInspectionStatus(data: UpdateInspectionStatusData): Promise<Inspection | null> {
  // First, get the current inspection
  const current = await getInspectionById(data.inspectionId);
  if (!current) return null;

  // Validate state transition
  const allowedTransitions = VALID_STATUS_TRANSITIONS[current.status];
  if (!allowedTransitions.includes(data.newStatus)) {
    throw new Error(
      `Invalid state transition: ${current.status} -> ${data.newStatus}. Allowed: ${allowedTransitions.join(', ')}`
    );
  }

  // Update status with appropriate timestamp
  let timestampColumn = '';
  if (data.newStatus === InspectionStatus.QUEUED) timestampColumn = 'uploaded_at';
  else if (data.newStatus === InspectionStatus.PROCESSING) timestampColumn = 'processed_at';
  else if (data.newStatus === InspectionStatus.REVIEW_REQUIRED) timestampColumn = 'processed_at';
  else if (data.newStatus === InspectionStatus.COMPLETED) timestampColumn = 'completed_at';

  const timestampUpdate = timestampColumn ? `, ${timestampColumn} = NOW()` : '';

  const res = await query(
    `UPDATE inspections
     SET status = $1, updated_at = NOW()${timestampUpdate}
     WHERE id = $2
     RETURNING *`,
    [data.newStatus, data.inspectionId]
  );

  if (res.rows.length === 0) return null;

  const updated = mapRowToInspection(res.rows[0]);

  // Log audit event
  await logAuditEvent({
    userId: data.userId,
    action: 'INSPECTION_STATUS_CHANGED',
    resourceType: 'inspection',
    resourceId: data.inspectionId,
    changes: { from: current.status, to: data.newStatus },
  });

  return updated;
}

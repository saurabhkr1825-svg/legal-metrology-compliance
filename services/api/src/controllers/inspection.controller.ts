import { Request, Response } from 'express';
import { z } from 'zod';
import { InspectionStatus, UserRole } from '@slm/shared';
import { createInspection, getInspectionById, getInspectionsByOfficer, getInspectionByClientUuid } from '../services/inspection.service';
import { sendSuccess, sendError } from '../middleware/response';

const CreateInspectionSchema = z.object({
  clientUuid: z.string().uuid('Invalid client UUID'),
  status: z.nativeEnum(InspectionStatus).default(InspectionStatus.QUEUED),
  imageUrl: z.string().url('Invalid image URL').optional(),
  imageMetadata: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    format: z.string(),
    sizeBytes: z.number().int().positive(),
    captureMode: z.enum(['camera', 'upload']),
  }).optional(),
  capturedAt: z.string().datetime().transform((val) => new Date(val)),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
    timestamp: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  }).optional(),
  notes: z.string().max(1000).optional(),
});

export async function createInspectionHandler(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const parseResult = CreateInspectionSchema.safeParse(req.body);

  if (!parseResult.success) {
    sendError(res, 'VALIDATION_ERROR', 'Invalid request body', 400, {
      errors: parseResult.error.issues,
    });
    return;
  }

  const data = parseResult.data;

  // Check for idempotency: if clientUuid already exists, return existing inspection
  const existing = await getInspectionByClientUuid(data.clientUuid);
  if (existing) {
    // Only owner or admin can retrieve
    if (existing.officerId !== user.id && user.role !== UserRole.ADMIN) {
      sendError(res, 'FORBIDDEN', 'Access denied to existing inspection.', 403);
      return;
    }
    sendSuccess(res, { inspection: existing }, 200);
    return;
  }

  try {
    const inspection = await createInspection({
      clientUuid: data.clientUuid,
      officerId: user.id,
      status: data.status,
      imageUrl: data.imageUrl,
      imageMetadata: data.imageMetadata,
      capturedAt: data.capturedAt,
      location: data.location,
      notes: data.notes,
    });

    sendSuccess(res, { inspection }, 201);
  } catch (err: any) {
    console.error('[INSPECTION] Error creating inspection:', err);
    sendError(res, 'INTERNAL_ERROR', 'Failed to create inspection', 500);
  }
}

export async function getInspectionByIdHandler(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;

  const inspection = await getInspectionById(id);
  if (!inspection) {
    sendError(res, 'NOT_FOUND', 'Inspection not found', 404);
    return;
  }

  // Check ownership: officer can only see own inspections, admin/supervisor can see all
  if (inspection.officerId !== user.id && user.role === UserRole.FIELD_OFFICER) {
    sendError(res, 'FORBIDDEN', 'Access denied to this inspection', 403);
    return;
  }

  sendSuccess(res, { inspection });
}

export async function listInspectionsHandler(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const limit = Math.min(parseInt(req.query.limit as string || '20', 10), 100);
  const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
  const offset = (page - 1) * limit;

  // Officers can only list their own inspections; admins/supervisors could list more (or pass officerId filter)
  const result = await getInspectionsByOfficer(user.id, limit, offset);

  sendSuccess(res, {
    items: result.items,
    total: result.total,
    page,
    pageSize: limit,
    hasMore: offset + result.items.length < result.total,
  });
}

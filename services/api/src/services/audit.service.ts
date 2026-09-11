import { query } from '../db';
import { AuditAction, AuditLog } from '@slm/shared';

export interface CreateAuditLogParams {
  userId?: string;
  action: AuditAction | string;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ListAuditLogsFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

function mapRowToAuditLog(row: any): AuditLog {
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action as AuditAction,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    changes: row.changes,
    metadata: row.metadata,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    timestamp: row.timestamp,
  };
}

export async function logAuditEvent(params: CreateAuditLogParams): Promise<void> {
  try {
    const { userId, action, resourceType, resourceId, changes, metadata, ipAddress, userAgent } = params;
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, changes, metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId || null,
        action,
        resourceType,
        resourceId || null,
        changes ? JSON.stringify(changes) : null,
        metadata ? JSON.stringify(metadata) : null,
        ipAddress || null,
        userAgent || null,
      ]
    );
  } catch (err) {
    // Non-blocking: log error to console, do not throw
    console.error('[AUDIT] Failed to record audit log:', err);
  }
}

export async function listAuditLogs(
  filters: ListAuditLogsFilters = {}
): Promise<{ items: AuditLog[]; total: number }> {
  const { userId, action, resourceType, resourceId, startDate, endDate, limit = 50, offset = 0 } = filters;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(userId);
  }

  if (action) {
    conditions.push(`action = $${paramIndex++}`);
    params.push(action);
  }

  if (resourceType) {
    conditions.push(`resource_type = $${paramIndex++}`);
    params.push(resourceType);
  }

  if (resourceId) {
    conditions.push(`resource_id = $${paramIndex++}`);
    params.push(resourceId);
  }

  if (startDate) {
    conditions.push(`timestamp >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`timestamp <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM audit_logs ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const queryParams = [...params, limit, offset];
  const dataRes = await query(
    `SELECT * FROM audit_logs ${whereClause} ORDER BY timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    queryParams
  );

  const items = dataRes.rows.map(mapRowToAuditLog);
  return { items, total };
}


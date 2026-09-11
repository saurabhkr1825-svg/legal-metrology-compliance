import { query } from '../db';
import { AuditAction } from '@slm/shared';

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

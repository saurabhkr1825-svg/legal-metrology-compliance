import * as db from '../src/db';
import { AuditAction } from '@slm/shared';
import { logAuditEvent, listAuditLogs } from '../src/services/audit.service';

describe('Audit Logging & Querying Service', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should record an audit event to the database', async () => {
    const querySpy = jest.spyOn(db, 'query').mockResolvedValue({
      rows: [],
      rowCount: 1,
    } as any);

    await logAuditEvent({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      action: AuditAction.USER_LOGIN,
      resourceType: 'user',
      resourceId: '123e4567-e89b-12d3-a456-426614174000',
      metadata: { success: true },
      ipAddress: '127.0.0.1',
    });

    expect(querySpy).toHaveBeenCalled();
    const queryText = querySpy.mock.calls[0][0];
    expect(queryText).toContain('INSERT INTO audit_logs');
  });

  it('should list audit logs with filters and pagination', async () => {
    jest.spyOn(db, 'query')
      .mockResolvedValueOnce({
        rows: [{ count: '1' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '123e4567-e89b-12d3-a456-426614174001',
            action: AuditAction.INSPECTION_CREATED,
            resource_type: 'inspection',
            resource_id: '123e4567-e89b-12d3-a456-426614174002',
            changes: null,
            metadata: { clientUuid: 'test-uuid' },
            ip_address: '127.0.0.1',
            user_agent: 'MobileClient/1.0',
            timestamp: new Date(),
          },
        ],
        rowCount: 1,
      } as any);

    const result = await listAuditLogs({ action: AuditAction.INSPECTION_CREATED });
    expect(result.total).toBe(1);
    expect(result.items.length).toBe(1);
    expect(result.items[0].action).toBe(AuditAction.INSPECTION_CREATED);
    expect(result.items[0].resourceType).toBe('inspection');
  });
});

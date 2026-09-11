import { Request, Response } from 'express';
import { listAuditLogs } from '../services/audit.service';
import { sendSuccess } from '../middleware/response';

export async function listAuditLogsHandler(req: Request, res: Response): Promise<void> {
  const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 100);
  const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
  const offset = (page - 1) * limit;

  const userId = req.query.userId as string | undefined;
  const action = req.query.action as string | undefined;
  const resourceType = req.query.resourceType as string | undefined;
  const resourceId = req.query.resourceId as string | undefined;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const result = await listAuditLogs({
    userId,
    action,
    resourceType,
    resourceId,
    startDate,
    endDate,
    limit,
    offset,
  });

  sendSuccess(res, {
    items: result.items,
    total: result.total,
    page,
    pageSize: limit,
    hasMore: offset + result.items.length < result.total,
  });
}

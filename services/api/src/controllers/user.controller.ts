import { Request, Response } from 'express';
import { UserRole } from '@slm/shared';
import { listUsers, getUserById } from '../services/user.service';
import { sendSuccess, sendError } from '../middleware/response';

export async function listUsersHandler(req: Request, res: Response): Promise<void> {
  const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 100);
  const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
  const offset = (page - 1) * limit;

  const role = req.query.role as UserRole | undefined;

  const result = await listUsers(role, limit, offset);

  sendSuccess(res, {
    items: result.items,
    total: result.total,
    page,
    pageSize: limit,
    hasMore: offset + result.items.length < result.total,
  });
}

export async function getUserByIdHandler(req: Request, res: Response): Promise<void> {
  const currentUser = req.user!;
  const { id } = req.params;

  // Field officers can only view their own user details; supervisors/admins can view any
  if (currentUser.role === UserRole.FIELD_OFFICER && currentUser.id !== id) {
    sendError(res, 'FORBIDDEN', 'Access denied to user profile', 403);
    return;
  }

  const user = await getUserById(id);
  if (!user) {
    sendError(res, 'NOT_FOUND', 'User not found', 404);
    return;
  }

  sendSuccess(res, { user });
}

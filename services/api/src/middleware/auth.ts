import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../services/auth.service';
import { getUserById } from '../services/user.service';
import { sendError } from './response';
import { User, UserRole } from '@slm/shared';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      jwtPayload?: JwtPayload;
    }
  }
}

/**
 * Middleware: Verify JWT token and attach user to request.
 * Rejects unauthenticated requests.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    sendError(res, 'INVALID_TOKEN', 'Invalid or expired token.', 401);
    return;
  }

  // Fetch user from database to ensure account is still active
  const user = await getUserById(payload.userId);

  if (!user) {
    sendError(res, 'USER_NOT_FOUND', 'User account not found.', 401);
    return;
  }

  if (!user.isActive) {
    sendError(res, 'ACCOUNT_DISABLED', 'User account is disabled.', 403);
    return;
  }

  req.user = user;
  req.jwtPayload = payload;
  next();
}

/**
 * Middleware factory: Require specific roles.
 * Must be used after requireAuth.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 'FORBIDDEN', 'Insufficient permissions.', 403);
      return;
    }

    next();
  };
}

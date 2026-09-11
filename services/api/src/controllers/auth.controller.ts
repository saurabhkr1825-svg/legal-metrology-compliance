import { Request, Response } from 'express';
import { z } from 'zod';
import { login, refreshAccessToken, logoutUser } from '../services/auth.service';
import { sendSuccess, sendError } from '../middleware/response';

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const parseResult = LoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'VALIDATION_ERROR', 'Invalid request body', 400, {
      errors: parseResult.error.issues,
    });
    return;
  }

  const { email, password } = parseResult.data;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const result = await login({ email, password }, ipAddress, userAgent);

  if (!result) {
    sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    return;
  }

  sendSuccess(res, {
    user: result.user,
    token: result.token,
  });
}

export async function getCurrentUserHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);
    return;
  }

  sendSuccess(res, { user: req.user });
}

export async function refreshTokenHandler(req: Request, res: Response): Promise<void> {
  const parseResult = RefreshSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'VALIDATION_ERROR', 'Invalid request body', 400, {
      errors: parseResult.error.issues,
    });
    return;
  }

  const { refreshToken } = parseResult.data;
  const result = await refreshAccessToken(refreshToken);

  if (!result) {
    sendError(res, 'INVALID_TOKEN', 'Invalid or expired refresh token', 401);
    return;
  }

  sendSuccess(res, {
    user: result.user,
    token: result.token,
  });
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);
    return;
  }

  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  await logoutUser(req.user.id, ipAddress, userAgent);
  sendSuccess(res, { message: 'Logged out successfully' });
}

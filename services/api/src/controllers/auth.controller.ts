import { Request, Response } from 'express';
import { z } from 'zod';
import { login } from '../services/auth.service';
import { sendSuccess, sendError } from '../middleware/response';

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
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

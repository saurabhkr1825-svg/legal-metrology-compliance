import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse } from '@slm/shared';

/**
 * Attach a unique requestId to every request for tracing and audit.
 */
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  (req as any).requestId = req.headers['x-request-id'] || uuidv4();
  next();
}

/**
 * Wrap a successful API response in the standard envelope.
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiResponse<T> = {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: (res.req as any).requestId || '',
    },
  };
  res.status(statusCode).json(body);
}

/**
 * Wrap an error API response in the standard envelope.
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: Record<string, any>,
): void {
  const body: ApiResponse = {
    success: false,
    error: { code, message, details },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: (res.req as any).requestId || '',
    },
  };
  res.status(statusCode).json(body);
}

/**
 * Global error handler.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[ERROR]', err);
  sendError(res, 'INTERNAL_ERROR', 'An internal server error occurred.', 500);
}

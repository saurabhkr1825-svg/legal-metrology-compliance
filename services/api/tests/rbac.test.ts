import { requireRole } from '../src/middleware/auth';
import { UserRole } from '@slm/shared';

function mockRequest(user?: any) {
  return {
    user,
    headers: {},
  } as any;
}

function mockResponse() {
  const res: any = {};
  res.req = { requestId: 'test-req-id' };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Role-Based Access Control Middleware', () => {
  it('should allow user with authorized role', () => {
    const middleware = requireRole([UserRole.FIELD_OFFICER, UserRole.ADMIN]);
    const req = mockRequest({ id: '1', role: UserRole.FIELD_OFFICER });
    const res = mockResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should reject user with unauthorized role', () => {
    const middleware = requireRole([UserRole.ADMIN]);
    const req = mockRequest({ id: '1', role: UserRole.FIELD_OFFICER });
    const res = mockResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('should reject unauthenticated request', () => {
    const middleware = requireRole([UserRole.FIELD_OFFICER]);
    const req = mockRequest(undefined);
    const res = mockResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should allow supervisor for review endpoints', () => {
    const middleware = requireRole([UserRole.SUPERVISOR, UserRole.ADMIN]);
    const req = mockRequest({ id: 'sup-1', role: UserRole.SUPERVISOR });
    const res = mockResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should deny field officer from review endpoints', () => {
    const middleware = requireRole([UserRole.SUPERVISOR, UserRole.ADMIN]);
    const req = mockRequest({ id: 'off-1', role: UserRole.FIELD_OFFICER });
    const res = mockResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

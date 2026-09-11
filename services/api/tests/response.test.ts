import { sendSuccess, sendError } from '../src/middleware/response';

// Minimal mock for Express Response
function mockResponse() {
  const res: any = {};
  res.req = { requestId: 'test-req-id' };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('API Response Helpers', () => {
  it('sendSuccess wraps data in standard envelope', () => {
    const res = mockResponse();
    sendSuccess(res, { foo: 'bar' });

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ foo: 'bar' });
    expect(body.metadata.requestId).toBe('test-req-id');
    expect(body.metadata.timestamp).toBeDefined();
  });

  it('sendError wraps error in standard envelope', () => {
    const res = mockResponse();
    sendError(res, 'NOT_FOUND', 'Resource not found', 404);

    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Resource not found');
  });
});

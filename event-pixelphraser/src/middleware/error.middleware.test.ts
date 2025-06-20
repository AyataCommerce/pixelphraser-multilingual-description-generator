import { Request, Response, NextFunction } from 'express';
import { errorMiddleware } from '../middleware/error.middleware';
import CustomError from '../errors/custom.error';

describe('errorMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('should handle CustomError and return proper response', () => {
    const error = new CustomError(400, 'Validation Error', [
      { statusCode: 400, message: 'Missing field' },
    ]);
    process.env.NODE_ENV = 'production';

    errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Validation Error',
      errors: error.errors,
      stack: undefined,
    });
  });

  it('should include stack in development mode for CustomError', () => {
    const error = new CustomError(404, 'Not Found');
    process.env.NODE_ENV = 'development';

    errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Not Found',
        stack: expect.any(String),
      })
    );
  });

  it('should handle unknown errors with 500 and generic message in production', () => {
    const error = new Error('Unexpected failure');
    process.env.NODE_ENV = 'production';

    errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      message: 'Internal server error',
    });
  });

  it('should send actual error message in development for unknown errors', () => {
    const error = new Error('Something broke');
    process.env.NODE_ENV = 'development';

    errorMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      messge: 'Something broke',
    });
  });
});

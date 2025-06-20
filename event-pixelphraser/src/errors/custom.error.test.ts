import CustomError from './custom.error';

describe('CustomError', () => {
  it('should create an instance with statusCode and message', () => {
    const error = new CustomError(400, 'Bad Request');

    expect(error).toBeInstanceOf(CustomError);
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad Request');
    expect(error.errors).toBeUndefined();
  });

  it('should include optional error items when provided', () => {
    const errorItems = [
      { statusCode: '400', message: 'Field A is required', referencedBy: 'fieldA' },
      { statusCode: '400', message: 'Field B must be a number' },
    ];

    const error = new CustomError(400, 'Validation failed', errorItems);

    expect(error.errors).toBeDefined();
    expect(error.errors).toHaveLength(2);
    expect(error.errors?.[0].referencedBy).toBe('fieldA');
  });

  it('should retain message from base Error class', () => {
    const error = new CustomError(404, 'Not Found');

    expect(error.message).toBe('Not Found');
    expect(error.toString()).toContain('Not Found');
  });

  it('should accept string statusCode', () => {
    const error = new CustomError('500', 'Internal Server Error');

    expect(error.statusCode).toBe('500');
    expect(typeof error.statusCode).toBe('string');
  });
});

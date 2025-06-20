import { readConfiguration } from '../utils/config.utils';
import CustomError from '../errors/custom.error';
import * as envValidatorModule from '../validators/env.validators';
import * as helperValidatorModule from '../validators/helpers.validators';

jest.mock('../validators/env.validators', () => ({
  __esModule: true,
  default: {}, // Mock validator object
}));

jest.mock('../validators/helpers.validators', () => ({
  getValidateMessages: jest.fn(),
}));

describe('readConfiguration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Clear cached modules
    process.env = { ...originalEnv }; // Clone original
  });

  afterEach(() => {
    process.env = originalEnv; // Restore after test
    jest.clearAllMocks();
  });

  it('should return config object when validation passes', () => {
    // ✅ Setup valid env vars
    process.env.CLIENT_ID = 'test-client-id';
    process.env.CLIENT_SECRET = 'test-secret';
    process.env.PROJECT_KEY = 'test-key';
    process.env.SCOPE = 'read write';
    process.env.REGION = 'us';

    // 🧪 Mock helper to return no validation errors
    (helperValidatorModule.getValidateMessages as jest.Mock).mockReturnValue([]);

    const config = readConfiguration();

    expect(config).toEqual({
      clientId: 'test-client-id',
      clientSecret: 'test-secret',
      projectKey: 'test-key',
      scope: 'read write',
      region: 'us',
    });

    expect(helperValidatorModule.getValidateMessages).toHaveBeenCalledWith(
      envValidatorModule.default,
      expect.objectContaining({
        clientId: 'test-client-id',
      })
    );
  });

  it('should throw CustomError if validation errors are returned', () => {
    const validationErrors = [
      { statusCode: '400', message: 'CLIENT_ID is missing' },
    ];

    (helperValidatorModule.getValidateMessages as jest.Mock).mockReturnValue(validationErrors);

    // ❌ Incomplete env
    delete process.env.CLIENT_ID;

    expect(() => readConfiguration()).toThrow(CustomError);

    try {
      readConfiguration();
    } catch (error) {
      expect(error).toBeInstanceOf(CustomError);
      expect((error as CustomError).statusCode).toBe('InvalidEnvironmentVariablesError');
      expect((error as CustomError).errors).toEqual(validationErrors);
    }
  });
});

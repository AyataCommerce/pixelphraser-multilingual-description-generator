// google-cloud-setup.test.js
import { jest } from '@jest/globals';

// Mock all external dependencies before importing the module
const mockGoogleAuth = jest.fn();
const mockImageAnnotatorClient = jest.fn();
const mockGoogleGenerativeAI = jest.fn();
const mockGetGenerativeModel = jest.fn();

// Mock the modules
jest.mock('google-auth-library', () => ({
    GoogleAuth: mockGoogleAuth
}));

jest.mock('@google-cloud/vision', () => ({
    ImageAnnotatorClient: mockImageAnnotatorClient
}));

jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: mockGoogleGenerativeAI
}));

jest.mock('dotenv', () => ({
    config: jest.fn()
}));

// Mock process.env
const originalEnv = process.env;

describe('Google Cloud Setup', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        
        // Reset process.env
        process.env = { ...originalEnv };
        
        // Setup default mock implementations
        mockGoogleAuth.mockImplementation(() => ({}));
        mockImageAnnotatorClient.mockImplementation(() => ({}));
        mockGoogleGenerativeAI.mockImplementation(() => ({
            getGenerativeModel: mockGetGenerativeModel
        }));
        mockGetGenerativeModel.mockReturnValue({});
    });

    afterEach(() => {
        // Restore original process.env
        process.env = originalEnv;
        
        // Clear the module cache to ensure fresh imports
        jest.resetModules();
    });

    describe('Environment Variable Validation', () => {
        test('should throw error when BASE64_ENCODED_GCP_SERVICE_ACCOUNT is not set', async () => {
            // Arrange
            delete process.env.BASE64_ENCODED_GCP_SERVICE_ACCOUNT;
            process.env.GENERATIVE_AI_API_KEY = 'test-api-key';
            process.env.GEMINI_MODEL = 'test-model';

            // Act & Assert
            await expect(async () => {
                await import('./ai.config');
            }).rejects.toThrow('BASE64_ENCODED_GCP_SERVICE_ACCOUNT environment variable is not set.');
        });

        test('should throw error when GENERATIVE_AI_API_KEY is not set', async () => {
            // Arrange
            process.env.BASE64_ENCODED_GCP_SERVICE_ACCOUNT = Buffer.from('{"test": "value"}').toString('base64');
            delete process.env.GENERATIVE_AI_API_KEY;
            process.env.GEMINI_MODEL = 'test-model';

            // Act & Assert
            await expect(async () => {
                await import('./ai.config');
            }).rejects.toThrow('GENERATIVE_AI_API_KEY environment variable is not set.');
        });

        test('should throw error when GEMINI_MODEL is not set', async () => {
            // Arrange
            process.env.BASE64_ENCODED_GCP_SERVICE_ACCOUNT = Buffer.from('{"test": "value"}').toString('base64');
            process.env.GENERATIVE_AI_API_KEY = 'test-api-key';
            delete process.env.GEMINI_MODEL;

            // Act & Assert
            await expect(async () => {
                await import('./ai.config');
            }).rejects.toThrow('GEMINI_MODEL environment variable is not set.');
        });
    });

    describe('Successful Initialization', () => {
        test('should initialize all clients when all environment variables are set', async () => {
            // Arrange
            const mockCredentials = {
                type: 'service_account',
                project_id: 'test-project',
                private_key_id: 'test-key-id',
                private_key: 'test-private-key',
                client_email: 'test@test-project.iam.gserviceaccount.com',
                client_id: 'test-client-id'
            };
            
            process.env.BASE64_ENCODED_GCP_SERVICE_ACCOUNT = Buffer.from(JSON.stringify(mockCredentials)).toString('base64');
            process.env.GENERATIVE_AI_API_KEY = 'test-api-key';
            process.env.GEMINI_MODEL = 'gemini-pro';

            // Act
            const module = await import('./ai.config');

            // Assert
            expect(mockGoogleAuth).toHaveBeenCalledWith({
                credentials: mockCredentials,
                scopes: ['https://www.googleapis.com/auth/cloud-platform']
            });

            expect(mockImageAnnotatorClient).toHaveBeenCalledWith({
                auth: expect.any(Object)
            });

            expect(mockGoogleGenerativeAI).toHaveBeenCalledWith('test-api-key');

            expect(mockGetGenerativeModel).toHaveBeenCalledWith({
                model: 'gemini-pro'
            });

            // Verify exports exist
            expect(module.visionClient).toBeDefined();
            expect(module.genAI).toBeDefined();
            expect(module.model).toBeDefined();
        });

        test('should properly decode base64 encoded service account', async () => {
            // Arrange
            const mockCredentials = {
                type: 'service_account',
                project_id: 'test-project-123',
                private_key_id: 'key-123',
                private_key: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
                client_email: 'service@test-project-123.iam.gserviceaccount.com',
                client_id: '123456789'
            };
            
            const base64Credentials = Buffer.from(JSON.stringify(mockCredentials)).toString('base64');
            
            process.env.BASE64_ENCODED_GCP_SERVICE_ACCOUNT = base64Credentials;
            process.env.GENERATIVE_AI_API_KEY = 'test-api-key-123';
            process.env.GEMINI_MODEL = 'gemini-1.5-pro';

            // Act
            await import('./ai.config');

            // Assert
            expect(mockGoogleAuth).toHaveBeenCalledWith({
                credentials: mockCredentials,
                scopes: ['https://www.googleapis.com/auth/cloud-platform']
            });
        });
    });

    describe('Error Handling', () => {
        test('should throw error when base64 decoding fails', async () => {
            // Arrange
            process.env.BASE64_ENCODED_GCP_SERVICE_ACCOUNT = 'invalid-base64!@#';
            process.env.GENERATIVE_AI_API_KEY = 'test-api-key';
            process.env.GEMINI_MODEL = 'test-model';

            // Act & Assert
            await expect(async () => {
                await import('./ai.config');
            }).rejects.toThrow();
        });

        test('should throw error when JSON parsing fails', async () => {
            // Arrange
            const invalidJson = 'not-valid-json';
            process.env.BASE64_ENCODED_GCP_SERVICE_ACCOUNT = Buffer.from(invalidJson).toString('base64');
            process.env.GENERATIVE_AI_API_KEY = 'test-api-key';
            process.env.GEMINI_MODEL = 'test-model';

            // Act & Assert
            await expect(async () => {
                await import('./ai.config');
            }).rejects.toThrow();
        });
    });

    describe('Client Configuration', () => {
        test('should configure GoogleAuth with correct scopes', async () => {
            // Arrange
            const mockCredentials = { test: 'credentials' };
            process.env.BASE64_ENCODED_GCP_SERVICE_ACCOUNT = Buffer.from(JSON.stringify(mockCredentials)).toString('base64');
            process.env.GENERATIVE_AI_API_KEY = 'test-api-key';
            process.env.GEMINI_MODEL = 'test-model';

            // Act
            await import('./ai.config');

            // Assert
            expect(mockGoogleAuth).toHaveBeenCalledWith({
                credentials: mockCredentials,
                scopes: ['https://www.googleapis.com/auth/cloud-platform']
            });
        });

        test('should pass auth instance to vision client', async () => {
            // Arrange
            const mockAuthInstance = { authClient: 'mock' };
            mockGoogleAuth.mockReturnValue(mockAuthInstance);
            
            const mockCredentials = { test: 'credentials' };
            process.env.BASE64_ENCODED_GCP_SERVICE_ACCOUNT = Buffer.from(JSON.stringify(mockCredentials)).toString('base64');
            process.env.GENERATIVE_AI_API_KEY = 'test-api-key';
            process.env.GEMINI_MODEL = 'test-model';

            // Act
            await import('./ai.config');

            // Assert
            expect(mockImageAnnotatorClient).toHaveBeenCalledWith({
                auth: mockAuthInstance
            });
        });

        test('should initialize Gemini model with correct parameters', async () => {
            // Arrange
            const mockCredentials = { test: 'credentials' };
            process.env.BASE64_ENCODED_GCP_SERVICE_ACCOUNT = Buffer.from(JSON.stringify(mockCredentials)).toString('base64');
            process.env.GENERATIVE_AI_API_KEY = 'test-gemini-key';
            process.env.GEMINI_MODEL = 'gemini-1.5-turbo';

            // Act
            await import('./ai.config');

            // Assert
            expect(mockGoogleGenerativeAI).toHaveBeenCalledWith('test-gemini-key');
            expect(mockGetGenerativeModel).toHaveBeenCalledWith({
                model: 'gemini-1.5-turbo'
            });
        });
    });
});
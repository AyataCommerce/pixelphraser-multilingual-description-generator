import { expect } from '@jest/globals';
import request from 'supertest';

// Mock environment variables before importing app
jest.mock('../../src/config/ai.config', () => ({
  BASE64_ENCODED_GCP_SERVICE_ACCOUNT: 'mock-base64-service-account',
  GENERATIVE_AI_API_KEY: 'mock-ai-api-key',
  // Add any other config exports needed from this file
}));

// Mock configuration
jest.mock('../../src/utils/config.utils', () => ({
  readConfiguration: jest.fn().mockReturnValue({
    CLIENT_ID: "client-id",
    CLIENT_SECRET: "client-secret",
    PROJECT_KEY: "project-key",
    SCOPE: "scope",
    REGION: "region"
  })
}));

// Now import the app after the mocks are set up
import app from '../../src/app';
import { readConfiguration } from '../../src/utils/config.utils';

describe('Testing router', () => {
  beforeEach(() => {
    (readConfiguration as jest.Mock).mockClear();
  });

  test('Post to non-existing route returns 404', async () => {
    const response = await request(app).post('/none');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Path not found.',
    });
  });
});
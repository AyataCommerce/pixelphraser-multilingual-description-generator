import { expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import { readConfiguration } from '../../src/utils/config.utils';

// Mock configuration
jest.mock('../../src/utils/config.utils', () => ({
  readConfiguration: jest.fn().mockReturnValue({
    CTP_CLIENT_ID: "client-id",
    CTP_CLIENT_SECRET: "client-secret",
    CTP_PROJECT_KEY: "project-key",
    CTP_SCOPE: "scope",
    CTP_REGION: "region"
  })
}));

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
import { createProductCustomObject } from '../custom-object/createCustomObject.repository';

jest.mock('../../client/create.client', () => ({
  createApiRoot: jest.fn()
}));

jest.mock('../../utils/logger.utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../utils/config.utils', () => ({
  readConfiguration: jest.fn().mockReturnValue({
    projectKey: 'test-project',
    clientId: 'test-client',
    clientSecret: 'test-secret',
    scope: 'test-scope',
    apiUrl: 'https://test-api.com'
  })
}));

describe('createProductCustomObject', () => {
  const mockProductId = 'test-id';
  const mockImageUrl = 'https://test-image.jpg';
  const mockProductName = 'Test Product';
  const mockProductType = 't-shirt';
  const mockLanguages = ['fr', 'es', 'de'];
  const messageId = 'msg-123';
  const processId = 'process-abc';

  const mockExecute = jest.fn();
  const mockPost = jest.fn(() => ({ execute: mockExecute }));
  const mockCustomObjects = jest.fn(() => ({ post: mockPost }));

  beforeEach(() => {
    const { createApiRoot } = require('../../client/create.client');
    (createApiRoot as jest.Mock).mockReturnValue({
      customObjects: mockCustomObjects
    });

    mockExecute.mockClear();
    mockPost.mockClear();
    mockCustomObjects.mockClear();

    const { logger } = require('../../utils/logger.utils');
    logger.info.mockClear();
    logger.error.mockClear();
  });

  it('should create custom object successfully', async () => {
    const { logger } = require('../../utils/logger.utils');
    mockExecute.mockResolvedValueOnce(undefined); // Now returns void

    await createProductCustomObject(
      mockProductId,
      mockImageUrl,
      mockProductName,
      mockProductType,
      mockLanguages,
      messageId,
      processId
    );

    expect(mockCustomObjects).toHaveBeenCalled();
    expect(mockPost).toHaveBeenCalledWith({
      body: {
        container: 'temporaryDescription',
        key: mockProductId,
        value: {
          fr: null,
          es: null,
          de: null,
          imageUrl: mockImageUrl,
          productType: mockProductType,
          productName: mockProductName
        }
      }
    });

    expect(mockExecute).toHaveBeenCalled();

    expect(logger.info).toHaveBeenCalledWith(
      `Process ID: ${processId} | Message ID: ${messageId} - creating custom object with ID: ${mockProductId}`
    );

    expect(logger.info).toHaveBeenCalledWith(
      `Process ID: ${processId} | Message ID: ${messageId} - custom object created with ID: ${mockProductId}.`
    );
  });

  it('should handle API errors', async () => {
    const { logger } = require('../../utils/logger.utils');
    const error = new Error('API Error');
    mockExecute.mockRejectedValueOnce(error);

    await expect(
      createProductCustomObject(
        mockProductId,
        mockImageUrl,
        mockProductName,
        mockProductType,
        mockLanguages,
        messageId,
        processId
      )
    ).rejects.toThrow('API Error');

    expect(logger.error).toHaveBeenCalledWith(
      `Process ID: ${processId} | Message ID: ${messageId} - failed to create custom object with ID: ${mockProductId}`,
      { message: error.message }
    );
  });
});

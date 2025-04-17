import { updateCustomObjectWithDescription } from './updateCustomObjectWithDescription.repository';

jest.mock('../../client/create.client', () => ({
  createApiRoot: jest.fn()
}));

jest.mock('../../utils/logger.utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('updateCustomObjectWithDescription', () => {
  const mockProductId = 'test-id';
  const mockTranslations = {
    en: 'English description',
    de: 'Deutsche Beschreibung'
  };
  const mockImageUrl = 'https://test-image.jpg';
  const mockProductName = 'Test Product';
  const mockProductType = 'Shirt';
  const messageId = 'msg-001';
  const processId = 'proc-999';

  const mockExecute = jest.fn();
  const mockGet = jest.fn(() => ({ execute: mockExecute }));
  const mockWithContainerAndKey = jest.fn(() => ({ get: mockGet }));
  const mockPost = jest.fn(() => ({ execute: mockExecute }));
  const mockCustomObjects = jest.fn(() => ({
    withContainerAndKey: mockWithContainerAndKey,
    post: mockPost
  }));

  beforeEach(() => {
    const { createApiRoot } = require('../../client/create.client');
    (createApiRoot as jest.Mock).mockReturnValue({
      customObjects: mockCustomObjects
    });

    jest.clearAllMocks();
  });

  it('should update custom object successfully', async () => {
    const mockExistingObject = {
      body: {
        version: 2
      }
    };

    mockExecute
      .mockResolvedValueOnce(mockExistingObject) // GET
      .mockResolvedValueOnce({}); // POST

    await updateCustomObjectWithDescription(
      mockProductId,
      mockProductName,
      mockImageUrl,
      mockTranslations,
      mockProductType,
      messageId,
      processId
    );

    expect(mockCustomObjects).toHaveBeenCalledTimes(2);
    expect(mockWithContainerAndKey).toHaveBeenCalledWith({
      container: 'temporaryDescription',
      key: mockProductId
    });

    expect(mockPost).toHaveBeenCalledWith({
      body: {
        container: 'temporaryDescription',
        key: mockProductId,
        version: 2,
        value: {
          ...mockTranslations,
          imageUrl: mockImageUrl,
          productType: mockProductType,
          productName: mockProductName,
          generatedAt: expect.any(String)
        }
      }
    });

    const { logger } = require('../../utils/logger.utils');
    expect(logger.info).toHaveBeenCalledWith(
      `Process ID: ${processId} | Message ID: ${messageId} - updating custom object with ID: ${mockProductId}.`
    );
    expect(logger.info).toHaveBeenCalledWith(
      `Process ID: ${processId} | Message ID: ${messageId} - custom object updated with ID: ${mockProductId}.`
    );
  });

  it('should throw if custom object is not found', async () => {
    mockExecute.mockResolvedValueOnce({ body: null });

    await expect(updateCustomObjectWithDescription(
      mockProductId,
      mockProductName,
      mockImageUrl,
      mockTranslations,
      mockProductType,
      messageId,
      processId
    )).rejects.toThrow(
      `Process ID: ${processId} | Message ID: ${messageId} - custom object not found with ID: ${mockProductId}`
    );
  });

  it('should throw if get request fails', async () => {
    const error = new Error('Get API Error');
    mockExecute.mockRejectedValueOnce(error);

    await expect(updateCustomObjectWithDescription(
      mockProductId,
      mockProductName,
      mockImageUrl,
      mockTranslations,
      mockProductType,
      messageId,
      processId
    )).rejects.toThrow('Get API Error');

    const { logger } = require('../../utils/logger.utils');
    expect(logger.error).toHaveBeenCalledWith(
      `Process ID: ${processId} | Message ID: ${messageId} - failed to update custom object with ID: ${mockProductId}`,
      { message: error.message }
    );
  });

  it('should throw if post request fails', async () => {
    mockExecute
      .mockResolvedValueOnce({ body: { version: 1 } }) // GET
      .mockRejectedValueOnce(new Error('Update API Error')); // POST

    await expect(updateCustomObjectWithDescription(
      mockProductId,
      mockProductName,
      mockImageUrl,
      mockTranslations,
      mockProductType,
      messageId,
      processId
    )).rejects.toThrow('Update API Error');

    const { logger } = require('../../utils/logger.utils');
    expect(logger.error).toHaveBeenCalledWith(
      `Process ID: ${processId} | Message ID: ${messageId} - failed to update custom object with ID: ${mockProductId}`,
      { message: 'Update API Error' }
    );
  });
});

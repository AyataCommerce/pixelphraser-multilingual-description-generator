import { fetchProductType } from '../product-type/fetchProductTypeById.repository';

// Mock the API client
jest.mock('../../client/create.client', () => ({
  createApiRoot: jest.fn()
}));

// Mock the logger
jest.mock('../../utils/logger.utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('fetchProductType', () => {
  const mockProductTypeId = 'product-type-001';
  const mockMessageId = 'msg-789';
  const mockProcessId = 'proc-999';

  const mockExecute = jest.fn();
  const mockGet = jest.fn(() => ({ execute: mockExecute }));
  const mockWithId = jest.fn(() => ({ get: mockGet }));
  const mockProductTypes = jest.fn(() => ({ withId: mockWithId }));

  beforeEach(() => {
    const { createApiRoot } = require('../../client/create.client');
    (createApiRoot as jest.Mock).mockReturnValue({
      productTypes: mockProductTypes
    });

    jest.clearAllMocks();
  });

  it('should fetch and return product type key successfully', async () => {
    const mockResponse = {
      body: {
        key: 'apparel-type'
      }
    };

    mockExecute.mockResolvedValueOnce(mockResponse);

    const result = await fetchProductType(mockProductTypeId, mockMessageId, mockProcessId);

    expect(result).toBe('apparel-type');
    expect(mockProductTypes).toHaveBeenCalled();
    expect(mockWithId).toHaveBeenCalledWith({ ID: mockProductTypeId });
    expect(mockExecute).toHaveBeenCalled();

    const { logger } = require('../../utils/logger.utils');
    expect(logger.info).toHaveBeenCalledWith(
      `Process ID: ${mockProcessId} | Message ID: ${mockMessageId} - fetching product type with ID: ${mockProductTypeId}`
    );
    expect(logger.info).toHaveBeenCalledWith(
      `Process ID: ${mockProcessId} | Message ID: ${mockMessageId} - product type fetched, Product Type: apparel-type`
    );
  });

  it('should return empty string if key is not present', async () => {
    mockExecute.mockResolvedValueOnce({ body: {} });

    const result = await fetchProductType(mockProductTypeId, mockMessageId, mockProcessId);

    expect(result).toBe('');
  });

  it('should throw and log error if API call fails', async () => {
    const errorMessage = 'Product type fetch error';
    const error = new Error(errorMessage);
    mockExecute.mockRejectedValueOnce(error);

    await expect(fetchProductType(mockProductTypeId, mockMessageId, mockProcessId)).rejects.toThrow(errorMessage);

    const { logger } = require('../../utils/logger.utils');
    expect(logger.error).toHaveBeenCalledWith(
      `Process ID: ${mockProcessId} | Message ID: ${mockMessageId} - failed to fetch product type with ID: ${mockProductTypeId}`,
      { message: error.message }
    );
  });
});

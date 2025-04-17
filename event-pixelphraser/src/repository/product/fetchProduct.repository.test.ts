import { fetchProduct } from './fetchProductByID.repository';

jest.mock('../../client/create.client', () => ({
  createApiRoot: jest.fn()
}));

jest.mock('../../utils/logger.utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('fetchProduct', () => {
  const mockProductId = 'test-product-id';
  const mockMessageId = 'msg-456';
  const mockProcessId = 'proc-789';

  const mockExecute = jest.fn();
  const mockGet = jest.fn(() => ({ execute: mockExecute }));
  const mockWithId = jest.fn(() => ({ get: mockGet }));
  const mockProducts = jest.fn(() => ({ withId: mockWithId }));

  beforeEach(() => {
    const { createApiRoot } = require('../../client/create.client');
    (createApiRoot as jest.Mock).mockReturnValue({
      products: mockProducts
    });

    jest.clearAllMocks();
  });

  it('should fetch and return product data successfully', async () => {
    const mockProductData = { id: mockProductId, masterData: {} } as any;
    mockExecute.mockResolvedValueOnce({ body: mockProductData });

    const result = await fetchProduct(mockProductId, mockMessageId, mockProcessId);

    expect(result).toEqual(mockProductData);
    expect(mockProducts).toHaveBeenCalled();
    expect(mockWithId).toHaveBeenCalledWith({ ID: mockProductId });
    expect(mockExecute).toHaveBeenCalled();

    const { logger } = require('../../utils/logger.utils');
    expect(logger.info).toHaveBeenCalledWith(
      `Process ID: ${mockProcessId} | Message ID: ${mockMessageId} - fetching product with ID: ${mockProductId}`
    );
    expect(logger.info).toHaveBeenCalledWith(
      `Process ID: ${mockProcessId} | Message ID: ${mockMessageId} - product fetched with ID: ${mockProductId}`
    );
  });

  it('should throw and log error if API call fails', async () => {
    const errorMessage = 'Failed to fetch product';
    const error = new Error(errorMessage);
    mockExecute.mockRejectedValueOnce(error);

    await expect(fetchProduct(mockProductId, mockMessageId, mockProcessId)).rejects.toThrow(errorMessage);

    const { logger } = require('../../utils/logger.utils');
    expect(logger.error).toHaveBeenCalledWith(
      `Process ID: ${mockProcessId} | Message ID: ${mockMessageId} - failed to fetch product with ID: ${mockProductId}`,
      { message: error.message }
    );
  });
});

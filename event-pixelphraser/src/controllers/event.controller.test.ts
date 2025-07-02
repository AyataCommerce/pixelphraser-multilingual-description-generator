import { Request, Response } from 'express';

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-process-id'),
}));

// Mocks for repositories and services
jest.mock('../repository/product/fetchProductByID.repository', () => ({ fetchProduct: jest.fn() }));
jest.mock('../repository/product-type/fetchProductTypeById.repository', () => ({ fetchProductType: jest.fn() }));
jest.mock('../services/vision-ai/productAnalysis.service', () => ({ productAnalysis: jest.fn() }));
jest.mock('../services/generative-ai/descriptionGeneration.service', () => ({ generateProductDescription: jest.fn() }));
jest.mock('../repository/custom-object/fetchSelectedLanguages.repository', () => ({ fetchselectedLanguages: jest.fn() }));
jest.mock('../services/generative-ai/translateProductDescription.service', () => ({ translateProductDescription: jest.fn() }));
jest.mock('../repository/custom-object/createCustomObject.repository', () => ({ createProductCustomObject: jest.fn() }));
jest.mock('../repository/custom-object/updateCustomObjectWithDescription.repository', () => ({ updateCustomObjectWithDescription: jest.fn() }));

// Mocks for validation helpers
jest.mock('../helpers/validatePubSubMessage.helpers', () => ({
  validatePubSubMessage: jest.fn().mockReturnValue({ shouldContinue: true }),
}));
jest.mock('../helpers/validateAndDecodeData.helpers', () => ({
  validateAndDecodeData: jest.fn().mockReturnValue({
    data: Buffer.from(JSON.stringify({
      id: 'msg-id-123',
      notificationType: 'Message',
      type: 'ProductCreated',
      resource: { id: 'product-123' }
    })).toString(),
    shouldContinue: true
  }),
}));
jest.mock('../helpers/validateNotificationType.helpers', () => ({
  validateNotificationType: jest.fn().mockReturnValue({ shouldContinue: true }),
}));
jest.mock('../helpers/validateEventType.helpers', () => ({
  validateEventType: jest.fn().mockReturnValue({ shouldContinue: true }),
}));
jest.mock('../helpers/validateProductData.helpers', () => ({
  validateProductData: jest.fn().mockReturnValue({ shouldContinue: true }),
}));
jest.mock('../helpers/validateProductAttributes.helpers', () => ({
  validateProductAttributes: jest.fn().mockReturnValue({ shouldContinue: true }),
}));

// Imports for verification
import { fetchProduct } from '../repository/product/fetchProductByID.repository';
import { fetchProductType } from '../repository/product-type/fetchProductTypeById.repository';
import { productAnalysis } from '../services/vision-ai/productAnalysis.service';
import { generateProductDescription } from '../services/generative-ai/descriptionGeneration.service';
import { fetchselectedLanguages } from '../repository/custom-object/fetchSelectedLanguages.repository';
import { translateProductDescription } from '../services/generative-ai/translateProductDescription.service';
import { createProductCustomObject } from '../repository/custom-object/createCustomObject.repository';
import { updateCustomObjectWithDescription } from '../repository/custom-object/updateCustomObjectWithDescription.repository';

// Controller import
import { post } from './event.controller';

describe('POST /event - Product Description Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockProcessId = 'mock-process-id';

  beforeEach(() => {
    mockRequest = {
      body: {
        message: {
          data: 'base64mocked'
        }
      }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    (fetchProduct as jest.Mock).mockResolvedValue({
      id: 'product-123',
      productType: { id: 'product-type-id' },
      masterData: {
        current: {
          name: { en: 'Test Product' },
          masterVariant: {
            images: [{ url: 'https://test.com/image.jpg' }]
          }
        },
        staged: {
          masterVariant: {
            attributes: [{ name: 'generateDescription', value: true }]
          }
        }
      }
    });

    (fetchProductType as jest.Mock).mockResolvedValue('product-type-key');
    (productAnalysis as jest.Mock).mockResolvedValue({ labels: [], objects: [], colors: [], detectedText: '', webEntities: [] });
    (generateProductDescription as jest.Mock).mockResolvedValue('Generated Description');
    (fetchselectedLanguages as jest.Mock).mockResolvedValue(['en', 'de']);
    (translateProductDescription as jest.Mock).mockResolvedValue({ en: 'Generated Description', de: 'Generierte Beschreibung' });
    (createProductCustomObject as jest.Mock).mockResolvedValue({});
    (updateCustomObjectWithDescription as jest.Mock).mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle valid request end-to-end and respond with 200', async () => {
    await post(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalled();

    expect(fetchProduct).toHaveBeenCalledWith('product-123', 'msg-id-123', mockProcessId);
    expect(fetchProductType).toHaveBeenCalled();
    expect(productAnalysis).toHaveBeenCalled();
    expect(generateProductDescription).toHaveBeenCalled();
    expect(fetchselectedLanguages).toHaveBeenCalled();
    expect(translateProductDescription).toHaveBeenCalled();
    expect(createProductCustomObject).toHaveBeenCalled();
    expect(updateCustomObjectWithDescription).toHaveBeenCalled();
  });

  it('should exit early if PubSub validation fails', async () => {
    const { validatePubSubMessage } = require('../helpers/validatePubSubMessage.helpers');
    validatePubSubMessage.mockReturnValueOnce({ shouldContinue: false });

    await post(mockRequest as Request, mockResponse as Response);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(fetchProduct).not.toHaveBeenCalled();
  });

  it('should exit early if decoding fails', async () => {
    const { validateAndDecodeData } = require('../helpers/validateAndDecodeData.helpers');
    validateAndDecodeData.mockReturnValueOnce({ data: null, shouldContinue: false });

    await post(mockRequest as Request, mockResponse as Response);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(fetchProduct).not.toHaveBeenCalled();
  });

  it('should handle exception and respond with 500', async () => {
    (fetchProduct as jest.Mock).mockRejectedValueOnce(new Error('Boom!'));

    await post(mockRequest as Request, mockResponse as Response);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.send).toHaveBeenCalled();
  });

  it('should exit early if product ID is missing in message', async () => {
    const { validateAndDecodeData } = require('../helpers/validateAndDecodeData.helpers');
    validateAndDecodeData.mockReturnValueOnce({
      data: JSON.stringify({
        id: 'msg-id-123',
        notificationType: 'Message',
        type: 'ProductCreated',
        resource: {}
      }),
      shouldContinue: true
    });

    await post(mockRequest as Request, mockResponse as Response);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(fetchProduct).not.toHaveBeenCalled();
  });
});

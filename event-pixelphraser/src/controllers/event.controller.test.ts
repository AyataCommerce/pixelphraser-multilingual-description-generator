import { Request, Response } from 'express';
import { post } from './event.controller';

import { productAnalysis } from '../services/vision-ai/productAnalysis.service';
import { generateProductDescription } from '../services/generative-ai/descriptionGeneration.service';
import { createProductCustomObject } from '../repository/custom-object/createCustomObject.repository';
import { updateCustomObjectWithDescription } from '../repository/custom-object/updateCustomObjectWithDescription.repository';
import { fetchProductType } from '../repository/product-type/fetchProductTypeById.repository';
import { translateProductDescription } from '../services/generative-ai/translateProductDescription.service';
import { fetchProduct } from '../repository/product/fetchProductByID.repository';
import { fetchselectedLanguages } from '../repository/custom-object/fetchSelectedLanguages.repository';

import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));
jest.mock('../services/vision-ai/productAnalysis.service');
jest.mock('../services/generative-ai/descriptionGeneration.service');
jest.mock('../repository/custom-object/createCustomObject.repository');
jest.mock('../repository/custom-object/updateCustomObjectWithDescription.repository');
jest.mock('../repository/product-type/fetchProductTypeById.repository');
jest.mock('../services/generative-ai/translateProductDescription.service');
jest.mock('../repository/product/fetchProductByID.repository');
jest.mock('../repository/custom-object/fetchSelectedLanguages.repository');

describe('Event Controller with processId', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const mockProcessId = 'mock-process-id';

  beforeEach(() => {
    (uuidv4 as jest.Mock).mockReturnValue(mockProcessId);

    mockRequest = {
      body: {
        message: {
          data: Buffer.from(JSON.stringify({
            id: 'msg-id-123',
            notificationType: 'Message',
            type: 'ProductCreated',
            resource: { id: 'product-123' }
          })).toString('base64')
        }
      }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    (fetchProduct as jest.Mock).mockResolvedValue({
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

  it('should process valid message and generate descriptions successfully with processId', async () => {
    await post(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalled();

    expect(fetchProduct).toHaveBeenCalledWith('product-123', 'msg-id-123', mockProcessId);
    expect(fetchProductType).toHaveBeenCalledWith('product-type-id', 'msg-id-123', mockProcessId);
    expect(productAnalysis).toHaveBeenCalledWith('https://test.com/image.jpg', 'msg-id-123', mockProcessId);
    expect(generateProductDescription).toHaveBeenCalledWith(expect.anything(), 'Test Product', 'product-type-key', 'msg-id-123', mockProcessId);
    expect(fetchselectedLanguages).toHaveBeenCalledWith('msg-id-123', mockProcessId);
    expect(translateProductDescription).toHaveBeenCalledWith('Generated Description', ['en', 'de'], 'msg-id-123', mockProcessId);
    expect(createProductCustomObject).toHaveBeenCalledWith('product-123', 'https://test.com/image.jpg', 'Test Product', 'product-type-key', ['en', 'de'], 'msg-id-123', mockProcessId);
    expect(updateCustomObjectWithDescription).toHaveBeenCalledWith('product-123', 'Test Product', 'https://test.com/image.jpg', expect.anything(), 'product-type-key', 'msg-id-123', mockProcessId);
  });

  it('should skip processing for unsupported notificationType', async () => {
    mockRequest.body.message.data = Buffer.from(JSON.stringify({
      id: 'msg-id-123',
      notificationType: 'ResourceCreated',
      type: 'ProductCreated',
      resource: { id: 'product-123' }
    })).toString('base64');

    await post(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalled();
    expect(fetchProduct).not.toHaveBeenCalled();
  });

  it('should skip if generateDescription is false', async () => {
    (fetchProduct as jest.Mock).mockResolvedValueOnce({
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
            attributes: [{ name: 'generateDescription', value: false }]
          }
        }
      }
    });

    await post(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalled();
    expect(generateProductDescription).not.toHaveBeenCalled();
  });

  it('should return 200 for invalid event type', async () => {
    mockRequest.body.message.data = Buffer.from(JSON.stringify({
      id: 'msg-id-123',
      notificationType: 'Message',
      type: 'InvalidEvent',
      resource: { id: 'product-123' }
    })).toString('base64');

    await post(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalled();
    expect(fetchProduct).not.toHaveBeenCalled();
  });

  it('should return 200 if message is missing', async () => {
    mockRequest.body = {};
    await post(mockRequest as Request, mockResponse as Response);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalled();
  });

  it('should return 200 if base64 data is missing', async () => {
    mockRequest.body.message.data = undefined;
    await post(mockRequest as Request, mockResponse as Response);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    (fetchProduct as jest.Mock).mockRejectedValue(new Error('Oops!'));

    await post(mockRequest as Request, mockResponse as Response);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.send).toHaveBeenCalled();
  });
});

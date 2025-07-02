import { Request, Response } from 'express';
import { post, processProductDescription } from '../../src/controllers/event.controller';
import { fetchProduct } from '../../src/repository/product/fetchProductByID.repository';

jest.mock('../../src/client/create.client');
jest.mock('../../src/config/ai.config');
jest.mock('../../src/utils/logger.utils');
jest.mock('../../src/utils/config.utils.ts', () => ({
    readConfiguration: jest.fn().mockReturnValue({
        CLIENT_ID: "XXXXXXXXXXXXXXXXXXXXXXXX",
        CLIENT_SECRET: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        PROJECT_KEY: "test-scope",
        SCOPE: "manage_project:test-scope",
        REGION: "europe-west1.gcp"
    })
}));

jest.mock('../../src/repository/product/fetchProductByID.repository');

import * as eventControllerModule from '../../src/controllers/event.controller';

describe('Event Controller Integration Tests (Updated)', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    const mockStatus = jest.fn().mockReturnThis();
    const mockSend = jest.fn().mockReturnThis();

    beforeEach(() => {
        jest.clearAllMocks();

        mockRequest = {
            body: {
                message: {
                    data: Buffer.from(JSON.stringify({
                        id: 'msg-123',
                        notificationType: 'Message',
                        type: 'ProductCreated',
                        resource: { id: 'mockProductId' }
                    })).toString('base64')
                }
            }
        };
        mockResponse = {
            status: mockStatus,
            send: mockSend
        };

        (fetchProduct as jest.Mock).mockResolvedValue({
            id: 'mockProductId',
            productType: { id: 'mockProductTypeId' },
            masterData: {
                current: {
                    name: { en: 'Mock Product' },
                    masterVariant: {
                        images: [{ url: 'mockImageUrl' }]
                    }
                },
                staged: {
                    masterVariant: {
                        attributes: [{ name: 'generateDescription', value: true }]
                    }
                }
            }
        });

        jest.spyOn(eventControllerModule, 'processProductDescription').mockResolvedValue();
    });

    describe('Validation & Error Scenarios', () => {
        test('should acknowledge and exit if Pub/Sub message is missing', async () => {
            mockRequest = { body: {} };
            await post(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalled();
            expect(fetchProduct).not.toHaveBeenCalled();
        });

        test('should acknowledge and exit if message data is empty', async () => {
            mockRequest = { body: { message: {} } };
            await post(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalled();
            expect(fetchProduct).not.toHaveBeenCalled();
        });

        test('should acknowledge and exit if notificationType is unsupported', async () => {
            mockRequest.body.message.data = Buffer.from(JSON.stringify({
                id: 'msg-123',
                notificationType: 'ResourceCreated',
                type: 'ProductCreated'
            })).toString('base64');

            await post(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(fetchProduct).not.toHaveBeenCalled();
        });

        test('should acknowledge and exit if event type is unsupported', async () => {
            mockRequest.body.message.data = Buffer.from(JSON.stringify({
                id: 'msg-123',
                notificationType: 'Message',
                type: 'OrderCreated'
            })).toString('base64');

            await post(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(fetchProduct).not.toHaveBeenCalled();
        });

        test('should acknowledge and exit if product ID is missing', async () => {
            mockRequest.body.message.data = Buffer.from(JSON.stringify({
                id: 'msg-123',
                notificationType: 'Message',
                type: 'ProductCreated',
                resource: {}
            })).toString('base64');

            await post(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(fetchProduct).not.toHaveBeenCalled();
        });

        test('should acknowledge and exit if generateDescription is false', async () => {
            (fetchProduct as jest.Mock).mockResolvedValueOnce({
                id: 'mockProductId',
                productType: { id: 'mockProductTypeId' },
                masterData: {
                    current: {
                        name: { en: 'Mock Product' },
                        masterVariant: {
                            images: [{ url: 'mockImageUrl' }]
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
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(eventControllerModule.processProductDescription).not.toHaveBeenCalled();
        });

        test('should handle error and respond with 500 if fetchProduct fails', async () => {
            (fetchProduct as jest.Mock).mockRejectedValue(new Error('Database error'));

            await post(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockSend).toHaveBeenCalled();
            expect(eventControllerModule.processProductDescription).not.toHaveBeenCalled();
        });

        test('should handle error from processProductDescription', async () => {
            (eventControllerModule.processProductDescription as jest.Mock).mockRejectedValue(
                new Error('Unexpected failure')
            );

            await post(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockSend).toHaveBeenCalled();
        });
    });

    describe('Successful scenario', () => {
        test('should call processProductDescription with correct arguments', async () => {
            await post(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalled();

            expect(eventControllerModule.processProductDescription).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'mockProductId',
                    masterData: expect.any(Object),
                    productType: { id: 'mockProductTypeId' }
                }),
                'msg-123',
                expect.any(String) // UUID
            );
        });

        test('should use fallback product name if en/en-US not present', async () => {
            (fetchProduct as jest.Mock).mockResolvedValueOnce({
                id: 'mockProductId',
                productType: { id: 'mockProductTypeId' },
                masterData: {
                    current: {
                        name: { de: 'Produkt' },
                        masterVariant: { images: [{ url: 'mockImageUrl' }] }
                    },
                    staged: {
                        masterVariant: {
                            attributes: [{ name: 'generateDescription', value: true }]
                        }
                    }
                }
            });

            await post(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalled();
            expect(eventControllerModule.processProductDescription).toHaveBeenCalledWith(
                expect.objectContaining({
                    masterData: expect.any(Object)
                }),
                'msg-123',
                expect.any(String)
            );
        });
    });
});
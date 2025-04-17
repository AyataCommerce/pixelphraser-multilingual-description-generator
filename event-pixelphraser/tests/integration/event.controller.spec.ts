import { Request, Response } from 'express';
import { post } from '../../src/controllers/event.controller';
import { productAnalysis } from '../../src/services/vision-ai/productAnalysis.service';
import { generateProductDescription } from '../../src/services/generative-ai/descriptionGeneration.service';
import { createProductCustomObject } from '../../src/repository/custom-object/createCustomObject.repository';
import { updateCustomObjectWithDescription } from '../../src/repository/custom-object/updateCustomObjectWithDescription.repository';
import { fetchProductType } from '../../src/repository/product-type/fetchProductTypeById.repository';
import { translateProductDescription } from '../../src/services/generative-ai/translateProductDescription.service';
import { fetchProduct } from '../../src/repository/product/fetchProductByID.repository';
import { fetchselectedLanguages } from '../../src/repository/custom-object/fetchSelectedLanguages.repository';

jest.mock('../../src/client/create.client');
jest.mock('../../src/config/ai.config');
jest.mock('../../src/services/vision-ai/productAnalysis.service');
jest.mock('../../src/services/generative-ai/descriptionGeneration.service');
jest.mock('../../src/repository/custom-object/createCustomObject.repository');
jest.mock('../../src/repository/custom-object/updateCustomObjectWithDescription.repository');
jest.mock('../../src/repository/product-type/fetchProductTypeById.repository');
jest.mock('../../src/services/generative-ai/translateProductDescription.service');
jest.mock('../../src/repository/product/fetchProductByID.repository');
jest.mock('../../src/repository/custom-object/fetchSelectedLanguages.repository');
jest.mock('../../src/utils/logger.utils');
jest.mock('../../src/utils/config.utils.ts', () => ({
    readConfiguration: jest.fn().mockReturnValue({
        CTP_CLIENT_ID: "XXXXXXXXXXXXXXXXXXXXXXXX",
        CTP_CLIENT_SECRET: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        CTP_PROJECT_KEY: "test-scope",
        CTP_SCOPE: "manage_project:test-scope",
        CTP_REGION: "europe-west1.gcp"
    })
}));

jest.mock('../../src/config/ai.config.ts', () => ({
    BASE64_ENCODED_GCP_SERVICE_ACCOUNT: 'XXXXXXXXXX',
    GENERATIVE_AI_API_KEY: 'XXXXXXXXXX',
    GEMINI_MODEL: 'XXXXXXXXXX',
    visionClient: {
        annotateImage: jest.fn().mockResolvedValue([
            {
                labelAnnotations: [{ description: 'label1' }, { description: 'label2' }],
                localizedObjectAnnotations: [{ name: 'object1' }, { name: 'object2' }],
                imagePropertiesAnnotation: {
                    dominantColors: {
                        colors: [
                            { color: { red: 255, green: 255, blue: 255 } },
                            { color: { red: 0, green: 0, blue: 0 } },
                            { color: { red: 128, green: 128, blue: 128 } }
                        ]
                    }
                },
                textAnnotations: [{ description: 'detected text' }],
                webDetection: {
                    webEntities: [{ description: 'entity1' }, { description: 'entity2' }]
                }
            }
        ])
    },
    genAI: {
        getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockResolvedValue({
                response: {
                    text: () => 'generated description'
                }
            })
        })
    },
    model: {
        generateContent: jest.fn().mockResolvedValue({
            response: {
                text: () => 'generated description'
            }
        })
    }
}));

describe('Event Controller Integration Tests', () => {
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

        // Setup default mocks for new dependencies
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
                        attributes: [
                            { name: 'generateDescription', value: true }
                        ]
                    }
                }
            }
        });

        (fetchProductType as jest.Mock).mockResolvedValue('clothing');
        (productAnalysis as jest.Mock).mockResolvedValue({
            labels: 'label1, label2',
            objects: 'object1, object2',
            colors: ['255, 255, 255', '0, 0, 0', '128, 128, 128'],
            detectedText: 'detected text',
            webEntities: 'entity1, entity2'
        });
        (generateProductDescription as jest.Mock).mockResolvedValue('generated description');
        (fetchselectedLanguages as jest.Mock).mockResolvedValue(['en', 'de', 'fr']);
        (translateProductDescription as jest.Mock).mockResolvedValue({
            en: 'generated description',
            de: 'generierte Beschreibung',
            fr: 'description générée'
        });
        (createProductCustomObject as jest.Mock).mockResolvedValue({});
        (updateCustomObjectWithDescription as jest.Mock).mockResolvedValue({});
    });

    describe('Message validation scenarios', () => {
        test('should acknowledge and exit if Pub/Sub message is missing', async () => {
            mockRequest = { body: {} };
            await post(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalled();
            expect(fetchProduct).not.toHaveBeenCalled();
        });

        test('should acknowledge and exit if Pub/Sub message data is empty', async () => {
            mockRequest = { body: { message: {} } };
            await post(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalled();
            expect(fetchProduct).not.toHaveBeenCalled();
        });

        test('should acknowledge and exit for ResourceCreated notification type', async () => {
            mockRequest = {
                body: {
                    message: {
                        data: Buffer.from(JSON.stringify({
                            id: 'msg-123',
                            notificationType: 'ResourceCreated',
                            type: 'ProductCreated'
                        })).toString('base64')
                    }
                }
            };
            await post(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalled();
            expect(fetchProduct).not.toHaveBeenCalled();
        });

        test('should acknowledge and exit for invalid event type', async () => {
            mockRequest = {
                body: {
                    message: {
                        data: Buffer.from(JSON.stringify({
                            id: 'msg-123',
                            notificationType: 'Message',
                            type: 'OrderCreated'
                        })).toString('base64')
                    }
                }
            };
            await post(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalled();
            expect(fetchProduct).not.toHaveBeenCalled();
        });

        test('should acknowledge and exit if product ID is missing', async () => {
            mockRequest = {
                body: {
                    message: {
                        data: Buffer.from(JSON.stringify({
                            id: 'msg-123',
                            notificationType: 'Message',
                            type: 'ProductCreated',
                            resource: {}
                        })).toString('base64')
                    }
                }
            };
            await post(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalled();
            expect(fetchProduct).not.toHaveBeenCalled();
        });
    });

    describe('Product data validation scenarios', () => {
        test('should acknowledge and exit if product data is incomplete', async () => {
            (fetchProduct as jest.Mock).mockResolvedValue({
                id: 'mockProductId',
                // Missing productType
                masterData: {
                    current: {
                        name: { en: 'Mock Product' }
                        // Missing images
                    }
                }
            });

            await post(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalled();
            expect(productAnalysis).not.toHaveBeenCalled();
        });

        test('should acknowledge and exit if no product attributes found', async () => {
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
                            attributes: [] // Empty attributes
                        }
                    }
                }
            });

            await post(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalled();
            expect(productAnalysis).not.toHaveBeenCalled();
        });

        test('should acknowledge and exit if automatic description generation is not enabled', async () => {
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
                            attributes: [
                                { name: 'generateDescription', value: false } // Generation disabled
                            ]
                        }
                    }
                }
            });

            await post(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalled();
            expect(productAnalysis).not.toHaveBeenCalled();
        });
    });

    describe('Successful scenarios', () => {
        test('should process the event message and generate product description successfully', async () => {
            await post(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalled();
            expect(fetchProduct).toHaveBeenCalledWith('mockProductId', 'msg-123', expect.any(String));
            expect(fetchProductType).toHaveBeenCalledWith('mockProductTypeId', 'msg-123', expect.any(String));
            expect(productAnalysis).toHaveBeenCalledWith('mockImageUrl', 'msg-123', expect.any(String));
            expect(generateProductDescription).toHaveBeenCalledWith(
                {
                    labels: 'label1, label2',
                    objects: 'object1, object2',
                    colors: ['255, 255, 255', '0, 0, 0', '128, 128, 128'],
                    detectedText: 'detected text',
                    webEntities: 'entity1, entity2'
                },
                'Mock Product',
                'clothing',
                'msg-123',
                expect.any(String)
            );
            expect(fetchselectedLanguages).toHaveBeenCalledWith('msg-123', expect.any(String));
            expect(translateProductDescription).toHaveBeenCalledWith(
                'generated description',
                ['en', 'de', 'fr'],
                'msg-123',
                expect.any(String)
            );
            expect(createProductCustomObject).toHaveBeenCalledWith(
                'mockProductId',
                'mockImageUrl',
                'Mock Product',
                'clothing',
                ['en', 'de', 'fr'],
                'msg-123',
                expect.any(String)
            );
            expect(updateCustomObjectWithDescription).toHaveBeenCalledWith(
                'mockProductId',
                'Mock Product',
                'mockImageUrl',
                {
                    en: 'generated description',
                    de: 'generierte Beschreibung',
                    fr: 'description générée'
                },
                'clothing',
                'msg-123',
                expect.any(String)
            );
        });

        test('should handle product name in different locales', async () => {
            (fetchProduct as jest.Mock).mockResolvedValue({
                id: 'mockProductId',
                productType: { id: 'mockProductTypeId' },
                masterData: {
                    current: {
                        name: { 'en-US': 'Mock Product US' }, // Using en-US locale
                        masterVariant: {
                            images: [{ url: 'mockImageUrl' }]
                        }
                    },
                    staged: {
                        masterVariant: {
                            attributes: [
                                { name: 'generateDescription', value: true }
                            ]
                        }
                    }
                }
            });

            await post(mockRequest as Request, mockResponse as Response);
            
            expect(generateProductDescription).toHaveBeenCalledWith(
                expect.anything(),
                'Mock Product US', // Should use en-US name
                'clothing',
                'msg-123',
                expect.any(String)
            );
        });

        test('should handle product name in fallback locale', async () => {
            (fetchProduct as jest.Mock).mockResolvedValue({
                id: 'mockProductId',
                productType: { id: 'mockProductTypeId' },
                masterData: {
                    current: {
                        name: { de: 'Deutsches Produkt' }, // Only German locale available
                        masterVariant: {
                            images: [{ url: 'mockImageUrl' }]
                        }
                    },
                    staged: {
                        masterVariant: {
                            attributes: [
                                { name: 'generateDescription', value: true }
                            ]
                        }
                    }
                }
            });

            await post(mockRequest as Request, mockResponse as Response);
            
            expect(generateProductDescription).toHaveBeenCalledWith(
                expect.anything(),
                'Deutsches Produkt', // Should use first available name
                'clothing',
                'msg-123',
                expect.any(String)
            );
        });
    });

    describe('Error scenarios', () => {
        test('should handle errors during product fetch', async () => {
            (fetchProduct as jest.Mock).mockRejectedValue(new Error('Failed to fetch product'));
            
            await post(mockRequest as Request, mockResponse as Response);
            
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockSend).toHaveBeenCalled();
            expect(productAnalysis).not.toHaveBeenCalled();
        });

        test('should handle errors during product analysis', async () => {
            (productAnalysis as jest.Mock).mockRejectedValue(new Error('Vision AI analysis failed'));
            
            await post(mockRequest as Request, mockResponse as Response);
            
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockSend).toHaveBeenCalled();
            expect(generateProductDescription).not.toHaveBeenCalled();
        });

        test('should handle errors during description generation', async () => {
            (generateProductDescription as jest.Mock).mockRejectedValue(new Error('Description generation failed'));
            
            await post(mockRequest as Request, mockResponse as Response);
            
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockSend).toHaveBeenCalled();
            expect(translateProductDescription).not.toHaveBeenCalled();
        });

        test('should handle errors during language selection fetch', async () => {
            (fetchselectedLanguages as jest.Mock).mockRejectedValue(new Error('Failed to fetch languages'));
            
            await post(mockRequest as Request, mockResponse as Response);
            
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockSend).toHaveBeenCalled();
            expect(translateProductDescription).not.toHaveBeenCalled();
        });

        test('should handle errors during translation', async () => {
            (translateProductDescription as jest.Mock).mockRejectedValue(new Error('Translation failed'));
            
            await post(mockRequest as Request, mockResponse as Response);
            
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockSend).toHaveBeenCalled();
            expect(createProductCustomObject).not.toHaveBeenCalled();
        });

        test('should handle errors during custom object creation', async () => {
            (createProductCustomObject as jest.Mock).mockRejectedValue(new Error('Custom object creation failed'));
            
            await post(mockRequest as Request, mockResponse as Response);
            
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockSend).toHaveBeenCalled();
            expect(updateCustomObjectWithDescription).not.toHaveBeenCalled();
        });

        test('should handle errors during custom object update', async () => {
            (updateCustomObjectWithDescription as jest.Mock).mockRejectedValue(new Error('Custom object update failed'));
            
            await post(mockRequest as Request, mockResponse as Response);
            
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockSend).toHaveBeenCalled();
        });
    });
});
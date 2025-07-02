import { Request, Response } from 'express';
import { logger } from '../utils/logger.utils';
import { productAnalysis } from '../services/vision-ai/productAnalysis.service';
import { generateProductDescription } from '../services/generative-ai/descriptionGeneration.service';
import { createProductCustomObject } from '../repository/custom-object/createCustomObject.repository';
import { updateCustomObjectWithDescription } from '../repository/custom-object/updateCustomObjectWithDescription.repository';
import { fetchProductType } from '../repository/product-type/fetchProductTypeById.repository';
import { translateProductDescription } from '../services/generative-ai/translateProductDescription.service';
import { fetchProduct } from '../repository/product/fetchProductByID.repository';
import { fetchselectedLanguages } from '../repository/custom-object/fetchSelectedLanguages.repository';
import { v4 as uuidv4 } from 'uuid';
import { validatePubSubMessage } from '../helpers/validatePubSubMessage.helpers';
import { validateAndDecodeData } from '../helpers/validateAndDecodeData.helpers';
import { validateNotificationType } from '../helpers/validateNotificationType.helpers';
import { validateEventType } from '../helpers/validateEventType.helpers';
import { MessageData } from '../interfaces/messageData.interface';
import { validateProductData } from '../helpers/validateProductData.helpers';
import { validateProductAttributes } from '../helpers/validateProductAttributes.helpers';

export const processProductDescription = async (productData: any, messageId: string, processId: string): Promise<void> => {
    const productType = productData.productType.id;
    const imageUrl = productData.masterData.current.masterVariant.images[0].url;
    const nameMap = productData.masterData.current.name;
    const productName = nameMap['en'] || nameMap['en-US'] || Object.values(nameMap)[0];
    const productId = productData.id;

    // Fetch product type key from commercetools
    const productTypeKey = await fetchProductType(productType, messageId, processId);

    // Analyze product image
    const imageData = await productAnalysis(imageUrl, messageId, processId);

    // Generate product description
    const generatedDescription = await generateProductDescription(imageData, productName, productTypeKey, messageId, processId);

    // Fetch selected languages for translation
    const languagesForTranslation = await fetchselectedLanguages(messageId, processId);

    // Translate description to multiple languages
    const translations = await translateProductDescription(generatedDescription, languagesForTranslation, messageId, processId);

    // Create custom object to store product descriptions
    await createProductCustomObject(productId, imageUrl, productName, productTypeKey, languagesForTranslation, messageId, processId);

    // Update the custom object with the generated description
    await updateCustomObjectWithDescription(productId, productName, imageUrl, translations as Record<string, string>, productTypeKey, messageId, processId);

    logger.info(`Process ID: ${processId} | Message ID: ${messageId} - processing completed`);
};

export const post = async (request: Request, response: Response): Promise<void> => {
    const processId = uuidv4();
    logger.info(`Process ID: ${processId} - Starting request processing`);

    try {
        // Validate Pub/Sub message
        const pubSubValidation = validatePubSubMessage(request.body?.message, processId);
        if (!pubSubValidation.shouldContinue) {
            response.status(200).send();
            return;
        }

        // Decode and validate data
        const { data: decodedData, shouldContinue: dataContinue } = validateAndDecodeData(request.body.message, processId);
        if (!dataContinue) {
            response.status(200).send();
            return;
        }

        const messageData: MessageData = JSON.parse(decodedData!);

        // Validate notification type
        const notificationValidation = validateNotificationType(messageData, processId);
        if (!notificationValidation.shouldContinue) {
            response.status(200).send();
            return;
        }

        // Validate event type
        const eventValidation = validateEventType(messageData, processId);
        if (!eventValidation.shouldContinue) {
            response.status(200).send();
            return;
        }

        // Check if product ID is present
        const productId = messageData.resource?.id;
        if (!productId) {
            logger.error(`Process ID: ${processId} | Message ID: ${messageData.id} - product ID not found in message`);
            response.status(200).send();
            return;
        }

        // Fetch product data
        const productData = await fetchProduct(productId, messageData.id, processId);

        // Validate product data
        const productValidation = validateProductData(productData, messageData.id, processId);
        if (!productValidation.shouldContinue) {
            response.status(200).send();
            return;
        }

        // Validate product attributes
        const attributeValidation = validateProductAttributes(productData, messageData.id, processId);
        if (!attributeValidation.shouldContinue) {
            response.status(200).send();
            return;
        }

        // Send acknowledgment to Pub/Sub
        response.status(200).send();
        logger.info(`Process ID: ${processId} | Message ID: ${messageData.id} - acknowledgment sent to Pub/Sub`);

        // Process product description generation
        await processProductDescription(productData, messageData.id, processId);

    } catch (error) {
        logger.error(`Process ID: ${processId} | Error processing request`, {
            error: error instanceof Error
                ? { message: error.message, stack: error.stack, name: error.name }
                : error
        });
        response.status(500).send();
    }
};
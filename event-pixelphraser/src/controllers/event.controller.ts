import { Request, Response } from 'express';
import { logger } from '../utils/logger.utils';
import { productAnalysis } from '../services/vision-ai/productAnalysis.service';
import { generateProductDescription } from '../services/generative-ai/descriptionGeneration.service';
import { ProductAttribute } from '../interfaces/productAttribute.interface';
import { createProductCustomObject } from '../repository/custom-object/createCustomObject.repository';
import { updateCustomObjectWithDescription } from '../repository/custom-object/updateCustomObjectWithDescription.repository';
import { fetchProductType } from '../repository/product-type/fetchProductTypeById.repository';
import { translateProductDescription } from '../services/generative-ai/translateProductDescription.service';
import { fetchProduct } from '../repository/product/fetchProductByID.repository';
import { fetchselectedLanguages } from '../repository/custom-object/fetchSelectedLanguages.repository';
import { v4 as uuidv4 } from 'uuid';

export const post = async (request: Request, response: Response): Promise<void> => {

    // Generate a UUID for tracking this message processing session
    const processId = uuidv4();
    logger.info(`Process ID: ${processId} - Starting request processing`);

    try {

        // Extract and validate Pub/Sub message
        const pubSubMessage = request.body?.message;
        if (!pubSubMessage) {
            logger.error(`Process ID: ${processId} - Missing Pub/Sub message`);
            response.status(200).send();
            return;
        }
        logger.info('Message Received:', pubSubMessage);

        // Decode Pub/Sub message data
        const decodedData = pubSubMessage.data
            ? Buffer.from(pubSubMessage.data, 'base64').toString().trim()
            : undefined;

        if (!decodedData) {
            logger.error(`Process ID: ${processId} - No data found in Pub/Sub message`);
            response.status(200).send();
            return;
        }
        logger.info(`Process ID: ${processId} - Decoded Data: ${decodedData}`);

        // Parse the decoded data
        const messageData = JSON.parse(decodedData);

        // Get message ID & notification type
        const messageId = messageData?.id;
        const notificationType = messageData?.notificationType;

        // Check if the notification type is ResourceCreated or Message
        if (notificationType === 'Message') {
            logger.info(`Process ID: ${processId} | Message ID: ${messageId} - message received is of type ${notificationType}. processing message`);
        } else if (notificationType === 'ResourceCreated') {
            logger.info(`Process ID: ${processId} | Message ID: ${messageId} - message received is of type ${notificationType}. skipping message`);
            response.status(200).send();
            return;
        } else {
            logger.info(`Process ID: ${processId} | Message ID: ${messageId} - message received is of type ${notificationType}. skipping message`);
            response.status(200).send();
            return;
        }

        // Check if the resource type is valid
        const eventType = messageData?.type;
        logger.info(`Process ID: ${processId} | Message ID: ${messageId} - event received: ${eventType}`);
        const validEventTypes = ['ProductVariantAdded', 'ProductImageAdded', 'ProductCreated'];
        if (!validEventTypes.includes(eventType)) {
            logger.error(`Process ID: ${processId} | Message ID: ${messageId} - invalid event type: ${eventType}`);
            response.status(200).send();
            return;
        }

        // Check if the product ID is present in the message
        const productId = messageData.resource?.id;
        if (!productId) {
            logger.error(`Process ID: ${processId} | Message ID: ${messageId} - product ID not found in message`);
            response.status(200).send();
            return;
        }

        // Fetch product data from commercetools
        const productData = await fetchProduct(productId, messageId, processId);

        // Extract product type, name and image URL from product data
        const productType = productData?.productType?.id;
        const imageUrl = productData?.masterData?.current?.masterVariant?.images?.[0]?.url;
        const nameMap = productData?.masterData?.current?.name || {};
        const productName = nameMap['en'] || nameMap['en-US'] || Object.values(nameMap)[0];
        logger.info(`Process ID: ${processId} | Message ID: ${messageId} - product name: ${productName}`);

        // Check if product type, name and image URL are present
        if (!productType || !productName || !imageUrl) {
            logger.error(`Process ID: ${processId} | Message ID: ${messageId} - missing data (Product Type: ${productType}, Product Name: ${productName}, Image Url: ${imageUrl})`);
            response.status(200).send();
            return;
        }

        // Extract and validate product attributes
        const attributes: ProductAttribute[] = productData?.masterData?.staged?.masterVariant?.attributes || [];
        if (!attributes.length) {
            logger.error(`Process ID: ${processId} | Message ID: ${messageId} - no product attributes found`);
            response.status(200).send();
            return;
        }

        // Check if automatic description generation is enabled
        const genDescriptionAttr = attributes.find(attr => attr.name === 'generateDescription');
        if (!genDescriptionAttr || !Boolean(genDescriptionAttr?.value)) {
            logger.info(`Process ID: ${processId} | Message ID: ${messageId} - automatic description generation not enabled`);
            response.status(200).send();
            return;
        }

        // Sending acknowledgment to Pub/Sub
        response.status(200).send();
        logger.info(`Process ID: ${processId} | Message ID: ${messageId} - acknowledgment sent to Pub/Sub`);

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

    } catch (error) {
        logger.error(`Process ID: ${processId} | Error processing request`, {
            error: error instanceof Error
                ? { message: error.message, stack: error.stack, name: error.name }
                : error
        });
        response.status(500).send();
    }    
};
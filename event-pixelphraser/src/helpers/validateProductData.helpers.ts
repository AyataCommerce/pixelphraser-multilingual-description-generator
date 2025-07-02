import { ValidationResult } from "../interfaces/validationResult.interface";
import { logger } from "../utils/logger.utils";

export const validateProductData = (productData: any, messageId: string, processId: string): ValidationResult => {
    const productType = productData?.productType?.id;
    const imageUrl = productData?.masterData?.current?.masterVariant?.images?.[0]?.url;
    const nameMap = productData?.masterData?.current?.name || {};
    const productName = nameMap['en'] || nameMap['en-US'] || Object.values(nameMap)[0];
    
    logger.info(`Process ID: ${processId} | Message ID: ${messageId} - product name: ${productName}`);
    
    if (!productType || !productName || !imageUrl) {
        logger.error(`Process ID: ${processId} | Message ID: ${messageId} - missing data (Product Type: ${productType}, Product Name: ${productName}, Image Url: ${imageUrl})`);
        return { isValid: false, shouldContinue: false };
    }
    
    return { isValid: true, shouldContinue: true };
};
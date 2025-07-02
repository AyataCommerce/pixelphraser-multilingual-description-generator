import { ProductAttribute } from "../interfaces/productAttribute.interface";
import { ValidationResult } from "../interfaces/validationResult.interface";
import { logger } from "../utils/logger.utils";

export const validateProductAttributes = (productData: any, messageId: string, processId: string): ValidationResult => {
    const attributes: ProductAttribute[] = productData?.masterData?.staged?.masterVariant?.attributes || [];
    
    if (!attributes.length) {
        logger.error(`Process ID: ${processId} | Message ID: ${messageId} - no product attributes found`);
        return { isValid: false, shouldContinue: false };
    }
    
    const genDescriptionAttr = attributes.find(attr => attr.name === 'generateDescription');
    if (!genDescriptionAttr || !Boolean(genDescriptionAttr?.value)) {
        logger.info(`Process ID: ${processId} | Message ID: ${messageId} - automatic description generation not enabled`);
        return { isValid: true, shouldContinue: false };
    }
    
    return { isValid: true, shouldContinue: true };
};
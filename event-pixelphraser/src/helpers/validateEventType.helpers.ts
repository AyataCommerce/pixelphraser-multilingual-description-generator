import { MessageData } from "../interfaces/messageData.interface";
import { ValidationResult } from "../interfaces/validationResult.interface";
import { logger } from "../utils/logger.utils";

export const validateEventType = (messageData: MessageData, processId: string): ValidationResult => {
    const { id: messageId, type: eventType } = messageData;
    
    logger.info(`Process ID: ${processId} | Message ID: ${messageId} - event received: ${eventType}`);
    
    const validEventTypes = ['ProductVariantAdded', 'ProductImageAdded', 'ProductCreated'];
    if (!validEventTypes.includes(eventType)) {
        logger.error(`Process ID: ${processId} | Message ID: ${messageId} - invalid event type: ${eventType}`);
        return { isValid: false, shouldContinue: false };
    }
    
    return { isValid: true, shouldContinue: true };
};
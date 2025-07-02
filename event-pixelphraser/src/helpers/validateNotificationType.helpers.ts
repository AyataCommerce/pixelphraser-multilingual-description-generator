import { MessageData } from "../interfaces/messageData.interface";
import { ValidationResult } from "../interfaces/validationResult.interface";
import { logger } from "../utils/logger.utils";

export const validateNotificationType = (messageData: MessageData, processId: string): ValidationResult => {
    const { id: messageId, notificationType } = messageData;
    
    if (notificationType === 'Message') {
        logger.info(`Process ID: ${processId} | Message ID: ${messageId} - message received is of type ${notificationType}. processing message`);
        return { isValid: true, shouldContinue: true };
    }
    
    // All other notification types should be skipped
    logger.info(`Process ID: ${processId} | Message ID: ${messageId} - message received is of type ${notificationType}. skipping message`);
    return { isValid: true, shouldContinue: false };
};
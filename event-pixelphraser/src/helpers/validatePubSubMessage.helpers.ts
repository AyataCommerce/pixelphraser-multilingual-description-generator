import { ValidationResult } from "../interfaces/validationResult.interface";
import { logger } from "../utils/logger.utils";

export const validatePubSubMessage = (pubSubMessage: any, processId: string): ValidationResult => {
    if (!pubSubMessage) {
        logger.error(`Process ID: ${processId} - Missing Pub/Sub message`);
        return { isValid: false, shouldContinue: false };
    }
    logger.info('Message Received:', pubSubMessage);
    return { isValid: true, shouldContinue: true };
};
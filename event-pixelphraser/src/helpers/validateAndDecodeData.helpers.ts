import { logger } from "../utils/logger.utils";

export const validateAndDecodeData = (pubSubMessage: any, processId: string): { data: string | null; shouldContinue: boolean } => {
    const decodedData = pubSubMessage.data
        ? Buffer.from(pubSubMessage.data, 'base64').toString().trim()
        : undefined;

    if (!decodedData) {
        logger.error(`Process ID: ${processId} - No data found in Pub/Sub message`);
        return { data: null, shouldContinue: false };
    }
    
    logger.info(`Process ID: ${processId} - Decoded Data: ${decodedData}`);
    return { data: decodedData, shouldContinue: true };
};
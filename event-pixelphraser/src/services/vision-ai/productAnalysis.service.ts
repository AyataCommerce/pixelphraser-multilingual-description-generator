import { ImageData } from '../../interfaces/imageData.interface';
import { logger } from '../../utils/logger.utils';
import { visionClient } from '../../config/ai.config';

export async function productAnalysis(imageURL: string, messageId: string, processId: string): Promise<ImageData> {
    try {
        logger.info(`Process ID: ${processId} | Message ID: ${messageId} - sending image to Vision AI for analysis`);

        const request = {
            image: { source: { imageUri: imageURL } },
            features: [
                { type: 'LABEL_DETECTION' },
                { type: 'OBJECT_LOCALIZATION' },
                { type: 'IMAGE_PROPERTIES' },
                { type: 'TEXT_DETECTION' },
                { type: 'SAFE_SEARCH_DETECTION' },
                { type: 'WEB_DETECTION' }
            ]
        };

        const [result] = await visionClient.annotateImage(request);
        if (!result) throw new Error(`Message ID: ${messageId} - Vision AI analysis failed`);

        const imageData = {
            labels: result.labelAnnotations?.map((label: any) => label.description).join(', ') || 'No labels detected',
            objects: result.localizedObjectAnnotations?.map((obj: any) => obj.name).join(', ') || 'No objects detected',
            colors: result.imagePropertiesAnnotation?.dominantColors?.colors?.slice(0, 3).map((color: any) => {
                const rgb = color.color;
                return `${Math.round(rgb.red)}, ${Math.round(rgb.green)}, ${Math.round(rgb.blue)}`;
            }) || ['No colors detected'],
            detectedText: result.textAnnotations?.[0]?.description || 'No text detected',
            webEntities: result.webDetection?.webEntities?.slice(0, 5).map((entity: any) => entity.description).join(', ') || 'No web entities detected'
        };

        logger.info(`Process ID: ${processId} | Message ID: ${messageId} - Vision AI analysis completed`);
        return imageData;

    } catch (error: any) {
        logger.error(`Process ID: ${processId} | Message ID: ${messageId} - error during Vision AI analysis:`, { 
                message: error.message, stack: error.stack 
            });
        throw error;
    }
}

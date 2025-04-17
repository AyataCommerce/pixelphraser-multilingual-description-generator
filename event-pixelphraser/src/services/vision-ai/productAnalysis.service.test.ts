import { productAnalysis } from './productAnalysis.service';
import { visionClient } from '../../config/ai.config';

jest.mock('../../../src/config/ai.config', () => ({
  visionClient: {
    annotateImage: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger.utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('productAnalysis', () => {
  const mockImageURL = 'https://test-image.jpg';
  const messageId = 'msg-123';
  const processId = 'proc-456';

  beforeEach(() => {
    (visionClient.annotateImage as jest.Mock).mockReset();
  });

  it('should analyze image successfully with complete data', async () => {
    const mockVisionResponse = [{
      labelAnnotations: [{ description: 'label1' }, { description: 'label2' }],
      localizedObjectAnnotations: [{ name: 'object1' }, { name: 'object2' }],
      imagePropertiesAnnotation: {
        dominantColors: {
          colors: [
            { color: { red: 255, green: 0, blue: 0 } },
            { color: { red: 0, green: 255, blue: 0 } },
            { color: { red: 0, green: 0, blue: 255 } }
          ]
        }
      },
      textAnnotations: [{ description: 'some detected text' }],
      webDetection: {
        webEntities: [
          { description: 'entity1' },
          { description: 'entity2' },
          { description: 'entity3' }
        ]
      }
    }];

    (visionClient.annotateImage as jest.Mock).mockResolvedValue(mockVisionResponse);

    const result = await productAnalysis(mockImageURL, messageId, processId);

    expect(result).toEqual({
      labels: 'label1, label2',
      objects: 'object1, object2',
      colors: ['255, 0, 0', '0, 255, 0', '0, 0, 255'],
      detectedText: 'some detected text',
      webEntities: 'entity1, entity2, entity3',
    });

    expect(visionClient.annotateImage).toHaveBeenCalledWith({
      image: { source: { imageUri: mockImageURL } },
      features: [
        { type: 'LABEL_DETECTION' },
        { type: 'OBJECT_LOCALIZATION' },
        { type: 'IMAGE_PROPERTIES' },
        { type: 'TEXT_DETECTION' },
        { type: 'SAFE_SEARCH_DETECTION' },
        { type: 'WEB_DETECTION' },
      ],
    });
  });

  it('should handle missing fields gracefully', async () => {
    const mockVisionResponse = [{}];
    (visionClient.annotateImage as jest.Mock).mockResolvedValue(mockVisionResponse);

    const result = await productAnalysis(mockImageURL, messageId, processId);

    expect(result).toEqual({
      labels: 'No labels detected',
      objects: 'No objects detected',
      colors: ['No colors detected'],
      detectedText: 'No text detected',
      webEntities: 'No web entities detected',
    });
  });

  it('should throw an error if Vision AI returns null', async () => {
    (visionClient.annotateImage as jest.Mock).mockResolvedValue([null]);

    await expect(productAnalysis(mockImageURL, messageId, processId)).rejects.toThrow(
      `Message ID: ${messageId} - Vision AI analysis failed`
    );
  });

  it('should handle API errors', async () => {
    const error = new Error('Vision API crashed');
    (visionClient.annotateImage as jest.Mock).mockRejectedValue(error);

    await expect(productAnalysis(mockImageURL, messageId, processId)).rejects.toThrow('Vision API crashed');
  });
});

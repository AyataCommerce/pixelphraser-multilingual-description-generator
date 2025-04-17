import { generateProductDescription } from './descriptionGeneration.service';
import { model } from '../../config/ai.config';

jest.mock('../../../src/config/ai.config', () => ({
  model: {
    generateContent: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger.utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('Description Generation Service', () => {
  const mockImageData = {
    labels: 'shirt, cotton',
    objects: 'clothing, apparel',
    colors: ['255, 255, 255'],
    detectedText: 'brand name',
    webEntities: 'fashion, style'
  };

  const productName = 'Classic Cotton Shirt';
  const productTypeKey = 'shirt-type';
  const messageId = 'msg-123';
  const processId = 'proc-456';

  beforeEach(() => {
    (model.generateContent as jest.Mock).mockReset();
  });

  it('should generate a description successfully', async () => {
    const mockGeneratedText = 'This is a polished product description.';
    (model.generateContent as jest.Mock).mockResolvedValue({
      response: { text: () => mockGeneratedText }
    });

    const result = await generateProductDescription(mockImageData, productName, productTypeKey, messageId, processId);

    expect(result).toBe(mockGeneratedText);
    expect(model.generateContent).toHaveBeenCalledTimes(1);

    const calledPrompt = (model.generateContent as jest.Mock).mock.calls[0][0];
    expect(calledPrompt).toContain(productName);
    expect(calledPrompt).toContain(productTypeKey);
    expect(calledPrompt).toContain(mockImageData.labels);
    expect(calledPrompt).toContain(mockImageData.colors[0]);
  });

  it('should throw an error if the response is null', async () => {
    (model.generateContent as jest.Mock).mockResolvedValue(null);

    await expect(generateProductDescription(mockImageData, productName, productTypeKey, messageId, processId))
      .rejects.toThrow('Generative AI response is null or undefined.');
  });

  it('should handle and rethrow API errors', async () => {
    const error = new Error('API error occurred');
    (model.generateContent as jest.Mock).mockRejectedValue(error);

    await expect(generateProductDescription(mockImageData, productName, productTypeKey, messageId, processId))
      .rejects.toThrow('API error occurred');
  });
});

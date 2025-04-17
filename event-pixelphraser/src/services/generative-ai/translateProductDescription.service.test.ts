import { translateProductDescription } from './translateProductDescription.service';
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

describe('translateProductDescription', () => {
  const mockDescription = 'This is a product description.';
  const languages = ['fr', 'de'];
  const messageId = 'msg-456';
  const processId = 'proc-789';

  beforeEach(() => {
    (model.generateContent as jest.Mock).mockReset();
  });

  it('should translate the description into multiple languages', async () => {
    (model.generateContent as jest.Mock)
      .mockResolvedValueOnce({ response: { text: () => 'Ceci est une description de produit.' } })
      .mockResolvedValueOnce({ response: { text: () => 'Dies ist eine Produktbeschreibung.' } });

    const result = await translateProductDescription(mockDescription, languages, messageId, processId);

    expect(result).toEqual({
      fr: 'Ceci est une description de produit.',
      de: 'Dies ist eine Produktbeschreibung.'
    });

    expect(model.generateContent).toHaveBeenCalledTimes(2);
    const promptForFrench = (model.generateContent as jest.Mock).mock.calls[0][0];
    expect(promptForFrench).toContain('Translate the following product description into fr');
    expect(promptForFrench).toContain(mockDescription);
  });

  it('should throw if response is null for any language', async () => {
    (model.generateContent as jest.Mock).mockResolvedValue(null);

    await expect(
      translateProductDescription(mockDescription, ['es'], messageId, processId)
    ).rejects.toThrow(`Message ID: ${messageId} - translation to es failed`);
  });

  it('should throw if translated text is undefined', async () => {
    (model.generateContent as jest.Mock).mockResolvedValue({ response: { text: () => undefined } });

    await expect(
      translateProductDescription(mockDescription, ['it'], messageId, processId)
    ).rejects.toThrow(`Message ID: ${messageId} - translation to it failed.`);
  });

  it('should handle and rethrow errors from the API', async () => {
    const error = new Error('Translation API failed');
    (model.generateContent as jest.Mock).mockRejectedValue(error);

    await expect(
      translateProductDescription(mockDescription, ['ja'], messageId, processId)
    ).rejects.toThrow('Translation API failed');
  });
});

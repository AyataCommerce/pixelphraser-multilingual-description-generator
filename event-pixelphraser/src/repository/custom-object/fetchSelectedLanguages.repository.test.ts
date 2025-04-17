import { fetchselectedLanguages } from './fetchSelectedLanguages.repository';

jest.mock('../../client/create.client', () => ({
  createApiRoot: jest.fn()
}));

jest.mock('../../utils/logger.utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('fetchselectedLanguages', () => {
  const messageId = 'msg-123';
  const processId = 'proc-456';
  const mockExecute = jest.fn();
  const mockGet = jest.fn(() => ({ execute: mockExecute }));
  const mockWithContainerAndKey = jest.fn(() => ({ get: mockGet }));
  const mockCustomObjects = jest.fn(() => ({
    withContainerAndKey: mockWithContainerAndKey
  }));

  beforeEach(() => {
    const { createApiRoot } = require('../../client/create.client');
    (createApiRoot as jest.Mock).mockReturnValue({
      customObjects: mockCustomObjects
    });

    jest.clearAllMocks();
  });

  it('should return selected languages as an array', async () => {
    const languagesArray = ['en', 'de', 'fr'];
    mockExecute.mockResolvedValueOnce({
      body: { value: languagesArray }
    });

    const result = await fetchselectedLanguages(messageId, processId);

    expect(result).toEqual(languagesArray);
    expect(mockWithContainerAndKey).toHaveBeenCalledWith({
      container: 'selectedLanguages',
      key: 'pixelphraser'
    });

    const { logger } = require('../../utils/logger.utils');
    expect(logger.info).toHaveBeenCalledWith(
      `Process ID: ${processId} | Message ID: ${messageId} - fetching languages for translation`
    );
    expect(logger.info).toHaveBeenCalledWith(
      `Process ID: ${processId} | Message ID: ${messageId} - languages fetched: ${JSON.stringify(languagesArray)}`
    );
  });

  it('should convert object values to array if not an array', async () => {
    const languageObj = { en: 'en', de: 'de', fr: 'fr' };
    mockExecute.mockResolvedValueOnce({
      body: { value: languageObj }
    });

    const result = await fetchselectedLanguages(messageId, processId);

    expect(result).toEqual(['en', 'de', 'fr']);
  });

  it('should throw error when API call fails', async () => {
    const error = new Error('API failure');
    mockExecute.mockRejectedValueOnce(error);

    await expect(fetchselectedLanguages(messageId, processId)).rejects.toThrow('API failure');

    const { logger } = require('../../utils/logger.utils');
    expect(logger.error).toHaveBeenCalledWith(
      `Process ID: ${processId} | Message ID: ${messageId} - failed to fetch languages`,
      { message: error.message }
    );
  });
});

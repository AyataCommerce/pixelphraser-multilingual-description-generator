// src/connector/post-deploy.test.ts

jest.mock('../client/create.client', () => ({
  createApiRoot: jest.fn(() => ({ mocked: true })),
}));

jest.mock('../connector/actions', () => ({
  createGcpPubSubProductSubscription: jest.fn(() => Promise.resolve()),
}));

jest.mock('../utils/assert.utils', () => ({
  assertString: jest.fn(),
  assertError: jest.fn(),
}));

import { postDeploy } from './post-deploy';
import { createGcpPubSubProductSubscription } from './actions';
import { assertString } from '../utils/assert.utils';

describe('postDeploy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls expected methods with correct arguments', async () => {
    const props = new Map([
      ['CONNECT_GCP_TOPIC_NAME', 'test-topic'],
      ['CONNECT_GCP_PROJECT_ID', 'test-project'],
    ]);

    await postDeploy(props);

    expect(assertString).toHaveBeenCalledWith('test-topic', 'CONNECT_GCP_TOPIC_NAME');
    expect(assertString).toHaveBeenCalledWith('test-project', 'CONNECT_GCP_PROJECT_ID');
    expect(createGcpPubSubProductSubscription).toHaveBeenCalledWith(
      { mocked: true },
      'test-topic',
      'test-project'
    );
  });

  it('throws if a required property is missing', async () => {
    const props = new Map(); // Missing everything

    (assertString as jest.Mock).mockImplementation((value: any, key: string) => {
      if (!value) throw new Error(`${key} missing`);
    });

    await expect(postDeploy(props)).rejects.toThrow('CONNECT_GCP_TOPIC_NAME missing');
  });
});

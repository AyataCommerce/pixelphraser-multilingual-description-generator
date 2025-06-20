// src/connector/actions.test.ts

import {
  createGcpPubSubProductSubscription,
  deleteProductSubscription,
} from './actions';

// Fake builder method stubs
const mockExecute = jest.fn();
const mockPost = jest.fn(() => ({ execute: mockExecute }));
const mockDelete = jest.fn(() => ({ execute: mockExecute }));
const mockWithKey = jest.fn(() => ({ delete: mockDelete }));
const mockGet = jest.fn(() => ({ execute: mockExecute }));
const mockSubscriptions = jest.fn(() => ({
  get: mockGet,
  post: mockPost,
  withKey: mockWithKey,
}));

// Create a mock API root with subscriptions methods
const mockApiRoot = {
  subscriptions: mockSubscriptions,
} as any;

describe('createGcpPubSubProductSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EVENT_TRIGGER_NAME; // Ensure clean env
  });

  it('should create a new subscription with default event trigger', async () => {
    // Mock GET to return no existing subscriptions
    mockExecute.mockResolvedValueOnce({ body: { results: [] } }); // for GET
    mockExecute.mockResolvedValueOnce({}); // for POST

    await createGcpPubSubProductSubscription(mockApiRoot, 'topic-abc', 'project-xyz');

    expect(mockSubscriptions).toHaveBeenCalled();
    expect(mockPost).toHaveBeenCalledWith({
      body: {
        key: 'productCreatedSubscription',
        destination: {
          type: 'GoogleCloudPubSub',
          topic: 'topic-abc',
          projectId: 'project-xyz',
        },
        messages: [
          {
            resourceTypeId: 'product',
            types: ['ProductCreated'],
          },
        ],
      },
    });
    expect(mockExecute).toHaveBeenCalledTimes(2);
  });

  it('should use custom event trigger types from env', async () => {
    process.env.EVENT_TRIGGER_NAME = 'ProductUpdated, ProductDeleted';

    mockExecute.mockResolvedValueOnce({ body: { results: [] } }); // for GET
    mockExecute.mockResolvedValueOnce({}); // for POST

    await createGcpPubSubProductSubscription(mockApiRoot, 'topic-xyz', 'project-abc');

    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          messages: [
            {
              resourceTypeId: 'product',
              types: ['ProductUpdated', 'ProductDeleted'],
            },
          ],
        }),
      })
    );
  });
});

describe('deleteProductSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not call delete if no existing subscription', async () => {
    mockExecute.mockResolvedValueOnce({ body: { results: [] } }); // for GET

    await deleteProductSubscription(mockApiRoot);

    expect(mockGet).toHaveBeenCalled();
    expect(mockWithKey).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('should call delete on existing subscription', async () => {
    mockExecute.mockResolvedValueOnce({
      body: {
        results: [
          {
            version: 5,
          },
        ],
      },
    }); // GET
    mockExecute.mockResolvedValueOnce({}); // DELETE

    await deleteProductSubscription(mockApiRoot);

    expect(mockWithKey).toHaveBeenCalledWith({ key: 'productCreatedSubscription' });
    expect(mockDelete).toHaveBeenCalledWith({
      queryArgs: {
        version: 5,
      },
    });
    expect(mockExecute).toHaveBeenCalledTimes(2);
  });
});

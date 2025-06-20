// src/connector/pre-undeploy.test.ts

// 🛠️ Mock modules BEFORE importing the tested file
jest.mock('../client/create.client', () => ({
  createApiRoot: jest.fn(() => ({ mocked: true })),
}));

jest.mock('../connector/actions', () => ({
  deleteProductSubscription: jest.fn(() => Promise.resolve()),
}));

import { preUndeploy } from './pre-undeploy';
import { deleteProductSubscription } from './actions';
import { createApiRoot } from '../client/create.client';

describe('preUndeploy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls createApiRoot and deleteProductSubscription', async () => {
    await preUndeploy();

    expect(createApiRoot).toHaveBeenCalled();
    expect(deleteProductSubscription).toHaveBeenCalledWith({ mocked: true });
  });

  it('throws error if deleteProductSubscription fails', async () => {
    (deleteProductSubscription as jest.Mock).mockRejectedValue(new Error('Boom'));

    await expect(preUndeploy()).rejects.toThrow('Boom');
  });
});

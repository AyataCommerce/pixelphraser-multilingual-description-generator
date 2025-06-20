// event-pixelphraser\src\connector\pre-undeploy.ts
import dotenv from 'dotenv';
dotenv.config();

import { createApiRoot } from '../client/create.client';
import { assertError } from '../utils/assert.utils';
import { deleteProductSubscription } from './actions';

export async function preUndeploy(): Promise<void> {
  const apiRoot = createApiRoot();
  await deleteProductSubscription(apiRoot);
}

async function run(): Promise<void> {
  try {
    await preUndeploy();
  } catch (error) {
    assertError(error);
    process.stderr.write(`Post-undeploy failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

run();

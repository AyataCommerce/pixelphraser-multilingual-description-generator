import { Product } from '@commercetools/platform-sdk';
import { createApiRoot } from '../../client/create.client';
import { logger } from '../../utils/logger.utils';

export async function fetchProduct(productId: string, messageId: string, processId: string): Promise<Product> {
    try {
        const apiRoot = createApiRoot();

        logger.info(`Process ID: ${processId} | Message ID: ${messageId} - fetching product with ID: ${productId}`);
        
        const productResponse = await apiRoot
            .products()
            .withId({ ID: productId })
            .get()
            .execute();

        const productData = productResponse.body ?? null;

        logger.info(`Process ID: ${processId} | Message ID: ${messageId} - product fetched with ID: ${productId}`);

        return productData;

    } catch (error: any) {
        logger.error(`Process ID: ${processId} | Message ID: ${messageId} - failed to fetch product with ID: ${productId}`, {
            message: error.message,
        });
        throw error;
    }
}

import envValidators from './env.validators';
import { getValidateMessages } from './helpers.validators';

describe('envValidators', () => {
    const validEnv = {
        clientId: 'a'.repeat(24),
        clientSecret: 'b'.repeat(32),
        projectKey: 'valid-project',
        scope: 'read',
        region: 'us-central1.gcp',
    };

    it('should pass for valid environment variables', () => {
        const errors = getValidateMessages(envValidators, validEnv);
        expect(errors).toEqual([]);
    });

    it('should fail for short clientId', () => {
        const invalidEnv = { ...validEnv, clientId: 'short' };
        const errors = getValidateMessages(envValidators, invalidEnv);
        expect(errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ code: 'InValidClientId' }),
            ])
        );
    });

    it('should fail for invalid region', () => {
        const invalidEnv = { ...validEnv, region: 'invalid-region' };
        const errors = getValidateMessages(envValidators, invalidEnv);
        expect(errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ code: 'InvalidRegion' }),
            ])
        );
    });

    it('should allow missing optional scope', () => {
        const { scope, ...envWithoutScope } = validEnv;
        const errors = getValidateMessages(envValidators, envWithoutScope);
        expect(errors).toEqual([]);
    });

    it('should fail for short clientSecret', () => {
        const env = { ...validEnv, clientSecret: '123' };
        const errors = getValidateMessages(envValidators, env);
        expect(errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ code: 'InvalidClientSecret' }),
            ])
        );
    });
});

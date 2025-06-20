import {
  standardString,
  standardKey,
  optional,
  region,
  getValidateMessages,
} from './helpers.validators';

describe('Validator Helpers', () => {
  test('standardString - valid input', () => {
    const validatorConfig = standardString(['name'], { code: 'InvalidName', message: 'Name required', referencedBy: 'test' }, { min: 3 });
    const result = getValidateMessages([validatorConfig], { name: 'John' });
    expect(result).toEqual([]);
  });

  test('standardString - invalid input (too short)', () => {
    const validatorConfig = standardString(['name'], { code: 'InvalidName', message: 'Name required', referencedBy: 'test' }, { min: 3 });
    const result = getValidateMessages([validatorConfig], { name: 'Jo' });
    expect(result).toEqual([{ code: 'InvalidName', message: 'Name required', referencedBy: 'test' }]);
  });

  test('standardKey - valid', () => {
    const config = standardKey(['key'], { code: 'InvalidKey', message: 'Invalid key', referencedBy: 'test' });
    const result = getValidateMessages([config], { key: 'valid-key_123' });
    expect(result).toEqual([]);
  });

  test('standardKey - invalid', () => {
    const config = standardKey(['key'], { code: 'InvalidKey', message: 'Invalid key', referencedBy: 'test' });
    const result = getValidateMessages([config], { key: '$$badkey' });
    expect(result).toEqual([{ code: 'InvalidKey', message: 'Invalid key', referencedBy: 'test' }]);
  });

  test('optional(standardString) - missing value', () => {
    const config = optional(standardString)(['scope'], { code: 'InvalidScope', message: 'Scope too short', referencedBy: 'test' }, { min: 2 });
    const result = getValidateMessages([config], {});
    expect(result).toEqual([]);
  });

  test('optional(standardString) - invalid value', () => {
    const config = optional(standardString)(['scope'], { code: 'InvalidScope', message: 'Scope too short', referencedBy: 'test' }, { min: 2 });
    const result = getValidateMessages([config], { scope: 'a' });
    expect(result).toEqual([{ code: 'InvalidScope', message: 'Scope too short', referencedBy: 'test' }]);
  });

  test('region - valid', () => {
    const config = region(['region'], { code: 'InvalidRegion', message: 'Invalid region', referencedBy: 'test' });
    const result = getValidateMessages([config], { region: 'us-central1.gcp' });
    expect(result).toEqual([]);
  });

  test('region - invalid', () => {
    const config = region(['region'], { code: 'InvalidRegion', message: 'Invalid region', referencedBy: 'test' });
    const result = getValidateMessages([config], { region: 'asia-south1.aws' });
    expect(result).toEqual([{ code: 'InvalidRegion', message: 'Invalid region', referencedBy: 'test' }]);
  });
});

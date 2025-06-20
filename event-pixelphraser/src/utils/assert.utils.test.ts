import { assert, assertError, assertString } from '../utils/assert.utils';

describe('assert', () => {
  it('should not throw when condition is truthy', () => {
    expect(() => assert(true, 'Should not throw')).not.toThrow();
    expect(() => assert(1, 'Should not throw')).not.toThrow();
    expect(() => assert('valid', 'Should not throw')).not.toThrow();
  });

  it('should throw with custom message when condition is falsy', () => {
    expect(() => assert(false, 'Condition failed')).toThrowError(
      'Assertion failed: Condition failed'
    );
    expect(() => assert(null, 'Null value')).toThrowError(
      'Assertion failed: Null value'
    );
  });
});

describe('assertError', () => {
  it('should not throw if value is an instance of Error', () => {
    expect(() => assertError(new Error('Some error'))).not.toThrow();
  });

  it('should throw if value is not an Error', () => {
    expect(() => assertError('not an error')).toThrowError(
      'Assertion failed: Invalid error value'
    );

    expect(() => assertError({}, 'Expected error instance')).toThrowError(
      'Assertion failed: Expected error instance'
    );
  });
});

describe('assertString', () => {
  it('should not throw if value is a string', () => {
    expect(() => assertString('valid string')).not.toThrow();
  });

  it('should throw if value is not a string', () => {
    expect(() => assertString(123)).toThrowError(
      'Assertion failed: Invalid string value'
    );

    expect(() => assertString({}, 'Expected string')).toThrowError(
      'Assertion failed: Expected string'
    );
  });
});

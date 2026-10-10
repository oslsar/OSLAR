// Database-free tests using the same decimal helper as the generated browser form.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidDecimal, validateEntityPayload } from '../lib/compiler/validation.ts';
import { coerceEntityPayload } from '../lib/compiler/coercion.ts';

function preview(precision, scale, required = false) {
  return {
    entity: { entityCode: 'TEST' },
    gui: { generatedFields: [{
      columnName: 'AMOUNT', label: 'Amount', controlType: 'decimal',
      formatSpec: `numeric(${precision},${scale})`,
      validation: { required, maxLength: null, integerDigits: null, precision, scale },
    }] },
  };
}

for (const [precision, scale, valid, invalid] of [
  [6, 2, ['0', '1', '1.2', '1234.56', '-12.34'], ['12345.67', '1.234']],
  [9, 4, ['0', '1', '12345.6789', '-12.3456'], ['123456.7890', '1.23456']],
  [2, 2, ['0', '0.1', '0.12', '-0.12', '-0', '0.00'],
    ['1', '1.00', '10', '0.123', '-1', '-0.123', '.12', '-.12']],
  [2, 0, ['0', '12', '-12'], ['123', '1.0']],
]) {
  test(`numeric(${precision},${scale}) preserves valid decimals through validation and coercion`, () => {
    const definition = preview(precision, scale);
    for (const value of valid) {
      assert.equal(isValidDecimal(value, precision, scale), true, value);
      assert.deepEqual(validateEntityPayload(definition, { AMOUNT: value }),
        { valid: true, errors: [] }, value);
      assert.deepEqual(coerceEntityPayload(definition, { AMOUNT: value }),
        { valid: true, values: { AMOUNT: value }, errors: [] }, value);
    }
  });

  test(`numeric(${precision},${scale}) rejects overflow without throwing`, () => {
    for (const value of invalid) {
      assert.equal(isValidDecimal(value, precision, scale), false, value);
      let result;
      assert.doesNotThrow(() => {
        result = validateEntityPayload(preview(precision, scale), { AMOUNT: value });
      }, value);
      assert.equal(result.valid, false, value);
      assert.equal(result.errors[0].code, 'decimal_format', value);
    }
  });
}

test('numeric(2,2) retains optional and required empty-value behavior', () => {
  for (const value of ['', null, undefined]) {
    assert.equal(validateEntityPayload(preview(2, 2), { AMOUNT: value }).valid, true);
    const result = validateEntityPayload(preview(2, 2, true), { AMOUNT: value });
    assert.equal(result.errors[0].code, 'required');
  }
});

test('decimal syntax remains consistent with coercion', () => {
  for (const value of ['.12', '-.12', '0.', '+0.12', '1e-2', 'NaN', 'Infinity', 'abc']) {
    assert.equal(isValidDecimal(value, 2, 2), false, value);
    assert.equal(coerceEntityPayload(preview(2, 2), { AMOUNT: value }).valid, false, value);
  }
  assert.equal(validateEntityPayload(preview(2, 2), { AMOUNT: 0.12 }).valid, true);
  assert.equal(validateEntityPayload(preview(2, 2), { AMOUNT: 1 }).valid, false);
});

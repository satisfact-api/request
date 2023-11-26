import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import tryParse from './try-parse.js';

describe('With JSON', () => {
  test('It returns an object if the JSON is a valid object', async () => {
    assert.deepEqual(
      tryParse(JSON.stringify({ matricule: 'NCC-1701' })),
      { matricule: 'NCC-1701' },
    );
  });
  test('It returns a string if the JSON is a string', async () => {
    assert.equal(tryParse('"James T. Kirk"'), 'James T. Kirk');
  });
});

describe('Without JSON', () => {
  test('It properly returns a strings', async () => {
    assert.equal(tryParse('James T. Kirk'), 'James T. Kirk');
  });
  test('It properly returns an integer', async () => {
    assert.equal(tryParse(42), 42);
  });
  test('It properly returns a buffer', async () => {
    assert.deepEqual(tryParse(Buffer.from('NCC-1701')), Buffer.from('NCC-1701'));
  });
});

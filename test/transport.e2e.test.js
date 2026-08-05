'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const artifact = path.resolve(__dirname, '..', 'dist', 'blt.js');
const source = fs.readFileSync(artifact, 'utf8');

const loadTransport = fakeConsole => {
  const context = {
    console: fakeConsole,
    module: {exports: {}},
    exports: {},
  };
  vm.runInNewContext(source, context, {filename: artifact});
  return context.module.exports;
};

test('forwards method and data while preserving the original console call', () => {
  const originalCalls = [];
  let originalThis;
  const originalLog = function (...args) {
    originalThis = this;
    originalCalls.push(args);
    return 'original-result';
  };
  const fakeConsole = {log: originalLog};
  const attach = loadTransport(fakeConsole);
  const deliveries = [];
  const detach = attach((data, key) => deliveries.push({data, key}));

  const result = fakeConsole.log('hello', 42, {id: 7});

  assert.equal(result, 'original-result');
  assert.strictEqual(originalThis, fakeConsole);
  assert.deepEqual(originalCalls, [['hello', 42, {id: 7}]]);
  assert.deepEqual(deliveries, [{data: 'hello 42 [object Object]', key: 'log'}]);

  detach();
  assert.strictEqual(fakeConsole.log, originalLog);
});

test('repeated attachment is reference-counted without duplicate delivery', () => {
  const originalInfo = function () {};
  const fakeConsole = {info: originalInfo};
  const attach = loadTransport(fakeConsole);
  const deliveries = [];
  const transport = (data, key) => deliveries.push({data, key});

  const detachFirst = attach(transport);
  const detachSecond = attach(transport);
  fakeConsole.info('first');
  assert.deepEqual(deliveries, [{data: 'first', key: 'info'}]);

  detachFirst();
  fakeConsole.info('second');
  assert.deepEqual(deliveries, [
    {data: 'first', key: 'info'},
    {data: 'second', key: 'info'},
  ]);

  detachSecond();
  detachSecond();
  assert.strictEqual(fakeConsole.info, originalInfo);
  fakeConsole.info('third');
  assert.equal(deliveries.length, 2);
});

test('reentrant or throwing transports never recurse or suppress original logs', () => {
  const originalCalls = [];
  const originalWarn = (...args) => originalCalls.push(['warn', ...args]);
  const originalError = (...args) => originalCalls.push(['error', ...args]);
  const fakeConsole = {warn: originalWarn, error: originalError};
  const attach = loadTransport(fakeConsole);
  const deliveries = [];

  const detach = attach((data, key) => {
    deliveries.push({data, key});
    fakeConsole.warn('transport-internal');
    throw new Error('transport unavailable');
  });

  assert.doesNotThrow(() => fakeConsole.error('application-error'));
  assert.deepEqual(deliveries, [
    {data: 'application-error', key: 'error'},
  ]);
  assert.deepEqual(originalCalls, [
    ['warn', 'transport-internal'],
    ['error', 'application-error'],
  ]);

  detach();
  assert.strictEqual(fakeConsole.warn, originalWarn);
  assert.strictEqual(fakeConsole.error, originalError);
});

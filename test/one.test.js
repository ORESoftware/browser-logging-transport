'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const attachBrowserLoggingTransport = require('../dist/blt.js');

test('published CommonJS artifact exports the transport attachment function', () => {
  assert.equal(typeof attachBrowserLoggingTransport, 'function');
});

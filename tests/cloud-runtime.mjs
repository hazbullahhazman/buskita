// Import emitted JS with plain Node: tsx/Vite would mask extensionless ESM imports.
import assert from 'node:assert/strict';
for (const key of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN']) delete process.env[key];
const { default: state } = await import('../test-results/cloud-runtime/api/state.js');
const { default: action } = await import('../test-results/cloud-runtime/api/action.js');
const response = await state.fetch(new Request('https://example.test/api/state'));
assert.equal(response.status, 503);
assert.match((await response.json()).error, /Shared storage is not connected/);
assert.equal((await action.fetch(new Request('https://example.test/api/action'))).status, 405);
assert.equal((await action.fetch(new Request('https://example.test/api/action', { method: 'POST', body: '{' }))).status, 400);
console.log('PASS: both compiled API entry points load in plain Node and return controlled JSON responses.');

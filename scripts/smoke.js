import assert from 'node:assert/strict';

const base = process.env.API_URL || 'http://localhost:3000';
const headers = { authorization: `Bearer ${process.env.API_TOKEN}`, 'content-type': 'application/json' };
assert.equal((await fetch(`${base}/healthz`)).status, 200);
assert.equal((await fetch(`${base}/reports`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 401);
assert.equal((await fetch(`${base}/reports`, { method: 'POST', headers, body: '{"amountsCents":[-1]}' })).status, 400);
const response = await fetch(`${base}/reports`, { method: 'POST', headers, body: JSON.stringify({ amountsCents: [1250, 2500, 375] }) });
assert.equal(response.status, 202);
const { id } = await response.json();
for (let attempt = 0; attempt < 60; attempt++) {
  const report = await (await fetch(`${base}/reports/${id}`, { headers })).json();
  if (report.status === 'complete') {
    assert.equal(report.total_cents, '4125');
    console.log(`PASS: report ${id}, total 4125 cents`);
    process.exit(0);
  }
  await new Promise(resolve => setTimeout(resolve, 500));
}
throw new Error('Worker did not complete report within 30 seconds');

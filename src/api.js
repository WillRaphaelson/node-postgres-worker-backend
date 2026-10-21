import { randomUUID, timingSafeEqual } from 'node:crypto';
import express from 'express';
import { pool, waitForSchema } from './db.js';
import { validAmounts } from './report.js';

if (!process.env.API_TOKEN || process.env.API_TOKEN.length < 24) {
  throw new Error('API_TOKEN must contain at least 24 characters');
}
await waitForSchema();
const app = express();
app.use(express.json({ limit: '32kb' }));
app.get('/healthz', async (_req, res) => {
  try {
    await pool.query('SELECT id FROM reports LIMIT 0');
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});
app.use((req, res, next) => {
  const supplied = Buffer.from(req.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${process.env.API_TOKEN}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
app.post('/reports', async (req, res) => {
  const amounts = req.body?.amountsCents;
  if (!validAmounts(amounts)) return res.status(400).json({ error: 'Provide 1–1000 nonnegative integer amountsCents, each <= 1000000000' });
  const id = randomUUID();
  // The worker claims pending Postgres rows in a transaction.
  await pool.query('INSERT INTO reports (id, amounts_cents) VALUES ($1, $2)', [id, JSON.stringify(amounts)]);
  res.status(202).json({ id, status: 'pending' });
});
app.get('/reports/:id', async (req, res) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid report id' });
  }
  const { rows } = await pool.query('SELECT id, status, total_cents, created_at, completed_at FROM reports WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});
app.use((error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
  console.error('Request failed:', error.message);
  res.status(503).json({ error: 'Request failed' });
});
const server = app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('API ready'));
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  const deadline = setTimeout(() => process.exit(1), 25000).unref();
  await new Promise(resolve => server.close(resolve));
  await pool.end();
  clearTimeout(deadline);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

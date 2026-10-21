import { pool, waitForSchema } from './db.js';
import { totalCents } from './report.js';

await waitForSchema();
let stopping = false;
let active;
async function processOne() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query("SELECT id, amounts_cents FROM reports WHERE status = 'pending' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED");
    if (rows.length) {
      const { id, amounts_cents } = rows[0];
      await client.query("UPDATE reports SET total_cents = $2, status = 'complete', completed_at = now() WHERE id = $1", [id, totalCents(amounts_cents)]);
      await client.query('COMMIT');
      console.log(`Completed report ${id}`);
      return true;
    }
    await client.query('COMMIT');
    return false;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
async function drain() {
  while (!stopping && await processOne()) {}
}
function tick() {
  if (stopping || active) return;
  active = drain().catch(error => console.error('Worker:', error.message)).finally(() => { active = undefined; });
}
const timer = setInterval(tick, 1000);
tick();
console.log('Worker started');
async function shutdown() {
  if (stopping) return;
  stopping = true;
  clearInterval(timer);
  const deadline = setTimeout(() => process.exit(1), 25000).unref();
  await active;
  await pool.end();
  clearTimeout(deadline);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

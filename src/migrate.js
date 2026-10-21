import { pool } from './db.js';

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id uuid PRIMARY KEY,
      amounts_cents jsonb NOT NULL,
      total_cents bigint,
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete')),
      created_at timestamptz NOT NULL DEFAULT now(),
      completed_at timestamptz
    );
    CREATE INDEX IF NOT EXISTS reports_pending ON reports (created_at) WHERE status = 'pending';
  `);
  console.log('Schema ready');
} finally {
  await pool.end();
}

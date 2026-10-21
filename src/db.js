import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
});
pool.on('error', (error) => console.error('Idle database connection failed:', error.message));

export async function waitForSchema() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await pool.query('SELECT id FROM reports LIMIT 0');
      return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Database schema unavailable; run npm run migrate');
}

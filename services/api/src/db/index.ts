import { Pool, PoolClient } from 'pg';
import { config } from '../config';

const pool = new Pool({
  connectionString: config.db.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('[DB] Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
  return res;
}

export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (err) {
    console.error('[DB] Health check failed:', err);
    return false;
  }
}

export default pool;

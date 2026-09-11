import fs from 'fs';
import path from 'path';
import pool from './index';

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    // Create migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Get applied migrations
    const res = await client.query('SELECT name FROM schema_migrations ORDER BY id ASC');
    const applied = new Set(res.rows.map((r) => r.name));

    // Read migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      if (!applied.has(file)) {
        console.log(`[MIGRATE] Applying migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`[MIGRATE] Successfully applied: ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`[MIGRATE] Failed to apply ${file}:`, err);
          throw err;
        }
      }
    }
  } finally {
    client.release();
  }
}

// Run directly if called from CLI
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('[MIGRATE] All migrations completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[MIGRATE] Migration failed:', err);
      process.exit(1);
    });
}

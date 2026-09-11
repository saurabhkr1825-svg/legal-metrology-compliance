import { createUser } from '../../services/user.service';
import { UserRole } from '@slm/shared';
import pool from '../index';

/**
 * Development seed users.
 * Run: npm run seed:dev (or ts-node src/db/seeds/dev-users.ts)
 */

const DEV_USERS = [
  {
    email: 'officer@example.com',
    password: 'Officer123!',
    name: 'Dev Field Officer',
    role: UserRole.FIELD_OFFICER,
    phone: '+91-9000000001',
    region: 'Delhi NCR',
    department: 'Legal Metrology - District East',
  },
  {
    email: 'supervisor@example.com',
    password: 'Supervisor123!',
    name: 'Dev Supervisor',
    role: UserRole.SUPERVISOR,
    phone: '+91-9000000002',
    region: 'Delhi NCR',
    department: 'Legal Metrology - State HQ',
  },
  {
    email: 'admin@example.com',
    password: 'Admin123!',
    name: 'Dev Administrator',
    role: UserRole.ADMIN,
    phone: '+91-9000000003',
    region: 'National',
    department: 'Legal Metrology - Central',
  },
];

async function seedDevUsers() {
  console.log('[SEED] Creating development users...');

  for (const userData of DEV_USERS) {
    try {
      // Check if user already exists
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [userData.email]);
      if (existing.rows.length > 0) {
        console.log(`[SEED] User ${userData.email} already exists, skipping.`);
        continue;
      }

      const user = await createUser(userData);
      console.log(`[SEED] Created user: ${user.email} (${user.role})`);
    } catch (err) {
      console.error(`[SEED] Failed to create user ${userData.email}:`, err);
    }
  }

  console.log('[SEED] Development users seeding completed.');
}

if (require.main === module) {
  seedDevUsers()
    .then(() => {
      console.log('[SEED] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[SEED] Error:', err);
      process.exit(1);
    });
}

export { seedDevUsers };

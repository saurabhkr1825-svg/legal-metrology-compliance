import bcrypt from 'bcrypt';
import { query } from '../db';
import { User, UserRole } from '@slm/shared';

const BCRYPT_ROUNDS = 10;

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  region?: string;
  department?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(data: CreateUserData): Promise<User> {
  const passwordHash = await hashPassword(data.password);

  const res = await query(
    `INSERT INTO users (email, password_hash, name, role, phone, region, department)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, name, role, phone, region, department, is_active, created_at, updated_at`,
    [
      data.email.toLowerCase().trim(),
      passwordHash,
      data.name.trim(),
      data.role,
      data.phone || null,
      data.region || null,
      data.department || null,
    ]
  );

  const row = res.rows[0];
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    phone: row.phone,
    region: row.region,
    department: row.department,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
  const res = await query(
    `SELECT id, email, password_hash, name, role, phone, region, department, is_active, created_at, updated_at
     FROM users
     WHERE LOWER(email) = LOWER($1)`,
    [email.trim()]
  );

  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role as UserRole,
    phone: row.phone,
    region: row.region,
    department: row.department,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const res = await query(
    `SELECT id, email, name, role, phone, region, department, is_active, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    phone: row.phone,
    region: row.region,
    department: row.department,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listUsers(
  role?: UserRole,
  limit: number = 50,
  offset: number = 0
): Promise<{ items: User[]; total: number }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (role) {
    conditions.push(`role = $${paramIndex++}`);
    params.push(role);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const queryParams = [...params, limit, offset];
  const dataRes = await query(
    `SELECT id, email, name, role, phone, region, department, is_active, created_at, updated_at
     FROM users ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    queryParams
  );

  const items = dataRes.rows.map((row: any) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    phone: row.phone,
    region: row.region,
    department: row.department,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return { items, total };
}

export async function updateUserStatus(id: string, isActive: boolean): Promise<User | null> {
  const res = await query(
    `UPDATE users
     SET is_active = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, email, name, role, phone, region, department, is_active, created_at, updated_at`,
    [isActive, id]
  );

  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    phone: row.phone,
    region: row.region,
    department: row.department,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

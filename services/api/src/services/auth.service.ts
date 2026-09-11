import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, AuthToken } from '@slm/shared';
import { getUserByEmail, verifyPassword } from './user.service';
import { logAuditEvent } from './audit.service';
import { AuditAction } from '@slm/shared';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function login(
  credentials: LoginCredentials,
  ipAddress?: string,
  userAgent?: string
): Promise<{ user: User; token: AuthToken } | null> {
  const userWithHash = await getUserByEmail(credentials.email);

  if (!userWithHash) {
    // Log failed login attempt (no user found)
    await logAuditEvent({
      action: AuditAction.USER_LOGIN,
      resourceType: 'user',
      metadata: { success: false, email: credentials.email, reason: 'user_not_found' },
      ipAddress,
      userAgent,
    });
    return null;
  }

  if (!userWithHash.isActive) {
    // Log failed login (account disabled)
    await logAuditEvent({
      userId: userWithHash.id,
      action: AuditAction.USER_LOGIN,
      resourceType: 'user',
      resourceId: userWithHash.id,
      metadata: { success: false, reason: 'account_disabled' },
      ipAddress,
      userAgent,
    });
    return null;
  }

  const passwordValid = await verifyPassword(credentials.password, userWithHash.passwordHash);
  if (!passwordValid) {
    // Log failed login (invalid password)
    await logAuditEvent({
      userId: userWithHash.id,
      action: AuditAction.USER_LOGIN,
      resourceType: 'user',
      resourceId: userWithHash.id,
      metadata: { success: false, reason: 'invalid_password' },
      ipAddress,
      userAgent,
    });
    return null;
  }

  // Generate JWT token
  const payload: JwtPayload = {
    userId: userWithHash.id,
    email: userWithHash.email,
    role: userWithHash.role,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
  });

  // For now, refreshToken is the same structure with longer expiry
  const refreshToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiry,
  });

  const token: AuthToken = {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.accessExpiry,
  };

  // Remove passwordHash from returned user
  const { passwordHash, ...user } = userWithHash;

  // Log successful login
  await logAuditEvent({
    userId: user.id,
    action: AuditAction.USER_LOGIN,
    resourceType: 'user',
    resourceId: user.id,
    metadata: { success: true },
    ipAddress,
    userAgent,
  });

  return { user, token };
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}

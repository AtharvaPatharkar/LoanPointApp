import crypto from 'node:crypto';
import { config } from '../config/index.js';

export interface TokenPayload {
  userId: string;
  mobile: string;
  role: 'customer' | 'admin';
  tokenType?: 'access' | 'refresh';
  exp: number; // unix timestamp in seconds
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Hash refresh tokens with SHA-256 before storing in database
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Sign standard JWT (defaults to 120 minutes / 2 hours in development and testing mode)
 */
export function signJwt(
  payload: Omit<TokenPayload, 'exp'>,
  expiresInSeconds: number = config.env === 'production' ? 15 * 60 : 120 * 60 // 120 minutes for dev/testing, 15 minutes for production
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload: TokenPayload = {
    ...payload,
    tokenType: payload.tokenType || 'access',
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dataToSign}.${signature}`;
}

/**
 * Sign Refresh Token (7 days validity)
 */
export function signRefreshToken(
  payload: Omit<TokenPayload, 'exp' | 'tokenType'>,
  expiresInSeconds: number = 7 * 24 * 3600
): string {
  return signJwt(
    {
      ...payload,
      tokenType: 'refresh',
    },
    expiresInSeconds
  );
}

export function verifyJwt(token: string, expectedType: 'access' | 'refresh' = 'access'): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac('sha256', config.jwtSecret)
      .update(dataToSign)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // Constant-time check
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    // If tokenType was specified, verify it matches
    if (payload.tokenType && payload.tokenType !== expectedType) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

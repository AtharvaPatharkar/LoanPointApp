import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Load backend/.env specifically
const backendRootEnv = path.resolve(__dirname, '../../.env');
const cwdEnv = path.resolve(process.cwd(), '.env');
const cwdBackendEnv = path.resolve(process.cwd(), 'backend/.env');

[backendRootEnv, cwdBackendEnv, cwdEnv].forEach(loadEnvFile);

export interface Config {
  env: string;
  port: number;
  host: string;
  databaseUrl: string;
  imageKitPublicKey: string;
  imageKitPrivateKey: string;
  imageKitUrlEndpoint: string;
  jwtSecret: string;
  corsOrigins: string;
  adminMobile: string;
  adminPin: string;
  adminPasswordHash: string;
  otpMode: 'development' | 'production';
}

export function getConfig(): Config {
  return {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4000', 10),
    host: process.env.HOST || '0.0.0.0',
    databaseUrl: process.env.DATABASE_URL || '',
    imageKitPublicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
    imageKitPrivateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    imageKitUrlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
    jwtSecret: process.env.JWT_SECRET || '',
    corsOrigins: process.env.CORS_ORIGINS || '*',
    adminMobile: process.env.ADMIN_MOBILE || '',
    adminPin: process.env.ADMIN_PIN || '',
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
    otpMode: (process.env.OTP_MODE || 'development') as 'development' | 'production',
  };
}

export function validateEnvironment(): void {
  const current = getConfig();
  const errors: string[] = [];

  if (!current.databaseUrl) {
    errors.push('DATABASE_URL is required but not configured.');
  }

  if (!current.jwtSecret || current.jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be configured and contain at least 32 characters for HMAC-SHA256 security.');
  }

  if (!current.adminMobile) {
    errors.push('ADMIN_MOBILE is required in environment configuration.');
  }

  if (!current.adminPin && !current.adminPasswordHash) {
    errors.push('ADMIN_PIN or ADMIN_PASSWORD_HASH must be configured in environment configuration.');
  }

  if (!current.imageKitPrivateKey) {
    errors.push('IMAGEKIT_PRIVATE_KEY is required for backend file signing.');
  }

  if (current.env === 'production') {
    if (current.otpMode === 'development') {
      errors.push('CRITICAL: Demo OTP mode (OTP_MODE=development) is strictly forbidden when NODE_ENV=production. A production SMS provider must be configured.');
    }
  }

  if (errors.length > 0) {
    const errorMsg = `[Configuration Error] Backend cannot start due to missing or insecure configuration:\n - ${errors.join('\n - ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

export const config: Config = getConfig();

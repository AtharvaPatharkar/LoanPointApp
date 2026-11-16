import { neon } from '@neondatabase/serverless';

// Retrieve database URL from Expo environment or fallback to process.env
const databaseUrl =
  process.env.EXPO_PUBLIC_DATABASE_URL ||
  process.env.DATABASE_URL ||
  '';

export const isDatabaseConfigured = Boolean(databaseUrl);

export const getDbClient = () => {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured in environment variables');
  }
  return neon(databaseUrl);
};

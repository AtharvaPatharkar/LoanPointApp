import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { config } from '../config/index.js';

let sqlClient: NeonQueryFunction<false, false> | null = null;

export function getDb() {
  if (!sqlClient) {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL is not configured on the server');
    }
    sqlClient = neon(config.databaseUrl);
  }
  return sqlClient;
}

export async function testDbConnection(): Promise<boolean> {
  try {
    const sql = getDb();
    const result = (await sql`SELECT 1 as connected;`) as any[];
    
    // Automatically ensure aadhaar_number column exists in Neon DB for users & loan_applications
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(12);`;
    await sql`ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(12);`;
    
    return Boolean(result && result.length > 0);
  } catch (error) {
    console.error('[Database Connection Error]:', error);
    return false;
  }
}

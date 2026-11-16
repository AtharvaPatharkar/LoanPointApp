import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set in environment.');
  }

  const sql = neon(databaseUrl);
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sqlContent = fs.readFileSync(schemaPath, 'utf8');

  console.log('Running database schema migration on Neon Lakebase Postgres...');

  // Split SQL commands by semicolon (ignoring empty statements)
  const statements = sqlContent
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await sql.query(statement + ';');
  }

  console.log('Migration executed successfully!');

  // Verify created tables
  const tables = await sql.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log('Verified public tables in Neon:');
  console.table(tables);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

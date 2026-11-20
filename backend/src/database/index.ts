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
    
    // Automatically ensure all required columns exist in Neon DB for users & loan_applications
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(12);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(150);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS work_experience VARCHAR(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS salary_bank VARCHAR(100);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_type VARCHAR(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS has_credit_card VARCHAR(10);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS cibil_score_range VARCHAR(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dob VARCHAR(20);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS business_location VARCHAR(150);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS registered_business VARCHAR(150);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS business_constitution VARCHAR(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS business_vintage VARCHAR(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS industry_sector VARCHAR(100);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS annual_turnover VARCHAR(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_gst_registered VARCHAR(10);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gstin VARCHAR(20);`;
    // Car loan
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS car_condition VARCHAR(30);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS car_make_model VARCHAR(100);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS car_dealer_seller VARCHAR(150);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS car_on_road_price VARCHAR(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS car_fuel_type VARCHAR(30);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS car_mfg_year VARCHAR(10);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS car_down_payment VARCHAR(50);`;
    // Mortgage / LAP loan
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS property_type VARCHAR(100);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS property_location VARCHAR(150);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS market_valuation VARCHAR(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS property_ownership VARCHAR(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_property_freehold VARCHAR(10);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS has_existing_loan_on_property VARCHAR(10);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lap_purpose VARCHAR(150);`;
    // Agriculture loan
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS land_holding_acres VARCHAR(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS taluka_village VARCHAR(150);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gat_number VARCHAR(100);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS irrigation_source VARCHAR(100);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_crops VARCHAR(150);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS has_kcc_card VARCHAR(10);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS farming_type VARCHAR(100);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS agri_loan_type VARCHAR(100);`;
    // Mudra loan
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS social_category VARCHAR(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS enterprise_name VARCHAR(150);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS enterprise_activity VARCHAR(150);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_sector VARCHAR(100);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS business_premises VARCHAR(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS has_udyam_number VARCHAR(10);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS udyam_reg_number VARCHAR(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mudra_tier VARCHAR(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mudra_card_required VARCHAR(10);`;
    await sql`ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(12);`;
    
    return Boolean(result && result.length > 0);
  } catch (error) {
    console.error('[Database Connection Error]:', error);
    return false;
  }
}

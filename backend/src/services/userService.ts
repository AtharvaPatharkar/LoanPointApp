import { getDb } from '../database/index.js';
import { cleanMobile } from '../validators/index.js';

export class UserService {
  public async getProfileByUserId(userId: string): Promise<any | null> {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by, pan_number, aadhaar_last_four, aadhaar_number, is_kyc_completed, documents, created_at, updated_at
      FROM users
      WHERE id = ${userId}
      LIMIT 1;
    `) as any[];
    if (!rows || rows.length === 0) return null;
    return this.mapUserRow(rows[0]);
  }

  public async getProfileByMobile(mobile: string): Promise<any | null> {
    const cleaned = cleanMobile(mobile);
    const sql = getDb();
    const rows = (await sql`
      SELECT id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by, pan_number, aadhaar_last_four, aadhaar_number, is_kyc_completed, documents, created_at, updated_at
      FROM users
      WHERE mobile = ${cleaned}
      LIMIT 1;
    `) as any[];
    if (!rows || rows.length === 0) return null;
    return this.mapUserRow(rows[0]);
  }

  public async updateProfile(mobile: string, updates: any): Promise<any> {
    const cleaned = cleanMobile(mobile);
    const sql = getDb();

    const cleanAadhaar = updates.aadhaarNumber ? updates.aadhaarNumber.replace(/\D/g, '') : '';
    const fullAadhaar = cleanAadhaar.length === 12 ? cleanAadhaar : (updates.aadhaar_number || null);
    const lastFour = cleanAadhaar.length >= 4 ? cleanAadhaar.slice(-4) : (updates.aadhaar_last_four || null);
    const docsJson = (Array.isArray(updates.documents) && updates.documents.length > 0)
      ? JSON.stringify(updates.documents)
      : null;
    const isComplete = Boolean(updates.city && updates.panNumber && (Number(updates.monthlyIncome) > 0));

    await sql`
      UPDATE users
      SET full_name = CASE WHEN ${updates.name || updates.fullName || ''} <> '' THEN ${updates.name || updates.fullName} ELSE full_name END,
          email = CASE WHEN ${updates.email || ''} <> '' THEN ${updates.email} ELSE email END,
          city = CASE WHEN ${updates.city || ''} <> '' THEN ${updates.city} ELSE city END,
          employment_type = CASE WHEN ${updates.employmentType || ''} <> '' THEN ${updates.employmentType} ELSE employment_type END,
          monthly_income = CASE WHEN ${updates.monthlyIncome !== undefined && updates.monthlyIncome !== null} THEN ${Number(updates.monthlyIncome) || 0} ELSE monthly_income END,
          pan_number = CASE WHEN ${updates.panNumber || ''} <> '' THEN ${updates.panNumber} ELSE pan_number END,
          aadhaar_number = CASE WHEN ${fullAadhaar || ''} <> '' THEN ${fullAadhaar} ELSE aadhaar_number END,
          aadhaar_last_four = CASE WHEN ${lastFour || ''} <> '' THEN ${lastFour} ELSE aadhaar_last_four END,
          documents = CASE WHEN ${docsJson || ''} <> '' THEN ${docsJson}::jsonb ELSE documents END,
          is_kyc_completed = CASE WHEN ${isComplete} THEN TRUE ELSE is_kyc_completed END,
          updated_at = NOW()
      WHERE mobile = ${cleaned};
    `;

    return await this.getProfileByMobile(cleaned);
  }

  public async getAllUsers(): Promise<any[]> {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, full_name, mobile, email, city, employment_type, monthly_income, referral_code, referred_by, pan_number, aadhaar_last_four, aadhaar_number, is_kyc_completed, documents, created_at, updated_at
      FROM users
      ORDER BY created_at DESC;
    `) as any[];
    return rows.map((r: any) => this.mapUserRow(r));
  }

  public async adminUpdateUser(userId: string, updates: any): Promise<any | null> {
    const sql = getDb();
    const cleanAadhaar = updates.aadhaarNumber ? updates.aadhaarNumber.replace(/\D/g, '') : '';
    const fullAadhaar = cleanAadhaar.length === 12 ? cleanAadhaar : (updates.aadhaar_number || null);
    const lastFour = cleanAadhaar.length >= 4 ? cleanAadhaar.slice(-4) : (updates.aadhaar_last_four || null);
    const docsJson = (Array.isArray(updates.documents) && updates.documents.length > 0)
      ? JSON.stringify(updates.documents)
      : null;
    const isKyc = updates.isKycCompleted !== undefined ? Boolean(updates.isKycCompleted) : null;

    await sql`
      UPDATE users
      SET full_name = CASE WHEN ${updates.name || updates.fullName || ''} <> '' THEN ${updates.name || updates.fullName} ELSE full_name END,
          email = CASE WHEN ${updates.email || ''} <> '' THEN ${updates.email} ELSE email END,
          city = CASE WHEN ${updates.city || ''} <> '' THEN ${updates.city} ELSE city END,
          employment_type = CASE WHEN ${updates.employmentType || ''} <> '' THEN ${updates.employmentType} ELSE employment_type END,
          monthly_income = CASE WHEN ${updates.monthlyIncome !== undefined && updates.monthlyIncome !== null} THEN ${Number(updates.monthlyIncome) || 0} ELSE monthly_income END,
          pan_number = CASE WHEN ${updates.panNumber || ''} <> '' THEN ${updates.panNumber} ELSE pan_number END,
          aadhaar_number = CASE WHEN ${fullAadhaar || ''} <> '' THEN ${fullAadhaar} ELSE aadhaar_number END,
          aadhaar_last_four = CASE WHEN ${lastFour || ''} <> '' THEN ${lastFour} ELSE aadhaar_last_four END,
          documents = CASE WHEN ${docsJson || ''} <> '' THEN ${docsJson}::jsonb ELSE documents END,
          is_kyc_completed = CASE WHEN ${isKyc !== null} THEN ${isKyc} ELSE is_kyc_completed END,
          updated_at = NOW()
      WHERE id = ${userId};
    `;

    return await this.getProfileByUserId(userId);
  }

  public async saveUserDocument(mobile: string, documentItem: any): Promise<any[]> {
    const cleaned = cleanMobile(mobile);
    const sql = getDb();

    const user = await this.getProfileByMobile(cleaned);
    let docs: any[] = user?.documents || [];
    if (!Array.isArray(docs)) docs = [];

    docs = docs.filter((d: any) => d.id !== documentItem.id);
    docs.unshift(documentItem);

    await sql`
      UPDATE users
      SET documents = ${JSON.stringify(docs)}::jsonb,
          updated_at = NOW()
      WHERE mobile = ${cleaned};
    `;

    return docs;
  }

  public async deleteUserDocument(mobile: string, docId: string): Promise<any[]> {
    const cleaned = cleanMobile(mobile);
    const sql = getDb();

    const user = await this.getProfileByMobile(cleaned);
    let docs: any[] = user?.documents || [];
    if (!Array.isArray(docs)) docs = [];

    docs = docs.filter((d: any) => d.id !== docId);

    await sql`
      UPDATE users
      SET documents = ${JSON.stringify(docs)}::jsonb,
          updated_at = NOW()
      WHERE mobile = ${cleaned};
    `;

    return docs;
  }

  private mapUserRow(row: any) {
    const docs = typeof row.documents === 'string' ? JSON.parse(row.documents) : row.documents || [];
    const passportDoc = Array.isArray(docs)
      ? docs.find((d: any) => d.docKey === 'passport_photo' || d.name?.toLowerCase().includes('passport'))
      : undefined;

    return {
      id: row.id,
      name: row.full_name || 'Valued Customer',
      mobile: row.mobile,
      email: row.email || '',
      city: row.city || '',
      employmentType: row.employment_type || 'Salaried',
      monthlyIncome: Number(row.monthly_income) || 0,
      panNumber: row.pan_number || '',
      aadhaarNumber: row.aadhaar_number || row.aadhaar_last_four || '',
      aadhaarLinked: Boolean(row.aadhaar_number || row.aadhaar_last_four),
      cibilEstimateScore: 740,
      memberSince: new Date(row.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      referralCode: row.referral_code,
      referredBy: row.referred_by || undefined,
      role: 'customer',
      avatar: passportDoc?.fileUri || undefined,
      isKycCompleted: Boolean(row.is_kyc_completed),
      documents: Array.isArray(docs) ? docs : [],
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    };
  }
}

export const userService = new UserService();

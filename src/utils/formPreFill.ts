import { UserProfile, DocumentItem } from '../types';

/**
 * Helper to find the actual DocumentItem in the user's database records.
 * Returns the DocumentItem if found, else undefined.
 */
export const findUserDocument = (
  user: UserProfile | null | undefined,
  docKey: string,
  extraKeywords: string[] = []
): DocumentItem | undefined => {
  if (!user || !user.documents || !Array.isArray(user.documents) || user.documents.length === 0) {
    return undefined;
  }

  return user.documents.find((doc: DocumentItem) => {
    if (doc.docKey && doc.docKey === docKey) {
      return true;
    }
    const lowerName = (doc.name || '').toLowerCase();
    const cleanKey = docKey.replace(/_/g, ' ').toLowerCase();
    if (lowerName.includes(cleanKey)) {
      return true;
    }
    return extraKeywords.some((kw) => lowerName.includes(kw.toLowerCase()));
  });
};

/**
 * Universal helper to check if a specific document has been uploaded by the user in the database.
 * Matches by exact docKey or standard keywords.
 */
export const isUserDocUploaded = (
  user: UserProfile | null | undefined,
  docKey: string,
  extraKeywords: string[] = []
): boolean => {
  return !!findUserDocument(user, docKey, extraKeywords);
};

/**
 * Helper to format user's monthly income into display string e.g. "₹1,20,000" or empty string if 0
 */
export const getUserIncomeFormatted = (user: UserProfile | null | undefined): string => {
  if (!user || !user.monthlyIncome || user.monthlyIncome <= 0) {
    return '';
  }
  return `₹${user.monthlyIncome.toLocaleString('en-IN')}`;
};

/**
 * Helper to format user's employment type
 */
export const getUserEmploymentType = (
  user: UserProfile | null | undefined,
  fallback: 'Salaried' | 'Self-Employed' = 'Salaried'
): 'Salaried' | 'Self-Employed' => {
  if (!user || !user.employmentType) {
    return fallback;
  }
  const emp = user.employmentType.toLowerCase();
  if (emp.includes('business') || emp.includes('self')) {
    return 'Self-Employed';
  }
  return 'Salaried';
};

export function validateIndianMobile(mobile?: string): boolean {
  if (!mobile) return false;
  const cleaned = mobile.replace(/\D/g, '').slice(-10);
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function cleanMobile(mobile: string): string {
  return mobile.replace(/\D/g, '').slice(-10);
}

export function validatePan(pan?: string): boolean {
  if (!pan) return true; // Optional field
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim().toUpperCase());
}

export function validateAadhaar(aadhaar?: string): boolean {
  if (!aadhaar) return true; // Optional field
  const cleaned = aadhaar.replace(/\D/g, '');
  return cleaned.length === 12 || cleaned.length === 4;
}

export type BankCategory = 'private' | 'public' | 'small-finance' | 'payments';

export interface BankConfig {
  id: string;
  name: string;
  shortName: string;
  category: BankCategory;
  svgPath: string; // relative path within assets/bank-logos
  primaryColor?: string;
}

export const BANKS: Record<string, BankConfig> = {
  // Private Banks
  hdfc: {
    id: 'hdfc',
    name: 'HDFC Bank',
    shortName: 'HDFC',
    category: 'private',
    svgPath: 'private/hdfc.svg',
    primaryColor: '#004c8f',
  },
  icici: {
    id: 'icici',
    name: 'ICICI Bank',
    shortName: 'ICICI',
    category: 'private',
    svgPath: 'private/icici.svg',
    primaryColor: '#b02a30',
  },
  axis: {
    id: 'axis',
    name: 'Axis Bank',
    shortName: 'AXIS',
    category: 'private',
    svgPath: 'private/axis.svg',
    primaryColor: '#97144d',
  },
  kotak: {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    shortName: 'KOTAK',
    category: 'private',
    svgPath: 'private/kotak.svg',
    primaryColor: '#ed1c24',
  },
  'idfc-first': {
    id: 'idfc-first',
    name: 'IDFC FIRST Bank',
    shortName: 'IDFC',
    category: 'private',
    svgPath: 'private/idfc.svg',
    primaryColor: '#9d1d27',
  },
  indusind: {
    id: 'indusind',
    name: 'IndusInd Bank',
    shortName: 'INDUSIND',
    category: 'private',
    svgPath: 'private/indusind.svg',
    primaryColor: '#84191b',
  },
  yes: {
    id: 'yes',
    name: 'Yes Bank',
    shortName: 'YES',
    category: 'private',
    svgPath: 'private/yes.svg',
    primaryColor: '#005a9c',
  },
  federal: {
    id: 'federal',
    name: 'Federal Bank',
    shortName: 'FEDERAL',
    category: 'private',
    svgPath: 'private/federal.svg',
    primaryColor: '#004cbe',
  },
  bandhan: {
    id: 'bandhan',
    name: 'Bandhan Bank',
    shortName: 'BANDHAN',
    category: 'private',
    svgPath: 'private/bandhan.svg',
    primaryColor: '#003366',
  },
  idbi: {
    id: 'idbi',
    name: 'IDBI Bank',
    shortName: 'IDBI',
    category: 'private',
    svgPath: 'private/idbi.svg',
    primaryColor: '#006633',
  },
  rbl: {
    id: 'rbl',
    name: 'RBL Bank',
    shortName: 'RBL',
    category: 'private',
    svgPath: 'private/rbl.svg',
    primaryColor: '#1a3c75',
  },
  'south-indian': {
    id: 'south-indian',
    name: 'South Indian Bank',
    shortName: 'SIB',
    category: 'private',
    svgPath: 'private/south-indian.svg',
    primaryColor: '#cc0000',
  },

  // Public Sector Banks
  sbi: {
    id: 'sbi',
    name: 'State Bank of India',
    shortName: 'SBI',
    category: 'public',
    svgPath: 'public/sbi.svg',
    primaryColor: '#280071',
  },
  'bank-of-baroda': {
    id: 'bank-of-baroda',
    name: 'Bank of Baroda',
    shortName: 'BOB',
    category: 'public',
    svgPath: 'public/bank-of-baroda.svg',
    primaryColor: '#f26522',
  },
  pnb: {
    id: 'pnb',
    name: 'Punjab National Bank',
    shortName: 'PNB',
    category: 'public',
    svgPath: 'public/pnb.svg',
    primaryColor: '#a20f2e',
  },
  canara: {
    id: 'canara',
    name: 'Canara Bank',
    shortName: 'CANARA',
    category: 'public',
    svgPath: 'public/canara.svg',
    primaryColor: '#0099da',
  },
  'union-bank': {
    id: 'union-bank',
    name: 'Union Bank of India',
    shortName: 'UBI',
    category: 'public',
    svgPath: 'public/union-bank.svg',
    primaryColor: '#00529b',
  },
  'bank-of-india': {
    id: 'bank-of-india',
    name: 'Bank of India',
    shortName: 'BOI',
    category: 'public',
    svgPath: 'public/bank-of-india.svg',
    primaryColor: '#00539f',
  },
  'bank-of-maharashtra': {
    id: 'bank-of-maharashtra',
    name: 'Bank of Maharashtra',
    shortName: 'BOM',
    category: 'public',
    svgPath: 'public/bank-of-maharashtra.svg',
    primaryColor: '#1d71b8',
  },
  'indian-bank': {
    id: 'indian-bank',
    name: 'Indian Bank',
    shortName: 'INDIAN',
    category: 'public',
    svgPath: 'public/indian-bank.svg',
    primaryColor: '#1f4395',
  },
  'central-bank': {
    id: 'central-bank',
    name: 'Central Bank of India',
    shortName: 'CBI',
    category: 'public',
    svgPath: 'public/central-bank.svg',
    primaryColor: '#cf102d',
  },
  iob: {
    id: 'iob',
    name: 'Indian Overseas Bank',
    shortName: 'IOB',
    category: 'public',
    svgPath: 'public/iob.svg',
    primaryColor: '#0055a5',
  },
  uco: {
    id: 'uco',
    name: 'UCO Bank',
    shortName: 'UCO',
    category: 'public',
    svgPath: 'public/uco.svg',
    primaryColor: '#0072bc',
  },

  // Small Finance Banks
  'au-small-finance': {
    id: 'au-small-finance',
    name: 'AU Small Finance Bank',
    shortName: 'AU SFB',
    category: 'small-finance',
    svgPath: 'small-finance/au-small-finance.svg',
    primaryColor: '#6f2c91',
  },
  ujjivan: {
    id: 'ujjivan',
    name: 'Ujjivan Small Finance Bank',
    shortName: 'UJJIVAN',
    category: 'small-finance',
    svgPath: 'small-finance/ujjivan.svg',
    primaryColor: '#e31b23',
  },
  esaf: {
    id: 'esaf',
    name: 'ESAF Small Finance Bank',
    shortName: 'ESAF',
    category: 'small-finance',
    svgPath: 'small-finance/esaf.svg',
    primaryColor: '#005c9e',
  },

  // Payments Banks
  airtel: {
    id: 'airtel',
    name: 'Airtel Payments Bank',
    shortName: 'AIRTEL',
    category: 'payments',
    svgPath: 'payments/airtel.svg',
    primaryColor: '#e40000',
  },
  'india-post': {
    id: 'india-post',
    name: 'India Post Payments Bank',
    shortName: 'IPPB',
    category: 'payments',
    svgPath: 'payments/india-post.svg',
    primaryColor: '#c8102e',
  },
  paytm: {
    id: 'paytm',
    name: 'Paytm Payments Bank',
    shortName: 'PAYTM',
    category: 'payments',
    svgPath: 'payments/paytm.svg',
    primaryColor: '#002e6e',
  },
  fino: {
    id: 'fino',
    name: 'Fino Payments Bank',
    shortName: 'FINO',
    category: 'payments',
    svgPath: 'payments/fino.svg',
    primaryColor: '#8b0051',
  },
};

export const BANK_LIST: BankConfig[] = Object.values(BANKS);

/**
 * Fuzzy match a bank name string to its BankConfig
 */
export function getBankByNameOrId(identifier?: string | null): BankConfig | undefined {
  if (!identifier) return undefined;
  const lower = identifier.toLowerCase().trim();

  // 1. Direct id match
  if (BANKS[lower]) return BANKS[lower];

  // 2. Exact name or shortName match
  for (const b of BANK_LIST) {
    if (b.name.toLowerCase() === lower || b.shortName.toLowerCase() === lower) {
      return b;
    }
  }

  // 3. Substring matching
  if (lower.includes('hdfc')) return BANKS['hdfc'];
  if (lower.includes('icici')) return BANKS['icici'];
  if (lower.includes('axis')) return BANKS['axis'];
  if (lower.includes('kotak')) return BANKS['kotak'];
  if (lower.includes('idfc')) return BANKS['idfc-first'];
  if (lower.includes('indus')) return BANKS['indusind'];
  if (lower.includes('yes bank') || lower === 'yes') return BANKS['yes'];
  if (lower.includes('federal')) return BANKS['federal'];
  if (lower.includes('bandhan')) return BANKS['bandhan'];
  if (lower.includes('idbi')) return BANKS['idbi'];
  if (lower.includes('rbl')) return BANKS['rbl'];
  if (lower.includes('south indian') || lower.includes('sib')) return BANKS['south-indian'];

  if (lower.includes('state bank') || lower.includes('sbi')) return BANKS['sbi'];
  if (lower.includes('baroda') || lower.includes('bob')) return BANKS['bank-of-baroda'];
  if (lower.includes('punjab national') || lower.includes('pnb')) return BANKS['pnb'];
  if (lower.includes('canara')) return BANKS['canara'];
  if (lower.includes('union bank') || lower.includes('ubi')) return BANKS['union-bank'];
  if (lower.includes('bank of india') || lower.includes('boi')) return BANKS['bank-of-india'];
  if (lower.includes('maharashtra') || lower.includes('bom')) return BANKS['bank-of-maharashtra'];
  if (lower.includes('indian bank')) return BANKS['indian-bank'];
  if (lower.includes('central bank') || lower.includes('cbi')) return BANKS['central-bank'];
  if (lower.includes('overseas') || lower.includes('iob')) return BANKS['iob'];
  if (lower.includes('uco')) return BANKS['uco'];

  if (lower.includes('au small') || lower.includes('ausfb')) return BANKS['au-small-finance'];
  if (lower.includes('ujjivan')) return BANKS['ujjivan'];
  if (lower.includes('esaf')) return BANKS['esaf'];

  if (lower.includes('airtel')) return BANKS['airtel'];
  if (lower.includes('india post') || lower.includes('ippb')) return BANKS['india-post'];
  if (lower.includes('paytm')) return BANKS['paytm'];
  if (lower.includes('fino')) return BANKS['fino'];

  return undefined;
}

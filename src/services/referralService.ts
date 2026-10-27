import { UserProfile } from '../types';

export interface ReferralItem {
  id: string;
  name: string;
  loanType: string;
  appliedAmount: number;
  reward: number;
  status: 'In Process' | 'Approved' | 'Disbursed' | 'Rejected';
  date: string;
  referredByCode: string;
}

export interface WalletTransaction {
  id: string;
  title: string;
  amount: string;
  date: string;
  type: 'credit' | 'debit';
}

const INITIAL_REFERRALS: ReferralItem[] = [
  {
    id: 'REF-101',
    name: 'Amit Patil',
    loanType: 'Personal Loan',
    appliedAmount: 500000,
    reward: 1000,
    status: 'Disbursed',
    date: '02 Oct 2026',
    referredByCode: 'RAHUL123',
  },
  {
    id: 'REF-102',
    name: 'Sneha Deshmukh',
    loanType: 'Home Loan',
    appliedAmount: 2500000,
    reward: 2000,
    status: 'Approved',
    date: '28 Sep 2026',
    referredByCode: 'RAHUL123',
  },
  {
    id: 'REF-103',
    name: 'Prakash More',
    loanType: 'Business Loan',
    appliedAmount: 1000000,
    reward: 1500,
    status: 'In Process',
    date: '15 Sep 2026',
    referredByCode: 'RAHUL123',
  },
  {
    id: 'REF-104',
    name: 'Ravi Jadhav',
    loanType: 'Personal Loan',
    appliedAmount: 300000,
    reward: 1000,
    status: 'Disbursed',
    date: '05 Sep 2026',
    referredByCode: 'RAHUL123',
  },
  {
    id: 'REF-105',
    name: 'Neha Kulkarni',
    loanType: 'Car Loan',
    appliedAmount: 800000,
    reward: 1000,
    status: 'Rejected',
    date: '20 Aug 2026',
    referredByCode: 'RAHUL123',
  },
];

const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  { id: 'TX-1', title: 'Amit Patil Referral', amount: '+₹1,000', date: '02 Oct 2026', type: 'credit' },
  { id: 'TX-2', title: 'Ravi Jadhav Referral', amount: '+₹1,000', date: '05 Sep 2026', type: 'credit' },
  { id: 'TX-3', title: 'Bank Withdrawal (HDFC)', amount: '-₹3,000', date: '15 Aug 2026', type: 'debit' },
];

class ReferralService {
  private referrals: ReferralItem[] = [...INITIAL_REFERRALS];
  private walletBalance: number = 6000;
  private transactions: WalletTransaction[] = [...INITIAL_TRANSACTIONS];

  public getReferrals(): ReferralItem[] {
    return [...this.referrals];
  }

  public getWalletBalance(): number {
    return this.walletBalance;
  }

  public getTransactions(): WalletTransaction[] {
    return [...this.transactions];
  }

  // Calculate reward amount based on loan type
  public getRewardRateForLoan(loanType: string): number {
    const lower = loanType.toLowerCase();
    if (lower.includes('home')) return 2000;
    if (lower.includes('business')) return 1500;
    if (lower.includes('personal')) return 1000;
    if (lower.includes('car')) return 1000;
    return 1000;
  }

  // Register a new referred friend when DEF signs up using ABC's referral code
  public registerNewReferral(friendName: string, referralCode: string, loanType = 'Personal Loan', appliedAmount = 300000): ReferralItem {
    const reward = this.getRewardRateForLoan(loanType);
    const newRef: ReferralItem = {
      id: `REF-${Math.floor(100 + Math.random() * 900)}`,
      name: friendName,
      loanType,
      appliedAmount,
      reward,
      status: 'In Process',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      referredByCode: referralCode,
    };
    this.referrals.unshift(newRef);
    return newRef;
  }

  // When DEF's loan gets approved or disbursed
  public updateReferralStatus(id: string, newStatus: 'Approved' | 'Disbursed' | 'Rejected'): void {
    const item = this.referrals.find((r) => r.id === id);
    if (!item) return;

    item.status = newStatus;
    if (newStatus === 'Disbursed') {
      this.walletBalance += item.reward;
      this.transactions.unshift({
        id: `TX-${Date.now()}`,
        title: `${item.name} Referral (${item.loanType})`,
        amount: `+₹${item.reward.toLocaleString('en-IN')}`,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        type: 'credit',
      });
    }
  }

  // Withdraw from wallet
  public withdrawAmount(amount: number): { success: boolean; refId: string } {
    if (amount <= 0 || amount > this.walletBalance) {
      throw new Error('Insufficient wallet balance');
    }
    this.walletBalance -= amount;
    const refId = `LPW-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    this.transactions.unshift({
      id: `TX-${Date.now()}`,
      title: 'Bank Withdrawal Payout',
      amount: `-₹${amount.toLocaleString('en-IN')}`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: 'debit',
    });
    return { success: true, refId };
  }
}

export const referralService = new ReferralService();

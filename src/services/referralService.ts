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

const INITIAL_REFERRALS: ReferralItem[] = [];

const INITIAL_TRANSACTIONS: WalletTransaction[] = [];

class ReferralService {
  private referrals: ReferralItem[] = [];
  private walletBalance: number = 0;
  private transactions: WalletTransaction[] = [];

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

  public clearUserData(): void {
    this.referrals = [];
    this.walletBalance = 0;
    this.transactions = [];
  }
}

export const referralService = new ReferralService();

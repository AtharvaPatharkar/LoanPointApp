import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { UserProfile } from '../../types';
import { formatINR, generateUniqueReferralCode } from '../../utils/calculator';
import { colors } from '../../theme/colors';
import { referralService, ReferralItem, WalletTransaction } from '../../services/referralService';

interface OffersReferralScreenProps {
  user: UserProfile | null;
  onNavigateLoan: (loanType: string) => void;
}

export const OffersReferralScreen: React.FC<OffersReferralScreenProps> = ({
  user,
}) => {
  const [activeTab, setActiveTab] = useState<'refer' | 'history' | 'rewards'>('refer');
  const [copied, setCopied] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<number>(referralService.getWalletBalance());
  const [referrals, setReferrals] = useState<ReferralItem[]>(referralService.getReferrals());
  const [transactions, setTransactions] = useState<WalletTransaction[]>(referralService.getTransactions());
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('2000');
  const [withdrawSuccess, setWithdrawSuccess] = useState<boolean>(false);

  const syncState = () => {
    setWalletBalance(referralService.getWalletBalance());
    setReferrals(referralService.getReferrals());
    setTransactions(referralService.getTransactions());
  };

  const referralCode =
    user?.referralCode ||
    (user ? generateUniqueReferralCode(user.name, user.mobile) : 'RAHUL5999');
  const referralLink = `https://loanpoint.in/ref/${referralCode}`;

  const handleCopy = () => {
    setCopied(true);
    Alert.alert('Copied!', `Referral link: ${referralLink}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const message = `Namaskar! Need a fast & reliable loan? Apply through Loan Point Nanded using my referral link: ${referralLink} or code: ${referralCode}`;
    try {
      await Share.share({ message });
    } catch {
      // ignore
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Namaskar! Apply for Home, Personal or Business Loan with Loan Point Nanded using my referral code: ${referralCode}\n${referralLink}`;
    const encoded = encodeURIComponent(message);
    const webWhatsAppUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    const nativeWhatsAppUrl = `whatsapp://send?text=${encoded}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(webWhatsAppUrl, '_blank');
      return;
    }

    Linking.canOpenURL(nativeWhatsAppUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(nativeWhatsAppUrl);
        }
        return Linking.openURL(webWhatsAppUrl);
      })
      .catch(() => {
        Linking.openURL(webWhatsAppUrl).catch(() => handleShare());
      });
  };

  const handleWithdraw = () => {
    const val = Number(withdrawAmount);
    if (!val || val <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount');
      return;
    }
    try {
      referralService.withdrawAmount(val);
      syncState();
      setWithdrawSuccess(true);
    } catch (err: unknown) {
      Alert.alert('Withdrawal Error', err instanceof Error ? err.message : 'Insufficient balance');
    }
  };

  const rewardRates = [
    { type: 'Home Loan', reward: '₹2,000', icon: 'home-outline' as const },
    { type: 'Business Loan', reward: '₹1,500', icon: 'briefcase-outline' as const },
    { type: 'Personal Loan', reward: '₹1,000', icon: 'person-outline' as const },
    { type: 'Car Loan', reward: '₹1,000', icon: 'car-outline' as const },
  ];

  return (
    <View style={styles.root}>
      {/* Top Segmented Tabs: Refer | History | Rewards */}
      <View style={styles.tabsHeader}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'refer' && styles.tabBtnActive]}
          onPress={() => setActiveTab('refer')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, activeTab === 'refer' && styles.tabBtnTextActive]}>
            Refer & Earn
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
            History ({referrals.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'rewards' && styles.tabBtnActive]}
          onPress={() => setActiveTab('rewards')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, activeTab === 'rewards' && styles.tabBtnTextActive]}>
            Wallet ({formatINR(walletBalance)})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ================= TAB 1: REFER & EARN ================= */}
        {activeTab === 'refer' && (
          <>
            {/* Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroBadge}>
                <Ionicons name="gift" size={14} color="#b45309" />
                <Text style={styles.heroBadgeText}>EARN UP TO ₹2,000 PER FRIEND</Text>
              </View>
              <Text style={styles.heroTitle}>Invite Friends, Earn Cash Rewards</Text>
              <Text style={styles.heroDesc}>
                Help your friends get the best loan sanction with Loan Point. When their loan is disbursed, you receive cash rewards straight to your wallet.
              </Text>

              {/* Link Box */}
              <View style={styles.linkBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkLabel}>YOUR REFERRAL LINK</Text>
                  <Text style={styles.linkText} numberOfLines={1}>{referralLink}</Text>
                </View>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={colors.primary} />
                  <Text style={styles.copyBtnText}>{copied ? 'Copied' : 'Copy'}</Text>
                </TouchableOpacity>
              </View>

              {/* Share CTA Buttons */}
              <View style={styles.shareButtonsRow}>
                <TouchableOpacity style={styles.waBtn} onPress={handleShareWhatsApp} activeOpacity={0.8}>
                  <Ionicons name="logo-whatsapp" size={16} color={colors.white} />
                  <Text style={styles.shareBtnText}>Share on WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareMoreBtn} onPress={handleShare} activeOpacity={0.7}>
                  <Ionicons name="share-social-outline" size={16} color={colors.text} />
                  <Text style={styles.shareMoreText}>More</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Stats Grid */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{referrals.length}</Text>
                <Text style={styles.statLabel}>Total Referred</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{referrals.filter((r) => r.status === 'Approved').length}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{referrals.filter((r) => r.status === 'Disbursed').length}</Text>
                <Text style={styles.statLabel}>Disbursed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.success }]}>
                  {formatINR(referrals.filter((r) => r.status === 'Disbursed').reduce((acc, r) => acc + r.reward, 0))}
                </Text>
                <Text style={styles.statLabel}>Earned</Text>
              </View>
            </View>

            {/* Reward Payout Structure */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Reward Structure per Disbursement</Text>
              {rewardRates.map((item, idx) => (
                <View key={idx} style={[styles.rewardRow, idx === rewardRates.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.rewardLeft}>
                    <View style={styles.rewardIcon}>
                      <Ionicons name={item.icon} size={18} color={colors.primary} />
                    </View>
                    <Text style={styles.rewardType}>{item.type}</Text>
                  </View>
                  <Text style={styles.rewardAmount}>{item.reward}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ================= TAB 2: REFERRAL HISTORY ================= */}
        {activeTab === 'history' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Referred Friends & Status ({referrals.length})</Text>
            <View style={styles.list}>
              {referrals.map((ref) => {
                const isDisbursed = ref.status === 'Disbursed';
                const isApproved = ref.status === 'Approved';
                const isRejected = ref.status === 'Rejected';

                const badgeBg = isDisbursed ? '#ecfdf5' : isApproved ? '#eff6ff' : isRejected ? '#fef2f2' : '#fffbeb';
                const badgeColor = isDisbursed ? '#065f46' : isApproved ? '#1d4ed8' : isRejected ? '#dc2626' : '#b45309';

                return (
                  <View key={ref.id} style={styles.historyItem}>
                    <View style={styles.historyTop}>
                      <View>
                        <Text style={styles.refName}>{ref.name}</Text>
                        <Text style={styles.refMeta}>{ref.loanType} · {formatINR(ref.appliedAmount)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.statusBadgeText, { color: badgeColor }]}>{ref.status}</Text>
                      </View>
                    </View>

                    <View style={styles.historyBottom}>
                      <Text style={styles.historyDate}>Referred on {ref.date}</Text>
                      <Text style={[styles.historyReward, isDisbursed && { color: colors.success }]}>
                        {isDisbursed ? `+₹${ref.reward.toLocaleString('en-IN')} Disbursed` : `Eligible ₹${ref.reward.toLocaleString('en-IN')}`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ================= TAB 3: REWARD WALLET ================= */}
        {activeTab === 'rewards' && (
          <>
            <View style={styles.walletCard}>
              <Text style={styles.walletLabel}>Available Wallet Balance</Text>
              <Text style={styles.walletAmount}>{formatINR(walletBalance)}</Text>
              <Text style={styles.walletSub}>Ready to transfer to your linked bank account</Text>

              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={() => {
                  setWithdrawSuccess(false);
                  setIsWithdrawModalOpen(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="card-outline" size={16} color={colors.white} />
                <Text style={styles.withdrawBtnText}>Withdraw to Bank Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Wallet Activity</Text>
              {transactions.map((tx, idx) => (
                <View key={tx.id || idx} style={[styles.txRow, idx === transactions.length - 1 && { borderBottomWidth: 0 }]}>
                  <View>
                    <Text style={styles.txTitle}>{tx.title}</Text>
                    <Text style={styles.txDate}>{tx.date}</Text>
                  </View>
                  <Text style={[styles.txAmount, tx.type === 'credit' ? { color: colors.success } : { color: colors.textMuted }]}>
                    {tx.amount}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Simple Withdraw Modal */}
      <Modal visible={isWithdrawModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {!withdrawSuccess ? (
              <>
                <Text style={styles.modalHeading}>Withdraw to Bank</Text>
                <Text style={styles.modalSub}>
                  Available: {formatINR(walletBalance)} · Linked: HDFC Bank (**** 1234)
                </Text>

                <View style={styles.amountInputBox}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    keyboardType="numeric"
                    value={withdrawAmount}
                    onChangeText={setWithdrawAmount}
                  />
                </View>

                <View style={styles.presetAmountsRow}>
                  {['1000', '2000', '5000'].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.presetPill, withdrawAmount === val && styles.presetPillActive]}
                      onPress={() => setWithdrawAmount(val)}
                    >
                      <Text style={[styles.presetPillText, withdrawAmount === val && styles.presetPillTextActive]}>
                        ₹{val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setIsWithdrawModalOpen(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalSubmitBtn}
                    onPress={handleWithdraw}
                  >
                    <Text style={styles.modalSubmitText}>Confirm Payout</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <Ionicons name="checkmark-circle" size={50} color={colors.success} />
                <Text style={styles.successHeading}>Withdrawal Initiated!</Text>
                <Text style={styles.successSub}>
                  ₹{withdrawAmount} has been sent to your linked bank account. Reference ID: LPW-2026-{Math.floor(1000 + Math.random() * 9000)}
                </Text>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={() => setIsWithdrawModalOpen(false)}
                >
                  <Text style={styles.modalSubmitText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  heroDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 12,
  },
  linkLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 2,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  shareButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  waBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  shareMoreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  shareMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  rewardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rewardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardType: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  rewardAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  list: {
    gap: 10,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
    paddingBottom: 10,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  refName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  refMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  historyBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  historyDate: {
    fontSize: 10,
    color: colors.textLight,
  },
  historyReward: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  walletCard: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  walletLabel: {
    fontSize: 11,
    color: '#dbeafe',
  },
  walletAmount: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.white,
    marginTop: 2,
  },
  walletSub: {
    fontSize: 11,
    color: '#dbeafe',
    marginTop: 2,
    marginBottom: 12,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  withdrawBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  txTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  txDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 28,
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modalSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    paddingVertical: 8,
  },
  presetAmountsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  presetPillTextActive: {
    color: colors.white,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  modalSubmitBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSubmitText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  successHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  successSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
});

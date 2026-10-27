import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile, LoanApplication, LoanCategory, LoanType } from '../../types';
import { COMPANY_INFO } from '../../data/mockData';
import { LoanIcon } from '../common/LoanIcon';
import { formatINR } from '../../utils/calculator';
import { colors } from '../../theme/colors';

interface HomeScreenProps {
  user: UserProfile | null;
  categories: LoanCategory[];
  applications: LoanApplication[];
  onSelectCategory: (id: LoanType) => void;
  onNavigate: (screen: string, params?: Record<string, unknown>) => void;
  onOpenCall: () => void;
  onOpenWhatsApp: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  categories,
  applications,
  onSelectCategory,
  onNavigate,
  onOpenCall,
  onOpenWhatsApp,
}) => {
  const activeApp = applications.find(
    (a) => a.status !== 'Disbursed' && a.status !== 'Rejected'
  ) || applications[0];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Simple Native Welcome Card */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeTop}>
          <View>
            <Text style={styles.welcomeGreeting}>
              Hello, {user?.name?.split(' ')[0] || 'Customer'} 👋
            </Text>
            <Text style={styles.welcomeSubtitle}>Welcome back to Loan Point</Text>
          </View>
          <View style={styles.cibilPill}>
            <Text style={styles.cibilText}>CIBIL {user?.cibilEstimateScore || 750}</Text>
          </View>
        </View>

        {/* Primary Banner Action */}
        <TouchableOpacity
          style={styles.applyNowBanner}
          onPress={() => onNavigate('loan_apply', { loanType: 'personal' })}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Need a Fast Loan?</Text>
            <Text style={styles.bannerSub}>Quick approval with direct bank tie-ups</Text>
          </View>
          <View style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>Apply</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.white} />
          </View>
        </TouchableOpacity>
      </View>

      {/* 2. Clean 4-Grid Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('loan_apply', { loanType: 'personal' })}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Apply Loan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('emi_calculator')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#eef2ff' }]}>
              <Ionicons name="calculator-outline" size={22} color="#4f46e5" />
            </View>
            <Text style={styles.actionLabel}>EMI Calc</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('eligibility_checker')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="speedometer-outline" size={22} color="#059669" />
            </View>
            <Text style={styles.actionLabel}>Eligibility</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('applications')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fffbeb' }]}>
              <Ionicons name="time-outline" size={22} color="#d97706" />
            </View>
            <Text style={styles.actionLabel}>Track Loan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Clean Active Application Spotlight */}
      {activeApp && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Active Application</Text>
            <TouchableOpacity onPress={() => onNavigate('applications')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.appCard}
            onPress={() => onNavigate('application_detail', { applicationId: activeApp.id })}
            activeOpacity={0.7}
          >
            <View style={styles.appCardHeader}>
              <View>
                <Text style={styles.appName}>{activeApp.loanTypeName}</Text>
                <Text style={styles.appId}>{activeApp.id}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{activeApp.status}</Text>
              </View>
            </View>

            <View style={styles.appDivider} />

            <View style={styles.appDetailsRow}>
              <View>
                <Text style={styles.appDetailLabel}>Amount</Text>
                <Text style={styles.appDetailValue}>{formatINR(activeApp.requestedAmount)}</Text>
              </View>
              <View>
                <Text style={styles.appDetailLabel}>Tenure</Text>
                <Text style={styles.appDetailValue}>{activeApp.tenureMonths} Months</Text>
              </View>
              <View style={styles.appDetailAction}>
                <Text style={styles.trackText}>Details</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Refer & Earn Banner */}
      <TouchableOpacity
        style={styles.referralBanner}
        onPress={() => onNavigate('offers_referral')}
        activeOpacity={0.8}
      >
        <View style={styles.referralIconBox}>
          <Ionicons name="gift" size={20} color="#b45309" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.referralBannerTitle}>Refer Friends & Earn Cash</Text>
          <Text style={styles.referralBannerSub}>Get up to ₹2,000 per successful disbursement</Text>
        </View>
        <View style={styles.referralPill}>
          <Text style={styles.referralPillText}>Invite</Text>
          <Ionicons name="chevron-forward" size={12} color="#b45309" />
        </View>
      </TouchableOpacity>

      {/* 4. Loan Solutions (Clean Native 2-Column Grid) */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Loan Products</Text>
          <TouchableOpacity onPress={() => onNavigate('services')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.productsGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.productCard}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.7}
            >
              <View style={styles.productIconWrap}>
                <LoanIcon name={cat.iconName} size={22} />
              </View>
              <Text style={styles.productTitle}>{cat.title}</Text>
              <Text style={styles.productRate}>
                From {cat.indicativeInterestRate.split('–')[0].trim()}
              </Text>
              <View style={styles.productFooter}>
                <Text style={styles.applyPillText}>Apply</Text>
                <Ionicons name="chevron-forward" size={12} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 5. Simple One-Tap Support Bar */}
      <View style={styles.supportBox}>
        <Text style={styles.supportTitle}>Need Help with Loans?</Text>
        <Text style={styles.supportSub}>Connect directly with our branch team</Text>
        <View style={styles.supportButtonsRow}>
          <TouchableOpacity
            style={styles.supportCallBtn}
            onPress={onOpenCall}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={15} color={colors.white} />
            <Text style={styles.supportBtnText}>Call Branch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportWaBtn}
            onPress={onOpenWhatsApp}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-whatsapp" size={15} color={colors.white} />
            <Text style={styles.supportBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: colors.background,
  },
  welcomeCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  welcomeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeGreeting: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  cibilPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  cibilText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  applyNowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  bannerSub: {
    fontSize: 11,
    color: '#dbeafe',
    marginTop: 1,
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  bannerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionItem: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  appCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  appCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  appId: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  appDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  appDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appDetailLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  appDetailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  appDetailAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trackText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  productCard: {
    width: '48.3%',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    justifyContent: 'space-between',
  },
  productIconWrap: {
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  productRate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    paddingTop: 6,
  },
  applyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  referralBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  referralIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  referralBannerSub: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
  },
  referralPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  referralPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  supportBox: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 4,
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  supportSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  supportButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  supportCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  supportWaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  supportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
});

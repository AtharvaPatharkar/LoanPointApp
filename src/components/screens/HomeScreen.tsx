import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
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
              Hello, {user?.name?.split(' ')[0] || 'Customer'}
            </Text>
            <Text style={styles.welcomeSubtitle}>Welcome back to Loan Point</Text>
          </View>
          <TouchableOpacity
            style={styles.cibilPill}
            onPress={() => onNavigate('cibil_services')}
            activeOpacity={0.75}
          >
            <View style={styles.cibilIconDot}>
              <Ionicons name="shield-checkmark" size={13} color="#15803d" />
            </View>
            <View>
              <Text style={styles.cibilScoreText}>
                CIBIL <Text style={styles.cibilScoreNum}>{user?.cibilEstimateScore || 768}</Text>
              </Text>
              <Text style={styles.cibilRatingText}>Excellent</Text>
            </View>
            <Ionicons name="chevron-forward" size={12} color="#15803d" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>

        {/* Primary Banner Action - High Impact Gradient-Style Card */}
        <TouchableOpacity
          style={styles.applyNowBanner}
          onPress={() => onNavigate('loan_apply', { loanType: 'personal' })}
          activeOpacity={0.88}
        >
          {/* Subtle Ambient Decorative Circles */}
          <View style={styles.bannerOrbTop} />
          <View style={styles.bannerOrbBottom} />

          <View style={styles.bannerLeftContent}>
            <View style={styles.bannerBadge}>
              <Ionicons name="flash" size={11} color="#ffffff" />
              <Text style={styles.bannerBadgeText}>INSTANT DISBURSEMENT</Text>
            </View>
            <Text style={styles.bannerTitle}>Need a Fast Loan?</Text>
            <Text style={styles.bannerSub}>
              Paperless approval up to ₹25 Lakhs with 0% advance fees
            </Text>
          </View>

          <View style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>Apply Now</Text>
            <View style={styles.bannerBtnArrowCircle}>
              <Ionicons name="arrow-forward" size={12} color="#075665" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* 2. Clean 4-Grid Quick Actions with Solid Color Fill Icons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {/* Apply Loan: Vivid Logo Cyan Fill */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('loan_apply', { loanType: 'personal' })}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, styles.actionIconApply]}>
              <MaterialCommunityIcons name="file-document-edit" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionLabel}>Apply Loan</Text>
          </TouchableOpacity>

          {/* EMI Calculator: Deep Indigo Navy Fill */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('emi_calculator')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, styles.actionIconEmi]}>
              <MaterialCommunityIcons name="calculator-variant" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionLabel}>EMI Calc</Text>
          </TouchableOpacity>

          {/* Eligibility: Vibrant Emerald Green Fill */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('eligibility_checker')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, styles.actionIconElig]}>
              <MaterialCommunityIcons name="speedometer" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionLabel}>Eligibility</Text>
          </TouchableOpacity>

          {/* Track Loan: Logo Crimson Scarlet Red Fill */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('applications')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, styles.actionIconTrack]}>
              <Ionicons name="compass" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionLabel}>Track Loan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Attractive High-Contrast Active Application Spotlight */}
      {activeApp && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithDot}>
              <View style={styles.liveIndicatorDot} />
              <Text style={styles.sectionTitle}>Active Application</Text>
            </View>
            <TouchableOpacity onPress={() => onNavigate('applications')} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.appCard}
            onPress={() => onNavigate('application_detail', { applicationId: activeApp.id })}
            activeOpacity={0.88}
          >
            {/* Top Accent Gradient-Style Bar */}
            <View style={styles.appCardAccentBar} />

            {/* Header with Loan Icon & Live Badge */}
            <View style={styles.appCardHeader}>
              <View style={styles.appTitleLeft}>
                <View style={styles.appLoanIconTile}>
                  <MaterialCommunityIcons name="file-document-check" size={20} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.appName}>{activeApp.loanTypeName}</Text>
                  <View style={styles.appIdBadge}>
                    <Text style={styles.appIdText}>{activeApp.id}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.statusBadge}>
                <View style={styles.statusBlinkDot} />
                <Text style={styles.statusBadgeText}>{activeApp.status}</Text>
              </View>
            </View>

            {/* Middle Stats Card Tile */}
            <View style={styles.appDetailsRow}>
              <View style={styles.appMetricCol}>
                <Text style={styles.appDetailLabel}>SANCTION AMOUNT</Text>
                <Text style={styles.appDetailValue}>{formatINR(activeApp.requestedAmount)}</Text>
              </View>
              <View style={styles.appMetricDivider} />
              <View style={styles.appMetricCol}>
                <Text style={styles.appDetailLabel}>LOAN TENURE</Text>
                <Text style={styles.appDetailValue}>{activeApp.tenureMonths} Months</Text>
              </View>
            </View>

            {/* Next Action Box */}
            <View style={styles.appNextActionBox}>
              <MaterialCommunityIcons name="clock-fast" size={15} color="#008ecc" />
              <Text style={styles.appNextActionText} numberOfLines={1}>
                {activeApp.nextAction || 'Under bank credit evaluation'}
              </Text>
              <View style={styles.appDetailActionPill}>
                <Text style={styles.trackText}>Track</Text>
                <Ionicons name="arrow-forward" size={11} color="#ffffff" />
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
          <FontAwesome5 name="gift" size={19} color="#ffffff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.referralBannerTitle}>Refer Friends & Earn Cash</Text>
          <Text style={styles.referralBannerSub}>Get up to ₹2,000 per successful disbursement</Text>
        </View>
        <View style={styles.referralPill}>
          <MaterialCommunityIcons name="send-circle" size={17} color="#ffffff" />
          <Text style={styles.referralPillText}>Invite</Text>
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
            activeOpacity={0.8}
          >
            <View style={styles.supportIconCircle}>
              <Ionicons name="call" size={15} color="#008ecc" />
            </View>
            <Text style={styles.supportBtnText}>Call Branch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportWaBtn}
            onPress={onOpenWhatsApp}
            activeOpacity={0.8}
          >
            <View style={styles.supportIconCircle}>
              <Ionicons name="logo-whatsapp" size={16} color="#16a34a" />
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5', // Soft Healthy Green Tint
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    gap: 7,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cibilIconDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  cibilScoreText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#065f46',
    letterSpacing: 0.3,
  },
  cibilScoreNum: {
    fontSize: 13,
    fontWeight: '900',
    color: '#15803d',
  },
  cibilRatingText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16a34a',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  applyNowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#075665', // Deep Logo Petrol / Banking Teal
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 6,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#075665',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  bannerOrbTop: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#008ecc', // Vivid Logo Cyan Glow
    opacity: 0.35,
  },
  bannerOrbBottom: {
    position: 'absolute',
    bottom: -40,
    left: '25%',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2d3091', // Royal Navy Glow
    opacity: 0.28,
  },
  bannerLeftContent: {
    flex: 1,
    marginRight: 10,
    zIndex: 2,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
    gap: 4,
  },
  bannerBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.6,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  bannerSub: {
    fontSize: 11,
    color: '#e6f6fc',
    marginTop: 3,
    lineHeight: 15,
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 8,
    borderRadius: 22,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  bannerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#075665', // Deep Petrol text
  },
  bannerBtnArrowCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e6f6fc',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconApply: {
    backgroundColor: '#008ecc', // Vivid Logo Sky Cyan
    shadowColor: '#008ecc',
  },
  actionIconEmi: {
    backgroundColor: '#2d3091', // Rich Logo Indigo Navy
    shadowColor: '#2d3091',
  },
  actionIconElig: {
    backgroundColor: '#16a34a', // Vivid Green
    shadowColor: '#16a34a',
  },
  actionIconTrack: {
    backgroundColor: '#ee1c25', // Vivid Logo Crimson Red
    shadowColor: '#ee1c25',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  sectionTitleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  appCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#2d3091',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  appCardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#008ecc', // Vivid Brand Sky Cyan Accent Bar
  },
  appCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  appLoanIconTile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#2d3091', // Solid Logo Royal Indigo
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2d3091',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  appName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  appIdBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  appIdText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  statusBlinkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46',
  },
  appDetailsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  appMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  appMetricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#cbd5e1',
  },
  appDetailLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.6,
  },
  appDetailValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  appNextActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f6fc', // Soft Logo Sky Cyan Tint
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    gap: 7,
  },
  appNextActionText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#016f9f',
  },
  appDetailActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008ecc', // Vivid Logo Cyan Blue
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  trackText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  productCard: {
    width: '48.2%',
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
    backgroundColor: '#fffdf5',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  referralIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#d97706', // Solid Prosperity Amber Gold
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  referralBannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#78350f',
  },
  referralBannerSub: {
    fontSize: 11,
    color: '#92400e',
    marginTop: 2,
  },
  referralPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#008ecc', // Vivid Logo Cyan Blue Fill
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
    elevation: 2,
  },
  referralPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
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
    backgroundColor: '#008ecc', // Logo Vivid Sky Cyan
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  supportWaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a', // Official WhatsApp Green
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  supportIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});

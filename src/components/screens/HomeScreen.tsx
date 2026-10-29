import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { UserProfile, LoanApplication, LoanCategory, LoanType } from '../../types';
import { COMPANY_INFO } from '../../data/mockData';
import { LoanIcon } from '../common/LoanIcon';
import { IsometricTile } from '../common/IsometricTile';
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

const LOAN_PRODUCT_META: Record<
  string,
  {
    type:
      | 'personal'
      | 'business'
      | 'home'
      | 'mortgage'
      | 'car'
      | 'education'
      | 'agriculture'
      | 'mudra';
    badgeTag?: string;
    badgeColor?: string;
    popular?: boolean;
    cardBorderColor: string;
    cardBg: string;
  }
> = {
  personal: {
    type: 'personal',
    badgeTag: 'Highest Approval',
    badgeColor: '#10b981', // Emerald green
    popular: true,
    cardBorderColor: '#fed7aa',
    cardBg: '#fffbf5',
  },
  home: {
    type: 'home',
    badgeTag: 'Lowest 8.40%',
    badgeColor: '#0284c7', // Sky blue
    popular: true,
    cardBorderColor: '#fecdd3',
    cardBg: '#fff8f8',
  },
  business: {
    type: 'business',
    badgeTag: 'No Collateral',
    badgeColor: '#6366f1', // Indigo purple
    popular: false,
    cardBorderColor: '#ddd6fe',
    cardBg: '#faf8ff',
  },
  mortgage: {
    type: 'mortgage',
    badgeTag: 'Max Funding',
    badgeColor: '#0d9488', // Teal
    popular: false,
    cardBorderColor: '#bae6fd',
    cardBg: '#f7fbff',
  },
  car: {
    type: 'car',
    badgeTag: 'Up to 90%',
    badgeColor: '#2563eb', // Royal Blue
    popular: false,
    cardBorderColor: '#bfdbfe',
    cardBg: '#f6faff',
  },
  education: {
    type: 'education',
    badgeTag: 'Study India/Abroad',
    badgeColor: '#c026d3', // Fuchsia
    popular: false,
    cardBorderColor: '#fbcfe8',
    cardBg: '#fdf8fa',
  },
  agriculture: {
    type: 'agriculture',
    badgeTag: 'Govt Subsidy',
    badgeColor: '#16a34a', // Grass Green
    popular: false,
    cardBorderColor: '#bbf7d0',
    cardBg: '#f7fdf9',
  },
  mudra: {
    type: 'mudra',
    badgeTag: 'PMMY 0% Security',
    badgeColor: '#ea580c', // Bright Orange
    popular: false,
    cardBorderColor: '#fde68a',
    cardBg: '#fffdf5',
  },
};

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

  // Micro-animations for live elements on the Home page
  const pulseLiveDot = useRef(new Animated.Value(1)).current;
  const bannerShimmer = useRef(new Animated.Value(0)).current;
  const quickActionZoom = useRef(new Animated.Value(1)).current;
  const giftPulse = useRef(new Animated.Value(1)).current;
  const supportCallPulse = useRef(new Animated.Value(1)).current;
  const supportWaPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Live status dot gentle breathing
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseLiveDot, {
          toValue: 0.35,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseLiveDot, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Banner button gentle pulse
    const bannerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bannerShimmer, {
          toValue: 1.04,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bannerShimmer, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Quick Actions Zoom In - Zoom Out micro pulse
    const actionZoomLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(quickActionZoom, {
          toValue: 1.06,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(quickActionZoom, {
          toValue: 0.98,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // 4. Refer & Earn Gift Box continuous pulse
    const giftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(giftPulse, {
          toValue: 1.1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(giftPulse, {
          toValue: 0.95,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // 5. Call Branch & WhatsApp continuous alternating pulse
    const supportCallLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(supportCallPulse, {
          toValue: 1.04,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(supportCallPulse, {
          toValue: 0.98,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const supportWaLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(650),
        Animated.timing(supportWaPulse, {
          toValue: 1.04,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(supportWaPulse, {
          toValue: 0.98,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    dotLoop.start();
    bannerLoop.start();
    actionZoomLoop.start();
    giftLoop.start();
    supportCallLoop.start();
    supportWaLoop.start();

    return () => {
      dotLoop.stop();
      bannerLoop.stop();
      actionZoomLoop.stop();
      giftLoop.stop();
      supportCallLoop.stop();
      supportWaLoop.stop();
    };
  }, [pulseLiveDot, bannerShimmer, quickActionZoom, giftPulse, supportCallPulse, supportWaPulse]);

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

          <Animated.View style={[styles.bannerBtn, { transform: [{ scale: bannerShimmer }] }]}>
            <Text style={styles.bannerBtnText}>Apply Now</Text>
            <View style={styles.bannerBtnArrowCircle}>
              <Ionicons name="arrow-forward" size={12} color="#075665" />
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* 2. 45° 3D Isometric FinTech Quick Actions with Half-Circle Sheen & Zoom-In Pulse */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Tools & Desk</Text>
          <Text style={styles.quickToolsSub}>1-Tap Instant Access</Text>
        </View>

        <View style={styles.actionsGrid}>
          {/* Apply Fast: 45° Gold Money Pouch */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('loan_apply', { loanType: 'personal' })}
            activeOpacity={0.78}
          >
            <Animated.View
              style={[
                styles.actionHalfCirclePlatform,
                styles.actionPlatformApply,
                { transform: [{ scale: quickActionZoom }] },
              ]}
            >
              {/* Half-circle specular light sheen */}
              <View style={styles.actionPlatformSheen} />
              <View style={styles.actionIconTilt45}>
                <MaterialCommunityIcons name="file-document-edit" size={24} color="#ffffff" />
              </View>
            </Animated.View>
            <Text style={styles.actionLabel}>Apply Loan</Text>
            <View style={[styles.actionMicroPill, { backgroundColor: '#e0f2fe' }]}>
              <Text style={[styles.actionMicroPillText, { color: '#0369a1' }]}>Instant</Text>
            </View>
          </TouchableOpacity>

          {/* EMI Calculator: 45° Royal Indigo Navy Tile */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('emi_calculator')}
            activeOpacity={0.78}
          >
            <Animated.View
              style={[
                styles.actionHalfCirclePlatform,
                styles.actionPlatformEmi,
                { transform: [{ scale: quickActionZoom }] },
              ]}
            >
              <View style={styles.actionPlatformSheen} />
              <View style={styles.actionIconTilt45}>
                <MaterialCommunityIcons name="calculator-variant" size={24} color="#ffffff" />
              </View>
            </Animated.View>
            <Text style={styles.actionLabel}>EMI Calc</Text>
            <View style={[styles.actionMicroPill, { backgroundColor: '#ede9fe' }]}>
              <Text style={[styles.actionMicroPillText, { color: '#4338ca' }]}>Planner</Text>
            </View>
          </TouchableOpacity>

          {/* Eligibility: 45° Speedometer Emerald Platform */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('eligibility_checker')}
            activeOpacity={0.78}
          >
            <Animated.View
              style={[
                styles.actionHalfCirclePlatform,
                styles.actionPlatformElig,
                { transform: [{ scale: quickActionZoom }] },
              ]}
            >
              <View style={styles.actionPlatformSheen} />
              <View style={styles.actionIconTilt45}>
                <MaterialCommunityIcons name="speedometer" size={24} color="#ffffff" />
              </View>
            </Animated.View>
            <Text style={styles.actionLabel}>Eligibility</Text>
            <View style={[styles.actionMicroPill, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.actionMicroPillText, { color: '#15803d' }]}>Check</Text>
            </View>
          </TouchableOpacity>

          {/* Track Loan: 45° Crimson Radar Compass */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onNavigate('applications')}
            activeOpacity={0.78}
          >
            <Animated.View
              style={[
                styles.actionHalfCirclePlatform,
                styles.actionPlatformTrack,
                { transform: [{ scale: quickActionZoom }] },
              ]}
            >
              <View style={styles.actionPlatformSheen} />
              <View style={styles.actionIconTilt45}>
                <Ionicons name="compass" size={24} color="#ffffff" />
              </View>
            </Animated.View>
            <Text style={styles.actionLabel}>Track Status</Text>
            <View style={[styles.actionMicroPill, { backgroundColor: '#fee2e2' }]}>
              <Text style={[styles.actionMicroPillText, { color: '#b91c1c' }]}>Live</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. High-Conversion 45° 3D Isometric Active Application Spotlight */}
      {activeApp && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithDot}>
              <Animated.View style={[styles.liveIndicatorDot, { opacity: pulseLiveDot }]} />
              <Text style={styles.sectionTitle}>Active Application</Text>
              <View style={styles.liveEvaluationBadge}>
                <Text style={styles.liveEvaluationBadgeText}>LIVE DESK</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => onNavigate('applications')} activeOpacity={0.7}>
              <View style={styles.seeAllBadge}>
                <Text style={styles.seeAllText}>View All</Text>
                <Ionicons name="arrow-forward" size={11} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.appCard}
            onPress={() => onNavigate('application_detail', { applicationId: activeApp.id })}
            activeOpacity={0.88}
          >
            {/* Top Multi-Color Accent Gradient Bar */}
            <View style={styles.appCardAccentBar} />

            {/* Header with 45° 3D Model Tile & Live Progress Badge */}
            <View style={styles.appCardHeader}>
              <View style={styles.appTitleLeft}>
                {/* 45° 3D Isometric Tile matching loan type with Zoom-In/Out pulse */}
                <View style={styles.appLoanIsoTileWrap}>
                  <IsometricTile
                    type={
                      activeApp.loanType === 'home'
                        ? 'home'
                        : activeApp.loanType === 'business'
                        ? 'business'
                        : activeApp.loanType === 'mortgage'
                        ? 'mortgage'
                        : 'personal'
                    }
                    size={52}
                    animated={true}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appName}>{activeApp.loanTypeName}</Text>
                  <View style={styles.appIdBadgeRow}>
                    <View style={styles.appIdBadge}>
                      <Text style={styles.appIdText}>{activeApp.id}</Text>
                    </View>
                    <Text style={styles.appSubmittedText}>
                      Applied: {activeApp.submissionDate}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.statusBadge}>
                <Animated.View style={[styles.statusBlinkDot, { opacity: pulseLiveDot }]} />
                <Text style={styles.statusBadgeText}>{activeApp.status}</Text>
              </View>
            </View>

            {/* Middle Stats Card Tile with 3 Micro-Metrics */}
            <View style={styles.appDetailsRow}>
              <View style={styles.appMetricCol}>
                <Text style={styles.appDetailLabel}>SANCTION AMOUNT</Text>
                <Text style={styles.appDetailValue}>{formatINR(activeApp.requestedAmount)}</Text>
              </View>
              <View style={styles.appMetricDivider} />
              <View style={styles.appMetricCol}>
                <Text style={styles.appDetailLabel}>LOAN TENURE</Text>
                <Text style={styles.appDetailValue}>{activeApp.tenureMonths} Mos</Text>
              </View>
              <View style={styles.appMetricDivider} />
              <View style={styles.appMetricCol}>
                <Text style={styles.appDetailLabel}>BRANCH DESK</Text>
                <Text style={[styles.appDetailValue, { color: '#008ecc' }]}>Nanded</Text>
              </View>
            </View>

            {/* Next Action Box with Live Pulse */}
            <View style={styles.appNextActionBox}>
              <View style={styles.clockIconWrap}>
                <MaterialCommunityIcons name="clock-fast" size={16} color="#008ecc" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.appNextActionHeader}>CURRENT STATUS</Text>
                <Text style={styles.appNextActionText} numberOfLines={1}>
                  {activeApp.nextAction || 'Under bank credit evaluation'}
                </Text>
              </View>
              <Animated.View
                style={[
                  styles.appDetailActionPill,
                  { transform: [{ scale: quickActionZoom }] },
                ]}
              >
                <Text style={styles.trackText}>Track Live</Text>
                <Ionicons name="arrow-forward" size={11} color="#ffffff" />
              </Animated.View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Refer & Earn Banner with 3D Specular Platform & Zoom Animation */}
      <TouchableOpacity
        style={styles.referralBanner}
        onPress={() => onNavigate('offers_referral')}
        activeOpacity={0.84}
      >
        <Animated.View
          style={[
            styles.referralIconBox,
            { transform: [{ scale: giftPulse }] },
          ]}
        >
          {/* Half-Circle Specular Top Sheen */}
          <View style={styles.referralHalfSheen} />
          <FontAwesome5 name="gift" size={20} color="#ffffff" />
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={styles.referralBannerTitle}>Refer Friends & Earn Cash</Text>
          <Text style={styles.referralBannerSub}>Get up to ₹2,000 per successful disbursement</Text>
        </View>
        <Animated.View
          style={[
            styles.referralPill,
            { transform: [{ scale: quickActionZoom }] },
          ]}
        >
          <MaterialCommunityIcons name="send-circle" size={17} color="#ffffff" />
          <Text style={styles.referralPillText}>Invite</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* 4. Paisabazaar-Style 3D Isometric FinTech Loan Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Loans & Credit Solutions</Text>
            <Text style={styles.sectionSubtitle}>
              Lowest interest rates with direct bank disbursement
            </Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate('services')} activeOpacity={0.7}>
            <View style={styles.seeAllBadge}>
              <Text style={styles.seeAllText}>See All (8)</Text>
              <Ionicons name="arrow-forward" size={11} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.productsGrid}>
          {categories.map((cat) => {
            const meta = LOAN_PRODUCT_META[cat.id] || {
              type: 'personal',
              badgeTag: 'Best Rate',
              badgeColor: '#008ecc',
              cardBorderColor: '#e2e8f0',
              cardBg: '#ffffff',
            };

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.productCard3D,
                  {
                    borderColor: meta.cardBorderColor,
                    backgroundColor: meta.cardBg,
                  },
                ]}
                onPress={() => onSelectCategory(cat.id)}
                activeOpacity={0.82}
              >
                {/* 3D Isometric Claymorphic Art Tile with Ribbon Tag */}
                <View style={styles.productIconWrap3D}>
                  <IsometricTile
                    type={meta.type}
                    size={62}
                    badgeTag={meta.badgeTag}
                    badgeColor={meta.badgeColor}
                  />
                </View>

                {/* Loan Title & Indicative Low Rate */}
                <Text style={styles.productTitle3D} numberOfLines={1}>
                  {cat.title}
                </Text>
                <View style={styles.ratePillWrap}>
                  <Text style={styles.productRate3D}>
                    From{' '}
                    <Text style={styles.productRateBold}>
                      {cat.indicativeInterestRate.split('–')[0].trim()}
                    </Text>
                  </Text>
                </View>

                {/* Bottom Action Strip */}
                <View style={styles.productFooter3D}>
                  <Text style={styles.applyPillText3D}>Apply Fast</Text>
                  <View style={styles.productArrowCircle}>
                    <Ionicons name="chevron-forward" size={11} color="#ffffff" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 5. One-Tap Support Bar with Specular Platforms & Zoom-In Pulse */}
      <View style={styles.supportBox}>
        <View style={styles.supportHeaderRow}>
          <Text style={styles.supportTitle}>Need Help with Loans?</Text>
          <View style={styles.supportOnlineBadge}>
            <Animated.View style={[styles.liveIndicatorDot, { opacity: pulseLiveDot }]} />
            <Text style={styles.supportOnlineText}>ONLINE</Text>
          </View>
        </View>
        <Text style={styles.supportSub}>Connect directly with our branch relationship team</Text>

        <View style={styles.supportButtonsRow}>
          {/* Call Branch Button with Zoom Pulse */}
          <TouchableOpacity
            style={styles.supportBtnTouch}
            onPress={onOpenCall}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.supportCallBtn,
                { transform: [{ scale: supportCallPulse }] },
              ]}
            >
              <View style={styles.supportHalfSheen} />
              <View style={styles.supportIconCircle}>
                <Ionicons name="call" size={16} color="#008ecc" />
              </View>
              <Text style={styles.supportBtnText}>Call Branch</Text>
            </Animated.View>
          </TouchableOpacity>

          {/* WhatsApp Support Button with Zoom Pulse */}
          <TouchableOpacity
            style={styles.supportBtnTouch}
            onPress={onOpenWhatsApp}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.supportWaBtn,
                { transform: [{ scale: supportWaPulse }] },
              ]}
            >
              <View style={styles.supportHalfSheen} />
              <View style={styles.supportIconCircle}>
                <Ionicons name="logo-whatsapp" size={17} color="#16a34a" />
              </View>
              <Text style={styles.supportBtnText}>WhatsApp</Text>
            </Animated.View>
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
  sectionSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: -4,
    marginBottom: 8,
  },
  seeAllBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e6f6fc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  seeAllText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
  },
  quickToolsSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#008ecc',
    backgroundColor: '#e6f6fc',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionItem: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionHalfCirclePlatform: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 4,
  },
  actionPlatformSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  actionIconTilt45: {
    transform: [{ rotate: '-12deg' }],
  },
  actionPlatformApply: {
    backgroundColor: '#008ecc', // Sky Cyan
    shadowColor: '#008ecc',
  },
  actionPlatformEmi: {
    backgroundColor: '#2d3091', // Indigo Navy
    shadowColor: '#2d3091',
  },
  actionPlatformElig: {
    backgroundColor: '#16a34a', // Emerald Green
    shadowColor: '#16a34a',
  },
  actionPlatformTrack: {
    backgroundColor: '#ee1c25', // Crimson Red
    shadowColor: '#ee1c25',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  actionMicroPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 4,
  },
  actionMicroPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
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
  liveEvaluationBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginLeft: 6,
  },
  liveEvaluationBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.4,
  },
  appCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#2d3091',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
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
    gap: 12,
    flex: 1,
  },
  appLoanIsoTileWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIdBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  appSubmittedText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
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
    fontSize: 15.5,
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
  },
  appIdText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
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
    paddingHorizontal: 8,
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
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.4,
  },
  appDetailValue: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  appNextActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f6fc', // Soft Logo Sky Cyan Tint
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
  },
  clockIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appNextActionHeader: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.4,
  },
  appNextActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0369a1',
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
    rowGap: 14,
  },
  productCard3D: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productIconWrap3D: {
    marginTop: 2,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTitle3D: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  ratePillWrap: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productRate3D: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
  },
  productRateBold: {
    fontSize: 11,
    fontWeight: '800',
    color: '#008ecc', // Vivid Cyan Rate
  },
  productFooter3D: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  applyPillText3D: {
    fontSize: 11,
    fontWeight: '800',
    color: '#075665', // Deep Petrol
  },
  productArrowCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#075665',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#d97706', // Solid Prosperity Amber Gold
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 3,
  },
  referralHalfSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
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
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
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
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supportHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  supportOnlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 5,
  },
  supportOnlineText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.4,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  supportSub: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginBottom: 12,
  },
  supportButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  supportBtnTouch: {
    flex: 1,
  },
  supportCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#008ecc', // Logo Vivid Sky Cyan
    paddingVertical: 11,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 4,
  },
  supportWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a', // Official WhatsApp Green
    paddingVertical: 11,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 4,
  },
  supportHalfSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
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

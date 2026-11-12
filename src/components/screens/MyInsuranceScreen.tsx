import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { formatINR } from '../../utils/calculator';
import { UserProfile } from '../../types';

interface InsurancePlan {
  id: string;
  title: string;
  category: 'loan_protection' | 'life' | 'health' | 'home';
  tag: string;
  tagColor: string;
  coverAmount: number;
  monthlyPremium: number;
  provider: string;
  features: string[];
  recommended?: boolean;
}

const INSURANCE_PLANS: InsurancePlan[] = [
  {
    id: 'loan_suraksha',
    title: 'Loan Suraksha Shield',
    category: 'loan_protection',
    tag: 'Highest Recommendation',
    tagColor: '#10b981',
    coverAmount: 4000000,
    monthlyPremium: 499,
    provider: 'Loan Point Partner Life',
    features: [
      '100% outstanding loan cleared in case of unforeseen event',
      'No burden passed to spouse or family members',
      'Instant digital policy issue with existing loan KYC',
      'Tax benefit under Sec 80C',
    ],
    recommended: true,
  },
  {
    id: 'health_plus',
    title: 'Complete Health Protect',
    category: 'health',
    tag: 'Cashless EMI Guarantee',
    tagColor: '#008ecc',
    coverAmount: 1000000,
    monthlyPremium: 649,
    provider: 'Care Health Banking Tie-up',
    features: [
      'Covers hospital bills + EMI waiver up to 6 months',
      'Cashless hospital network across 11,000+ centers',
      'Zero pre-medical tests up to 45 years',
      'Direct branch assistance in Nanded',
    ],
  },
  {
    id: 'home_suraksha',
    title: 'Home & Asset Protection',
    category: 'home',
    tag: 'All-Risk Property Cover',
    tagColor: '#8b5cf6',
    coverAmount: 5000000,
    monthlyPremium: 349,
    provider: 'ICICI Lombard Secured Tie-up',
    features: [
      'Fire, earthquake, flood & natural disaster shield',
      'Mandatory tie-in for Home Loan peace of mind',
      'Structure + contents covered at nominal rate',
      'Instant e-Certificate for bank loan audit',
    ],
  },
  {
    id: 'term_life_1cr',
    title: 'Term Life 1 Crore Pure Cover',
    category: 'life',
    tag: 'Lowest Premium Tier',
    tagColor: '#f59e0b',
    coverAmount: 10000000,
    monthlyPremium: 799,
    provider: 'HDFC Life Strategic Link',
    features: [
      'Fixed ₹1 Crore security for your nominees',
      'Claim settlement ratio 99.3%',
      'Terminal illness early benefit built-in',
      'Flexible annual/monthly payment modes',
    ],
  },
];

interface MyInsuranceScreenProps {
  user: UserProfile | null;
  onOpenCall?: () => void;
  onOpenWhatsApp?: () => void;
}

export const MyInsuranceScreen: React.FC<MyInsuranceScreenProps> = ({
  user,
  onOpenCall,
  onOpenWhatsApp,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [enquiredPlan, setEnquiredPlan] = useState<string | null>(null);

  const filteredPlans =
    selectedCategory === 'all'
      ? INSURANCE_PLANS
      : INSURANCE_PLANS.filter((p) => p.category === selectedCategory);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Spotlight Hero Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroGlowCircle} />

        <View style={styles.heroBadgeRow}>
          <View style={styles.heroBadgePill}>
            <Ionicons name="shield-checkmark" size={14} color="#38bdf8" />
            <Text style={styles.heroBadgeText}>LOAN POINT SECURE</Text>
          </View>
          <View style={styles.zeroPaperPill}>
            <Text style={styles.zeroPaperText}>Zero Medicals</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Protect Your Loan & Family</Text>
        <Text style={styles.heroSubtitle}>
          Ensure your home and family remain debt-free with specialized banking insurance tied to your loan account.
        </Text>

        {/* 3 Micro-Metrics Row */}
        <View style={styles.metricRow}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Max Coverage</Text>
            <Text style={styles.metricValue}>₹1 Crore</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Premiums From</Text>
            <Text style={[styles.metricValue, { color: '#38bdf8' }]}>₹349/mo</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Settlement Ratio</Text>
            <Text style={[styles.metricValue, { color: '#86efac' }]}>99.3%</Text>
          </View>
        </View>
      </View>

      {/* 2. Category Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {[
          { id: 'all', label: 'All Plans', icon: 'shield-outline' },
          { id: 'loan_protection', label: 'Loan Shield', icon: 'lock-closed-outline' },
          { id: 'health', label: 'Health & EMI', icon: 'medkit-outline' },
          { id: 'home', label: 'Home & Asset', icon: 'home-outline' },
          { id: 'life', label: 'Term Life', icon: 'heart-outline' },
        ].map((tab) => {
          const isActive = selectedCategory === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => setSelectedCategory(tab.id)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={isActive ? '#ffffff' : '#475569'}
              />
              <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. Insurance Plans List */}
      <View style={styles.plansSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Curated Loan Protection Plans</Text>
          <Text style={styles.sectionSubtitle}>Handpicked for active borrowers</Text>
        </View>

        {filteredPlans.map((plan) => {
          const isEnquired = enquiredPlan === plan.id;

          return (
            <View key={plan.id} style={styles.planCard}>
              {/* Top Tag Ribbon */}
              <View style={styles.planHeaderRow}>
                <View style={[styles.tagBadge, { backgroundColor: plan.tagColor }]}>
                  <Text style={styles.tagBadgeText}>{plan.tag}</Text>
                </View>
                <Text style={styles.providerText}>{plan.provider}</Text>
              </View>

              <Text style={styles.planTitle}>{plan.title}</Text>

              {/* Cover & Premium Details */}
              <View style={styles.pricingBox}>
                <View style={styles.pricingCol}>
                  <Text style={styles.pricingLabel}>LIFE / ASSET COVER</Text>
                  <Text style={styles.coverAmountText}>{formatINR(plan.coverAmount)}</Text>
                </View>
                <View style={styles.pricingDivider} />
                <View style={styles.pricingCol}>
                  <Text style={styles.pricingLabel}>MONTHLY PREMIUM</Text>
                  <Text style={styles.premiumText}>₹{plan.monthlyPremium} <Text style={styles.perMonth}>/mo</Text></Text>
                </View>
              </View>

              {/* Feature Checklist */}
              <View style={styles.featuresList}>
                {plan.features.map((feat, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                    <Text style={styles.featureItemText}>{feat}</Text>
                  </View>
                ))}
              </View>

              {/* Card Action Button */}
              <TouchableOpacity
                style={[styles.enquireBtn, isEnquired && styles.enquireBtnSuccess]}
                onPress={() => setEnquiredPlan(plan.id)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isEnquired ? 'checkmark-circle' : 'shield-checkmark'}
                  size={16}
                  color="#ffffff"
                />
                <Text style={styles.enquireBtnText}>
                  {isEnquired ? 'Interest Registered! Our Desk Will Call' : 'Get Quote & Policy Details'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* 4. Branch Advisory Help Box */}
      <View style={styles.advisoryBox}>
        <View style={styles.advisoryIconWrap}>
          <Ionicons name="call" size={20} color="#008ecc" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.advisoryTitle}>Need Insurance Consultation?</Text>
          <Text style={styles.advisorySub}>
            Speak with our Nanded branch insurance specialist for custom loan collateral coverage.
          </Text>
        </View>
        {onOpenCall && (
          <TouchableOpacity style={styles.advisoryCallBtn} onPress={onOpenCall} activeOpacity={0.8}>
            <Text style={styles.advisoryCallBtnText}>Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 96,
    backgroundColor: '#f8fafc',
  },
  heroCard: {
    backgroundColor: colors.cardNavyFrom,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: colors.cardNavyFrom,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  heroGlowCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heroBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#bae6fd',
    letterSpacing: 0.6,
  },
  zeroPaperPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  zeroPaperText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#86efac',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#e0f2fe',
    marginTop: 4,
    lineHeight: 17,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  metricLabel: {
    fontSize: 10,
    color: '#bae6fd',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  filterPillActive: {
    backgroundColor: '#008ecc',
    borderColor: '#008ecc',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  plansSection: {
    gap: 14,
  },
  sectionHeaderRow: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  providerText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  pricingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  pricingCol: {
    flex: 1,
    alignItems: 'center',
  },
  pricingDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },
  pricingLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.4,
  },
  coverAmountText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#008ecc',
    marginTop: 2,
  },
  premiumText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#16a34a',
    marginTop: 2,
  },
  perMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  featuresList: {
    gap: 6,
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureItemText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  enquireBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#008ecc',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  enquireBtnSuccess: {
    backgroundColor: '#16a34a',
    shadowColor: '#16a34a',
  },
  enquireBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  advisoryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    gap: 12,
  },
  advisoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  advisoryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369a1',
  },
  advisorySub: {
    fontSize: 11,
    color: '#0284c7',
    marginTop: 2,
  },
  advisoryCallBtn: {
    backgroundColor: '#008ecc',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  advisoryCallBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});


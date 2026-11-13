import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { UserProfile } from '../../types';
import { colors } from '../../theme/colors';

interface TopUpLoanScreenProps {
  user?: UserProfile | null;
  onBack: () => void;
  onApplySuccess?: () => void;
}

export const TopUpLoanScreen: React.FC<TopUpLoanScreenProps> = ({
  user,
  onBack,
  onApplySuccess,
}) => {
  const [loanAmount, setLoanAmount] = useState<string>('500000');
  const [existingBank, setExistingBank] = useState<string>('HDFC Bank');
  const [tenureYears, setTenureYears] = useState<number>(3);
  const [purpose, setPurpose] = useState<string>('Home Renovation / Personal');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const parsedAmount = parseInt(loanAmount, 10) || 0;
  // Estimated EMI calculation: P * r * (1+r)^n / ((1+r)^n - 1) with ~10.5% p.a.
  const monthlyRate = 10.5 / 12 / 100;
  const totalMonths = tenureYears * 12;
  const estimatedEmi = Math.round(
    (parsedAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
  ) || 0;

  const handleSubmit = () => {
    if (parsedAmount < 25000) {
      Alert.alert('Invalid Amount', 'Minimum Top-Up loan amount is ₹25,000');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Application Submitted!',
        `Your Top-Up Loan request for ₹${parsedAmount.toLocaleString('en-IN')} has been submitted successfully. Our loan officer will contact you within 2 hours.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onApplySuccess) onApplySuccess();
              else onBack();
            },
          },
        ]
      );
    }, 700);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Banner Graphic */}
      <View style={styles.bannerWrapper}>
        <Image
          source={require('../../../assets/banner/need-extra-funds-banner.png')}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      </View>

      {/* Header Info */}
      <View style={styles.cardSection}>
        <View style={styles.badgeRow}>
          <View style={styles.instantBadge}>
            <Ionicons name="flash" size={13} color="#ffffff" />
            <Text style={styles.instantBadgeText}>PRE-APPROVED OFFERS AVAILABLE</Text>
          </View>
        </View>

        <Text style={styles.title}>Top-Up Loan on Existing Loan</Text>
        <Text style={styles.subtitle}>
          Get instant additional funds on your ongoing loan without submitting fresh income documents.
        </Text>
      </View>

      {/* Feature Highlights Grid */}
      <View style={styles.featuresRow}>
        <View style={styles.featureItem}>
          <View style={[styles.featureIconWrap, { backgroundColor: '#fef3c7' }]}>
            <MaterialCommunityIcons name="percent" size={18} color="#d97706" />
          </View>
          <Text style={styles.featureTitle}>From 8.99%</Text>
          <Text style={styles.featureSub}>Lowest Interest</Text>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIconWrap, { backgroundColor: '#eff6ff' }]}>
            <MaterialCommunityIcons name="file-document-outline" size={18} color="#2563eb" />
          </View>
          <Text style={styles.featureTitle}>Minimal KYC</Text>
          <Text style={styles.featureSub}>Paperless Process</Text>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIconWrap, { backgroundColor: '#f0fdf4' }]}>
            <Ionicons name="speedometer-outline" size={18} color="#16a34a" />
          </View>
          <Text style={styles.featureTitle}>24 Hours</Text>
          <Text style={styles.featureSub}>Fast Disbursal</Text>
        </View>
      </View>

      {/* Application Form */}
      <View style={styles.formCard}>
        <Text style={styles.formSectionTitle}>Customize Top-Up Request</Text>

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Required Top-Up Amount (₹)</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={loanAmount}
              onChangeText={setLoanAmount}
              placeholder="e.g. 500000"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Existing Bank */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Existing Active Loan Bank</Text>
          <TextInput
            style={styles.singleInput}
            value={existingBank}
            onChangeText={setExistingBank}
            placeholder="e.g. HDFC Bank, SBI, ICICI"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Purpose */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>End Use / Purpose</Text>
          <TextInput
            style={styles.singleInput}
            value={purpose}
            onChangeText={setPurpose}
            placeholder="e.g. Home Renovation, Business expansion"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Tenure Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tenure</Text>
          <View style={styles.tenureRow}>
            {[1, 2, 3, 5, 7].map((yr) => (
              <TouchableOpacity
                key={yr}
                style={[
                  styles.tenureBtn,
                  tenureYears === yr && styles.tenureBtnActive,
                ]}
                onPress={() => setTenureYears(yr)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tenureBtnText,
                    tenureYears === yr && styles.tenureBtnTextActive,
                  ]}
                >
                  {yr} {yr === 1 ? 'Year' : 'Years'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Calculated EMI Preview */}
        <View style={styles.emiPreviewBox}>
          <View>
            <Text style={styles.emiLabel}>Estimated Monthly EMI</Text>
            <Text style={styles.emiValue}>₹{estimatedEmi.toLocaleString('en-IN')} / mo</Text>
          </View>
          <View style={styles.rateBadge}>
            <Text style={styles.rateText}>@ 10.5% p.a.</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.88}
        >
          <Text style={styles.submitBtnText}>
            {isSubmitting ? 'Submitting Application...' : 'Apply for Top-Up Now'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerWrapper: {
    width: '100%',
    aspectRatio: 2.22,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#0a3875',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: '#053e92',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  cardSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  instantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  instantBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 18,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  featureItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  featureSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  singleInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  tenureRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tenureBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tenureBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  tenureBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  tenureBtnTextActive: {
    color: '#ffffff',
  },
  emiPreviewBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  emiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e40af',
  },
  emiValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1e3a8a',
    marginTop: 2,
  },
  rateBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rateText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbbf24',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
  },
});


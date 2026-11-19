import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COMPANY_INFO } from '../../data/mockData';
import { authService } from '../../services/authService';
import { UserProfile } from '../../types';
import { colors } from '../../theme/colors';
import { SignUpScreen } from './SignUpScreen';

interface AuthScreensProps {
  onAuthSuccess: (user: UserProfile) => void;
  onSkipToDemo: () => void;
  initialReferralCode?: string;
}

export type AuthMode = 'signup' | 'login' | 'otp' | 'admin';

export const AuthScreens: React.FC<AuthScreensProps> = ({
  onAuthSuccess,
  onSkipToDemo,
  initialReferralCode = '',
}) => {
  // Start on unified WhatsApp Login
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Quick mobile validation
  const cleanMobile = mobileNumber.replace(/\D/g, '');
  const isMobileValid = cleanMobile.length === 10;
  const isAdminNumber = cleanMobile === '9545555999';

  const handleRequestOtp = async () => {
    setErrorMessage(null);
    if (!isMobileValid) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setIsLoading(true);
    try {
      await authService.requestOtp(cleanMobile);
      setOtpCode('');
      setAuthMode('otp');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await authService.verifyOtp(otpCode);
      onAuthSuccess(res.user);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Invalid OTP entered');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. RENDER SIGN UP SCREEN
  if (authMode === 'signup') {
    return (
      <SignUpScreen
        onSignUpSuccess={(registeredUser) => {
          // DO NOT directly open without login: Redirect to Customer Login page with success message
          setMobileNumber(registeredUser.mobile);
          setSuccessBanner(`Account successfully created for ${registeredUser.name}! Please login with your WhatsApp OTP to continue.`);
          setErrorMessage(null);
          setAuthMode('login');
        }}
        onNavigateToLogin={() => {
          setSuccessBanner(null);
          setAuthMode('login');
        }}
        onSkipToDemo={onSkipToDemo}
        initialReferralCode={initialReferralCode}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Brand Header */}
      <View style={styles.headerBox}>
        <Image
          source={require('../../../assets/logo/loan-point-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.brandTitle}>{COMPANY_INFO.name}</Text>
        <Text style={styles.brandSub}>
          {authMode === 'login'
            ? 'Unified Secure Login'
            : 'Verify WhatsApp OTP'}
        </Text>
        <Text style={styles.brandTagline}>
          Fast, easy & transparent loans across India
        </Text>
      </View>

      {/* 2. LOGIN SCREEN (Unified Login for Admin & Customers) */}
      {authMode === 'login' && (
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardBadge}>
              <Ionicons name="log-in" size={15} color={colors.primary} />
              <Text style={styles.cardBadgeText}>ACCOUNT LOGIN</Text>
            </View>
          </View>

          <View style={styles.channelBadge}>
            <Ionicons name="logo-whatsapp" size={15} color="#059669" />
            <Text style={styles.channelBadgeText}>WhatsApp Instant OTP</Text>
          </View>

          {/* Registration Success Banner */}
          {successBanner && (
            <View style={styles.successBannerCard}>
              <View style={styles.successBannerIconWrap}>
                <Ionicons name="checkmark-done-circle" size={22} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.successBannerTitle}>Registration Successful!</Text>
                <Text style={styles.successBannerSub}>{successBanner}</Text>
              </View>
              <TouchableOpacity onPress={() => setSuccessBanner(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={16} color="#059669" />
              </TouchableOpacity>
            </View>
          )}

          {/* Mobile Number Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Enter 10-Digit Mobile Number</Text>
            <View style={[styles.inputWrapper, isMobileValid && styles.inputWrapperActive]}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.textInput}
                keyboardType="phone-pad"
                value={mobileNumber}
                onChangeText={(text) => setMobileNumber(text.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#94a3b8"
              />
              {isMobileValid && <Ionicons name="checkmark-circle" size={18} color="#16a34a" />}
            </View>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Login / Send OTP Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, !isMobileValid && styles.primaryBtnDisabled]}
            onPress={handleRequestOtp}
            disabled={isLoading || !isMobileValid}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <View style={styles.primaryBtnIconWrap}>
                  <Ionicons name="logo-whatsapp" size={19} color="#ffffff" />
                </View>
                <Text style={styles.primaryBtnText}>Get WhatsApp OTP</Text>
                <Ionicons name="arrow-forward" size={17} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>

          {/* Prominent Register Button / Link */}
          <View style={styles.registerPromptBox}>
            <Text style={styles.registerPromptText}>Don't have an account yet?</Text>
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => setAuthMode('signup')}
              activeOpacity={0.8}
            >
              <View style={styles.registerBtnIconWrap}>
                <Ionicons name="person-add" size={16} color="#004aad" />
              </View>
              <Text style={styles.registerBtnText}>Create / Register New Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3. OTP VERIFICATION SCREEN */}
      {authMode === 'otp' && (
        <View style={styles.formCard}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setAuthMode('login')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={16} color="#64748b" />
            <Text style={styles.backBtnText}>Change Mobile Number</Text>
          </TouchableOpacity>

          <View style={styles.channelBadge}>
            <Ionicons name="logo-whatsapp" size={16} color="#059669" />
            <Text style={styles.channelBadgeText}>WhatsApp Verification</Text>
          </View>

          <Text style={styles.otpTitle}>Verify WhatsApp OTP</Text>
          <Text style={styles.otpSubtitle}>
            We've sent a verification code to WhatsApp number <Text style={{ fontWeight: '700', color: '#0f172a' }}>+91 {mobileNumber}</Text>
          </Text>

          <TextInput
            style={styles.otpInputField}
            keyboardType="numeric"
            value={otpCode}
            onChangeText={setOtpCode}
            maxLength={6}
            placeholder="Enter OTP"
            placeholderTextColor="#94a3b8"
            autoFocus
          />

          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.verifyOtpBtn, (isLoading || otpCode.length < 4) && styles.primaryBtnDisabled]}
            onPress={handleVerifyOtp}
            disabled={isLoading || otpCode.length < 4}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>
                  {isAdminNumber ? 'Verify & Open Admin Portal' : 'Verify & Open My Account'}
                </Text>
                <Ionicons name="shield-checkmark" size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={handleRequestOtp}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={14} color={colors.primary} />
            <Text style={styles.resendBtnText}>Resend WhatsApp Code</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingTop: 36,
    paddingBottom: 40,
    backgroundColor: '#f8fafc',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  brandTagline: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 0,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  channelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  successBannerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  successBannerIconWrap: {
    marginTop: 1,
  },
  successBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065f46',
  },
  successBannerSub: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  inputWrapperActive: {
    borderColor: colors.primary,
    backgroundColor: '#ffffff',
  },
  countryCodeBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },

  referralToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 12,
  },
  referralToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  referralInputBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    marginBottom: 14,
  },
  referralHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referralInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  appliedPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  appliedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  referralField: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.primary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
    flex: 1,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669', // Vibrant emerald green for WhatsApp action
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#047857',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#004aad', // Professional deep trust royal blue
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#003680',
    shadowColor: '#004aad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
    backgroundColor: '#94a3b8',
    borderColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  registerPromptBox: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    gap: 10,
  },
  registerPromptText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.8,
    borderColor: '#004aad',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 20,
    width: '100%',
    shadowColor: '#004aad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  registerBtnIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#004aad',
    letterSpacing: 0.2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  switchText: {
    fontSize: 13,
    color: '#64748b',
  },
  switchLink: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  otpSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  demoOtpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  demoOtpText: {
    fontSize: 12,
    color: '#166534',
  },
  otpInputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 12,
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center',
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 10,
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  demoBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 16,
  },
  demoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  authTabRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  authTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
  },
  authTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  authTabActiveAdmin: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  authTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  authTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  authTabTextActiveAdmin: {
    color: colors.indigoNavyDark,
    fontWeight: '800',
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginBottom: 12,
    gap: 8,
  },
  adminBannerText: {
    flex: 1,
    fontSize: 11.5,
    color: colors.primaryDeep,
    lineHeight: 16,
  },
});

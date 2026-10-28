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
  // Start on Login first by default (and after logout)
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [mobileNumber, setMobileNumber] = useState<string>('9545555999');
  const [otpCode, setOtpCode] = useState<string>('123456');
  const [adminPin, setAdminPin] = useState<string>('9545');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Quick mobile validation
  const isMobileValid = mobileNumber.replace(/\D/g, '').length === 10;

  const handleAdminLogin = () => {
    setErrorMessage(null);
    if (!adminPin.trim()) {
      setErrorMessage('Please enter Admin Security PIN');
      return;
    }

    try {
      const res = authService.loginAdmin(adminPin.trim());
      onAuthSuccess(res.user);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Invalid Admin PIN');
    }
  };

  const handleRequestOtp = async () => {
    setErrorMessage(null);
    if (!isMobileValid) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setIsLoading(true);
    try {
      await authService.requestOtp(mobileNumber);
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
          source={require('../../../assets/loan-point-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.brandTitle}>{COMPANY_INFO.name}</Text>
        <Text style={styles.brandSub}>
          {authMode === 'login'
            ? 'Customer Login'
            : authMode === 'admin'
            ? 'Admin Portal'
            : 'Verify OTP'}
        </Text>
        <Text style={styles.brandTagline}>
          Fast, easy & transparent loans in Nanded & Marathwada
        </Text>
      </View>

      {/* Mode Switcher Tabs (Customer Login vs Admin Access) */}
      {(authMode === 'login' || authMode === 'admin') && (
        <View style={styles.authTabRow}>
          <TouchableOpacity
            style={[styles.authTab, authMode === 'login' && styles.authTabActive]}
            onPress={() => {
              setErrorMessage(null);
              setAuthMode('login');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="person"
              size={15}
              color={authMode === 'login' ? '#2563eb' : '#64748b'}
            />
            <Text
              style={[
                styles.authTabText,
                authMode === 'login' && styles.authTabTextActive,
              ]}
            >
              Customer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authTab, authMode === 'admin' && styles.authTabActiveAdmin]}
            onPress={() => {
              setErrorMessage(null);
              setAuthMode('admin');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="shield-checkmark"
              size={15}
              color={authMode === 'admin' ? '#0f172a' : '#64748b'}
            />
            <Text
              style={[
                styles.authTabText,
                authMode === 'admin' && styles.authTabTextActiveAdmin,
              ]}
            >
              Admin / Staff
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. LOGIN SCREEN (NO Referral Code section here - referral is only on Registration) */}
      {authMode === 'login' && (
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardBadge}>
              <Ionicons name="log-in" size={15} color="#2563eb" />
              <Text style={styles.cardBadgeText}>CUSTOMER LOGIN</Text>
            </View>
          </View>

          <View style={styles.channelBadge}>
            <Ionicons name="logo-whatsapp" size={15} color="#059669" />
            <Text style={styles.channelBadgeText}>WhatsApp Instant OTP Login</Text>
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
            <Text style={styles.inputLabel}>Registered Mobile Number</Text>
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
                placeholder="9545555999"
                placeholderTextColor="#94a3b8"
                autoFocus
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
                <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
                <Text style={styles.primaryBtnText}>Send WhatsApp Login OTP</Text>
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
              <Ionicons name="person-add-outline" size={16} color="#2563eb" />
              <Text style={styles.registerBtnText}>Register New Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2B. ADMIN LOGIN SCREEN */}
      {authMode === 'admin' && (
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardBadge, { backgroundColor: '#f1f5f9' }]}>
              <Ionicons name="shield-checkmark" size={15} color="#0f172a" />
              <Text style={[styles.cardBadgeText, { color: '#0f172a' }]}>
                BRANCH ADMIN & STAFF
              </Text>
            </View>
          </View>

          <View style={styles.adminBanner}>
            <Ionicons name="lock-closed" size={16} color="#2563eb" />
            <Text style={styles.adminBannerText}>
              Authorized Loan Point administrators only. Manage applications, sanction status & CRM pipeline.
            </Text>
          </View>

          <View style={styles.demoOtpBox}>
            <Ionicons name="key-outline" size={16} color="#059669" />
            <Text style={styles.demoOtpText}>
              Master Admin Access PIN: <Text style={{ fontWeight: '800' }}>9545</Text>
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Admin Access Security PIN</Text>
            <View style={[styles.inputWrapper, adminPin.length >= 4 && styles.inputWrapperActive]}>
              <Ionicons name="key" size={18} color="#64748b" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                secureTextEntry
                value={adminPin}
                onChangeText={setAdminPin}
                maxLength={6}
                placeholder="Enter 4-digit Admin PIN"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: '#0f172a' }]}
            onPress={handleAdminLogin}
            activeOpacity={0.85}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color="#ffffff" />
            <Text style={styles.primaryBtnText}>Access Admin Console</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={() => {
              setErrorMessage(null);
              setAuthMode('login');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={14} color="#2563eb" />
            <Text style={styles.resendBtnText}>Back to Customer Login</Text>
          </TouchableOpacity>
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

          <Text style={styles.otpTitle}>Verify 6-Digit OTP</Text>
          <Text style={styles.otpSubtitle}>
            We've sent a one-time code to WhatsApp number <Text style={{ fontWeight: '700', color: '#0f172a' }}>+91 {mobileNumber}</Text>
          </Text>

          <View style={styles.demoOtpBox}>
            <Ionicons name="information-circle" size={16} color="#059669" />
            <Text style={styles.demoOtpText}>
              Demo OTP Code: <Text style={{ fontWeight: '800' }}>123456</Text>
            </Text>
          </View>

          <TextInput
            style={styles.otpInputField}
            keyboardType="numeric"
            value={otpCode}
            onChangeText={setOtpCode}
            maxLength={6}
            placeholder="123456"
            autoFocus
          />

          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleVerifyOtp}
            disabled={isLoading || otpCode.length < 6}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Verify & Continue to Account</Text>
                <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={handleRequestOtp}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={14} color="#2563eb" />
            <Text style={styles.resendBtnText}>Resend WhatsApp Code</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Skip to Demo Customer */}
      <TouchableOpacity style={styles.demoBtn} onPress={onSkipToDemo} activeOpacity={0.7}>
        <Text style={styles.demoBtnText}>Explore App as Demo Customer (Skip)</Text>
      </TouchableOpacity>
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
    color: '#2563eb',
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
    borderRadius: 20,
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
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
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
    borderColor: '#2563eb',
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
    color: '#2563eb',
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
    color: '#2563eb',
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
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  registerPromptBox: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
    gap: 8,
  },
  registerPromptText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  registerBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563eb',
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
    color: '#2563eb',
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
    color: '#2563eb',
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
    color: '#2563eb',
    fontWeight: '700',
  },
  authTabTextActiveAdmin: {
    color: '#0f172a',
    fontWeight: '800',
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 12,
    gap: 8,
  },
  adminBannerText: {
    flex: 1,
    fontSize: 11.5,
    color: '#1e40af',
    lineHeight: 16,
  },
});

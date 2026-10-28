import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { UserProfile, NotificationPreferences } from '../../types';
import { notificationService } from '../../services/notificationService';
import { authService } from '../../services/authService';
import { cityLocationService } from '../../services/cityLocationService';
import { COMPANY_INFO } from '../../data/mockData';
import { colors } from '../../theme/colors';
import {
  validatePAN,
  validateAadhaar,
  validateMonthlyIncome,
  validateEmail,
  getEmailDomainSuggestions,
} from '../../utils/calculator';

interface ProfileScreenProps {
  user: UserProfile | null;
  onUpdateUser?: (updated: UserProfile) => void;
  currentLanguage?: 'en' | 'mr' | 'hi';
  onLanguageChange?: (lang: 'en' | 'mr' | 'hi') => void;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
  onResetDemoData: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onUpdateUser,
  onLogout,
  onNavigate,
  onResetDemoData,
}) => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(notificationService.getPreferences());
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'consent' | null>(null);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editEmail, setEditEmail] = useState<string>(user?.email || '');
  const [editCity, setEditCity] = useState<string>(user?.city || '');
  const [editEmploymentType, setEditEmploymentType] = useState<
    'Salaried' | 'Self Employed' | 'Business Owner' | 'Agriculturist' | 'Others'
  >(user?.employmentType || 'Salaried');
  const [editMonthlyIncome, setEditMonthlyIncome] = useState<string>(
    (user?.monthlyIncome || 50000).toString()
  );
  const [editPanNumber, setEditPanNumber] = useState<string>(user?.panNumber || '');
  const [editAadhaarNumber, setEditAadhaarNumber] = useState<string>(user?.aadhaarNumber || '');

  // Dropdowns & Autocomplete within Edit Modal
  const [showEmploymentDropdown, setShowEmploymentDropdown] = useState<boolean>(false);
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);
  const [isCitySelected, setIsCitySelected] = useState<boolean>(false);
  const [editSuccessMessage, setEditSuccessMessage] = useState<string | null>(null);
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Validation Checks for Edit Profile
  const isCityWrong = editCity.trim().length >= 3 && cityLocationService.isWrongCity(editCity);

  const isEmailEntered = editEmail.trim().length > 0;
  const isEmailValid = !isEmailEntered || validateEmail(editEmail);
  const emailDomainSuggestions = isEmailEntered ? getEmailDomainSuggestions(editEmail) : [];

  const incomeValidation = validateMonthlyIncome(editMonthlyIncome);
  const isIncomeValid = incomeValidation.isValid;

  const isPanEntered = editPanNumber.trim().length > 0;
  const isPanValid = !isPanEntered || validatePAN(editPanNumber);

  const isAadhaarEntered = editAadhaarNumber.replace(/[\s-]/g, '').length > 0;
  const aadhaarValidation = isAadhaarEntered ? validateAadhaar(editAadhaarNumber) : { isValid: true };
  const isAadhaarValid = aadhaarValidation.isValid;

  const openEditModal = () => {
    setEditEmail(user?.email || '');
    setEditCity(user?.city || '');
    setEditEmploymentType(user?.employmentType || 'Salaried');
    setEditMonthlyIncome((user?.monthlyIncome || 50000).toString());
    setEditPanNumber(user?.panNumber || '');
    setEditAadhaarNumber(user?.aadhaarNumber || '');
    setEditSuccessMessage(null);
    setEditErrorMessage(null);
    setShowEmploymentDropdown(false);
    setShowCityPicker(false);
    setIsCitySelected(false);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setEditErrorMessage(null);
    if (isEmailEntered && !isEmailValid) {
      setEditErrorMessage('Please enter a valid email address (e.g. name@domain.com)');
      return;
    }
    if (!isIncomeValid) {
      setEditErrorMessage(incomeValidation.error || 'Please enter a valid monthly net income');
      return;
    }
    if (isPanEntered && !isPanValid) {
      setEditErrorMessage('Please enter a valid 10-character PAN format (e.g. ABCDE1234F)');
      return;
    }
    if (isAadhaarEntered && !isAadhaarValid) {
      setEditErrorMessage(aadhaarValidation.error || 'Please enter a valid 12-digit Aadhaar number');
      return;
    }
    if (isCityWrong) {
      setEditErrorMessage(`"${editCity.trim()}" is not a recognized Indian city/district.`);
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = authService.updateProfile({
        email: editEmail.trim() || undefined,
        city: editCity.trim(),
        employmentType: editEmploymentType,
        monthlyIncome: incomeValidation.value || (user?.monthlyIncome || 50000),
        panNumber: editPanNumber.trim().toUpperCase() || undefined,
        aadhaarNumber: editAadhaarNumber.replace(/\D/g, '') || undefined,
      });

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      setEditSuccessMessage('Profile details updated successfully!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditSuccessMessage(null);
      }, 1200);
    } catch (err: unknown) {
      setEditErrorMessage(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };


  const toggleChannel = (channel: keyof NotificationPreferences['channels']) => {
    const updated = notificationService.updatePreferences({
      channels: {
        ...prefs.channels,
        [channel]: !prefs.channels[channel],
      },
    });
    setPrefs(updated);
  };

  const toggleReminder = (reminder: keyof NotificationPreferences['reminders']) => {
    const updated = notificationService.updatePreferences({
      reminders: {
        ...prefs.reminders,
        [reminder]: !prefs.reminders[reminder],
      },
    });
    setPrefs(updated);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Profile Summary Spotlight Hero Card */}
      <View style={styles.headerHeroCard}>
        <View style={styles.heroGlowCircle} />

        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CU'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.customerBadge}>
              <View style={styles.customerBadgeDot} />
              <Text style={styles.customerBadgeText}>VERIFIED BORROWER</Text>
            </View>
            <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
            <Text style={styles.userMobile}>+91 {user?.mobile || '9545555999'}</Text>
            <Text style={styles.userCity}>
              {user?.city ? `${user.city} · ` : ''}{user?.employmentType || 'Salaried'}
            </Text>
          </View>
        </View>

        {/* Edit Profile Button Pill */}
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={openEditModal}
          activeOpacity={0.8}
        >
          <View style={styles.editIconCircle}>
            <Ionicons name="create" size={14} color={colors.primary} />
          </View>
          <Text style={styles.editProfileBtnText}>Edit Profile & Income Details</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 2. Registration & Account Information Card */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Registration Information</Text>
          <TouchableOpacity onPress={openEditModal} activeOpacity={0.7}>
            <Text style={styles.changeActionLink}>Change Details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.regInfoCard}>
          {/* Full Legal Name (Locked / Read-Only) */}
          <View style={styles.regInfoRow}>
            <View style={styles.regInfoLeft}>
              <View style={[styles.fieldIconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="person" size={14} color="#0284c7" />
              </View>
              <Text style={styles.regInfoLabel}>Full Legal Name</Text>
            </View>
            <View style={styles.regInfoRight}>
              <Text style={styles.regInfoValue}>{user?.name || 'Customer'}</Text>
              <View style={styles.lockedBadge}>
                <Ionicons name="lock-closed" size={10} color="#059669" />
                <Text style={styles.lockedBadgeText}>Verified</Text>
              </View>
            </View>
          </View>

          {/* Registered Mobile Number (Locked / Read-Only) */}
          <View style={styles.regInfoRow}>
            <View style={styles.regInfoLeft}>
              <View style={[styles.fieldIconBox, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="logo-whatsapp" size={14} color="#16a34a" />
              </View>
              <Text style={styles.regInfoLabel}>WhatsApp Mobile</Text>
            </View>
            <View style={styles.regInfoRight}>
              <Text style={styles.regInfoValue}>+91 {user?.mobile || '9545555999'}</Text>
              <View style={styles.lockedBadge}>
                <Ionicons name="lock-closed" size={10} color="#059669" />
                <Text style={styles.lockedBadgeText}>Verified</Text>
              </View>
            </View>
          </View>

          {/* Email Address (Editable) */}
          <View style={styles.regInfoRow}>
            <View style={styles.regInfoLeft}>
              <View style={[styles.fieldIconBox, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="mail" size={14} color="#ee1c25" />
              </View>
              <Text style={styles.regInfoLabel}>Email Address</Text>
            </View>
            <View style={styles.regInfoRight}>
              <Text style={styles.regInfoValue}>
                {user?.email || 'Not specified'}
              </Text>
              <Ionicons name="pencil" size={12} color="#94a3b8" />
            </View>
          </View>

          {/* City & District (Editable) */}
          <View style={styles.regInfoRow}>
            <View style={styles.regInfoLeft}>
              <View style={[styles.fieldIconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="location" size={14} color="#d97706" />
              </View>
              <Text style={styles.regInfoLabel}>City / District</Text>
            </View>
            <View style={styles.regInfoRight}>
              <Text style={[styles.regInfoValue, { fontWeight: '700', color: '#0f172a' }]}>
                {user?.city || 'Not specified'}
              </Text>
              <Ionicons name="pencil" size={12} color="#94a3b8" />
            </View>
          </View>

          {/* Employment Type (Editable) */}
          <View style={styles.regInfoRow}>
            <View style={styles.regInfoLeft}>
              <View style={[styles.fieldIconBox, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="briefcase" size={14} color="#2d3091" />
              </View>
              <Text style={styles.regInfoLabel}>Employment Type</Text>
            </View>
            <View style={styles.regInfoRight}>
              <Text style={[styles.regInfoValue, { fontWeight: '700', color: '#0f172a' }]}>
                {user?.employmentType || 'Salaried'}
              </Text>
              <Ionicons name="pencil" size={12} color="#94a3b8" />
            </View>
          </View>

          {/* Monthly Income (Editable) */}
          <View style={styles.regInfoRow}>
            <View style={styles.regInfoLeft}>
              <View style={[styles.fieldIconBox, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="cash" size={14} color="#16a34a" />
              </View>
              <Text style={styles.regInfoLabel}>Monthly Net Income</Text>
            </View>
            <View style={styles.regInfoRight}>
              <Text style={[styles.regInfoValue, { fontWeight: '800', color: '#16a34a' }]}>
                ₹{(user?.monthlyIncome || 50000).toLocaleString('en-IN')}
              </Text>
              <Ionicons name="pencil" size={12} color="#94a3b8" />
            </View>
          </View>

          {/* PAN Card */}
          <View style={styles.regInfoRow}>
            <View style={styles.regInfoLeft}>
              <View style={[styles.fieldIconBox, { backgroundColor: '#e0e7ff' }]}>
                <FontAwesome5 name="id-card" size={12} color="#4f46e5" />
              </View>
              <Text style={styles.regInfoLabel}>PAN Card Number</Text>
            </View>
            <View style={styles.regInfoRight}>
              <Text style={[styles.regInfoValue, { fontWeight: '700', color: '#0f172a' }]}>
                {user?.panNumber || 'Not provided'}
              </Text>
              <Ionicons name="pencil" size={12} color="#94a3b8" />
            </View>
          </View>

          {/* Aadhaar Number (Optional) */}
          <View style={styles.regInfoRow}>
            <View style={styles.regInfoLeft}>
              <View style={[styles.fieldIconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="finger-print" size={14} color="#0284c7" />
              </View>
              <Text style={styles.regInfoLabel}>Aadhaar Number</Text>
            </View>
            <View style={styles.regInfoRight}>
              <Text style={[styles.regInfoValue, { fontWeight: '700', color: '#0f172a' }]}>
                {user?.aadhaarNumber ? `XXXX-XXXX-${user.aadhaarNumber.slice(-4)}` : 'Not provided'}
              </Text>
              <Ionicons name="pencil" size={12} color="#94a3b8" />
            </View>
          </View>

          {/* Customer ID & Referral */}
          <View style={[styles.regInfoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.regInfoLeft}>
              <View style={[styles.fieldIconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="shield-checkmark" size={14} color="#d97706" />
              </View>
              <Text style={styles.regInfoLabel}>Customer ID & Code</Text>
            </View>
            <View style={styles.regInfoRight}>
              <Text style={[styles.regInfoValue, { color: colors.primary, fontWeight: '800' }]}>
                {user?.referralCode || user?.id || 'LP-CUST-8102'}
              </Text>
            </View>
          </View>
        </View>
      </View>


      {/* 3. Account & Documents Navigation */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBox, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="apps" size={15} color={colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Account & Services</Text>
        </View>

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigate('documents')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="folder-outline" size={17} color="#0284c7" />
              </View>
              <Text style={styles.menuLabel}>My KYC Documents & Vault</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigate('offers_referral')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="gift-outline" size={17} color="#d97706" />
              </View>
              <Text style={styles.menuLabel}>Offers & Referral Rewards</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigate('support')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="help-circle-outline" size={17} color="#16a34a" />
              </View>
              <Text style={styles.menuLabel}>Help & Support Desk</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={() => onNavigate('rate_us')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="star-outline" size={17} color="#9333ea" />
              </View>
              <Text style={styles.menuLabel}>Rate Us & Feedback</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Notification Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBox, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="logo-whatsapp" size={15} color="#16a34a" />
          </View>
          <Text style={styles.sectionTitle}>WhatsApp Alerts & Reminders</Text>
        </View>

        <View style={styles.menuCard}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabelWrap}>
              <Ionicons name="notifications-outline" size={16} color="#16a34a" />
              <Text style={styles.switchLabel}>WhatsApp Loan Updates</Text>
            </View>
            <Switch
              value={prefs.channels.whatsapp}
              onValueChange={() => toggleChannel('whatsapp')}
              trackColor={{ false: colors.border, true: '#16a34a' }}
            />
          </View>

          <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
            <View style={styles.switchLabelWrap}>
              <Ionicons name="document-text-outline" size={16} color="#0284c7" />
              <Text style={styles.switchLabel}>WhatsApp Document Alerts</Text>
            </View>
            <Switch
              value={prefs.reminders.pendingDocuments}
              onValueChange={() => toggleReminder('pendingDocuments')}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>
      </View>

      {/* 5. Legal & Policies */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal & Privacy</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setActiveModal('privacy')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setActiveModal('terms')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={() => setActiveModal('consent')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>Credit Bureau Consent & Disclosures</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout & Reset Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={onResetDemoData} activeOpacity={0.7}>
          <Ionicons name="refresh-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.resetText}>Reset Demo Customer State</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>
        {COMPANY_INFO.name} · v2.4.0 · Nanded, Maharashtra
      </Text>

      {/* EDIT & CHANGE PROFILE MODAL */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.editBackdrop}>
          <View style={styles.editModalCard}>
            <View style={styles.editModalHeader}>
              <View>
                <Text style={styles.editModalTitle}>Edit Profile Information</Text>
                <Text style={styles.editModalSub}>Update your city, income, and KYC details</Text>
              </View>
              <TouchableOpacity
                style={styles.editModalCloseBtn}
                onPress={() => setIsEditModalOpen(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.editModalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
            >
              {/* Notice that Full Name and Mobile Number are verified and non-editable */}
              <View style={styles.lockedNoticeBox}>
                <Ionicons name="shield-checkmark" size={16} color="#059669" />
                <Text style={styles.lockedNoticeText}>
                  Full Name & Registered Mobile are verified at sign up and cannot be edited. All other details below can be changed.
                </Text>
              </View>

              {/* Full Name (Read-Only) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Legal Name (Fixed)</Text>
                <View style={[styles.inputBox, styles.inputBoxDisabled]}>
                  <Ionicons name="person" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                  <Text style={styles.inputDisabledText}>{user?.name || 'Customer'}</Text>
                  <Ionicons name="lock-closed" size={14} color="#94a3b8" />
                </View>
              </View>

              {/* Mobile Number (Read-Only) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Registered WhatsApp Number (Fixed)</Text>
                <View style={[styles.inputBox, styles.inputBoxDisabled]}>
                  <Ionicons name="call" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                  <Text style={styles.inputDisabledText}>+91 {user?.mobile || '9545555999'}</Text>
                  <Ionicons name="lock-closed" size={14} color="#94a3b8" />
                </View>
              </View>

              {/* Email Address (Editable + Max Limit + @ Domain Suggest) */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>Email Address</Text>
                  <Text style={styles.fieldHint}>
                    {editEmail.length > 0 ? `${editEmail.length}/70 chars` : 'Optional'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputBox,
                    isEmailEntered && isEmailValid && styles.inputBoxActive,
                    isEmailEntered && !isEmailValid && styles.inputBoxError,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={isEmailEntered && !isEmailValid ? '#dc2626' : 'colors.primary'}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={[styles.textInputField, isEmailEntered && !isEmailValid && { color: '#dc2626' }]}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="email@example.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    maxLength={70}
                  />
                  {isEmailEntered && isEmailValid && (
                    <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                  )}
                  {isEmailEntered && !isEmailValid && (
                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  )}
                </View>

                {/* Email Red Line Error */}
                {isEmailEntered && !isEmailValid && (
                  <View style={styles.cityErrorAlert}>
                    <Ionicons name="alert-circle" size={13} color="#dc2626" />
                    <Text style={styles.cityErrorAlertText}>
                      Please enter a valid email format (e.g. name@domain.com)
                    </Text>
                  </View>
                )}

                {/* @ Auto Suggestions */}
                {emailDomainSuggestions.length > 0 && !isEmailValid && (
                  <View style={styles.domainSuggestBox}>
                    <Text style={styles.domainSuggestTitle}>Suggestions:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {emailDomainSuggestions.map((sug, i) => {
                        const domainName = sug.split('@')[1];
                        return (
                          <TouchableOpacity
                            key={`profile-mail-${domainName}-${i}`}
                            style={styles.domainChip}
                            onPress={() => setEditEmail(sug)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.domainChipAt}>@</Text>
                            <Text style={styles.domainChipText}>{domainName}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>


              {/* City / District (Editable + India JSON + Autocomplete) */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>City / District</Text>
                  <Text style={styles.fieldHint}>Select or type</Text>
                </View>
                <View style={[styles.inputBox, isCityWrong && styles.inputBoxError]}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={isCityWrong ? '#dc2626' : 'colors.primary'}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={[styles.textInputField, isCityWrong && { color: '#dc2626' }]}
                    value={editCity}
                    onChangeText={(text) => {
                      setEditCity(text);
                      setIsCitySelected(false);
                    }}
                    placeholder="Type or select city"
                    placeholderTextColor="#94a3b8"
                  />
                  {editCity.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setEditCity('');
                        setIsCitySelected(false);
                      }}
                      style={{ marginRight: 6 }}
                    >
                      <Ionicons name="close-circle" size={16} color={isCityWrong ? '#dc2626' : '#94a3b8'} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.pickerTriggerBtn}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowCityPicker((p) => !p);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerTriggerBtnText}>{showCityPicker ? 'Close' : 'Select'}</Text>
                    <Ionicons name={showCityPicker ? 'chevron-up' : 'chevron-down'} size={12} color="colors.primary" />
                  </TouchableOpacity>
                </View>

                {/* City Error Warning */}
                {isCityWrong && (
                  <View style={styles.cityErrorAlert}>
                    <Ionicons name="alert-circle" size={14} color="#dc2626" />
                    <Text style={styles.cityErrorAlertText}>
                      "{editCity.trim()}" is not found in India cities list.
                    </Text>
                  </View>
                )}

                {/* City Autocomplete Suggestions */}
                {editCity.trim().length >= 3 && !showCityPicker && !isCitySelected && cityLocationService.searchSuggestions(editCity, 5).length > 0 && (
                  <View style={styles.autoSuggestCard}>
                    {cityLocationService.searchSuggestions(editCity, 5).map((item, idx) => (
                      <TouchableOpacity
                        key={`profile-city-${item.city}-${idx}`}
                        style={styles.autoSuggestItem}
                        onPress={() => {
                          setEditCity(item.city);
                          setIsCitySelected(true);
                          Keyboard.dismiss();
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="location-outline" size={14} color="colors.primary" style={{ marginRight: 6 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.autoSuggestCityName}>{item.city}</Text>
                          <Text style={styles.autoSuggestStateName}>{item.state}</Text>
                        </View>
                        <Ionicons name="arrow-forward-circle-outline" size={14} color="#94a3b8" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* All India Dropdown List */}
                {showCityPicker && (
                  <View style={styles.allCitiesCard}>
                    <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                      {cityLocationService.searchSuggestions(editCity || 'a', 30).map((item, idx) => (
                        <TouchableOpacity
                          key={`drop-${item.city}-${idx}`}
                          style={styles.cityDropdownOption}
                          onPress={() => {
                            setEditCity(item.city);
                            setShowCityPicker(false);
                            setIsCitySelected(true);
                          }}
                        >
                          <Text style={styles.cityDropdownText}>{item.city}</Text>
                          <Text style={styles.cityDropdownSub}>{item.state}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Employment Type Dropdown (Editable) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Employment Type</Text>
                <TouchableOpacity
                  style={[styles.inputBox, showEmploymentDropdown && styles.inputBoxActive]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowEmploymentDropdown((p) => !p);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={
                      editEmploymentType === 'Salaried'
                        ? 'briefcase'
                        : editEmploymentType === 'Self Employed'
                        ? 'ribbon'
                        : editEmploymentType === 'Business Owner'
                        ? 'storefront'
                        : editEmploymentType === 'Agriculturist'
                        ? 'leaf'
                        : 'apps'
                    }
                    size={16}
                    color="colors.primary"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.dropdownValueText}>{editEmploymentType}</Text>
                  <Ionicons name={showEmploymentDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="colors.primary" />
                </TouchableOpacity>

                {showEmploymentDropdown && (
                  <View style={styles.empDropdownMenu}>
                    {(['Salaried', 'Self Employed', 'Business Owner', 'Agriculturist', 'Others'] as const).map((type) => {
                      const isSelected = editEmploymentType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[styles.empOptionRow, isSelected && styles.empOptionRowActive]}
                          onPress={() => {
                            setEditEmploymentType(type);
                            setShowEmploymentDropdown(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.empOptionText, isSelected && styles.empOptionTextActive]}>
                            {type}
                          </Text>
                          {isSelected && <Ionicons name="checkmark-circle" size={16} color="colors.primary" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Monthly Income (Editable) */}
              {/* Monthly Income (Editable + Red Line Validation) */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>Monthly Net Income (₹)</Text>
                  <Text style={styles.fieldHint}>Required (Min ₹10K)</Text>
                </View>
                <View
                  style={[
                    styles.inputBox,
                    isIncomeValid && styles.inputBoxActive,
                    !isIncomeValid && styles.inputBoxError,
                  ]}
                >
                  <Text style={[styles.currencyPrefix, !isIncomeValid && { color: '#dc2626' }]}>₹</Text>
                  <TextInput
                    style={[styles.textInputField, !isIncomeValid && { color: '#dc2626' }]}
                    value={editMonthlyIncome}
                    onChangeText={setEditMonthlyIncome}
                    keyboardType="numeric"
                    placeholder="50000"
                    placeholderTextColor="#94a3b8"
                  />
                  {isIncomeValid && <Ionicons name="checkmark-circle" size={16} color="#16a34a" />}
                  {!isIncomeValid && <Ionicons name="alert-circle" size={16} color="#dc2626" />}
                </View>
                {!isIncomeValid && (
                  <View style={styles.cityErrorAlert}>
                    <Ionicons name="alert-circle" size={13} color="#dc2626" />
                    <Text style={styles.cityErrorAlertText}>
                      {incomeValidation.error || 'Please enter valid monthly income (min ₹10,000)'}
                    </Text>
                  </View>
                )}
              </View>

              {/* PAN Number (Editable + Format Validation) */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>PAN Number</Text>
                  <Text style={styles.fieldHint}>Optional (10 chars)</Text>
                </View>
                <View
                  style={[
                    styles.inputBox,
                    isPanEntered && isPanValid && styles.inputBoxActive,
                    isPanEntered && !isPanValid && styles.inputBoxError,
                  ]}
                >
                  <Ionicons
                    name="card-outline"
                    size={16}
                    color={isPanEntered && !isPanValid ? '#dc2626' : 'colors.primary'}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={[
                      styles.textInputField,
                      { textTransform: 'uppercase', fontWeight: '700', letterSpacing: 1 },
                      isPanEntered && !isPanValid && { color: '#dc2626' },
                    ]}
                    value={editPanNumber}
                    onChangeText={(t) => setEditPanNumber(t.toUpperCase())}
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                  />
                  {isPanEntered && isPanValid && <Ionicons name="checkmark-circle" size={16} color="#16a34a" />}
                  {isPanEntered && !isPanValid && <Ionicons name="alert-circle" size={16} color="#dc2626" />}
                </View>
                {isPanEntered && !isPanValid && (
                  <View style={styles.cityErrorAlert}>
                    <Ionicons name="alert-circle" size={13} color="#dc2626" />
                    <Text style={styles.cityErrorAlertText}>
                      Invalid PAN card format. Must be 5 uppercase letters, 4 numbers, 1 letter.
                    </Text>
                  </View>
                )}
              </View>

              {/* Aadhaar Number (Editable + 12-digit Validation) */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>Aadhaar Card Number</Text>
                  <Text style={styles.fieldHint}>
                    {editAadhaarNumber.length > 0 ? `${editAadhaarNumber.replace(/[\s-]/g, '').length}/12 Digits` : 'Optional'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputBox,
                    isAadhaarEntered && isAadhaarValid && styles.inputBoxActive,
                    isAadhaarEntered && !isAadhaarValid && styles.inputBoxError,
                  ]}
                >
                  <Ionicons
                    name="finger-print-outline"
                    size={16}
                    color={isAadhaarEntered && !isAadhaarValid ? '#dc2626' : 'colors.primary'}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={[
                      styles.textInputField,
                      { fontWeight: '700', letterSpacing: 1 },
                      isAadhaarEntered && !isAadhaarValid && { color: '#dc2626' },
                    ]}
                    value={editAadhaarNumber}
                    onChangeText={(t) => setEditAadhaarNumber(t.replace(/\D/g, '').slice(0, 12))}
                    maxLength={12}
                    keyboardType="numeric"
                    placeholder="5489 1234 5678"
                    placeholderTextColor="#94a3b8"
                  />
                  {isAadhaarEntered && isAadhaarValid && <Ionicons name="checkmark-circle" size={16} color="#16a34a" />}
                  {isAadhaarEntered && !isAadhaarValid && <Ionicons name="alert-circle" size={16} color="#dc2626" />}
                </View>
                {isAadhaarEntered && !isAadhaarValid && (
                  <View style={styles.cityErrorAlert}>
                    <Ionicons name="alert-circle" size={13} color="#dc2626" />
                    <Text style={styles.cityErrorAlertText}>
                      {aadhaarValidation.error || 'Aadhaar must be exactly 12 numeric digits'}
                    </Text>
                  </View>
                )}
              </View>


              {/* Error / Success Messages */}
              {editErrorMessage && (
                <View style={styles.editErrorAlert}>
                  <Ionicons name="alert-circle" size={15} color="#dc2626" />
                  <Text style={styles.editErrorText}>{editErrorMessage}</Text>
                </View>
              )}

              {editSuccessMessage && (
                <View style={styles.editSuccessAlert}>
                  <Ionicons name="checkmark-circle" size={15} color="#059669" />
                  <Text style={styles.editSuccessText}>{editSuccessMessage}</Text>
                </View>
              )}

              {/* Save Changes Button */}
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={18} color="#ffffff" />
                    <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Info Modals */}
      <Modal visible={!!activeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {activeModal === 'privacy' && 'Privacy Policy'}
              {activeModal === 'terms' && 'Terms of Service'}
              {activeModal === 'consent' && 'Credit Bureau Consent'}
            </Text>
            <Text style={styles.modalBody}>
              {activeModal === 'privacy' &&
                'Loan Point values your privacy. Your personal and financial information is used solely to evaluate loan options, verify eligibility, and submit applications to RBI-approved lending partners.'}
              {activeModal === 'terms' &&
                'By using Loan Point Mobile, you agree to our terms of service. Loan approvals and interest rates are determined by partnering banks and NBFCs based on underwriting criteria.'}
              {activeModal === 'consent' &&
                'You consent to Loan Point retrieving your credit score and report from authorized credit rating agencies (CIBIL, Experian, Equifax, CRIF High Mark) to calculate loan eligibility.'}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActiveModal(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  /* 1. Profile Summary Spotlight Hero Card */
  headerHeroCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.cardNavyFrom,
    borderRadius: 18,
    padding: 20,
    shadowColor: colors.cardNavyFrom,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  heroGlowCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 142, 204, 0.2)',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  userInfo: {
    flex: 1,
  },
  customerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  customerBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#38bdf8',
  },
  customerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#bae6fd',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.2,
  },
  userMobile: {
    fontSize: 13,
    color: '#e0f2fe',
    marginTop: 2,
    fontWeight: '600',
  },
  userCity: {
    fontSize: 12,
    color: '#93c5fd',
    marginTop: 2,
    fontWeight: '700',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  editIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.white,
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDeep,
    letterSpacing: -0.2,
  },
  changeActionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  regInfoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  regInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  regInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regInfoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  regInfoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  regInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065f46',
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  menuText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  switchLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  actionSection: {
    marginTop: 8,
    gap: 10,
  },
  adminAccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adminAccessText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    paddingVertical: 13,
    gap: 8,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginTop: 4,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  versionText: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalCloseBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },

  // EDIT MODAL STYLES
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  editModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 14,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  editModalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  editModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editModalScroll: {
    marginBottom: 10,
  },
  lockedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  lockedNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#15803d',
    lineHeight: 15,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  fieldHint: {
    fontSize: 11,
    color: '#94a3b8',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  inputBoxDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  inputDisabledText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  inputBoxActive: {
    borderColor: 'colors.primary',
  },
  inputBoxError: {
    borderColor: '#ef4444',
    backgroundColor: '#fff5f5',
  },
  textInputField: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },

  currencyPrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
    marginRight: 6,
  },
  pickerTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'colors.primaryLight',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'colors.primaryBorder',
  },
  pickerTriggerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'colors.primary',
  },
  cityErrorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  cityErrorAlertText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
  },
  autoSuggestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'colors.primaryBorder',
    marginTop: 4,
    overflow: 'hidden',
    elevation: 2,
  },
  autoSuggestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  autoSuggestCityName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  autoSuggestStateName: {
    fontSize: 10,
    color: '#64748b',
  },
  allCitiesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 4,
    overflow: 'hidden',
  },
  cityDropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cityDropdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  cityDropdownSub: {
    fontSize: 10,
    color: '#64748b',
  },
  dropdownValueText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  empDropdownMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'colors.primaryBorder',
    marginTop: 6,
    overflow: 'hidden',
    elevation: 3,
  },
  empOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  empOptionRowActive: {
    backgroundColor: 'colors.primaryLight',
  },
  empOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  empOptionTextActive: {
    color: 'colors.primaryDark',
    fontWeight: '800',
  },
  editErrorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  editErrorText: {
    flex: 1,
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  editSuccessAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  editSuccessText: {
    flex: 1,
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'colors.primary',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
    marginBottom: 20,
    shadowColor: 'colors.primary',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  domainSuggestBox: {
    marginTop: 6,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  domainSuggestTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  domainChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'colors.primaryLight',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'colors.primaryBorder',
  },
  domainChipAt: {
    fontSize: 12,
    fontWeight: '800',
    color: 'colors.primary',
    marginRight: 2,
  },
  domainChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'colors.primaryDark',
  },
});


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
import { Ionicons } from '@expo/vector-icons';
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
      {/* 1. Profile Summary Card */}
      <View style={styles.card}>
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CU'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
            <Text style={styles.userMobile}>+91 {user?.mobile || '9545555999'}</Text>
            <Text style={styles.userCity}>
              {user?.city ? `${user.city} · ` : ''}{user?.employmentType || 'Salaried'}
            </Text>
          </View>
        </View>

        {/* Edit and Change Profile Button */}
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={openEditModal}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={17} color="#2563eb" />
          <Text style={styles.editProfileBtnText}>Edit Profile Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#2563eb" />
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
              <Ionicons name="person" size={16} color="#64748b" />
              <Text style={styles.regInfoLabel}>Full Legal Name</Text>
            </View>
            <View style={styles.regInfoRight}>
              <Text style={styles.regInfoValue}>{user?.name || 'Customer'}</Text>
              <View style={styles.lockedBadge}>
                <Ionicons name="lock-closed" size={10} color="#64748b" />
                <Text style={styles.lockedBadgeText}>Verified</Text>
              </View>
            </View>
          </View>

          {/* Registered Mobile Number (Locked / Read-Only) */}
          <View style={styles.regInfoRow}>
            <View style={styles.regInfoLeft}>
              <Ionicons name="call" size={16} color="#64748b" />
              <Text style={styles.regInfoLabel}>WhatsApp Mobile</Text>
            </View>
            <View style={styles.regInfoRight}>
              <Text style={styles.regInfoValue}>+91 {user?.mobile || '9545555999'}</Text>
              <View style={styles.lockedBadge}>
                <Ionicons name="lock-closed" size={10} color="#64748b" />
                <Text style={styles.lockedBadgeText}>Verified</Text>
              </View>
            </View>
          </View>

          {/* Email Address (Editable) */}
          <View style={styles.regInfoRow}>
            <View style={styles.regInfoLeft}>
              <Ionicons name="mail" size={16} color="#2563eb" />
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
              <Ionicons name="location" size={16} color="#2563eb" />
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
              <Ionicons name="briefcase" size={16} color="#2563eb" />
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
              <Ionicons name="cash" size={16} color="#16a34a" />
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
              <Ionicons name="card" size={16} color="#4f46e5" />
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
              <Ionicons name="finger-print" size={16} color="#0284c7" />
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
              <Ionicons name="shield-checkmark" size={16} color="#d97706" />
              <Text style={styles.regInfoLabel}>Customer ID & Code</Text>
            </View>
            <View style={styles.regInfoRight}>
              <Text style={[styles.regInfoValue, { color: '#2563eb', fontWeight: '800' }]}>
                {user?.referralCode || user?.id || 'LP-CUST-8102'}
              </Text>
            </View>
          </View>
        </View>
      </View>


      {/* 3. Account & Documents Navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account & Services</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigate('documents')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="folder-outline" size={18} color={colors.primary} />
              <Text style={styles.menuLabel}>My KYC Documents</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigate('offers_referral')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="gift-outline" size={18} color="#d97706" />
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
              <Ionicons name="help-circle-outline" size={18} color="#059669" />
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
              <Ionicons name="star-outline" size={18} color="#7c3aed" />
              <Text style={styles.menuLabel}>Rate Us & Feedback</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WhatsApp Alerts & Reminders</Text>
        <View style={styles.menuCard}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>WhatsApp Loan Updates</Text>
            <Switch
              value={prefs.channels.whatsapp}
              onValueChange={() => toggleChannel('whatsapp')}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>WhatsApp Document Alerts</Text>
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
                    color={isEmailEntered && !isEmailValid ? '#dc2626' : '#2563eb'}
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
                    color={isCityWrong ? '#dc2626' : '#2563eb'}
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
                    <Ionicons name={showCityPicker ? 'chevron-up' : 'chevron-down'} size={12} color="#2563eb" />
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
                        <Ionicons name="location-outline" size={14} color="#2563eb" style={{ marginRight: 6 }} />
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
                    color="#2563eb"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.dropdownValueText}>{editEmploymentType}</Text>
                  <Ionicons name={showEmploymentDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#2563eb" />
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
                          {isSelected && <Ionicons name="checkmark-circle" size={16} color="#2563eb" />}
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
                    color={isPanEntered && !isPanValid ? '#dc2626' : '#2563eb'}
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
                    color={isAadhaarEntered && !isAadhaarValid ? '#dc2626' : '#2563eb'}
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
    borderRadius: 16,
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  userMobile: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  userCity: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  changeActionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
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
    gap: 8,
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
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  menuText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  actionSection: {
    marginTop: 8,
    gap: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    paddingVertical: 13,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
  resetBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  resetText: {
    fontSize: 12,
    color: colors.textLight,
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
    borderColor: '#2563eb',
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
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  pickerTriggerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
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
    borderColor: '#93c5fd',
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
    borderColor: '#bfdbfe',
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
    backgroundColor: '#eff6ff',
  },
  empOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  empOptionTextActive: {
    color: '#1d4ed8',
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
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#2563eb',
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
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  domainChipAt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
    marginRight: 2,
  },
  domainChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
});


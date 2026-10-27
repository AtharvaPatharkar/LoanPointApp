import React, { useState, useEffect } from 'react';
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
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COMPANY_INFO } from '../../data/mockData';
import { authService } from '../../services/authService';
import { cityLocationService, CityResultItem } from '../../services/cityLocationService';
import { UserProfile } from '../../types';
import { colors } from '../../theme/colors';
import {
  validateMonthlyIncome,
  validateEmail,
  getEmailDomainSuggestions,
} from '../../utils/calculator';

interface SignUpScreenProps {
  onSignUpSuccess: (user: UserProfile) => void;
  onNavigateToLogin: () => void;
  onSkipToDemo: () => void;
  initialReferralCode?: string;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSignUpSuccess,
  onNavigateToLogin,
  onSkipToDemo,
  initialReferralCode = '',
}) => {
  // Sign Up Form State - NO default city (user types or selects)
  const [fullName, setFullName] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [employmentType, setEmploymentType] = useState<'Salaried' | 'Self Employed' | 'Business Owner' | 'Agriculturist' | 'Others'>('Salaried');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('50000');
  const [referralCode, setReferralCode] = useState<string>(initialReferralCode);
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(true);

  // All India Cities state (Loaded from GitHub JSON via .env URL)
  const [allIndiaCities, setAllIndiaCities] = useState<CityResultItem[]>(cityLocationService.getFallbackCities());
  const [isCitiesLoading, setIsCitiesLoading] = useState<boolean>(false);
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);
  const [citySearchFilter, setCitySearchFilter] = useState<string>('');
  const [isCitySelected, setIsCitySelected] = useState<boolean>(false);
  const [showEmploymentDropdown, setShowEmploymentDropdown] = useState<boolean>(false);

  // OTP Verification state after form entry
  const [isOtpStep, setIsOtpStep] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('123456');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registrationSuccessUser, setRegistrationSuccessUser] = useState<UserProfile | null>(null);

  // Load all India cities from GitHub raw JSON configured in .env
  useEffect(() => {
    let isMounted = true;
    const loadCities = async () => {
      setIsCitiesLoading(true);
      try {
        const data = await cityLocationService.fetchCitiesData();
        if (isMounted && data && data.length > 0) {
          setAllIndiaCities(data);
        }
      } catch (err) {
        console.warn('Failed loading India cities in SignUpScreen:', err);
      } finally {
        if (isMounted) setIsCitiesLoading(false);
      }
    };
    loadCities();
    return () => {
      isMounted = false;
    };
  }, []);

  // Email Validation & Suggestions
  const isEmailEntered = emailAddress.trim().length > 0;
  const isEmailValid = !isEmailEntered || validateEmail(emailAddress);
  const emailDomainSuggestions = isEmailEntered ? getEmailDomainSuggestions(emailAddress) : [];

  // Monthly Net Income Validation
  const incomeValidation = validateMonthlyIncome(monthlyIncome);
  const isIncomeValid = incomeValidation.isValid;

  // Form validity checks
  const isNameValid = fullName.trim().length >= 2;
  const isMobileValid = mobileNumber.replace(/\D/g, '').length === 10;
  // Check if user has entered an invalid city against the loaded India cities dataset
  const isCityWrong = city.trim().length >= 3 && cityLocationService.isWrongCity(city);
  const isFormValid =
    isNameValid &&
    isMobileValid &&
    isEmailValid &&
    isIncomeValid &&
    agreeToTerms &&
    !isCityWrong;

  const handleInitiateSignUp = async () => {
    setErrorMessage(null);

    if (!isNameValid) {
      setErrorMessage('Please enter your full legal name');
      return;
    }
    if (!isMobileValid) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    if (isEmailEntered && !isEmailValid) {
      setErrorMessage('Please enter a valid email address (e.g. name@domain.com)');
      return;
    }
    if (!isIncomeValid) {
      setErrorMessage(incomeValidation.error || 'Please enter a valid monthly net income');
      return;
    }
    if (isCityWrong) {
      setErrorMessage(`"${city.trim()}" is not a recognized Indian city/district. Please choose a valid city.`);
      return;
    }
    if (!agreeToTerms) {
      setErrorMessage('Please agree to terms and privacy policy');
      return;
    }

    setIsLoading(true);
    try {
      // Send verification OTP
      await authService.requestOtp(mobileNumber, referralCode);
      setIsOtpStep(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndCompleteSignUp = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Verify OTP and complete user registration in records
      await authService.verifyOtp(otpCode, referralCode);
      const reg = await authService.registerUser({
        name: fullName.trim(),
        mobile: mobileNumber.replace(/\D/g, '').slice(-10),
        email: emailAddress.trim() || undefined,
        city: city.trim() || undefined,
        employmentType,
        monthlyIncome: incomeValidation.value || 50000,
        referralCode: referralCode.trim() || undefined,
      });

      // Show immediate celebration / successful registration card
      setRegistrationSuccessUser(reg.user);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter India cities by query
  const query = (citySearchFilter || city || '').toLowerCase().trim();
  const filteredIndiaCities = query.length === 0
    ? allIndiaCities.slice(0, 100)
    : allIndiaCities.filter((c) =>
        c.city.toLowerCase().includes(query) || c.state.toLowerCase().includes(query)
      ).slice(0, 80);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
    >
      {/* Brand Header */}
      <View style={styles.headerBox}>
        <Image
          source={require('../../../assets/loan-point-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.brandTitle}>{COMPANY_INFO.name}</Text>
        <Text style={styles.brandSub}>Create Your Account</Text>
        <Text style={styles.brandTagline}>Instant access to personal, business & home loan solutions</Text>
      </View>

      {/* 3 CASES: Success Screen -> OTP Step -> Registration Form */}
      {registrationSuccessUser ? (
        /* REGISTRATION SUCCESSFUL VIEW - OPEN LOGIN PAGE INSTEAD OF DIRECT ENTRY */
        <View style={styles.formCard}>
          <View style={styles.successCelebrationHeader}>
            <View style={styles.successIconOuter}>
              <Ionicons name="checkmark-done-circle" size={48} color="#059669" />
            </View>
            <Text style={styles.successCardHeading}>Account Created Successfully!</Text>
            <Text style={styles.successCardSub}>
              Welcome to Loan Point, <Text style={{ fontWeight: '800', color: '#0f172a' }}>{registrationSuccessUser.name}</Text>!
            </Text>
          </View>

          {/* Details Confirmation Card */}
          <View style={styles.successDetailCard}>
            <View style={styles.successDetailRow}>
              <Text style={styles.successDetailLabel}>Registered Mobile</Text>
              <Text style={styles.successDetailValue}>+91 {registrationSuccessUser.mobile}</Text>
            </View>
            <View style={styles.successDetailRow}>
              <Text style={styles.successDetailLabel}>City / District</Text>
              <Text style={styles.successDetailValue}>{registrationSuccessUser.city || 'India'}</Text>
            </View>
            <View style={styles.successDetailRow}>
              <Text style={styles.successDetailLabel}>Employment Type</Text>
              <Text style={styles.successDetailValue}>{registrationSuccessUser.employmentType}</Text>
            </View>
            <View style={styles.successDetailRow}>
              <Text style={styles.successDetailLabel}>Customer ID</Text>
              <Text style={[styles.successDetailValue, { color: '#2563eb', fontWeight: '800' }]}>
                {registrationSuccessUser.id}
              </Text>
            </View>
          </View>

          <View style={styles.noticeAlertBox}>
            <Ionicons name="lock-closed" size={16} color="#0284c7" />
            <Text style={styles.noticeAlertText}>
              For your account security, please login using your registered mobile number to access your account.
            </Text>
          </View>

          {/* Go to Login Page Button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => onSignUpSuccess(registrationSuccessUser)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Proceed to Customer Login</Text>
            <Ionicons name="log-in-outline" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      ) : !isOtpStep ? (
        /* Sign Up Form Card */
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardBadge}>
              <Ionicons name="person-add" size={15} color="#2563eb" />
              <Text style={styles.cardBadgeText}>NEW CUSTOMER REGISTRATION</Text>
            </View>
          </View>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <Text style={styles.requiredTag}>Required</Text>
            </View>
            <View style={[styles.inputWrapper, isNameValid && styles.inputWrapperActive]}>
              <Ionicons name="person-outline" size={18} color={isNameValid ? '#2563eb' : '#94a3b8'} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Rahul V. Sharma"
                placeholderTextColor="#94a3b8"
                value={fullName}
                onChangeText={setFullName}
              />
              {isNameValid && <Ionicons name="checkmark-circle" size={18} color="#16a34a" />}
            </View>
          </View>

          {/* Mobile Number */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>WhatsApp / Mobile Number</Text>
              <Text style={styles.requiredTag}>Required</Text>
            </View>
            <View style={[styles.inputWrapper, isMobileValid && styles.inputWrapperActive]}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="9545555999"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobileNumber}
                onChangeText={(text) => setMobileNumber(text.replace(/\D/g, '').slice(0, 10))}
              />
              {isMobileValid && <Ionicons name="checkmark-circle" size={18} color="#16a34a" />}
            </View>
          </View>

          {/* Email Address (Optional) with Max Limit & @ Auto Suggest */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <Text style={styles.optionalTag}>
                {emailAddress.length > 0 ? `${emailAddress.length}/70 chars` : 'Optional'}
              </Text>
            </View>
            <View
              style={[
                styles.inputWrapper,
                isEmailEntered && isEmailValid && styles.inputWrapperActive,
                isEmailEntered && !isEmailValid && styles.inputWrapperError,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={isEmailEntered && !isEmailValid ? '#dc2626' : isEmailValid && isEmailEntered ? '#2563eb' : '#94a3b8'}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.textInput, isEmailEntered && !isEmailValid && { color: '#dc2626' }]}
                placeholder="rahul.sharma@example.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                maxLength={70}
                value={emailAddress}
                onChangeText={setEmailAddress}
              />
              {isEmailEntered && isEmailValid && (
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              )}
              {isEmailEntered && !isEmailValid && (
                <Ionicons name="alert-circle" size={18} color="#dc2626" />
              )}
            </View>

            {/* Email Red Line Error Message */}
            {isEmailEntered && !isEmailValid && (
              <View style={styles.cityErrorAlert}>
                <Ionicons name="alert-circle" size={15} color="#dc2626" />
                <Text style={styles.cityErrorAlertText}>
                  Please enter a valid email address format (e.g. name@domain.com)
                </Text>
              </View>
            )}

            {/* Auto Suggestions when user types @ */}
            {emailDomainSuggestions.length > 0 && !isEmailValid && (
              <View style={styles.domainSuggestContainer}>
                <Text style={styles.domainSuggestHeader}>Suggested Domains:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.domainChipScroll}>
                  {emailDomainSuggestions.map((suggested, idx) => {
                    const domainOnly = suggested.split('@')[1];
                    return (
                      <TouchableOpacity
                        key={`sug-domain-${domainOnly}-${idx}`}
                        style={styles.domainChip}
                        onPress={() => setEmailAddress(suggested)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.domainChipAt}>@</Text>
                        <Text style={styles.domainChipText}>{domainOnly}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* City / District (No Default Nanded; Uses EXPO_PUBLIC_INDIA_STATES_DISTRICTS_URL) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>City / District</Text>
              <Text style={styles.optionalTag}>Select or type</Text>
            </View>
            {/* City Input Wrapper */}
            <View
              style={[
                styles.inputWrapper,
                city.length > 0 && !isCityWrong && styles.inputWrapperActive,
                isCityWrong && styles.inputWrapperError,
              ]}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color={isCityWrong ? '#dc2626' : city.length > 0 ? '#2563eb' : '#94a3b8'}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.textInput, isCityWrong && { color: '#dc2626' }]}
                placeholder="Type or select your city"
                placeholderTextColor="#94a3b8"
                value={city}
                onChangeText={(text) => {
                  setCity(text);
                  setCitySearchFilter(text);
                  setIsCitySelected(false);
                }}
              />
              {/* Clear button if text entered */}
              {city.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setCity('');
                    setCitySearchFilter('');
                    setIsCitySelected(false);
                  }}
                  style={{ marginRight: 6 }}
                >
                  <Ionicons name="close-circle" size={16} color={isCityWrong ? '#dc2626' : '#94a3b8'} />
                </TouchableOpacity>
              )}
              {/* Select City Button to open all India districts */}
              <TouchableOpacity
                style={[styles.selectCityBtn, isCityWrong && styles.selectCityBtnError]}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowCityPicker((prev) => !prev);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.selectCityBtnText, isCityWrong && { color: '#dc2626' }]}>
                  {showCityPicker ? 'Close' : 'Select City'}
                </Text>
                <Ionicons
                  name={showCityPicker ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={isCityWrong ? '#dc2626' : '#2563eb'}
                />
              </TouchableOpacity>
            </View>

            {/* RED ERROR MESSAGE IF WRONG CITY ENTERED */}
            {isCityWrong && (
              <View style={styles.cityErrorAlert}>
                <Ionicons name="alert-circle" size={15} color="#dc2626" />
                <Text style={styles.cityErrorAlertText}>
                  "{city.trim()}" is not found in India cities/districts list. Please check spelling or select from list.
                </Text>
              </View>
            )}

            {/* LIVE AUTOCOMPLETE SUGGESTIONS (Triggered when user enters 3 or more characters and has not yet selected) */}
            {city.trim().length >= 3 && !showCityPicker && !isCitySelected && cityLocationService.searchSuggestions(city, 6).length > 0 && (
              <View style={styles.autoSuggestCard}>
                {cityLocationService.searchSuggestions(city, 6).map((item, idx) => (
                  <TouchableOpacity
                    key={`sug-${item.city}-${item.stateCode}-${idx}`}
                    style={styles.autoSuggestItem}
                    onPress={() => {
                      setCity(item.city);
                      setCitySearchFilter(item.city);
                      setIsCitySelected(true);
                      Keyboard.dismiss();
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location-outline" size={15} color="#2563eb" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.autoSuggestCityName}>
                        {item.city}
                      </Text>
                      <Text style={styles.autoSuggestStateName}>
                        {item.state}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward-circle-outline" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* City Dropdown List loaded from GitHub JSON in .env */}
            {showCityPicker && (
              <View style={styles.cityDropdownCard}>
                <View style={styles.cityDropdownHeader}>
                  <Ionicons name="map-outline" size={14} color="#64748b" />
                  <Text style={styles.cityDropdownTitle}>
                    All India Cities & Districts ({allIndiaCities.length})
                  </Text>
                  {isCitiesLoading && <ActivityIndicator size="small" color="#2563eb" />}
                </View>

                {/* Quick Search */}
                <View style={styles.pickerSearchRow}>
                  <Ionicons name="search" size={14} color="#94a3b8" />
                  <TextInput
                    style={styles.pickerSearchInput}
                    value={citySearchFilter}
                    onChangeText={setCitySearchFilter}
                    placeholder="Search city, district, or state..."
                    placeholderTextColor="#94a3b8"
                  />
                  {citySearchFilter.length > 0 && (
                    <TouchableOpacity onPress={() => setCitySearchFilter('')}>
                      <Ionicons name="close-circle" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView
                  style={styles.cityDropdownScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  {filteredIndiaCities.length > 0 ? (
                    filteredIndiaCities.map((item, index) => {
                      const isPicked = city.toLowerCase() === item.city.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={`${item.city}-${item.stateCode}-${index}`}
                          style={[styles.cityOptionRow, isPicked && styles.cityOptionRowActive]}
                          onPress={() => {
                            setCity(item.city);
                            setShowCityPicker(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.cityOptionTextWrap}>
                            <Text style={[styles.cityOptionText, isPicked && styles.cityOptionTextActive]}>
                              {item.city}
                            </Text>
                            <Text style={styles.cityOptionState}>{item.state}</Text>
                          </View>
                          {isPicked && (
                            <Ionicons name="checkmark-circle" size={16} color="#2563eb" />
                          )}
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.noCityFound}>
                      <Text style={styles.noCityFoundText}>No matching Indian city or district found</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Employment Type Dropdown */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Employment Type</Text>
              <Text style={styles.requiredTag}>Select Option</Text>
            </View>

            {/* Dropdown Selector Header Button */}
            <TouchableOpacity
              style={[styles.dropdownSelectBox, showEmploymentDropdown && styles.dropdownSelectBoxActive]}
              onPress={() => {
                Keyboard.dismiss();
                setShowEmploymentDropdown((prev) => !prev);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownLeftWrap}>
                <Ionicons
                  name={
                    employmentType === 'Salaried'
                      ? 'briefcase-outline'
                      : employmentType === 'Self Employed'
                      ? 'ribbon-outline'
                      : employmentType === 'Business Owner'
                      ? 'storefront-outline'
                      : 'leaf-outline'
                  }
                  size={18}
                  color="#2563eb"
                  style={styles.inputIcon}
                />
                <Text style={styles.dropdownSelectedText}>{employmentType}</Text>
              </View>
              <Ionicons
                name={showEmploymentDropdown ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#2563eb"
              />
            </TouchableOpacity>

            {/* Dropdown Options Menu */}
            {showEmploymentDropdown && (
              <View style={styles.dropdownMenuCard}>
                {[
                  {
                    type: 'Salaried' as const,
                    desc: 'Govt, Corporate, IT or Pvt Ltd company employee',
                    icon: 'briefcase-outline',
                  },
                  {
                    type: 'Self Employed' as const,
                    desc: 'Doctor, Chartered Accountant, Lawyer, Consultant',
                    icon: 'ribbon-outline',
                  },
                  {
                    type: 'Business Owner' as const,
                    desc: 'Proprietor, Trader, Manufacturer, Retail merchant',
                    icon: 'storefront-outline',
                  },
                  {
                    type: 'Agriculturist' as const,
                    desc: 'Farmer, Landowner, Dairy or agri-business',
                    icon: 'leaf-outline',
                  },
                  {
                    type: 'Others' as const,
                    desc: 'Freelancer, Retired, Homemaker, or other source of income',
                    icon: 'apps-outline',
                  },
                ].map((item) => {
                  const isSelected = employmentType === item.type;
                  return (
                    <TouchableOpacity
                      key={item.type}
                      style={[styles.dropdownOptionItem, isSelected && styles.dropdownOptionItemActive]}
                      onPress={() => {
                        setEmploymentType(item.type);
                        setShowEmploymentDropdown(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={isSelected ? '#2563eb' : '#64748b'}
                        style={{ marginRight: 10 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dropdownOptionTitle, isSelected && styles.dropdownOptionTitleActive]}>
                          {item.type}
                        </Text>
                        <Text style={styles.dropdownOptionDesc}>{item.desc}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color="#2563eb" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Monthly Net Income (₹) with Red Line Error Validation */}
          <View style={styles.inputGroup}>

            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Monthly Net Income (₹)</Text>
              <Text style={styles.requiredTag}>Required</Text>
            </View>
            <View
              style={[
                styles.inputWrapper,
                isIncomeValid && styles.inputWrapperActive,
                !isIncomeValid && styles.inputWrapperError,
              ]}
            >
              <Text
                style={[
                  styles.currencySymbolText,
                  !isIncomeValid && { color: '#dc2626' },
                ]}
              >
                ₹
              </Text>
              <TextInput
                style={[styles.textInput, !isIncomeValid && { color: '#dc2626' }]}
                placeholder="50000"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
              />
              {isIncomeValid && (
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              )}
              {!isIncomeValid && (
                <Ionicons name="alert-circle" size={18} color="#dc2626" />
              )}
            </View>

            {/* Red Line Error Alert for Monthly Income */}
            {!isIncomeValid && (
              <View style={styles.cityErrorAlert}>
                <Ionicons name="alert-circle" size={15} color="#dc2626" />
                <Text style={styles.cityErrorAlertText}>
                  {incomeValidation.error || 'Please enter a valid monthly income (min ₹10,000)'}
                </Text>
              </View>
            )}
          </View>

          {/* Referral Code */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Referral Code</Text>
              <Text style={styles.optionalTag}>Optional (Get ₹500 reward)</Text>
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="gift-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { fontWeight: '700', letterSpacing: 1 }]}
                placeholder="e.g. ARVIND5999"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                value={referralCode}
                onChangeText={(t) => setReferralCode(t.toUpperCase())}
              />
              {referralCode.length >= 4 && (
                <View style={styles.appliedPill}>
                  <Text style={styles.appliedPillText}>APPLIED</Text>
                </View>
              )}
            </View>
          </View>

          {/* Terms & Conditions Checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreeToTerms && styles.checkboxActive]}>
              {agreeToTerms && <Ionicons name="checkmark" size={14} color={colors.white} />}
            </View>
            <Text style={styles.termsText}>
              I agree to Loan Point's <Text style={styles.termsLink}>Terms of Service</Text> and consent to receive WhatsApp updates & verification OTPs.
            </Text>
          </TouchableOpacity>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Submit Sign Up Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, !isFormValid && styles.primaryBtnDisabled]}
            onPress={handleInitiateSignUp}
            disabled={isLoading || !isFormValid}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Continue & Verify WhatsApp OTP</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
              </>
            )}
          </TouchableOpacity>

          {/* Switch to Login */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
              <Text style={styles.switchLink}>Login here</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* OTP Verification Step */
        <View style={styles.formCard}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setIsOtpStep(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={16} color="#64748b" />
            <Text style={styles.backBtnText}>Edit Details</Text>
          </TouchableOpacity>

          <View style={styles.channelBadge}>
            <Ionicons name="logo-whatsapp" size={16} color="#059669" />
            <Text style={styles.channelBadgeText}>WhatsApp Verification</Text>
          </View>

          <Text style={styles.otpTitle}>Enter 6-Digit Code</Text>
          <Text style={styles.otpSubtitle}>
            We've sent a verification code to WhatsApp number <Text style={{ fontWeight: '700', color: '#0f172a' }}>+91 {mobileNumber}</Text>
          </Text>

          <View style={styles.demoOtpBox}>
            <Ionicons name="information-circle" size={16} color="#059669" />
            <Text style={styles.demoOtpText}>
              Demo OTP: <Text style={{ fontWeight: '800' }}>123456</Text>
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
            onPress={handleVerifyAndCompleteSignUp}
            disabled={isLoading || otpCode.length < 6}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Verify & Create Account</Text>
                <Ionicons name="checkmark-circle" size={18} color={colors.white} />
              </>
            )}
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
  successCelebrationHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#a7f3d0',
  },
  successCardHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#065f46',
    textAlign: 'center',
  },
  successCardSub: {
    fontSize: 13,
    color: '#047857',
    textAlign: 'center',
    marginTop: 4,
  },
  successDetailCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 14,
    gap: 8,
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successDetailLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  successDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  noticeAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  noticeAlertText: {
    flex: 1,
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 16,
    fontWeight: '500',
  },
  cardHeader: {
    marginBottom: 16,
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
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  requiredTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  optionalTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
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
  inputIcon: {
    marginRight: 8,
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

  inputWrapperError: {
    borderColor: '#ef4444',
    backgroundColor: '#fff5f5',
  },
  selectCityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  selectCityBtnError: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  selectCityBtnText: {
    fontSize: 12,
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
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 6,
  },
  cityErrorAlertText: {
    flex: 1,
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
    lineHeight: 16,
  },
  autoSuggestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  autoSuggestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  autoSuggestHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  autoSuggestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  autoSuggestCityName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  autoSuggestStateName: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  noSuggestBox: {
    padding: 12,
    alignItems: 'center',
  },
  noSuggestText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  cityDropdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cityDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cityDropdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  pickerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    margin: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    padding: 0,
  },
  cityDropdownScroll: {
    maxHeight: 180,
  },
  cityOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cityOptionRowActive: {
    backgroundColor: '#eff6ff',
  },
  cityOptionTextWrap: {
    flex: 1,
  },
  cityOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  cityOptionTextActive: {
    color: '#1d4ed8',
    fontWeight: '800',
  },
  cityOptionState: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  noCityFound: {
    padding: 16,
    alignItems: 'center',
  },
  noCityFoundText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  dropdownSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownSelectBoxActive: {
    borderColor: '#2563eb',
    backgroundColor: '#f8faff',
  },
  dropdownLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownSelectedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 8,
  },
  dropdownMenuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownOptionItemActive: {
    backgroundColor: '#eff6ff',
  },
  dropdownOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  dropdownOptionTitleActive: {
    color: '#1d4ed8',
  },
  dropdownOptionDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  termsLink: {
    color: '#2563eb',
    fontWeight: '700',
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
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  channelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
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
  currencySymbolText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563eb',
    marginRight: 8,
  },
  domainSuggestContainer: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  domainSuggestHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  domainChipScroll: {
    flexDirection: 'row',
    gap: 6,
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


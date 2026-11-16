import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { UserProfile, LoanApplication } from '../../types';
import { loanService } from '../../services/loanService';
import { cityLocationService, CityResultItem } from '../../services/cityLocationService';
import { BankLogo } from '../common/BankLogo';
import { COMPANY_INFO } from '../../data/mockData';
import { LoanIcon } from '../common/LoanIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MortgageLoanApplyScreenProps {
  user: UserProfile | null;
  onSuccess: (newApp: LoanApplication) => void;
  onCancel: () => void;
}

interface UploadedDocState {
  panCard: boolean;
  aadhaarCard: boolean;
  propertyTitleDeed: boolean;
  sanctionPlanTaxReceipt: boolean;
  incomeProofItrSlips: boolean;
  bankStatements: boolean;
  photograph: boolean;
}

export const MortgageLoanApplyScreen: React.FC<MortgageLoanApplyScreenProps> = ({
  user,
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // ---------------- STEP 1: Basic Details ----------------
  const [fullName, setFullName] = useState<string>(user?.name || '');
  const [mobileNumber, setMobileNumber] = useState<string>(user?.mobile || '');
  const [emailId, setEmailId] = useState<string>(user?.email || '');
  const [dob, setDob] = useState<string>('18/09/1984');
  const [city, setCity] = useState<string>(user?.city || '');
  const [isAgreedStep1, setIsAgreedStep1] = useState<boolean>(true);

  // ---------------- STEP 2: Mortgage Property Details ----------------
  const [propertyType, setPropertyType] = useState<string>('Self-Occupied Residential House / Villa');
  const [propertyLocation, setPropertyLocation] = useState<string>('Shivaji Nagar, Nanded');
  const [marketValuation, setMarketValuation] = useState<string>('₹85,00,000');
  const [propertyOwnership, setPropertyOwnership] = useState<string>('Sole Ownership (Applicant)');
  const [isPropertyFreehold, setIsPropertyFreehold] = useState<'Yes' | 'No'>('Yes');
  const [hasExistingLoanOnProperty, setHasExistingLoanOnProperty] = useState<'No' | 'Yes'>('No');

  // ---------------- STEP 3: Income & Financing Details ----------------
  const [occupationType, setOccupationType] = useState<'Self-Employed / Business' | 'Salaried'>('Self-Employed / Business');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('₹1,50,000');
  const [requiredLoanAmount, setRequiredLoanAmount] = useState<string>('₹45,00,000');
  const [loanTenure, setLoanTenure] = useState<string>('10 Years (120 Months)');
  const [lapPurpose, setLapPurpose] = useState<string>('Business Expansion & Working Capital');
  const [bankAccount, setBankAccount] = useState<string>('State Bank of India');
  const [cibilScoreRange, setCibilScoreRange] = useState<string>('750 and Above (Excellent)');

  // ---------------- STEP 4: Documents ----------------
  const [panNumber, setPanNumber] = useState<string>(user?.panNumber || '');
  const [aadhaarNumber, setAadhaarNumber] = useState<string>(user?.aadhaarNumber || '');
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocState>({
    panCard: true,
    aadhaarCard: true,
    propertyTitleDeed: true,
    sanctionPlanTaxReceipt: true,
    incomeProofItrSlips: true,
    bankStatements: true,
    photograph: true,
  });

  // ---------------- STEP 5: Final Confirmation & Submission ----------------
  const [isFinalConfirmed, setIsFinalConfirmed] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedApp, setSubmittedApp] = useState<LoanApplication | null>(null);
  const [submittedDateString, setSubmittedDateString] = useState<string>('');

  // ---------------- Modals State ----------------
  const [showCityModal, setShowCityModal] = useState<boolean>(false);
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState<boolean>(false);
  const [showOwnershipModal, setShowOwnershipModal] = useState<boolean>(false);
  const [showIncomeModal, setShowIncomeModal] = useState<boolean>(false);
  const [showAmountModal, setShowAmountModal] = useState<boolean>(false);
  const [showTenureModal, setShowTenureModal] = useState<boolean>(false);
  const [showPurposeModal, setShowPurposeModal] = useState<boolean>(false);
  const [showBankModal, setShowBankModal] = useState<boolean>(false);

  // City Search
  const [citySearch, setCitySearch] = useState<string>('');
  const [allCities, setAllCities] = useState<CityResultItem[]>(cityLocationService.getFallbackCities());

  // Error validation
  const [formError, setFormError] = useState<string | null>(null);

  // Document counts
  const uploadedCount = Object.values(uploadedDocs).filter(Boolean).length;
  const totalDocsCount = Object.keys(uploadedDocs).length;

  const propertyTypes = [
    'Self-Occupied Residential House / Villa',
    'Commercial Shop / Office Space',
    'Rented Residential Apartment',
    'Industrial Plot / Shed / Warehouse',
    'Commercial Complex / Showroom Floor',
  ];

  const ownershipOptions = [
    'Sole Ownership (Applicant)',
    'Joint Ownership with Spouse / Parents',
    'Family Ancestral Property with NOC',
    'Company / Partnership Firm Owned',
  ];

  const incomeRanges = [
    '₹50,000 - ₹75,000',
    '₹75,000 - ₹1,00,000',
    '₹1,00,000 - ₹1,50,000',
    '₹1,50,000 - ₹2,50,000',
    'Above ₹2,50,000',
  ];

  const amountOptions = [
    '₹10,00,000',
    '₹20,00,000',
    '₹30,00,000',
    '₹45,00,000',
    '₹60,00,000',
    '₹75,00,000',
    '₹1,00,00,000',
    '₹2,00,00,000',
  ];

  const tenureOptions = [
    '3 Years (36 Months)',
    '5 Years (60 Months)',
    '7 Years (84 Months)',
    '10 Years (120 Months)',
    '15 Years (180 Months)',
  ];

  const lapPurposes = [
    'Business Expansion & Working Capital',
    'Debt Consolidation & High-Cost Loan Clearance',
    'Commercial Asset / Equipment Purchase',
    'Children Higher Education Overseas',
    'Medical & Major Family Milestone',
  ];

  const bankOptions = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Bank of Maharashtra',
    'Kotak Mahindra Bank',
    'Punjab National Bank',
    'Other Bank',
  ];

  useEffect(() => {
    if (!citySearch.trim()) {
      setAllCities(cityLocationService.getFallbackCities());
    } else {
      const filtered = cityLocationService
        .getFallbackCities()
        .filter(
          (c) =>
            c.city.toLowerCase().includes(citySearch.toLowerCase()) ||
            c.state.toLowerCase().includes(citySearch.toLowerCase())
        );
      setAllCities(filtered);
    }
  }, [citySearch]);

  const handleStep1Continue = () => {
    setFormError(null);
    if (!fullName.trim()) {
      setFormError('Please enter your full name');
      return;
    }
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!city.trim()) {
      setFormError('Please select your city');
      return;
    }
    if (!isAgreedStep1) {
      setFormError('Please accept terms & conditions');
      return;
    }
    setCurrentStep(2);
  };

  const handleStep2Continue = () => {
    setFormError(null);
    if (!propertyLocation.trim()) {
      setFormError('Please enter property location address');
      return;
    }
    setCurrentStep(3);
  };

  const handleStep3Continue = () => {
    setFormError(null);
    setCurrentStep(4);
  };

  const handleStep4Continue = () => {
    setFormError(null);
    if (panNumber.trim() && panNumber.trim().length !== 10) {
      setFormError('PAN Number must be 10 characters (e.g. ABCDE1234F)');
      return;
    }
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
    if (cleanAadhaar && cleanAadhaar.length !== 12) {
      setFormError('Aadhaar Number must be 12 digits');
      return;
    }
    setCurrentStep(5);
  };

  const handleFinalSubmit = async () => {
    setFormError(null);
    if (!isFinalConfirmed) {
      setFormError('Please confirm verification checkbox to submit your application');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      const numericAmount = parseInt(requiredLoanAmount.replace(/[^0-9]/g, ''), 10) || 4500000;
      const tenureMatch = loanTenure.match(/(\d+)\s*Years/);
      const tenureMonths = tenureMatch ? parseInt(tenureMatch[1], 10) * 12 : 120;

      const app = await loanService.submitEnquiry({
        loanType: 'mortgage',
        applicantName: fullName.trim(),
        mobile: cleanMobile,
        requestedAmount: numericAmount,
        tenureMonths: tenureMonths,
        monthlyIncome: 150000,
        employmentType: occupationType === 'Salaried' ? 'Salaried' : 'Self-Employed',
        city: city.trim(),
        panNumber: panNumber.trim().toUpperCase() || undefined,
        aadhaarNumber: aadhaarNumber.replace(/\D/g, '') || undefined,
        purpose: `Mortgage Loan (LAP) | Property: ${propertyType} | Location: ${propertyLocation} | Valuation: ${marketValuation} | Ownership: ${propertyOwnership} | Freehold: ${isPropertyFreehold} | Purpose: ${lapPurpose} | Bank: ${bankAccount}`,
      });

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setSubmittedDateString(`${dateStr}, ${timeStr}`);
      setSubmittedApp(app);
      setIsSubmitting(false);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setFormError(err instanceof Error ? err.message : 'Submission failed');
    }
  };

  const handleToggleDocUpload = (key: keyof UploadedDocState) => {
    setUploadedDocs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const stepsList = [
    { num: 1, label: 'Basic Details' },
    { num: 2, label: 'Property (LAP)' },
    { num: 3, label: 'Financials' },
    { num: 4, label: 'Documents' },
    { num: 5, label: 'Submit' },
  ];

  return (
    <View style={styles.screen}>
      {/* 1. Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (submittedApp) {
              onCancel();
            } else if (currentStep > 1) {
              setFormError(null);
              setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5);
            } else {
              onCancel();
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image
            source={require('../../../assets/logo/loan-point-logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. Hero Section: Top Banner with assets/inner-banner/mortgage-inner.png */}
        <View style={styles.heroBannerImageContainer}>
          <Image
            source={require('../../../assets/inner-banner/mortgage-inner.png')}
            style={styles.heroBannerImage}
            resizeMode="contain"
          />
        </View>

        {/* 3. 5-Step Tracker */}
        {!submittedApp && (
          <View style={styles.stepperContainer}>
            <View style={styles.stepperTrack}>
              {stepsList.map((st, index) => {
                const isCompleted = currentStep > st.num;
                const isActive = currentStep === st.num;
                return (
                  <React.Fragment key={st.num}>
                    <View style={styles.stepItem}>
                      {isCompleted ? (
                        <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                          <Ionicons name="checkmark" size={16} color="#ffffff" />
                        </View>
                      ) : (
                        <View style={[styles.stepCircle, isActive && styles.stepCircleActive]}>
                          <Text style={isActive ? styles.stepCircleTextActive : styles.stepCircleText}>
                            {st.num}
                          </Text>
                        </View>
                      )}
                      <Text
                        style={
                          isActive
                            ? styles.stepLabelActive
                            : isCompleted
                            ? styles.stepLabelCompleted
                            : styles.stepLabel
                        }
                        numberOfLines={1}
                      >
                        {st.label}
                      </Text>
                    </View>
                    {index < stepsList.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          currentStep > st.num && styles.stepLineActive,
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}

        {/* Error Box */}
        {!!formError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#dc2626" />
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        )}

        {/* ---------------- STEP 1: Basic Details ---------------- */}
        {currentStep === 1 && !submittedApp && (
          <View style={styles.cardContainer}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepHeaderIconBox}>
                <Ionicons name="person" size={20} color="#002e75" />
              </View>
              <View style={styles.stepHeaderTextCol}>
                <Text style={styles.stepHeaderTitle}>Step 1 – Basic Details</Text>
                <Text style={styles.stepHeaderSubtitle}>Tell us about property owner / borrower</Text>
              </View>
            </View>

            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Full Name (As on Property Deed) <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="person-outline" size={20} color="#64748b" />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter property owner full name"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Mobile Number <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="call-outline" size={20} color="#64748b" />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                 editable={false} />
              </View>
            </View>

            {/* Email ID */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email ID (Optional)</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="mail-outline" size={20} color="#64748b" />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your email ID"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={emailId}
                  onChangeText={setEmailId}
                />
              </View>
            </View>

            {/* DOB & City Row */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>Date of Birth <Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconBox}>
                    <Ionicons name="calendar-outline" size={18} color="#64748b" />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor="#94a3b8"
                    value={dob}
                    onChangeText={setDob}
                  />
                </View>
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.fieldLabel}>City <Text style={styles.asterisk}>*</Text></Text>
                <TouchableOpacity
                  style={styles.dropdownPickerBox}
                  onPress={() => setShowCityModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.inputIconBox}>
                    <Ionicons name="location-outline" size={18} color="#64748b" />
                  </View>
                  <Text style={styles.dropdownPickerText} numberOfLines={1}>
                    {city || 'Select City'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Safety Strip */}
            <View style={styles.safetyStrip}>
              <View style={styles.safetyIconBox}>
                <Ionicons name="shield-checkmark" size={18} color="#16a34a" />
              </View>
              <View style={styles.safetyTextBox}>
                <Text style={styles.safetyTitle}>Complete Property Confidentiality</Text>
                <Text style={styles.safetyDesc}>Property deeds and technical reports are handled through secured bank channels.</Text>
              </View>
            </View>

            {/* Consent Checkbox */}
            <TouchableOpacity
              style={styles.consentRow}
              onPress={() => setIsAgreedStep1(!isAgreedStep1)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxBox, isAgreedStep1 && styles.checkboxBoxChecked]}>
                {isAgreedStep1 && <Ionicons name="checkmark" size={14} color="#ffffff" />}
              </View>
              <Text style={styles.consentText}>
                I authorize Loan Point & LAP lending partners to evaluate my property and contact me. I accept{' '}
                <Text style={styles.consentLink}>Terms & Conditions</Text> and{' '}
                <Text style={styles.consentLink}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>

            {/* Continue Button */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleStep1Continue}
                activeOpacity={0.85}
              >
                <Text style={styles.continueButtonText}>Continue to Property Details</Text>
                <Ionicons name="arrow-forward" size={18} color="#002e75" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ---------------- STEP 2: Mortgage Property Details ---------------- */}
        {currentStep === 2 && !submittedApp && (
          <View style={styles.cardContainer}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepHeaderIconBox}>
                <MaterialCommunityIcons name="home-city-outline" size={22} color="#002e75" />
              </View>
              <View style={styles.stepHeaderTextCol}>
                <Text style={styles.stepHeaderTitle}>Step 2 – Property Against Loan</Text>
                <Text style={styles.stepHeaderSubtitle}>Valuation, category, location & title status</Text>
              </View>
            </View>

            {/* Property Type */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Property Category <Text style={styles.asterisk}>*</Text></Text>
              <TouchableOpacity
                style={styles.dropdownPickerBox}
                onPress={() => setShowPropertyTypeModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.inputIconBox}>
                  <MaterialCommunityIcons name="office-building" size={18} color="#64748b" />
                </View>
                <Text style={styles.dropdownPickerText}>{propertyType}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Property Location */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Property Exact Location / Area <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="location-outline" size={20} color="#64748b" />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Plot No. 12, Shivaji Nagar, Nanded"
                  placeholderTextColor="#94a3b8"
                  value={propertyLocation}
                  onChangeText={setPropertyLocation}
                />
              </View>
            </View>

            {/* Market Valuation & Ownership Row */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>Estimated Valuation <Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconBox}>
                    <MaterialCommunityIcons name="tag-outline" size={18} color="#64748b" />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. ₹85,00,000"
                    placeholderTextColor="#94a3b8"
                    value={marketValuation}
                    onChangeText={setMarketValuation}
                  />
                </View>
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.fieldLabel}>Ownership Title</Text>
                <TouchableOpacity
                  style={styles.dropdownPickerBox}
                  onPress={() => setShowOwnershipModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownPickerText} numberOfLines={1}>{propertyOwnership}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Freehold Status Question */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Is Property Clear & Freehold with Sanctioned Plan?</Text>
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    isPropertyFreehold === 'Yes' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setIsPropertyFreehold('Yes')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isPropertyFreehold === 'Yes' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={isPropertyFreehold === 'Yes' ? '#004aad' : '#94a3b8'}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      isPropertyFreehold === 'Yes' && styles.segmentButtonTextActive,
                    ]}
                  >
                    Yes (Clear Freehold)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    isPropertyFreehold === 'No' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setIsPropertyFreehold('No')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isPropertyFreehold === 'No' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={isPropertyFreehold === 'No' ? '#004aad' : '#94a3b8'}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      isPropertyFreehold === 'No' && styles.segmentButtonTextActive,
                    ]}
                  >
                    Leasehold / Under Review
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Existing Loan on Property */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Any Existing Loan / Mortgage on this Property?</Text>
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    hasExistingLoanOnProperty === 'No' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setHasExistingLoanOnProperty('No')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={hasExistingLoanOnProperty === 'No' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={hasExistingLoanOnProperty === 'No' ? '#004aad' : '#94a3b8'}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      hasExistingLoanOnProperty === 'No' && styles.segmentButtonTextActive,
                    ]}
                  >
                    No (Unencumbered)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    hasExistingLoanOnProperty === 'Yes' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setHasExistingLoanOnProperty('Yes')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={hasExistingLoanOnProperty === 'Yes' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={hasExistingLoanOnProperty === 'Yes' ? '#004aad' : '#94a3b8'}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      hasExistingLoanOnProperty === 'Yes' && styles.segmentButtonTextActive,
                    ]}
                  >
                    Yes (Balance Transfer / Top-Up)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.dualButtonRow}>
              <TouchableOpacity
                style={styles.backStepButton}
                onPress={() => setCurrentStep(1)}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color="#002e75" />
                <Text style={styles.backStepButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={handleStep2Continue}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionButtonText}>Continue to Financials</Text>
                <Ionicons name="arrow-forward" size={18} color="#002e75" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ---------------- STEP 3: Income & Financing Details ---------------- */}
        {currentStep === 3 && !submittedApp && (
          <View style={styles.cardContainer}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepHeaderIconBox}>
                <MaterialCommunityIcons name="calculator-variant" size={22} color="#002e75" />
              </View>
              <View style={styles.stepHeaderTextCol}>
                <Text style={styles.stepHeaderTitle}>Step 3 – Income & LAP Terms</Text>
                <Text style={styles.stepHeaderSubtitle}>Set loan quantum, tenure, and repayment bank</Text>
              </View>
            </View>

            {/* Occupation Type */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Borrower Occupation <Text style={styles.asterisk}>*</Text></Text>
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    occupationType === 'Self-Employed / Business' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setOccupationType('Self-Employed / Business')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={occupationType === 'Self-Employed / Business' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={occupationType === 'Self-Employed / Business' ? '#004aad' : '#94a3b8'}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      occupationType === 'Self-Employed / Business' && styles.segmentButtonTextActive,
                    ]}
                  >
                    Business / Professional
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    occupationType === 'Salaried' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setOccupationType('Salaried')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={occupationType === 'Salaried' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={occupationType === 'Salaried' ? '#004aad' : '#94a3b8'}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      occupationType === 'Salaried' && styles.segmentButtonTextActive,
                    ]}
                  >
                    Salaried Individual
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Monthly Income & Loan Purpose Row */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>Monthly Income <Text style={styles.asterisk}>*</Text></Text>
                <TouchableOpacity
                  style={styles.dropdownPickerBox}
                  onPress={() => setShowIncomeModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.inputIconBox}>
                    <MaterialCommunityIcons name="wallet-outline" size={18} color="#64748b" />
                  </View>
                  <Text style={styles.dropdownPickerText} numberOfLines={1}>{monthlyIncome}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.fieldLabel}>Loan Purpose</Text>
                <TouchableOpacity
                  style={styles.dropdownPickerBox}
                  onPress={() => setShowPurposeModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownPickerText} numberOfLines={1}>{lapPurpose}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Required Loan Amount */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Required Mortgage Loan Amount (Up to 65% of Valuation) <Text style={styles.asterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownPickerBox}
                onPress={() => setShowAmountModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.inputIconBox}>
                  <MaterialCommunityIcons name="currency-inr" size={20} color="#64748b" />
                </View>
                <Text style={styles.dropdownPickerTextHighlight}>{requiredLoanAmount}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Tenure & Operating Bank Row */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>Tenure <Text style={styles.asterisk}>*</Text></Text>
                <TouchableOpacity
                  style={styles.dropdownPickerBox}
                  onPress={() => setShowTenureModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.inputIconBox}>
                    <Ionicons name="calendar-outline" size={18} color="#64748b" />
                  </View>
                  <Text style={styles.dropdownPickerText} numberOfLines={1}>{loanTenure}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.fieldLabel}>Operating Bank</Text>
                <TouchableOpacity
                  style={styles.dropdownPickerBox}
                  onPress={() => setShowBankModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.inputIconBox}>
                    {bankAccount ? (
                      <BankLogo bank={bankAccount} width={20} height={20} />
                    ) : (
                      <MaterialCommunityIcons name="bank" size={18} color="#64748b" />
                    )}
                  </View>
                  <Text style={styles.dropdownPickerText} numberOfLines={1}>{bankAccount}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.dualButtonRow}>
              <TouchableOpacity
                style={styles.backStepButton}
                onPress={() => setCurrentStep(2)}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color="#002e75" />
                <Text style={styles.backStepButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={handleStep3Continue}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionButtonText}>Continue to Documents</Text>
                <Ionicons name="arrow-forward" size={18} color="#002e75" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ---------------- STEP 4: Documents Section (Exact Reference Layout) ---------------- */}
        {currentStep === 4 && !submittedApp && (
          <View style={styles.cardContainer}>
            {/* Header: Step 4 – Upload Documents */}
            <View style={styles.step4BannerHeader}>
              <View style={styles.step4UploadIconBox}>
                <Feather name="upload" size={26} color="#000000" />
              </View>
              <View style={styles.step4BannerTextCol}>
                <Text style={styles.step4BannerTitle}>Step 4 – Upload Documents</Text>
                <Text style={styles.step4BannerSubtitle}>
                  Upload clear and valid mortgage property documents for faster loan approval
                </Text>
              </View>
            </View>

            {/* Document List (7 Rows) */}
            <View style={styles.docListContainer}>
              {/* Row 1: PAN Card (Mandatory) */}
              <View style={styles.docRowItem}>
                <View style={styles.docLeftIconBadge}>
                  <View style={styles.panBadgeFrame}>
                    <Text style={styles.panBadgeText}>PAN</Text>
                    <View style={styles.panBadgeLines}>
                      <View style={styles.panBadgeLine} />
                      <View style={[styles.panBadgeLine, { width: '60%' }]} />
                    </View>
                  </View>
                </View>
                <View style={styles.docInfoCol}>
                  <View style={styles.docTitleWithBadgeRow}>
                    <Text style={styles.docRowTitle}>Borrower PAN Card</Text>
                    <View style={styles.mandatoryPill}>
                      <Text style={styles.mandatoryPillText}>Mandatory</Text>
                    </View>
                  </View>
                  <Text style={styles.docRowSubtitle}>Copy of Borrower PAN Card (Front Side)</Text>
                </View>
                <TouchableOpacity
                  style={[styles.uploadPillBtn, uploadedDocs.panCard && styles.uploadPillBtnDone]}
                  onPress={() => handleToggleDocUpload('panCard')}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={uploadedDocs.panCard ? 'checkmark-circle' : 'arrow-up'}
                    size={16}
                    color={uploadedDocs.panCard ? '#16a34a' : '#004aad'}
                  />
                  <Text style={[styles.uploadPillBtnText, uploadedDocs.panCard && styles.uploadPillBtnTextDone]}>
                    {uploadedDocs.panCard ? 'Uploaded' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.docRowDivider} />

              {/* Row 2: Aadhaar Card (Mandatory) */}
              <View style={styles.docRowItem}>
                <View style={styles.docLeftIconBadge}>
                  <View style={styles.aadhaarBadgeFrame}>
                    <Ionicons name="sunny-outline" size={14} color="#dc2626" />
                    <Text style={styles.aadhaarBadgeText}>AADHAAR</Text>
                  </View>
                </View>
                <View style={styles.docInfoCol}>
                  <View style={styles.docTitleWithBadgeRow}>
                    <Text style={styles.docRowTitle}>Borrower Aadhaar Card</Text>
                    <View style={styles.mandatoryPill}>
                      <Text style={styles.mandatoryPillText}>Mandatory</Text>
                    </View>
                  </View>
                  <Text style={styles.docRowSubtitle}>Front & Back (Both Sides)</Text>
                </View>
                <TouchableOpacity
                  style={[styles.uploadPillBtn, uploadedDocs.aadhaarCard && styles.uploadPillBtnDone]}
                  onPress={() => handleToggleDocUpload('aadhaarCard')}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={uploadedDocs.aadhaarCard ? 'checkmark-circle' : 'arrow-up'}
                    size={16}
                    color={uploadedDocs.aadhaarCard ? '#16a34a' : '#004aad'}
                  />
                  <Text style={[styles.uploadPillBtnText, uploadedDocs.aadhaarCard && styles.uploadPillBtnTextDone]}>
                    {uploadedDocs.aadhaarCard ? 'Uploaded' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.docRowDivider} />

              {/* Row 3: Registered Title Deed Chain */}
              <View style={styles.docRowItem}>
                <View style={styles.docLeftIconBadge}>
                  <View style={styles.docRoundIconWrap}>
                    <Ionicons name="home-outline" size={24} color="#002e75" />
                  </View>
                </View>
                <View style={styles.docInfoCol}>
                  <Text style={styles.docRowTitle}>Registered Title Deed Chain (13+ Years)</Text>
                  <Text style={styles.docRowSubtitle}>Sale deed, conveyance deed, gift deed or lease deed</Text>
                </View>
                <TouchableOpacity
                  style={[styles.uploadPillBtn, uploadedDocs.propertyTitleDeed && styles.uploadPillBtnDone]}
                  onPress={() => handleToggleDocUpload('propertyTitleDeed')}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={uploadedDocs.propertyTitleDeed ? 'checkmark-circle' : 'arrow-up'}
                    size={16}
                    color={uploadedDocs.propertyTitleDeed ? '#16a34a' : '#004aad'}
                  />
                  <Text style={[styles.uploadPillBtnText, uploadedDocs.propertyTitleDeed && styles.uploadPillBtnTextDone]}>
                    {uploadedDocs.propertyTitleDeed ? 'Uploaded' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.docRowDivider} />

              {/* Row 4: Sanctioned Plan & Municipal Tax Receipt */}
              <View style={styles.docRowItem}>
                <View style={styles.docLeftIconBadge}>
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="floor-plan" size={24} color="#002e75" />
                  </View>
                </View>
                <View style={styles.docInfoCol}>
                  <Text style={styles.docRowTitle}>Sanctioned Plan & Property Tax Receipt</Text>
                  <Text style={styles.docRowSubtitle}>Approved building layout plan & latest property tax paid challan</Text>
                </View>
                <TouchableOpacity
                  style={[styles.uploadPillBtn, uploadedDocs.sanctionPlanTaxReceipt && styles.uploadPillBtnDone]}
                  onPress={() => handleToggleDocUpload('sanctionPlanTaxReceipt')}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={uploadedDocs.sanctionPlanTaxReceipt ? 'checkmark-circle' : 'arrow-up'}
                    size={16}
                    color={uploadedDocs.sanctionPlanTaxReceipt ? '#16a34a' : '#004aad'}
                  />
                  <Text style={[styles.uploadPillBtnText, uploadedDocs.sanctionPlanTaxReceipt && styles.uploadPillBtnTextDone]}>
                    {uploadedDocs.sanctionPlanTaxReceipt ? 'Uploaded' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.docRowDivider} />

              {/* Row 5: Income Proof */}
              <View style={styles.docRowItem}>
                <View style={styles.docLeftIconBadge}>
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="file-document-outline" size={24} color="#002e75" />
                  </View>
                </View>
                <View style={styles.docInfoCol}>
                  <Text style={styles.docRowTitle}>Income Proof (ITR / Salary Slips)</Text>
                  <Text style={styles.docRowSubtitle}>Last 3 years ITR with computation or 6 months salary slips</Text>
                </View>
                <TouchableOpacity
                  style={[styles.uploadPillBtn, uploadedDocs.incomeProofItrSlips && styles.uploadPillBtnDone]}
                  onPress={() => handleToggleDocUpload('incomeProofItrSlips')}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={uploadedDocs.incomeProofItrSlips ? 'checkmark-circle' : 'arrow-up'}
                    size={16}
                    color={uploadedDocs.incomeProofItrSlips ? '#16a34a' : '#004aad'}
                  />
                  <Text style={[styles.uploadPillBtnText, uploadedDocs.incomeProofItrSlips && styles.uploadPillBtnTextDone]}>
                    {uploadedDocs.incomeProofItrSlips ? 'Uploaded' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.docRowDivider} />

              {/* Row 6: Bank Statements */}
              <View style={styles.docRowItem}>
                <View style={styles.docLeftIconBadge}>
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="bank" size={24} color="#002e75" />
                  </View>
                </View>
                <View style={styles.docInfoCol}>
                  <Text style={styles.docRowTitle}>Bank Statements (Last 12 Months)</Text>
                  <Text style={styles.docRowSubtitle}>Operating savings / current account statements (PDF)</Text>
                </View>
                <TouchableOpacity
                  style={[styles.uploadPillBtn, uploadedDocs.bankStatements && styles.uploadPillBtnDone]}
                  onPress={() => handleToggleDocUpload('bankStatements')}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={uploadedDocs.bankStatements ? 'checkmark-circle' : 'arrow-up'}
                    size={16}
                    color={uploadedDocs.bankStatements ? '#16a34a' : '#004aad'}
                  />
                  <Text style={[styles.uploadPillBtnText, uploadedDocs.bankStatements && styles.uploadPillBtnTextDone]}>
                    {uploadedDocs.bankStatements ? 'Uploaded' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.docRowDivider} />

              {/* Row 7: Property Photograph */}
              <View style={styles.docRowItem}>
                <View style={styles.docLeftIconBadge}>
                  <View style={styles.docRoundIconWrap}>
                    <Ionicons name="image-outline" size={24} color="#002e75" />
                  </View>
                </View>
                <View style={styles.docInfoCol}>
                  <Text style={styles.docRowTitle}>Property Elevation Photograph</Text>
                  <Text style={styles.docRowSubtitle}>Front view exterior & interior photograph of mortgaged property</Text>
                </View>
                <TouchableOpacity
                  style={[styles.uploadPillBtn, uploadedDocs.photograph && styles.uploadPillBtnDone]}
                  onPress={() => handleToggleDocUpload('photograph')}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={uploadedDocs.photograph ? 'checkmark-circle' : 'arrow-up'}
                    size={16}
                    color={uploadedDocs.photograph ? '#16a34a' : '#004aad'}
                  />
                  <Text style={[styles.uploadPillBtnText, uploadedDocs.photograph && styles.uploadPillBtnTextDone]}>
                    {uploadedDocs.photograph ? 'Uploaded' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom 100% Safe & Secure Card */}
            <View style={styles.safeSecureCard}>
              <View style={styles.shieldIconWrap}>
                <MaterialCommunityIcons name="shield-check" size={28} color="#16a34a" />
              </View>
              <View style={styles.safeSecureTextCol}>
                <Text style={styles.safeSecureTitle}>Your documents are 100% safe & secure</Text>
                <Text style={styles.safeSecureDesc}>
                  We use bank-level encryption and share your documents only with our lending partners for loan processing.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.dualButtonRow}>
              <TouchableOpacity
                style={styles.backStepButton}
                onPress={() => setCurrentStep(3)}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color="#000000" />
                <Text style={styles.backStepButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={handleStep4Continue}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionButtonText}>Submit Application</Text>
                <Ionicons name="arrow-forward" size={18} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ---------------- STEP 5: Review & Submit ---------------- */}
        {currentStep === 5 && !submittedApp && (
          <View style={styles.cardContainer}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepHeaderIconBox}>
                <MaterialCommunityIcons name="file-document-edit-outline" size={24} color="#002e75" />
              </View>
              <View style={styles.stepHeaderTextCol}>
                <Text style={styles.stepHeaderTitle}>Step 5 – Submit Application</Text>
                <Text style={styles.stepHeaderSubtitle}>
                  Please review your mortgage loan application details and submit.
                </Text>
              </View>
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Text style={styles.summaryCardTitle}>Application Summary</Text>
                <TouchableOpacity
                  style={styles.editButtonPill}
                  onPress={() => setCurrentStep(1)}
                  activeOpacity={0.8}
                >
                  <Feather name="edit-2" size={14} color="#004aad" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.summaryTable}>
                <View style={styles.summaryRow}>
                  <View style={styles.rowLabelCol}>
                    <Ionicons name="person-outline" size={16} color="#0f172a" style={styles.rowIcon} />
                    <Text style={styles.summaryLabel}>Property Owner</Text>
                  </View>
                  <Text style={styles.summaryColon}>:</Text>
                  <Text style={styles.summaryValue}>{fullName}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.rowLabelCol}>
                    <Ionicons name="call-outline" size={16} color="#0f172a" style={styles.rowIcon} />
                    <Text style={styles.summaryLabel}>Mobile Number</Text>
                  </View>
                  <Text style={styles.summaryColon}>:</Text>
                  <Text style={styles.summaryValue}>+91 {mobileNumber}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.rowLabelCol}>
                    <MaterialCommunityIcons name="home-city-outline" size={16} color="#0f172a" style={styles.rowIcon} />
                    <Text style={styles.summaryLabel}>Property Category</Text>
                  </View>
                  <Text style={styles.summaryColon}>:</Text>
                  <Text style={styles.summaryValue}>{propertyType}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.rowLabelCol}>
                    <Ionicons name="location-outline" size={16} color="#0f172a" style={styles.rowIcon} />
                    <Text style={styles.summaryLabel}>Location</Text>
                  </View>
                  <Text style={styles.summaryColon}>:</Text>
                  <Text style={styles.summaryValue}>{propertyLocation}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.rowLabelCol}>
                    <MaterialCommunityIcons name="tag-outline" size={16} color="#0f172a" style={styles.rowIcon} />
                    <Text style={styles.summaryLabel}>Valuation</Text>
                  </View>
                  <Text style={styles.summaryColon}>:</Text>
                  <Text style={styles.summaryValue}>{marketValuation}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.rowLabelCol}>
                    <MaterialCommunityIcons name="currency-inr" size={16} color="#0f172a" style={styles.rowIcon} />
                    <Text style={styles.summaryLabel}>Required LAP</Text>
                  </View>
                  <Text style={styles.summaryColon}>:</Text>
                  <Text style={styles.summaryValueHighlight}>{requiredLoanAmount}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.rowLabelCol}>
                    <Ionicons name="calendar-outline" size={16} color="#0f172a" style={styles.rowIcon} />
                    <Text style={styles.summaryLabel}>Tenure</Text>
                  </View>
                  <Text style={styles.summaryColon}>:</Text>
                  <Text style={styles.summaryValue}>{loanTenure}</Text>
                </View>
              </View>
            </View>

            {/* Uploaded Documents Grid (7/7) */}
            <View style={styles.docsSummaryCard}>
              <View style={styles.docsSummaryHeader}>
                <View style={styles.docsSummaryTitleRow}>
                  <MaterialCommunityIcons name="file-check-outline" size={18} color="#004aad" />
                  <Text style={styles.docsSummaryTitle}>Uploaded Title & Financials ({uploadedCount}/{totalDocsCount})</Text>
                </View>
                <TouchableOpacity
                  style={styles.editAddButton}
                  onPress={() => setCurrentStep(4)}
                  activeOpacity={0.8}
                >
                  <Feather name="edit-2" size={13} color="#004aad" />
                  <Text style={styles.editAddButtonText}>Edit / Add</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.docsGrid}>
                <View style={styles.docGridCol}>
                  <View style={styles.docCheckItem}>
                    <MaterialCommunityIcons name="card-account-details-outline" size={16} color="#334155" />
                    <Text style={styles.docCheckText}>
                      Borrower PAN <Text style={styles.mandatoryBadge}>(Mandatory)</Text>
                    </Text>
                    <Ionicons
                      name={uploadedDocs.panCard ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={uploadedDocs.panCard ? '#16a34a' : '#94a3b8'}
                      style={styles.checkIconEnd}
                    />
                  </View>

                  <View style={styles.docCheckItem}>
                    <MaterialCommunityIcons name="card-account-details" size={16} color="#334155" />
                    <Text style={styles.docCheckText}>
                      Borrower Aadhaar <Text style={styles.mandatoryBadge}>(Mandatory)</Text>
                    </Text>
                    <Ionicons
                      name={uploadedDocs.aadhaarCard ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={uploadedDocs.aadhaarCard ? '#16a34a' : '#94a3b8'}
                      style={styles.checkIconEnd}
                    />
                  </View>

                  <View style={styles.docCheckItem}>
                    <Ionicons name="home-outline" size={16} color="#334155" />
                    <Text style={styles.docCheckText}>Title Deed Chain</Text>
                    <Ionicons
                      name={uploadedDocs.propertyTitleDeed ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={uploadedDocs.propertyTitleDeed ? '#16a34a' : '#94a3b8'}
                      style={styles.checkIconEnd}
                    />
                  </View>

                  <View style={styles.docCheckItem}>
                    <MaterialCommunityIcons name="floor-plan" size={16} color="#334155" />
                    <Text style={styles.docCheckText}>Sanctioned Plan</Text>
                    <Ionicons
                      name={uploadedDocs.sanctionPlanTaxReceipt ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={uploadedDocs.sanctionPlanTaxReceipt ? '#16a34a' : '#94a3b8'}
                      style={styles.checkIconEnd}
                    />
                  </View>
                </View>

                <View style={styles.docGridCol}>
                  <View style={styles.docCheckItem}>
                    <MaterialCommunityIcons name="file-chart-outline" size={16} color="#334155" />
                    <Text style={styles.docCheckText}>ITR & Income Proof</Text>
                    <Ionicons
                      name={uploadedDocs.incomeProofItrSlips ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={uploadedDocs.incomeProofItrSlips ? '#16a34a' : '#94a3b8'}
                      style={styles.checkIconEnd}
                    />
                  </View>

                  <View style={styles.docCheckItem}>
                    <MaterialCommunityIcons name="bank-transfer" size={16} color="#334155" />
                    <Text style={styles.docCheckText}>Bank Statements (12M)</Text>
                    <Ionicons
                      name={uploadedDocs.bankStatements ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={uploadedDocs.bankStatements ? '#16a34a' : '#94a3b8'}
                      style={styles.checkIconEnd}
                    />
                  </View>

                  <View style={styles.docCheckItem}>
                    <Ionicons name="image-outline" size={16} color="#334155" />
                    <Text style={styles.docCheckText}>Property Photo</Text>
                    <Ionicons
                      name={uploadedDocs.photograph ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={uploadedDocs.photograph ? '#16a34a' : '#94a3b8'}
                      style={styles.checkIconEnd}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Legal Confirmation Checkbox */}
            <TouchableOpacity
              style={styles.declarationRow}
              onPress={() => setIsFinalConfirmed(!isFinalConfirmed)}
              activeOpacity={0.8}
            >
              <View style={[styles.finalCheckbox, isFinalConfirmed && styles.finalCheckboxChecked]}>
                {isFinalConfirmed && <Ionicons name="checkmark" size={16} color="#ffffff" />}
              </View>
              <Text style={styles.declarationText}>
                I hereby declare that the property details, title status, and income proofs provided are genuine and unencumbered.
                I authorize <Text style={styles.declarationBold}>Loan Point</Text> to arrange legal & technical evaluation with partner banks.
              </Text>
            </TouchableOpacity>

            {/* Bottom Actions */}
            <View style={styles.dualButtonRow}>
              <TouchableOpacity
                style={styles.backStepButton}
                onPress={() => setCurrentStep(4)}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color="#002e75" />
                <Text style={styles.backStepButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBigButton, isSubmitting && styles.submitBigButtonDisabled]}
                onPress={handleFinalSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#002e75" />
                ) : (
                  <>
                    <Text style={styles.submitBigButtonText}>Submit Application</Text>
                    <Ionicons name="arrow-forward" size={18} color="#002e75" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ---------------- POST-SUBMIT SUCCESS VIEW ---------------- */}
        {submittedApp && (
          <View style={styles.successScreenWrapper}>
            <View style={styles.successCard}>
              <View style={styles.successCelebrationBadge}>
                <Ionicons name="checkmark" size={38} color="#ffffff" />
              </View>

              <Text style={styles.successCardTitle}>Application Submitted Successfully!</Text>
              <Text style={styles.successCardSubtitle}>
                Thank you for choosing Loan Point. Your Mortgage Loan (LAP) application has been received.
              </Text>

              {/* ID & Date Pill Cards */}
              <View style={styles.applicationIdPillRow}>
                <View style={styles.appIdBox}>
                  <View style={styles.appIdIconWrap}>
                    <MaterialCommunityIcons name="file-document-outline" size={20} color="#004aad" />
                  </View>
                  <View>
                    <Text style={styles.appIdLabel}>Application ID</Text>
                    <Text style={styles.appIdValue}>{submittedApp.id}</Text>
                  </View>
                </View>

                <View style={styles.appIdBox}>
                  <View style={styles.appIdIconWrap}>
                    <Ionicons name="calendar-outline" size={20} color="#004aad" />
                  </View>
                  <View>
                    <Text style={styles.appIdLabel}>Submitted On</Text>
                    <Text style={styles.appIdDateValue}>{submittedDateString || 'Today'}</Text>
                  </View>
                </View>
              </View>

              {/* 4-Step Lifecycle Tracker */}
              <View style={styles.lifecycleTrackerRow}>
                <View style={styles.lifecycleNode}>
                  <View style={[styles.lifecycleCircle, styles.lifecycleCircleCompleted]}>
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  </View>
                  <Text style={[styles.lifecycleLabel, styles.lifecycleLabelActive]}>Application Received</Text>
                </View>

                <View style={styles.lifecycleConnector} />

                <View style={styles.lifecycleNode}>
                  <View style={styles.lifecycleCircle}>
                    <MaterialCommunityIcons name="shield-search" size={16} color="#64748b" />
                  </View>
                  <Text style={styles.lifecycleLabel}>Legal Title Search</Text>
                </View>

                <View style={styles.lifecycleConnector} />

                <View style={styles.lifecycleNode}>
                  <View style={styles.lifecycleCircle}>
                    <MaterialCommunityIcons name="home-analytics" size={16} color="#64748b" />
                  </View>
                  <Text style={styles.lifecycleLabel}>Technical Valuation</Text>
                </View>

                <View style={styles.lifecycleConnector} />

                <View style={styles.lifecycleNode}>
                  <View style={styles.lifecycleCircle}>
                    <MaterialCommunityIcons name="handshake-outline" size={16} color="#64748b" />
                  </View>
                  <Text style={styles.lifecycleLabel}>Sanction & Loan</Text>
                </View>
              </View>

              {/* Relationship Manager Card */}
              <View style={styles.rmCard}>
                <View style={styles.rmAvatarFrame}>
                  <Image
                    source={require('../../../assets/logo/customer-sagar.png')}
                    style={styles.rmImage}
                    resizeMode="cover"
                  />
                </View>

                <View style={styles.rmInfoCol}>
                  <Text style={styles.rmRoleLabel}>Your Relationship Manager</Text>
                  <Text style={styles.rmName}>Arvind Patil</Text>
                  <View style={styles.rmPhoneRow}>
                    <Ionicons name="call" size={14} color="#16a34a" />
                    <Text style={styles.rmPhoneNumber}>+91 95455 55999</Text>
                  </View>
                </View>

                <View style={styles.rmActionCol}>
                  <TouchableOpacity
                    style={styles.rmCallBtn}
                    onPress={() => Linking.openURL('tel:9545555999').catch(() => {})}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call" size={14} color="#002e75" />
                    <Text style={styles.rmCallBtnText}>Call Now</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rmWhatsappBtn}
                    onPress={() => {
                      const msg = encodeURIComponent(
                        `Hello Arvind Patil, I submitted Mortgage Loan Application ${submittedApp.id} for property in ${propertyLocation}. Please assist.`
                      );
                      Linking.openURL(`https://api.whatsapp.com/send?phone=919545555999&text=${msg}`).catch(() => {});
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-whatsapp" size={14} color="#ffffff" />
                    <Text style={styles.rmWhatsappBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* What's Next */}
              <View style={styles.whatsNextCard}>
                <View style={styles.whatsNextBellWrap}>
                  <MaterialCommunityIcons name="bell-ring-outline" size={22} color="#f59e0b" />
                </View>
                <View style={styles.whatsNextTextWrap}>
                  <Text style={styles.whatsNextTitle}>What's Next?</Text>
                  <Text style={styles.whatsNextDesc}>
                    Our mortgage advocate will coordinate technical inspection and search the 13-year property index title deeds for expedited bank approval.
                  </Text>
                </View>
              </View>

              {/* Success Action Buttons */}
              <View style={styles.successActionsRow}>
                <TouchableOpacity
                  style={styles.goHomeBtn}
                  onPress={onCancel}
                  activeOpacity={0.8}
                >
                  <Ionicons name="home-outline" size={18} color="#002e75" />
                  <Text style={styles.goHomeBtnText}>Go to Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.trackAppBtn}
                  onPress={() => onSuccess(submittedApp)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="file-search-outline" size={18} color="#002e75" />
                  <Text style={styles.trackAppBtnText}>Track My Application</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* City Modal */}
      <Modal visible={showCityModal} animationType="slide" transparent onRequestClose={() => setShowCityModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your City</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchBox}>
              <Ionicons name="search" size={18} color="#64748b" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search city, district or state..."
                placeholderTextColor="#94a3b8"
                value={citySearch}
                onChangeText={setCitySearch}
              />
            </View>
            <FlatList
              data={allCities}
              keyExtractor={(item) => `${item.city}-${item.state}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionItem}
                  onPress={() => {
                    setCity(`${item.city}, ${item.state}`);
                    setShowCityModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item.city}, {item.state}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Property Type Modal */}
      <Modal visible={showPropertyTypeModal} animationType="slide" transparent onRequestClose={() => setShowPropertyTypeModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Property Category</Text>
              <TouchableOpacity onPress={() => setShowPropertyTypeModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={propertyTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionItem}
                  onPress={() => {
                    setPropertyType(item);
                    setShowPropertyTypeModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Ownership Modal */}
      <Modal visible={showOwnershipModal} animationType="slide" transparent onRequestClose={() => setShowOwnershipModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Ownership Title</Text>
              <TouchableOpacity onPress={() => setShowOwnershipModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ownershipOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionItem}
                  onPress={() => {
                    setPropertyOwnership(item);
                    setShowOwnershipModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Income Modal */}
      <Modal visible={showIncomeModal} animationType="slide" transparent onRequestClose={() => setShowIncomeModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Monthly Income</Text>
              <TouchableOpacity onPress={() => setShowIncomeModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={incomeRanges}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionItem}
                  onPress={() => {
                    setMonthlyIncome(item);
                    setShowIncomeModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Amount Modal */}
      <Modal visible={showAmountModal} animationType="slide" transparent onRequestClose={() => setShowAmountModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Loan Amount</Text>
              <TouchableOpacity onPress={() => setShowAmountModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={amountOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionItem}
                  onPress={() => {
                    setRequiredLoanAmount(item);
                    setShowAmountModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Tenure Modal */}
      <Modal visible={showTenureModal} animationType="slide" transparent onRequestClose={() => setShowTenureModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Tenure</Text>
              <TouchableOpacity onPress={() => setShowTenureModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={tenureOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionItem}
                  onPress={() => {
                    setLoanTenure(item);
                    setShowTenureModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Purpose Modal */}
      <Modal visible={showPurposeModal} animationType="slide" transparent onRequestClose={() => setShowPurposeModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Loan Purpose</Text>
              <TouchableOpacity onPress={() => setShowPurposeModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={lapPurposes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionItem}
                  onPress={() => {
                    setLapPurpose(item);
                    setShowPurposeModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Bank Modal */}
      <Modal visible={showBankModal} animationType="slide" transparent onRequestClose={() => setShowBankModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Operating Bank</Text>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={bankOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOptionItem, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}
                  onPress={() => {
                    setBankAccount(item);
                    setShowBankModal(false);
                  }}
                >
                  <BankLogo bank={item} width={26} height={26} />
                  <Text style={[styles.modalOptionText, { flex: 1 }]}>{item}</Text>
                  {bankAccount === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#004aad" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  heroBannerImageContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBannerImage: {
    width: SCREEN_WIDTH,
    height: Math.round(SCREEN_WIDTH * (341 / 1024)),
  },

  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerLogo: {
    width: 140,
    height: 42,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: '#002e75',
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  heroSunCircle: {
    position: 'absolute',
    right: -25,
    top: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ffd700',
    opacity: 0.88,
  },
  heroContentLeft: {
    flex: 1,
    paddingRight: 10,
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  heroTitleYellow: {
    color: '#ffd700',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#e2e8f0',
    marginTop: 4,
    lineHeight: 16,
  },
  heroGraphicRight: {
    width: 82,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 3,
  },
  avatarCircleFrame: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 46, 117, 0.45)',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPillBadge: {
    position: 'absolute',
    top: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001a45',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffd700',
    zIndex: 5,
  },
  avatarPillText: {
    color: '#ffd700',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 3,
  },
  thumbsUpBubble: {
    position: 'absolute',
    bottom: -4,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffd700',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  stepperContainer: {
    paddingVertical: 18,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
  },
  stepperTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    width: 58,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  stepCircleActive: {
    borderColor: '#f59e0b',
    backgroundColor: '#fed7aa',
  },
  stepCircleCompleted: {
    borderColor: '#10b981',
    backgroundColor: '#10b981',
  },
  stepCircleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  stepCircleTextActive: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  stepLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  stepLabelActive: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '800',
    textAlign: 'center',
  },
  stepLabelCompleted: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '700',
    textAlign: 'center',
  },
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 1,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: '#10b981',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 10,
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 10,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    fontWeight: '600',
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stepHeaderIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepHeaderTextCol: {
    flex: 1,
  },
  stepHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002e75',
  },
  stepHeaderSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  asterisk: {
    color: '#dc2626',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 46,
  },
  inputIconBox: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 0,
  },
  rowTwoCols: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownPickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 46,
  },
  dropdownPickerText: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
  },
  dropdownPickerTextHighlight: {
    flex: 1,
    fontSize: 14,
    color: '#004aad',
    fontWeight: '800',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  segmentButtonActive: {
    borderColor: '#004aad',
    backgroundColor: '#eff6ff',
  },
  segmentButtonText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginLeft: 6,
  },
  segmentButtonTextActive: {
    color: '#004aad',
    fontWeight: '700',
  },
  safetyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
  },
  safetyIconBox: {
    marginRight: 8,
  },
  safetyTextBox: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  safetyDesc: {
    fontSize: 10,
    color: '#15803d',
    marginTop: 1,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    marginBottom: 14,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  checkboxBoxChecked: {
    backgroundColor: '#004aad',
    borderColor: '#004aad',
  },
  consentText: {
    flex: 1,
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  consentLink: {
    color: '#004aad',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  buttonRow: {
    marginTop: 6,
  },
  continueButton: {
    backgroundColor: '#ffd700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    elevation: 2,
  },
  continueButtonText: {
    color: '#002e75',
    fontWeight: '800',
    fontSize: 15,
    marginRight: 6,
  },
  dualButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  backStepButtonText: {
    color: '#002e75',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 4,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: '#ffd700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    elevation: 2,
  },
  primaryActionButtonText: {
    color: '#002e75',
    fontWeight: '800',
    fontSize: 14,
    marginRight: 6,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#002e75',
    marginTop: 10,
    marginBottom: 10,
  },
  uploadItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  uploadItemBoxDone: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  uploadItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 6,
  },
  uploadIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  uploadIconBadgeDone: {
    backgroundColor: '#16a34a',
  },
  uploadItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  uploadItemDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  uploadActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  uploadActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004aad',
    marginLeft: 4,
  },
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 14,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  summaryCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#002e75',
  },
  editButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004aad',
    marginLeft: 4,
  },
  summaryTable: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 145,
  },
  rowIcon: {
    marginRight: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  summaryColon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginRight: 8,
  },
  summaryValue: {
    flex: 1,
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  summaryValueHighlight: {
    flex: 1,
    fontSize: 13,
    color: '#004aad',
    fontWeight: '800',
  },
  docsSummaryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 14,
  },
  docsSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  docsSummaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docsSummaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#002e75',
    marginLeft: 6,
  },
  editAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editAddButtonText: {
    fontSize: 11,
    color: '#004aad',
    fontWeight: '700',
    marginLeft: 3,
  },
  docsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  docGridCol: {
    flex: 1,
    gap: 6,
  },
  docCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  docCheckText: {
    flex: 1,
    fontSize: 10,
    color: '#0f172a',
    fontWeight: '600',
    marginLeft: 5,
  },
  mandatoryBadge: {
    color: '#dc2626',
    fontSize: 9,
  },
  checkIconEnd: {
    marginLeft: 4,
  },
  declarationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  finalCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 8,
  },
  finalCheckboxChecked: {
    backgroundColor: '#004aad',
    borderColor: '#004aad',
  },
  declarationText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  declarationBold: {
    fontWeight: '800',
    color: '#0f172a',
  },
  submitBigButton: {
    flex: 1,
    backgroundColor: '#ffd700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
  },
  submitBigButtonDisabled: {
    opacity: 0.65,
  },
  submitBigButtonText: {
    color: '#002e75',
    fontWeight: '800',
    fontSize: 15,
    marginRight: 6,
  },
  successScreenWrapper: {
    marginHorizontal: 14,
    marginTop: 10,
  },
  successCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    elevation: 3,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    alignItems: 'center',
  },
  successCelebrationBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 12,
    elevation: 4,
  },
  successCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  successCardSubtitle: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  applicationIdPillRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginTop: 14,
    marginBottom: 14,
  },
  appIdBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 10,
  },
  appIdIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  appIdLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  appIdValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#002e75',
  },
  appIdDateValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  lifecycleTrackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 14,
  },
  lifecycleNode: {
    alignItems: 'center',
    flex: 1,
  },
  lifecycleCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  lifecycleCircleCompleted: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  lifecycleLabel: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
  },
  lifecycleLabelActive: {
    color: '#16a34a',
    fontWeight: '800',
  },
  lifecycleConnector: {
    height: 2,
    flex: 0.5,
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
  },
  rmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 10,
    width: '100%',
    marginBottom: 14,
  },
  rmAvatarFrame: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#004aad',
    marginRight: 10,
  },
  rmImage: {
    width: '100%',
    height: '100%',
  },
  rmInfoCol: {
    flex: 1,
  },
  rmRoleLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  rmName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#002e75',
  },
  rmPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  rmPhoneNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
    marginLeft: 4,
  },
  rmActionCol: {
    gap: 6,
  },
  rmCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rmCallBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#002e75',
    marginLeft: 4,
  },
  rmWhatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25d366',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rmWhatsappBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    marginLeft: 4,
  },
  whatsNextCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 10,
    width: '100%',
    marginBottom: 16,
  },
  whatsNextBellWrap: {
    marginRight: 8,
    marginTop: 2,
  },
  whatsNextTextWrap: {
    flex: 1,
  },
  whatsNextTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
  },
  whatsNextDesc: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
    lineHeight: 15,
  },
  successActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  goHomeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingVertical: 12,
    borderRadius: 12,
  },
  goHomeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#002e75',
    marginLeft: 6,
  },
  trackAppBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffd700',
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
  },
  trackAppBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#002e75',
    marginLeft: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002e75',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
    marginVertical: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    marginLeft: 6,
    paddingVertical: 0,
  },
  modalOptionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  // Step 4 exact reference styling
  step4BannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 4,
  },
  step4UploadIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffd700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  step4BannerTextCol: {
    flex: 1,
  },
  step4BannerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 2,
  },
  step4BannerSubtitle: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  docListContainer: {
    marginBottom: 16,
  },
  docRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  docRowDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  docLeftIconBadge: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panBadgeFrame: {
    width: 42,
    height: 30,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#002e75',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  panBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#002e75',
    letterSpacing: 0.5,
  },
  panBadgeLines: {
    width: 24,
    marginTop: 2,
    gap: 1.5,
  },
  panBadgeLine: {
    height: 1.5,
    backgroundColor: '#002e75',
    borderRadius: 1,
  },
  aadhaarBadgeFrame: {
    width: 44,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fed7aa',
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aadhaarBadgeText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#dc2626',
    marginTop: 1,
  },
  docRoundIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfoCol: {
    flex: 1,
  },
  docTitleWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  docRowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  mandatoryPill: {
    backgroundColor: '#dc2626',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mandatoryPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  docRowSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 15,
  },
  uploadPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#004aad',
    backgroundColor: '#ffffff',
  },
  uploadPillBtnDone: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  uploadPillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004aad',
  },
  uploadPillBtnTextDone: {
    color: '#16a34a',
  },
  safeSecureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
    marginBottom: 16,
  },
  shieldIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeSecureTextCol: {
    flex: 1,
  },
  safeSecureTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 2,
  },
  safeSecureDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
});

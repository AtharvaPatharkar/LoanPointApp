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
import { calculateEMI, formatINR } from '../../utils/calculator';
import { LoanIcon } from '../common/LoanIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HomeLoanApplyScreenProps {
  user: UserProfile | null;
  onSuccess: (newApp: LoanApplication) => void;
  onCancel: () => void;
}

interface UploadedHomeDocsState {
  panCard: boolean;
  aadhaarCard: boolean;
  addressProof: boolean;
  incomeProof: boolean;
  bankStatements: boolean;
  existingLoanStatement: boolean;
  photograph: boolean;
}

export const HomeLoanApplyScreen: React.FC<HomeLoanApplyScreenProps> = ({
  user,
  onSuccess,
  onCancel,
}) => {
  // 5-Step Tracker: 1: Basic Details, 2: Property Details, 3: Income Details, 4: Documents, 5: Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // ---------------- STEP 1: Basic Details ----------------
  const [fullName, setFullName] = useState<string>(user?.name || 'Arvind Patil');
  const [mobileNumber, setMobileNumber] = useState<string>(user?.mobile || '9823012345');
  const [emailId, setEmailId] = useState<string>(user?.email || 'arvind.patil@example.com');
  const [dateOfBirth, setDateOfBirth] = useState<string>('15 Aug 1990');
  const [city, setCity] = useState<string>(user?.city || 'Nanded, Maharashtra');

  // ---------------- STEP 2: Property Details ----------------
  const [propertyType, setPropertyType] = useState<string>('Ready to Move Flat / Apartment');
  const [propertyLocation, setPropertyLocation] = useState<string>(user?.city || 'Nanded, Maharashtra');
  const [propertyValue, setPropertyValue] = useState<string>('₹75,00,000');
  const [propertyStage, setPropertyStage] = useState<string>('Selected / Finalized');

  // ---------------- STEP 3: Income Details ----------------
  const [employmentType, setEmploymentType] = useState<'Salaried' | 'Self-Employed'>('Salaried');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('₹1,20,000');
  const [companyName, setCompanyName] = useState<string>('Tech Solutions Ltd');
  const [salaryBankAccount, setSalaryBankAccount] = useState<string>('HDFC Bank');
  const [existingEmi, setExistingEmi] = useState<string>('No Existing EMI');

  // Loan Details
  const [requiredLoanAmount, setRequiredLoanAmount] = useState<string>('₹60,00,000');
  const [tenureYears, setTenureYears] = useState<string>('20 Years');

  // ---------------- STEP 4: Documents ----------------
  const [panNumber, setPanNumber] = useState<string>(user?.panNumber || 'ABCDE1234F');
  const [aadhaarNumber, setAadhaarNumber] = useState<string>(user?.aadhaarNumber || '987654321012');
  const [uploadedDocs, setUploadedDocs] = useState<UploadedHomeDocsState>({
    panCard: true,
    aadhaarCard: true,
    addressProof: true,
    incomeProof: true,
    bankStatements: true,
    existingLoanStatement: true,
    photograph: true,
  });

  // ---------------- STEP 5: Final Confirmation & Submitted State ----------------
  const [isFinalConfirmed, setIsFinalConfirmed] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedApp, setSubmittedApp] = useState<LoanApplication | null>(null);
  const [submittedDateString, setSubmittedDateString] = useState<string>('');

  // Modals
  const [showCityModal, setShowCityModal] = useState<boolean>(false);
  const [showDobModal, setShowDobModal] = useState<boolean>(false);
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState<boolean>(false);
  const [showIncomeModal, setShowIncomeModal] = useState<boolean>(false);
  const [showLoanAmountModal, setShowLoanAmountModal] = useState<boolean>(false);
  const [showTenureModal, setShowTenureModal] = useState<boolean>(false);

  // City Search
  const [citySearch, setCitySearch] = useState<string>('');
  const [allCities, setAllCities] = useState<CityResultItem[]>(cityLocationService.getFallbackCities());

  // Error validation
  const [formError, setFormError] = useState<string | null>(null);

  // Options for Dropdowns
  const propertyTypeOptions = [
    'Ready to Move Flat / Apartment',
    'Under Construction Apartment',
    'Independent House / Villa',
    'Plot + Construction (Composite Loan)',
    'Home Renovation / Improvement',
    'Home Loan Balance Transfer (BT)',
  ];

  const incomeOptions = [
    '₹25,000 - ₹50,000',
    '₹50,000 - ₹75,000',
    '₹75,000 - ₹1,00,000',
    '₹1,20,000',
    '₹1,00,000 - ₹1,50,000',
    'Above ₹1,50,000',
  ];

  const loanAmountOptions = [
    '₹25,00,000',
    '₹35,00,000',
    '₹50,00,000',
    '₹60,00,000',
    '₹75,00,000',
    '₹1,00,00,000',
    'Above ₹1 Crore',
  ];

  const tenureOptions = [
    '5 Years',
    '10 Years',
    '15 Years',
    '20 Years',
    '25 Years',
    '30 Years',
  ];

  // Count uploaded docs
  const uploadedCount = Object.values(uploadedDocs).filter(Boolean).length;
  const totalDocsCount = Object.keys(uploadedDocs).length;

  // Fetch cities
  useEffect(() => {
    let isMounted = true;
    const fetchCities = async () => {
      try {
        const data = await cityLocationService.fetchCitiesData();
        if (isMounted && data && data.length > 0) {
          setAllCities(data);
        }
      } catch (e) {
        console.warn('Cities load failed:', e);
      }
    };
    fetchCities();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCities = citySearch.trim() === ''
    ? allCities.slice(0, 80)
    : allCities.filter((c) =>
        c.city.toLowerCase().includes(citySearch.toLowerCase()) ||
        c.state.toLowerCase().includes(citySearch.toLowerCase())
      ).slice(0, 80);

  // Step 1 Validation & Continue
  const handleStep1Continue = () => {
    setFormError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError('Please enter your full name');
      return;
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setFormError('Please enter valid 10-digit mobile number');
      return;
    }

    if (!dateOfBirth.trim()) {
      setFormError('Please enter or select your date of birth');
      return;
    }

    if (!city.trim()) {
      setFormError('Please select your city');
      return;
    }

    setCurrentStep(2);
  };

  // Step 2 Validation & Continue
  const handleStep2Continue = () => {
    setFormError(null);
    if (!propertyLocation.trim()) {
      setFormError('Please enter property location');
      return;
    }
    setCurrentStep(3);
  };

  // Step 3 Validation & Continue -> Opens Step 4: Documents
  const handleStep3Continue = () => {
    setFormError(null);
    setCurrentStep(4);
  };

  // Step 4 Validation & Continue -> Opens Step 5: Submit Review
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

  // Step 5 Final Submit
  const handleFinalSubmit = async () => {
    setFormError(null);

    if (!isFinalConfirmed) {
      setFormError('Please confirm the verification checkbox to submit your application');
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      const numericAmount = parseInt(requiredLoanAmount.replace(/[^0-9]/g, ''), 10) || 6000000;
      const tenureMatch = tenureYears.match(/\d+/);
      const tenureMonths = (tenureMatch ? parseInt(tenureMatch[0], 10) : 20) * 12;

      const app = await loanService.submitEnquiry({
        loanType: 'home',
        applicantName: fullName.trim(),
        mobile: cleanMobile,
        requestedAmount: numericAmount,
        tenureMonths: tenureMonths,
        monthlyIncome: 120000,
        employmentType: employmentType,
        city: city.trim(),
        panNumber: panNumber.trim().toUpperCase() || undefined,
        aadhaarNumber: aadhaarNumber.replace(/\D/g, '') || undefined,
        purpose: `Home Loan | Property: ${propertyType} in ${propertyLocation} | Value: ${propertyValue} | Bank: ${salaryBankAccount}`,
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

  // Toggle simulated doc upload
  const handleToggleDocUpload = (key: keyof UploadedHomeDocsState) => {
    setUploadedDocs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const stepsList = [
    { num: 1, label: 'Basic Details' },
    { num: 2, label: 'Property Details' },
    { num: 3, label: 'Income Details' },
    { num: 4, label: 'Documents' },
    { num: 5, label: 'Submit' },
  ];

  return (
    <View style={styles.screen}>
      {/* 1. Top Header Bar: Back arrow and LOAN POINT logo */}
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
        {/* 2. Hero Section: Top Banner with assets/inner-banner/home-inner.png */}
        <View style={styles.heroBannerImageContainer}>
          <Image
            source={require('../../../assets/inner-banner/home-inner.png')}
            style={styles.heroBannerImage}
            resizeMode="contain"
          />
        </View>

        {/* 3. 5-Step Tracker (Hidden on Post-Submit Success Screen) */}
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

        {/* ================= STEP 1: Basic Details ================= */}
        {currentStep === 1 && (
          <View style={styles.mainCard}>
            <View style={styles.step1HeaderRow}>
              <View style={styles.step1IconBadge}>
                <Feather name="user" size={24} color="#000000" />
              </View>
              <View style={styles.step1HeaderTextCol}>
                <Text style={styles.step1TitleText}>Step 1 – Basic Details</Text>
                <Text style={styles.step1SubtitleText}>Tell us about yourself</Text>
              </View>
            </View>

            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldIconCol}>
                <Feather name="user" size={24} color="#0f172a" />
              </View>
              <View style={styles.fieldRightCol}>
                <Text style={styles.fieldLabel}>
                  Full Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your full name"
                    placeholderTextColor="#94a3b8"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldIconCol}>
                <Feather name="phone" size={24} color="#0f172a" />
              </View>
              <View style={styles.fieldRightCol}>
                <Text style={styles.fieldLabel}>
                  Mobile Number <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                  />
                </View>
              </View>
            </View>

            {/* Email ID (Optional) */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldIconCol}>
                <Feather name="mail" size={24} color="#0f172a" />
              </View>
              <View style={styles.fieldRightCol}>
                <Text style={styles.fieldLabel}>Email ID (Optional)</Text>
                <View style={styles.inputBox}>
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
            </View>

            {/* Date of Birth */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldIconCol}>
                <MaterialCommunityIcons name="calendar-month-outline" size={26} color="#0f172a" />
              </View>
              <View style={styles.fieldRightCol}>
                <Text style={styles.fieldLabel}>
                  Date of Birth <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.inputBoxDropdown}
                  onPress={() => setShowDobModal(true)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dropdownValueText, !dateOfBirth && styles.placeholderText]}>
                    {dateOfBirth || 'Select date of birth'}
                  </Text>
                  <MaterialCommunityIcons name="calendar-blank-outline" size={20} color="#0f172a" />
                </TouchableOpacity>
              </View>
            </View>

            {/* City */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldIconCol}>
                <Ionicons name="location-outline" size={26} color="#0f172a" />
              </View>
              <View style={styles.fieldRightCol}>
                <Text style={styles.fieldLabel}>
                  City <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.inputBoxDropdown}
                  onPress={() => setShowCityModal(true)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dropdownValueText, !city && styles.placeholderText]}>
                    {city || 'Select City'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#0f172a" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Safety Strip */}
            <View style={styles.safetyStrip}>
              <View style={styles.shieldGreenCircle}>
                <Ionicons name="checkmark-sharp" size={16} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.safetyTitle}>Your information is 100% safe & secure</Text>
                <Text style={styles.safetySub}>We use your details only for loan processing.</Text>
              </View>
            </View>

            {formError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <View style={styles.bottomBtnRow}>
              <TouchableOpacity
                style={styles.backBtnPill}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color="#000000" style={{ marginRight: 6 }} />
                <Text style={styles.backBtnPillText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueBtnYellow}
                onPress={handleStep1Continue}
                activeOpacity={0.88}
              >
                <Text style={styles.continueBtnYellowText}>Continue to Property Details</Text>
                <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 2: Property Details ================= */}
        {currentStep === 2 && (
          <View style={styles.mainCard}>
            <View style={styles.step1HeaderRow}>
              <View style={styles.step1IconBadge}>
                <FontAwesome5 name="building" size={20} color="#000000" />
              </View>
              <View style={styles.step1HeaderTextCol}>
                <Text style={styles.step1TitleText}>Step 2 – Property Details</Text>
                <Text style={styles.step1SubtitleText}>Tell us about the property you plan to finance</Text>
              </View>
            </View>

            {/* Property Type */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldIconCol}>
                <FontAwesome5 name="home" size={20} color="#0f172a" />
              </View>
              <View style={styles.fieldRightCol}>
                <Text style={styles.fieldLabel}>Property Type *</Text>
                <TouchableOpacity
                  style={styles.inputBoxDropdown}
                  onPress={() => setShowPropertyTypeModal(true)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.dropdownValueText}>{propertyType}</Text>
                  <Ionicons name="chevron-down" size={18} color="#0f172a" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Property Location */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldIconCol}>
                <Ionicons name="location-outline" size={24} color="#0f172a" />
              </View>
              <View style={styles.fieldRightCol}>
                <Text style={styles.fieldLabel}>Property Location / City *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Nanded, Maharashtra"
                    placeholderTextColor="#94a3b8"
                    value={propertyLocation}
                    onChangeText={setPropertyLocation}
                  />
                </View>
              </View>
            </View>

            {/* Estimated Property Value */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldIconCol}>
                <MaterialCommunityIcons name="currency-inr" size={24} color="#0f172a" />
              </View>
              <View style={styles.fieldRightCol}>
                <Text style={styles.fieldLabel}>Estimated Property Cost / Value *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. ₹75,00,000"
                    placeholderTextColor="#94a3b8"
                    value={propertyValue}
                    onChangeText={setPropertyValue}
                  />
                </View>
              </View>
            </View>

            <View style={styles.bottomBtnRow}>
              <TouchableOpacity
                style={styles.backBtnPill}
                onPress={() => setCurrentStep(1)}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color="#000000" style={{ marginRight: 6 }} />
                <Text style={styles.backBtnPillText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueBtnYellow}
                onPress={handleStep2Continue}
                activeOpacity={0.88}
              >
                <Text style={styles.continueBtnYellowText}>Continue to Income Details</Text>
                <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 3: Income Details ================= */}
        {currentStep === 3 && (
          <View style={styles.mainCard}>
            <View style={styles.step1HeaderRow}>
              <View style={styles.step1IconBadge}>
                <MaterialCommunityIcons name="briefcase-variant" size={24} color="#000000" />
              </View>
              <View style={styles.step1HeaderTextCol}>
                <Text style={styles.step1TitleText}>Step 3 – Income Details</Text>
                <Text style={styles.step1SubtitleText}>Share your monthly earning details</Text>
              </View>
            </View>

            {/* Employment Type */}
            <View style={styles.empRow}>
              <TouchableOpacity
                style={[styles.empOption, employmentType === 'Salaried' && styles.empOptionActive]}
                onPress={() => setEmploymentType('Salaried')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="briefcase-outline" size={22} color={employmentType === 'Salaried' ? '#004aad' : '#64748b'} />
                <Text style={[styles.empOptionText, employmentType === 'Salaried' && styles.empOptionTextActive]}>Salaried</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.empOption, employmentType === 'Self-Employed' && styles.empOptionActive]}
                onPress={() => setEmploymentType('Self-Employed')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="storefront-outline" size={22} color={employmentType === 'Self-Employed' ? '#004aad' : '#64748b'} />
                <Text style={[styles.empOptionText, employmentType === 'Self-Employed' && styles.empOptionTextActive]}>Self-Employed</Text>
              </TouchableOpacity>
            </View>

            {/* Monthly Net Income */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldIconCol}>
                <MaterialCommunityIcons name="sack-percent" size={24} color="#0f172a" />
              </View>
              <View style={styles.fieldRightCol}>
                <Text style={styles.fieldLabel}>Net Monthly Income *</Text>
                <TouchableOpacity
                  style={styles.inputBoxDropdown}
                  onPress={() => setShowIncomeModal(true)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.dropdownValueText}>{monthlyIncome}</Text>
                  <Ionicons name="chevron-down" size={18} color="#0f172a" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Required Loan Amount */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldIconCol}>
                <MaterialCommunityIcons name="cash-multiple" size={24} color="#0f172a" />
              </View>
              <View style={styles.fieldRightCol}>
                <Text style={styles.fieldLabel}>Required Loan Amount *</Text>
                <TouchableOpacity
                  style={styles.inputBoxDropdown}
                  onPress={() => setShowLoanAmountModal(true)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.dropdownValueText}>{requiredLoanAmount}</Text>
                  <Ionicons name="chevron-down" size={18} color="#0f172a" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tenure */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldIconCol}>
                <MaterialCommunityIcons name="calendar-clock" size={24} color="#0f172a" />
              </View>
              <View style={styles.fieldRightCol}>
                <Text style={styles.fieldLabel}>Loan Tenure *</Text>
                <TouchableOpacity
                  style={styles.inputBoxDropdown}
                  onPress={() => setShowTenureModal(true)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.dropdownValueText}>{tenureYears}</Text>
                  <Ionicons name="chevron-down" size={18} color="#0f172a" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.bottomBtnRow}>
              <TouchableOpacity
                style={styles.backBtnPill}
                onPress={() => setCurrentStep(2)}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color="#000000" style={{ marginRight: 6 }} />
                <Text style={styles.backBtnPillText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueBtnYellow}
                onPress={handleStep3Continue}
                activeOpacity={0.88}
              >
                <Text style={styles.continueBtnYellowText}>Continue to Documents</Text>
                <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 4: Documents Section (Exact Reference Layout) ================= */}
        {currentStep === 4 && (
          <View style={styles.mainCard}>
            {/* Header: Step 4 – Upload Documents */}
            <View style={styles.step4BannerHeader}>
              <View style={styles.step4UploadIconBox}>
                <Feather name="upload" size={26} color="#000000" />
              </View>
              <View style={styles.step4BannerTextCol}>
                <Text style={styles.step4BannerTitle}>Step 4 – Upload Documents</Text>
                <Text style={styles.step4BannerSubtitle}>
                  Upload clear and valid documents for faster loan approval
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
                    <Text style={styles.docRowTitle}>PAN Card</Text>
                    <View style={styles.mandatoryPill}>
                      <Text style={styles.mandatoryPillText}>Mandatory</Text>
                    </View>
                  </View>
                  <Text style={styles.docRowSubtitle}>Copy of your PAN Card (Front Side)</Text>
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
                    <Text style={styles.docRowTitle}>Aadhaar Card</Text>
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

              {/* Row 3: Address Proof */}
              <View style={styles.docRowItem}>
                <View style={styles.docLeftIconBadge}>
                  <View style={styles.docRoundIconWrap}>
                    <Ionicons name="home-outline" size={24} color="#002e75" />
                  </View>
                </View>
                <View style={styles.docInfoCol}>
                  <Text style={styles.docRowTitle}>Address Proof</Text>
                  <Text style={styles.docRowSubtitle}>Utility bill (Electricity / Water / Gas) / Rent Agreement</Text>
                </View>
                <TouchableOpacity
                  style={[styles.uploadPillBtn, uploadedDocs.addressProof && styles.uploadPillBtnDone]}
                  onPress={() => handleToggleDocUpload('addressProof')}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={uploadedDocs.addressProof ? 'checkmark-circle' : 'arrow-up'}
                    size={16}
                    color={uploadedDocs.addressProof ? '#16a34a' : '#004aad'}
                  />
                  <Text style={[styles.uploadPillBtnText, uploadedDocs.addressProof && styles.uploadPillBtnTextDone]}>
                    {uploadedDocs.addressProof ? 'Uploaded' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.docRowDivider} />

              {/* Row 4: Income Proof */}
              <View style={styles.docRowItem}>
                <View style={styles.docLeftIconBadge}>
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="file-document-outline" size={24} color="#002e75" />
                  </View>
                </View>
                <View style={styles.docInfoCol}>
                  <Text style={styles.docRowTitle}>Income Proof</Text>
                  <Text style={styles.docRowSubtitle}>Last 3 months' salary slips / ITR (Latest)</Text>
                </View>
                <TouchableOpacity
                  style={[styles.uploadPillBtn, uploadedDocs.incomeProof && styles.uploadPillBtnDone]}
                  onPress={() => handleToggleDocUpload('incomeProof')}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={uploadedDocs.incomeProof ? 'checkmark-circle' : 'arrow-up'}
                    size={16}
                    color={uploadedDocs.incomeProof ? '#16a34a' : '#004aad'}
                  />
                  <Text style={[styles.uploadPillBtnText, uploadedDocs.incomeProof && styles.uploadPillBtnTextDone]}>
                    {uploadedDocs.incomeProof ? 'Uploaded' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.docRowDivider} />

              {/* Row 5: Bank Statements */}
              <View style={styles.docRowItem}>
                <View style={styles.docLeftIconBadge}>
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="bank" size={24} color="#002e75" />
                  </View>
                </View>
                <View style={styles.docInfoCol}>
                  <Text style={styles.docRowTitle}>Bank Statements</Text>
                  <Text style={styles.docRowSubtitle}>Last 6 months' bank statements (Salary / Operating Account)</Text>
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

              {/* Row 6: Existing Loan Statement (if Available) */}
              <View style={styles.docRowItem}>
                <View style={styles.docLeftIconBadge}>
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="file-check-outline" size={24} color="#002e75" />
                  </View>
                </View>
                <View style={styles.docInfoCol}>
                  <View style={styles.docTitleWithBadgeRow}>
                    <Text style={styles.docRowTitle}>Existing Loan Statement</Text>
                    <Text style={styles.ifAvailableItalic}> (if Available)</Text>
                  </View>
                  <Text style={styles.docRowSubtitle}>Latest statement of your existing home loan / other loan (if any)</Text>
                </View>
                <TouchableOpacity
                  style={[styles.uploadPillBtn, uploadedDocs.existingLoanStatement && styles.uploadPillBtnDone]}
                  onPress={() => handleToggleDocUpload('existingLoanStatement')}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={uploadedDocs.existingLoanStatement ? 'checkmark-circle' : 'arrow-up'}
                    size={16}
                    color={uploadedDocs.existingLoanStatement ? '#16a34a' : '#004aad'}
                  />
                  <Text style={[styles.uploadPillBtnText, uploadedDocs.existingLoanStatement && styles.uploadPillBtnTextDone]}>
                    {uploadedDocs.existingLoanStatement ? 'Uploaded' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.docRowDivider} />

              {/* Row 7: Photograph (Applicant) */}
              <View style={styles.docRowItem}>
                <View style={styles.docLeftIconBadge}>
                  <View style={styles.docRoundIconWrap}>
                    <Ionicons name="person-outline" size={24} color="#002e75" />
                  </View>
                </View>
                <View style={styles.docInfoCol}>
                  <Text style={styles.docRowTitle}>Photograph (Applicant)</Text>
                  <Text style={styles.docRowSubtitle}>Recent passport-size photo (clear and front facing)</Text>
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

            {formError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            {/* Bottom Buttons: [Back] and [Submit Application ->] */}
            <View style={styles.bottomBtnRow}>
              <TouchableOpacity
                style={styles.backBtnPill}
                onPress={() => setCurrentStep(3)}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color="#000000" style={{ marginRight: 6 }} />
                <Text style={styles.backBtnPillText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueBtnYellow}
                onPress={handleStep4Continue}
                activeOpacity={0.88}
              >
                <Text style={styles.continueBtnYellowText}>Submit Application</Text>
                <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 5: Submit / Review Application ================= */}
        {currentStep === 5 && (
          <>
            {!submittedApp ? (
              <View style={styles.mainCard}>
                {/* Step 5 Title Header */}
                <View style={styles.step5TitleCard}>
                  <View style={styles.step5TitleIconWrap}>
                    <MaterialCommunityIcons name="file-document-check" size={26} color="#000000" />
                  </View>
                  <View style={styles.step5TitleTextCol}>
                    <Text style={styles.step5MainHeading}>Step 5 – Submit Application</Text>
                    <Text style={styles.step5SubHeading}>
                      Please review your details and submit your home loan application.
                    </Text>
                  </View>
                </View>

                {/* Application Summary Card */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardTitle}>Application Summary</Text>
                    <TouchableOpacity
                      style={styles.editBtnTouch}
                      onPress={() => setCurrentStep(1)}
                      activeOpacity={0.7}
                    >
                      <Feather name="edit-2" size={14} color="#004aad" style={{ marginRight: 4 }} />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.summaryTable}>
                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <Feather name="user" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Applicant Name</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>{fullName}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <Feather name="phone" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Mobile Number</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>+91 {mobileNumber}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <MaterialCommunityIcons name="office-building" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Employment Type</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>{employmentType}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <MaterialCommunityIcons name="currency-inr" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Monthly Income</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>{monthlyIncome}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <FontAwesome5 name="home" size={15} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Property Type</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>{propertyType}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <Ionicons name="location-outline" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Property Location</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>{propertyLocation}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <MaterialCommunityIcons name="currency-inr" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Property Value</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>{propertyValue}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <MaterialCommunityIcons name="cash-multiple" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Required Loan Amount</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValueHighlight}>{requiredLoanAmount}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <MaterialCommunityIcons name="calendar-clock" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Tenure</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>{tenureYears}</Text>
                    </View>
                  </View>
                </View>

                {/* Uploaded Documents Card (7/7) */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="file-document-outline" size={18} color="#002e75" />
                      <Text style={styles.summaryCardTitle}>Uploaded Documents ({uploadedCount}/{totalDocsCount})</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.editBtnTouch}
                      onPress={() => setCurrentStep(4)}
                      activeOpacity={0.7}
                    >
                      <Feather name="edit-2" size={14} color="#004aad" style={{ marginRight: 4 }} />
                      <Text style={styles.editBtnText}>Edit / Add</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.docGridRow}>
                    <View style={styles.docGridCol}>
                      <View style={styles.docBadgeBox}>
                        <MaterialCommunityIcons name="card-account-details-outline" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>
                          PAN Card <Text style={styles.mandatoryRed}>(Mandatory)</Text>
                        </Text>
                        <Ionicons
                          name={uploadedDocs.panCard ? 'checkmark-circle' : 'alert-circle'}
                          size={18}
                          color={uploadedDocs.panCard ? '#16a34a' : '#94a3b8'}
                        />
                      </View>

                      <View style={styles.docBadgeBox}>
                        <MaterialCommunityIcons name="card-text-outline" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>
                          Aadhaar Card <Text style={styles.mandatoryRed}>(Mandatory)</Text>
                        </Text>
                        <Ionicons
                          name={uploadedDocs.aadhaarCard ? 'checkmark-circle' : 'alert-circle'}
                          size={18}
                          color={uploadedDocs.aadhaarCard ? '#16a34a' : '#94a3b8'}
                        />
                      </View>

                      <View style={styles.docBadgeBox}>
                        <Ionicons name="home-outline" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>Address Proof</Text>
                        <Ionicons
                          name={uploadedDocs.addressProof ? 'checkmark-circle' : 'alert-circle'}
                          size={18}
                          color={uploadedDocs.addressProof ? '#16a34a' : '#94a3b8'}
                        />
                      </View>

                      <View style={styles.docBadgeBox}>
                        <MaterialCommunityIcons name="file-document-outline" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>Income Proof</Text>
                        <Ionicons
                          name={uploadedDocs.incomeProof ? 'checkmark-circle' : 'alert-circle'}
                          size={18}
                          color={uploadedDocs.incomeProof ? '#16a34a' : '#94a3b8'}
                        />
                      </View>
                    </View>

                    <View style={styles.docGridCol}>
                      <View style={styles.docBadgeBox}>
                        <MaterialCommunityIcons name="bank" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>Bank Statements</Text>
                        <Ionicons
                          name={uploadedDocs.bankStatements ? 'checkmark-circle' : 'alert-circle'}
                          size={18}
                          color={uploadedDocs.bankStatements ? '#16a34a' : '#94a3b8'}
                        />
                      </View>

                      <View style={styles.docBadgeBox}>
                        <MaterialCommunityIcons name="file-check-outline" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>
                          Existing Loan Statement{'\n'}
                          <Text style={styles.optionalGray}>(If Available)</Text>
                        </Text>
                        <Ionicons
                          name={uploadedDocs.existingLoanStatement ? 'checkmark-circle' : 'alert-circle'}
                          size={18}
                          color={uploadedDocs.existingLoanStatement ? '#16a34a' : '#94a3b8'}
                        />
                      </View>

                      <View style={styles.docBadgeBox}>
                        <Ionicons name="person-outline" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>
                          Photograph{'\n'}
                          <Text style={styles.optionalGray}>(Applicant)</Text>
                        </Text>
                        <Ionicons
                          name={uploadedDocs.photograph ? 'checkmark-circle' : 'alert-circle'}
                          size={18}
                          color={uploadedDocs.photograph ? '#16a34a' : '#94a3b8'}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Confirmation Checkbox */}
                <View style={styles.finalConfirmContainer}>
                  <TouchableOpacity
                    style={styles.finalCheckboxTouch}
                    onPress={() => setIsFinalConfirmed(!isFinalConfirmed)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.finalCheckSquare, isFinalConfirmed && styles.finalCheckSquareChecked]}>
                      {isFinalConfirmed && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                    </View>
                  </TouchableOpacity>

                  <Text style={styles.finalConfirmText}>
                    I hereby confirm that the information provided is true and correct. I authorize{' '}
                    <Text style={{ fontWeight: '800', color: '#002e75' }}>Loan Point</Text> to share my
                    application and documents with relevant banks/NBFCs for Home Loan processing.
                  </Text>
                </View>

                {formError ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color="#ef4444" />
                    <Text style={styles.errorText}>{formError}</Text>
                  </View>
                ) : null}

                <View style={styles.bottomBtnRow}>
                  <TouchableOpacity
                    style={styles.backBtnPill}
                    onPress={() => setCurrentStep(4)}
                    activeOpacity={0.8}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="arrow-back" size={18} color="#000000" style={{ marginRight: 6 }} />
                    <Text style={styles.backBtnPillText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.continueBtnYellow, isSubmitting && { opacity: 0.7 }]}
                    onPress={handleFinalSubmit}
                    activeOpacity={0.88}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <>
                        <Text style={styles.continueBtnYellowText}>Submit Application</Text>
                        <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Post-Submission Success View */
              <View style={styles.postSubmitContainer}>
                <View style={styles.celebrationHeroWrap}>
                  <View style={styles.scallopedGreenBadge}>
                    <Ionicons name="checkmark" size={38} color="#ffffff" />
                  </View>
                  <Text style={styles.postSubmitTitle}>Application Submitted{'\n'}Successfully!</Text>
                  <Text style={styles.postSubmitSubtitle}>
                    Thank you for choosing Loan Point.{'\n'}Your Home Loan application has been received.
                  </Text>
                </View>

                {/* Application ID & Date */}
                <View style={styles.appMetaDualCard}>
                  <View style={styles.appMetaLeftPill}>
                    <View style={styles.appMetaIconWrap}>
                      <MaterialCommunityIcons name="file-document-outline" size={24} color="#004aad" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.appMetaLabel}>Application ID</Text>
                      <Text style={styles.appMetaIdVal}>{submittedApp.id}</Text>
                    </View>
                  </View>

                  <View style={styles.appMetaDivider} />

                  <View style={styles.appMetaRightPill}>
                    <View style={styles.appMetaIconWrap}>
                      <MaterialCommunityIcons name="calendar-clock-outline" size={24} color="#004aad" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.appMetaLabel}>Submitted On</Text>
                      <Text style={styles.appMetaDateVal}>{submittedDateString || 'Today'}</Text>
                    </View>
                  </View>
                </View>

                {/* Relationship Manager (Arvind Patil) */}
                <View style={styles.managerCard}>
                  <View style={styles.managerLeftRow}>
                    <View style={styles.managerAvatarFrame}>
                      <MaterialCommunityIcons name="face-agent" size={32} color="#002e75" />
                    </View>
                    <View style={styles.managerInfoCol}>
                      <Text style={styles.managerRoleLabel}>Your Relationship Manager</Text>
                      <Text style={styles.managerNameText}>Arvind Patil</Text>
                      <TouchableOpacity
                        style={styles.managerPhoneRow}
                        onPress={() => Linking.openURL('tel:+919545555999')}
                      >
                        <Ionicons name="call" size={14} color="#16a34a" />
                        <Text style={styles.managerPhoneText}>+91 95455 55999</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.managerActionsCol}>
                    <TouchableOpacity
                      style={styles.mgrCallBtn}
                      onPress={() => Linking.openURL('tel:+919545555999')}
                    >
                      <Ionicons name="call" size={15} color="#000000" style={{ marginRight: 5 }} />
                      <Text style={styles.mgrCallBtnText}>Call Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.mgrWhatsAppBtn}
                      onPress={() =>
                        Linking.openURL(
                          `https://wa.me/919545555999?text=${encodeURIComponent(
                            `Hello Arvind Patil, I have submitted my Home Loan application (${submittedApp.id}). Please assist.`
                          )}`
                        )
                      }
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="#ffffff" style={{ marginRight: 5 }} />
                      <Text style={styles.mgrWhatsAppBtnText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.bottomBtnRow}>
                  <TouchableOpacity
                    style={styles.backBtnPill}
                    onPress={onCancel}
                  >
                    <Ionicons name="home-outline" size={18} color="#000000" style={{ marginRight: 6 }} />
                    <Text style={styles.backBtnPillText}>Home</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.continueBtnYellow}
                    onPress={() => onSuccess(submittedApp)}
                  >
                    <Text style={styles.continueBtnYellowText}>Track My Application</Text>
                    <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Date of Birth Picker Modal */}
      <Modal visible={showDobModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
              <TouchableOpacity onPress={() => setShowDobModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 10 }}>
              {['15 Aug 1990', '10 Jun 1993', '22 Jan 1995', '05 May 1988', '18 Sep 1985'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.modalOption}
                  onPress={() => {
                    setDateOfBirth(d);
                    setShowDobModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* City Picker Modal */}
      <Modal visible={showCityModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <View style={styles.citySearchBox}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.citySearchInput}
                placeholder="Search city..."
                placeholderTextColor="#94a3b8"
                value={citySearch}
                onChangeText={setCitySearch}
              />
            </View>

            <FlatList
              data={filteredCities}
              keyExtractor={(item, idx) => `${item.city}-${idx}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, city === item.city && styles.modalOptionSelected]}
                  onPress={() => {
                    setCity(item.city);
                    setShowCityModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item.city}</Text>
                  <Text style={styles.modalOptionSubText}>{item.state}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Property Type Modal */}
      <Modal visible={showPropertyTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Property Type</Text>
              <TouchableOpacity onPress={() => setShowPropertyTypeModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={propertyTypeOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, propertyType === item && styles.modalOptionSelected]}
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

      {/* Income Modal */}
      <Modal visible={showIncomeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Monthly Income Range</Text>
              <TouchableOpacity onPress={() => setShowIncomeModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={incomeOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, monthlyIncome === item && styles.modalOptionSelected]}
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

      {/* Loan Amount Modal */}
      <Modal visible={showLoanAmountModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Loan Amount</Text>
              <TouchableOpacity onPress={() => setShowLoanAmountModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={loanAmountOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, requiredLoanAmount === item && styles.modalOptionSelected]}
                  onPress={() => {
                    setRequiredLoanAmount(item);
                    setShowLoanAmountModal(false);
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
      <Modal visible={showTenureModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
                  style={[styles.modalOption, tenureYears === item && styles.modalOptionSelected]}
                  onPress={() => {
                    setTenureYears(item);
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
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 170,
    height: 38,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroBannerImageContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBannerImage: {
    width: SCREEN_WIDTH,
    height: Math.round(SCREEN_WIDTH * (342 / 1024)),
  },
  heroBanner: {
    width: '100%',
    minHeight: 125,
    backgroundColor: '#002e75',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  heroSunCircle: {
    position: 'absolute',
    right: -25,
    top: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fbbf24',
    opacity: 0.85,
  },
  heroContentLeft: {
    flex: 1,
    paddingRight: 10,
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroTitleYellow: {
    color: '#ffd700',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#e2e8f0',
    lineHeight: 16,
    fontWeight: '500',
  },
  heroGraphicRight: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
    marginLeft: 6,
  },
  homePillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001b44',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
    gap: 3,
  },
  homePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  homeCircleFrame: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0284c7',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  keysBubble: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffd700',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 60,
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
  mainCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  step1HeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  step1IconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffd700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  step1HeaderTextCol: {
    flex: 1,
  },
  step1TitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#001b44',
    marginBottom: 2,
  },
  step1SubtitleText: {
    fontSize: 12,
    color: '#475569',
  },
  fieldGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  fieldIconCol: {
    width: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 18,
  },
  fieldRightCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 5,
  },
  requiredStar: {
    color: '#ef4444',
  },
  inputBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: 'center',
  },
  inputBoxDropdown: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textInput: {
    fontSize: 14,
    color: '#0f172a',
    padding: 0,
    margin: 0,
  },
  dropdownValueText: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
  },
  placeholderText: {
    color: '#94a3b8',
    fontWeight: '400',
  },
  safetyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
    marginVertical: 14,
    gap: 10,
  },
  shieldGreenCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 2,
  },
  safetySub: {
    fontSize: 11,
    color: '#475569',
  },
  bottomBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  backBtnPill: {
    width: 100,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  continueBtnYellow: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffd700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueBtnYellowText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  empRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  empOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  empOptionActive: {
    borderColor: '#004aad',
    backgroundColor: '#eff6ff',
  },
  empOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  empOptionTextActive: {
    color: '#004aad',
    fontWeight: '800',
  },
  uploadItemBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadItemBoxDone: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  uploadItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  uploadIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconBadgeDone: {
    backgroundColor: '#16a34a',
  },
  uploadItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  uploadItemDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  uploadActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 4,
  },
  uploadActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004aad',
  },
  mandatoryRed: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '700',
  },
  step5TitleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  step5TitleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffd700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  step5TitleTextCol: {
    flex: 1,
  },
  step5MainHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 2,
  },
  step5SubHeading: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  summaryCard: {
    marginBottom: 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#dbeafe',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#002e75',
  },
  editBtnTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#004aad',
  },
  summaryTable: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  rowLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 140,
    gap: 6,
  },
  rowIcon: {
    width: 18,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  summaryColon: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
    marginRight: 10,
  },
  summaryValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
    flex: 1,
  },
  summaryValueHighlight: {
    fontSize: 14,
    color: '#002e75',
    fontWeight: '900',
    flex: 1,
  },
  docGridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  docGridCol: {
    flex: 1,
    gap: 8,
  },
  docBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  docBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginHorizontal: 6,
    lineHeight: 13,
  },
  finalConfirmContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 4,
    gap: 10,
  },
  finalCheckboxTouch: {
    marginTop: 2,
  },
  finalCheckSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalCheckSquareChecked: {
    backgroundColor: '#004aad',
    borderColor: '#004aad',
  },
  finalConfirmText: {
    flex: 1,
    fontSize: 12,
    color: '#1e293b',
    lineHeight: 18,
  },
  postSubmitContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingBottom: 20,
  },
  celebrationHeroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 12,
    position: 'relative',
  },
  scallopedGreenBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#16a34a',
    borderWidth: 3,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 12,
  },
  postSubmitTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#001b44',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
    lineHeight: 28,
  },
  postSubmitSubtitle: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  appMetaDualCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  appMetaLeftPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appMetaRightPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appMetaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appMetaLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  appMetaIdVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#002e75',
  },
  appMetaDateVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 14,
  },
  appMetaDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
  },
  managerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  managerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  managerAvatarFrame: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#ffd700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  managerInfoCol: {
    flex: 1,
  },
  managerRoleLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 1,
  },
  managerNameText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#002e75',
    marginBottom: 2,
  },
  managerPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  managerPhoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  managerActionsCol: {
    gap: 6,
  },
  mgrCallBtn: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
  },
  mgrCallBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  mgrWhatsAppBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
  },
  mgrWhatsAppBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  citySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
    gap: 8,
  },
  citySearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    padding: 0,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  modalOptionSelected: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  modalOptionText: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  modalOptionSubText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
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
  ifAvailableItalic: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#002e75',
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
  optionalGray: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
  },
});

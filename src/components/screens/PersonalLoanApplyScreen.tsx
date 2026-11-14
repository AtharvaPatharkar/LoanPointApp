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
import { COMPANY_INFO } from '../../data/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PersonalLoanApplyScreenProps {
  user: UserProfile | null;
  onSuccess: (newApp: LoanApplication) => void;
  onCancel: () => void;
}

interface UploadedDocState {
  panCard: boolean;
  aadhaarCard: boolean;
  addressProof: boolean;
  incomeProof: boolean;
  bankStatements: boolean;
  existingLoanStatement: boolean;
  photograph: boolean;
}

export const PersonalLoanApplyScreen: React.FC<PersonalLoanApplyScreenProps> = ({
  user,
  onSuccess,
  onCancel,
}) => {
  // Current step state: 1: Basic Details, 2: Employment, 3: Loan Details, 4: Documents, 5: Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // ---------------- STEP 1: Basic Details ----------------
  const [fullName, setFullName] = useState<string>(user?.name || 'Arvind Patil');
  const [mobileNumber, setMobileNumber] = useState<string>(user?.mobile || '9823012345');
  const [emailId, setEmailId] = useState<string>(user?.email || 'arvind.patil@example.com');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('₹1,20,000');
  const [city, setCity] = useState<string>(user?.city || 'Nanded, Maharashtra');
  const [loanAmount, setLoanAmount] = useState<string>('₹5,00,000');
  const [loanTenure, setLoanTenure] = useState<string>('3 Years (36 Months)');
  const [isAgreedStep1, setIsAgreedStep1] = useState<boolean>(true);

  // ---------------- STEP 2: Employment Details ----------------
  const [employmentType, setEmploymentType] = useState<'Salaried' | 'Self-Employed'>('Salaried');
  const [companyName, setCompanyName] = useState<string>('Tech Mahindra Ltd');
  const [workExperience, setWorkExperience] = useState<string>('5 - 10 Years');
  const [monthlySalaryInHand, setMonthlySalaryInHand] = useState<string>('120000');
  const [salaryBankAccount, setSalaryBankAccount] = useState<string>('HDFC Bank');
  const [companyType, setCompanyType] = useState<string>('Private Limited (Pvt Ltd)');

  // ---------------- STEP 3: Loan Details ----------------
  const [detailedLoanAmount, setDetailedLoanAmount] = useState<string>(loanAmount || '₹5,00,000');
  const [detailedTenure, setDetailedTenure] = useState<string>(loanTenure || '3 Years (36 Months)');
  const [loanPurpose, setLoanPurpose] = useState<string>('Debt Consolidation');
  const [existingEmi, setExistingEmi] = useState<string>('No Existing EMI');
  const [cibilScoreRange, setCibilScoreRange] = useState<string>('750 and Above (Excellent)');
  const [hasCreditCard, setHasCreditCard] = useState<'Yes' | 'No'>('Yes');

  // ---------------- STEP 4: Documents ----------------
  const [panNumber, setPanNumber] = useState<string>(user?.panNumber || 'ABCDE1234F');
  const [aadhaarNumber, setAadhaarNumber] = useState<string>(user?.aadhaarNumber || '987654321012');
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocState>({
    panCard: true,
    aadhaarCard: true,
    addressProof: true,
    incomeProof: true,
    bankStatements: true,
    existingLoanStatement: true,
    photograph: true,
  });

  // ---------------- STEP 5: Final Confirmation Checkbox & Submitted Data ----------------
  const [isFinalConfirmed, setIsFinalConfirmed] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedApp, setSubmittedApp] = useState<LoanApplication | null>(null);
  const [submittedDateString, setSubmittedDateString] = useState<string>('');

  // ---------------- Modals State ----------------
  const [showIncomeModal, setShowIncomeModal] = useState<boolean>(false);
  const [showCityModal, setShowCityModal] = useState<boolean>(false);
  const [showAmountModal, setShowAmountModal] = useState<boolean>(false);
  const [showTenureModal, setShowTenureModal] = useState<boolean>(false);
  const [showExpModal, setShowExpModal] = useState<boolean>(false);
  const [showBankModal, setShowBankModal] = useState<boolean>(false);
  const [showCompanyTypeModal, setShowCompanyTypeModal] = useState<boolean>(false);
  const [showPurposeModal, setShowPurposeModal] = useState<boolean>(false);
  const [showExistingEmiModal, setShowExistingEmiModal] = useState<boolean>(false);
  const [showCibilModal, setShowCibilModal] = useState<boolean>(false);

  // City search
  const [citySearch, setCitySearch] = useState<string>('');
  const [allCities, setAllCities] = useState<CityResultItem[]>(cityLocationService.getFallbackCities());

  // Error validation
  const [formError, setFormError] = useState<string | null>(null);

  // Options for Dropdowns
  const incomeRanges = [
    '₹15,000 - ₹25,000',
    '₹25,000 - ₹50,000',
    '₹50,000 - ₹75,000',
    '₹75,000 - ₹1,00,000',
    '₹1,20,000',
    '₹1,00,000 - ₹1,50,000',
    'Above ₹1,50,000',
  ];

  const amountOptions = [
    '₹50,000',
    '₹1,00,000',
    '₹2,00,000',
    '₹3,00,000',
    '₹5,00,000',
    '₹7,50,000',
    '₹10,00,000',
    '₹15,00,000',
    '₹20,00,000',
    '₹25,00,000',
    '₹30,00,000',
    '₹40,00,000',
    '₹50,00,000',
  ];

  const tenureOptions = [
    '1 Year (12 Months)',
    '2 Years (24 Months)',
    '3 Years (36 Months)',
    '4 Years (48 Months)',
    '5 Years (60 Months)',
    '6 Years (72 Months)',
    '7 Years (84 Months)',
  ];

  const experienceOptions = [
    'Less than 1 Year',
    '1 - 2 Years',
    '2 - 3 Years',
    '3 - 5 Years',
    '5 - 10 Years',
    'More than 10 Years',
  ];

  const bankOptions = [
    'State Bank of India (SBI)',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Kotak Mahindra Bank',
    'Punjab National Bank (PNB)',
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India',
    'IDFC FIRST Bank',
    'IndusInd Bank',
    'Yes Bank',
    'Other Bank',
  ];

  const companyTypeOptions = [
    'Private Limited (Pvt Ltd)',
    'Public Limited',
    'Government / PSU',
    'Partnership Firm',
    'Proprietorship',
    'LLP (Limited Liability Partnership)',
    'MNC (Multinational Corporation)',
    'NGO / Trust',
    'Other',
  ];

  const purposeOptions = [
    'Debt Consolidation',
    'Medical Emergency',
    'Home Renovation / Repair',
    'Wedding / Family Function',
    'Travel / Vacation',
    'Higher Education',
    'Business Expansion',
    'Two Wheeler / Car Purchase',
    'Consumer Electronics / Household',
    'Personal / Other Needs',
  ];

  const existingEmiOptions = [
    'No Existing EMI',
    'Below ₹5,000 / month',
    '₹5,000 - ₹10,000 / month',
    '₹10,000 - ₹20,000 / month',
    '₹20,000 - ₹50,000 / month',
    'Above ₹50,000 / month',
  ];

  const cibilOptions = [
    '750 and Above (Excellent)',
    '700 - 749 (Good)',
    '650 - 699 (Average)',
    'Below 650 (Needs Improvement)',
    'New to Credit (No CIBIL History)',
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

  // Step 1 Continue Handler
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

    if (!monthlyIncome) {
      setFormError('Please select your monthly income range');
      return;
    }

    if (!city.trim()) {
      setFormError('Please select your city');
      return;
    }

    if (!loanAmount) {
      setFormError('Please select loan amount requirement');
      return;
    }

    if (!loanTenure) {
      setFormError('Please select loan tenure');
      return;
    }

    if (!isAgreedStep1) {
      setFormError('Please agree to terms & conditions and privacy policy to continue');
      return;
    }

    setDetailedLoanAmount(loanAmount);
    setDetailedTenure(loanTenure);
    setCurrentStep(2);
  };

  // Step 2 Continue Handler -> Opens Step 3 (Loan Details)
  const handleStep2Continue = () => {
    setFormError(null);

    if (!companyName.trim()) {
      setFormError('Please enter company / organization name');
      return;
    }

    if (!workExperience) {
      setFormError('Please select your work experience');
      return;
    }

    if (!monthlySalaryInHand.trim()) {
      setFormError('Please enter your monthly salary (in hand)');
      return;
    }

    if (!salaryBankAccount) {
      setFormError('Please select your salary bank account');
      return;
    }

    if (!companyType) {
      setFormError('Please select your company type');
      return;
    }

    setCurrentStep(3);
  };

  // Step 3 Continue Handler -> Opens Step 4 (Documents)
  const handleStep3Continue = () => {
    setFormError(null);

    if (!detailedLoanAmount) {
      setFormError('Please select required loan amount');
      return;
    }

    if (!detailedTenure) {
      setFormError('Please select required tenure');
      return;
    }

    if (!loanPurpose) {
      setFormError('Please select loan purpose');
      return;
    }

    setCurrentStep(4);
  };

  // Step 4 Continue Handler -> Opens Step 5 (Submit / Review)
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

  // Step 5 Final Submit Handler
  const handleFinalSubmit = async () => {
    setFormError(null);

    if (!isFinalConfirmed) {
      setFormError('Please confirm the verification checkbox to submit your application');
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      const numericAmount = parseInt(detailedLoanAmount.replace(/[^0-9]/g, ''), 10) || 500000;
      const tenureMatch = detailedTenure.match(/(\d+)\s*Months/);
      const tenureMonths = tenureMatch ? parseInt(tenureMatch[1], 10) : 36;
      const numericSalary = parseInt(monthlySalaryInHand.replace(/[^0-9]/g, ''), 10) || 120000;

      const app = await loanService.submitEnquiry({
        loanType: 'personal',
        applicantName: fullName.trim(),
        mobile: cleanMobile,
        requestedAmount: numericAmount,
        tenureMonths: tenureMonths,
        monthlyIncome: numericSalary,
        employmentType: employmentType,
        city: city.trim(),
        panNumber: panNumber.trim().toUpperCase() || undefined,
        aadhaarNumber: aadhaarNumber.replace(/\D/g, '') || undefined,
        purpose: `Personal Loan | ${companyName.trim()} (${companyType}) | Bank: ${salaryBankAccount} | Purpose: ${loanPurpose} | Existing EMI: ${existingEmi} | CIBIL: ${cibilScoreRange}`,
      });

      // Format current timestamp e.g. "12 Nov 2026, 09:41 AM"
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
  const handleToggleDocUpload = (key: keyof UploadedDocState, label: string) => {
    setUploadedDocs((prev) => {
      const newState = !prev[key];
      return { ...prev, [key]: newState };
    });
  };

  const stepsList = [
    { num: 1, label: 'Basic Details' },
    { num: 2, label: 'Employment' },
    { num: 3, label: 'Loan Details' },
    { num: 4, label: 'Documents' },
    { num: 5, label: 'Submit' },
  ];

  return (
    <View style={styles.screen}>
      {/* 1. Header Bar: Back arrow and LOAN POINT logo */}
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
        {/* 2. Hero Section */}
        <View style={styles.heroBanner}>
          <View style={styles.heroSunCircle} />

          <View style={styles.heroContentLeft}>
            <Text style={styles.heroTitle}>
              Personal Loan <Text style={styles.heroTitleYellow}>Application</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              {submittedApp
                ? 'Application Submitted Successfully!'
                : currentStep === 5
                ? 'Review & Submit Your Application'
                : currentStep === 4
                ? 'Upload KYC & Income Documents'
                : currentStep === 3
                ? 'Customize Your Loan Details'
                : currentStep === 2
                ? 'Employment & Income Details'
                : 'Fill basic details to get best loan offer'}
            </Text>
          </View>

          <View style={styles.heroGraphicRight}>
            <View style={styles.avatarPillBadge}>
              <MaterialCommunityIcons name="shield-check" size={14} color="#ffd700" />
              <Text style={styles.avatarPillText}>Verified</Text>
            </View>
            <View style={styles.avatarCircleFrame}>
              <FontAwesome5 name="user-tie" size={48} color="#ffffff" />
            </View>
            <View style={styles.thumbsUpBubble}>
              <Ionicons name="thumbs-up" size={15} color="#002e75" />
            </View>
          </View>
        </View>

        {/* 3. 5-Step Tracker (Hidden on Post-Submit Success Screen to match reference design) */}
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

        {/* ================= STEP 1 VIEW ================= */}
        {currentStep === 1 && (
          <>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <View style={styles.inputIconCol}>
                  <Feather name="user" size={24} color="#0f172a" />
                </View>
                <View style={styles.inputRightCol}>
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

              <View style={styles.inputGroup}>
                <View style={styles.inputIconCol}>
                  <Feather name="phone" size={24} color="#0f172a" />
                </View>
                <View style={styles.inputRightCol}>
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

              <View style={styles.inputGroup}>
                <View style={styles.inputIconCol}>
                  <Feather name="mail" size={24} color="#0f172a" />
                </View>
                <View style={styles.inputRightCol}>
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

              <View style={styles.twoColRow}>
                <View style={styles.halfColGroup}>
                  <View style={styles.twoColIconCol}>
                    <MaterialCommunityIcons name="sack-percent" size={24} color="#0f172a" />
                  </View>
                  <View style={styles.twoColRight}>
                    <Text style={styles.fieldLabel} numberOfLines={1}>
                      Monthly Income <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.dropdownBox}
                      onPress={() => setShowIncomeModal(true)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {monthlyIncome || 'Select Income Range'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.halfColGroup}>
                  <View style={styles.twoColIconCol}>
                    <Ionicons name="location-outline" size={24} color="#0f172a" />
                  </View>
                  <View style={styles.twoColRight}>
                    <Text style={styles.fieldLabel} numberOfLines={1}>
                      City <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.dropdownBox}
                      onPress={() => setShowCityModal(true)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {city || 'Select City'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.requirementCard}>
              <View style={styles.reqHeaderRow}>
                <View style={styles.reqIconWrap}>
                  <MaterialCommunityIcons name="file-document-edit" size={22} color="#f59e0b" />
                </View>
                <Text style={styles.reqTitle}>Loan Requirement</Text>
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.halfColGroup}>
                  <View style={styles.twoColIconCol}>
                    <MaterialCommunityIcons name="cash-multiple" size={24} color="#0f172a" />
                  </View>
                  <View style={styles.twoColRight}>
                    <Text style={styles.fieldLabel} numberOfLines={1}>
                      Loan Amount <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.dropdownBox}
                      onPress={() => setShowAmountModal(true)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {loanAmount || 'Select Amount'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.halfColGroup}>
                  <View style={styles.twoColIconCol}>
                    <MaterialCommunityIcons name="calendar-clock" size={24} color="#0f172a" />
                  </View>
                  <View style={styles.twoColRight}>
                    <Text style={styles.fieldLabel} numberOfLines={1}>
                      Loan Tenure <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.dropdownBox}
                      onPress={() => setShowTenureModal(true)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {loanTenure || 'Select Tenure'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkboxTouch}
                onPress={() => setIsAgreedStep1(!isAgreedStep1)}
                activeOpacity={0.7}
              >
                <View style={[styles.customBox, isAgreedStep1 && styles.customBoxChecked]}>
                  {isAgreedStep1 && <Ionicons name="checkmark" size={16} color="#004aad" />}
                </View>
              </TouchableOpacity>

              <Text style={styles.agreementText}>
                I agree to be contacted by Loan Point & its lending partners for my loan application. I accept the{' '}
                <Text style={styles.linkText}>Terms & Conditions</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>.
              </Text>
            </View>

            {formError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleStep1Continue}
              activeOpacity={0.88}
            >
              <Text style={styles.continueText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#000000" style={styles.continueArrow} />
            </TouchableOpacity>
          </>
        )}

        {/* ================= STEP 2 VIEW ================= */}
        {currentStep === 2 && (
          <>
            <View style={styles.formCard}>
              <View style={styles.reqHeaderRow}>
                <View style={styles.reqIconWrap}>
                  <MaterialCommunityIcons name="briefcase-variant" size={22} color="#f59e0b" />
                </View>
                <Text style={styles.reqTitle}>Employment Details</Text>
              </View>

              <Text style={styles.fieldLabel}>
                Employment Type <Text style={styles.requiredStar}>*</Text>
              </Text>

              <View style={styles.empTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.empTypeCard,
                    employmentType === 'Salaried' && styles.empTypeCardActive,
                  ]}
                  onPress={() => setEmploymentType('Salaried')}
                  activeOpacity={0.8}
                >
                  <View style={styles.empCardTopRow}>
                    <MaterialCommunityIcons name="briefcase-outline" size={28} color="#0284c7" />
                    <View
                      style={[
                        styles.empRadioOuter,
                        employmentType === 'Salaried' && styles.empRadioOuterActive,
                      ]}
                    >
                      {employmentType === 'Salaried' && <View style={styles.empRadioInner} />}
                    </View>
                  </View>
                  <Text style={styles.empCardTitle}>Salaried</Text>
                  <Text style={styles.empCardSub}>Working with a company</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.empTypeCard,
                    employmentType === 'Self-Employed' && styles.empTypeCardActive,
                  ]}
                  onPress={() => setEmploymentType('Self-Employed')}
                  activeOpacity={0.8}
                >
                  <View style={styles.empCardTopRow}>
                    <MaterialCommunityIcons name="storefront-outline" size={28} color="#f59e0b" />
                    <View
                      style={[
                        styles.empRadioOuter,
                        employmentType === 'Self-Employed' && styles.empRadioOuterActive,
                      ]}
                    >
                      {employmentType === 'Self-Employed' && <View style={styles.empRadioInner} />}
                    </View>
                  </View>
                  <Text style={styles.empCardTitle}>Self-Employed</Text>
                  <Text style={styles.empCardSub}>Business / Freelancer</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIconCol}>
                  <MaterialCommunityIcons name="office-building" size={24} color="#0f172a" />
                </View>
                <View style={styles.inputRightCol}>
                  <Text style={styles.fieldLabel}>
                    Company / Organization Name <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter company name"
                      placeholderTextColor="#94a3b8"
                      value={companyName}
                      onChangeText={setCompanyName}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.halfColGroup}>
                  <View style={styles.twoColIconCol}>
                    <MaterialCommunityIcons name="account-cog-outline" size={24} color="#0f172a" />
                  </View>
                  <View style={styles.twoColRight}>
                    <Text style={styles.fieldLabel} numberOfLines={1}>
                      Work Experience <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.dropdownBox}
                      onPress={() => setShowExpModal(true)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {workExperience || 'Select Experience'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.halfColGroup}>
                  <View style={styles.twoColIconCol}>
                    <MaterialCommunityIcons name="cash-fast" size={24} color="#0f172a" />
                  </View>
                  <View style={styles.twoColRight}>
                    <Text style={styles.fieldLabel} numberOfLines={1}>
                      Monthly Salary (In Hand) <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <View style={styles.inputBox}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="₹ Enter monthly salary"
                        placeholderTextColor="#94a3b8"
                        keyboardType="number-pad"
                        value={monthlySalaryInHand}
                        onChangeText={setMonthlySalaryInHand}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={[styles.inputGroup, { marginTop: 14 }]}>
                <View style={styles.inputIconCol}>
                  <MaterialCommunityIcons name="bank-outline" size={24} color="#0f172a" />
                </View>
                <View style={styles.inputRightCol}>
                  <Text style={styles.fieldLabel}>
                    Salary Bank Account <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownBox}
                    onPress={() => setShowBankModal(true)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                      {salaryBankAccount || 'Select Bank'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#0f172a" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIconCol}>
                  <MaterialCommunityIcons name="domain" size={24} color="#0f172a" />
                </View>
                <View style={styles.inputRightCol}>
                  <Text style={styles.fieldLabel}>
                    Company Type <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownBox}
                    onPress={() => setShowCompanyTypeModal(true)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                      {companyType || 'Select Company Type'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#0f172a" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {formError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <View style={styles.step2BtnRow}>
              <TouchableOpacity
                style={styles.step2BackBtn}
                onPress={() => {
                  setFormError(null);
                  setCurrentStep(1);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color="#000000" style={{ marginRight: 6 }} />
                <Text style={styles.step2BackBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.step2ContinueBtn}
                onPress={handleStep2Continue}
                activeOpacity={0.88}
              >
                <Text style={styles.step2ContinueBtnText}>Continue to Loan Details</Text>
                <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ================= STEP 3 VIEW ================= */}
        {currentStep === 3 && (
          <>
            <View style={styles.formCard}>
              <View style={styles.reqHeaderRow}>
                <View style={styles.reqIconWrap}>
                  <MaterialCommunityIcons name="calculator-variant" size={22} color="#f59e0b" />
                </View>
                <Text style={styles.reqTitle}>Customize Loan Details</Text>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIconCol}>
                  <MaterialCommunityIcons name="cash-multiple" size={24} color="#0f172a" />
                </View>
                <View style={styles.inputRightCol}>
                  <Text style={styles.fieldLabel}>
                    Desired Loan Amount <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownBox}
                    onPress={() => setShowAmountModal(true)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.dropdownText}>{detailedLoanAmount}</Text>
                    <Ionicons name="chevron-down" size={16} color="#0f172a" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIconCol}>
                  <MaterialCommunityIcons name="calendar-clock" size={24} color="#0f172a" />
                </View>
                <View style={styles.inputRightCol}>
                  <Text style={styles.fieldLabel}>
                    Preferred Loan Tenure <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownBox}
                    onPress={() => setShowTenureModal(true)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.dropdownText}>{detailedTenure}</Text>
                    <Ionicons name="chevron-down" size={16} color="#0f172a" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIconCol}>
                  <MaterialCommunityIcons name="target" size={24} color="#0f172a" />
                </View>
                <View style={styles.inputRightCol}>
                  <Text style={styles.fieldLabel}>
                    Purpose of Loan <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownBox}
                    onPress={() => setShowPurposeModal(true)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.dropdownText}>{loanPurpose}</Text>
                    <Ionicons name="chevron-down" size={16} color="#0f172a" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.halfColGroup}>
                  <View style={styles.twoColIconCol}>
                    <MaterialCommunityIcons name="credit-card-clock-outline" size={24} color="#0f172a" />
                  </View>
                  <View style={styles.twoColRight}>
                    <Text style={styles.fieldLabel} numberOfLines={1}>
                      Existing EMIs <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.dropdownBox}
                      onPress={() => setShowExistingEmiModal(true)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {existingEmi}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.halfColGroup}>
                  <View style={styles.twoColIconCol}>
                    <MaterialCommunityIcons name="speedometer" size={24} color="#0f172a" />
                  </View>
                  <View style={styles.twoColRight}>
                    <Text style={styles.fieldLabel} numberOfLines={1}>
                      CIBIL Score <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.dropdownBox}
                      onPress={() => setShowCibilModal(true)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {cibilScoreRange.split(' ')[0]}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {formError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <View style={styles.step2BtnRow}>
              <TouchableOpacity
                style={styles.step2BackBtn}
                onPress={() => {
                  setFormError(null);
                  setCurrentStep(2);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color="#000000" style={{ marginRight: 6 }} />
                <Text style={styles.step2BackBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.step2ContinueBtn}
                onPress={handleStep3Continue}
                activeOpacity={0.88}
              >
                <Text style={styles.step2ContinueBtnText}>Continue to Documents</Text>
                <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ================= STEP 4 VIEW (Exact Reference Layout) ================= */}
        {currentStep === 4 && (
          <View style={styles.formCard}>
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
                  onPress={() => handleToggleDocUpload('panCard', 'PAN Card')}
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
                  onPress={() => handleToggleDocUpload('aadhaarCard', 'Aadhaar Card')}
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
                  onPress={() => handleToggleDocUpload('addressProof', 'Address Proof')}
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
                  <Text style={styles.docRowSubtitle}>Last 3 months' salary slips / Form 16 / ITR</Text>
                </View>
                <TouchableOpacity
                  style={[styles.uploadPillBtn, uploadedDocs.incomeProof && styles.uploadPillBtnDone]}
                  onPress={() => handleToggleDocUpload('incomeProof', 'Income Proof')}
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
                  <Text style={styles.docRowSubtitle}>Last 6 months' salary account bank statements</Text>
                </View>
                <TouchableOpacity
                  style={[styles.uploadPillBtn, uploadedDocs.bankStatements && styles.uploadPillBtnDone]}
                  onPress={() => handleToggleDocUpload('bankStatements', 'Bank Statements')}
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
                  <Text style={styles.docRowSubtitle}>Latest statement of your existing loan / credit card (if any)</Text>
                </View>
                <TouchableOpacity
                  style={[styles.uploadPillBtn, uploadedDocs.existingLoanStatement && styles.uploadPillBtnDone]}
                  onPress={() => handleToggleDocUpload('existingLoanStatement', 'Existing Loan Statement')}
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
                  onPress={() => handleToggleDocUpload('photograph', 'Photograph')}
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

            <View style={styles.step2BtnRow}>
              <TouchableOpacity
                style={styles.step2BackBtn}
                onPress={() => {
                  setFormError(null);
                  setCurrentStep(3);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color="#000000" style={{ marginRight: 6 }} />
                <Text style={styles.step2BackBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.step2ContinueBtn}
                onPress={handleStep4Continue}
                activeOpacity={0.88}
              >
                <Text style={styles.step2ContinueBtnText}>Submit Application</Text>
                <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 5: REVIEW OR SUBMITTED SUCCESS PAGE ================= */}
        {currentStep === 5 && (
          <>
            {!submittedApp ? (
              <>
                {/* Step 5 Header Banner Pill */}
                <View style={styles.step5TitleCard}>
                  <View style={styles.step5TitleIconWrap}>
                    <MaterialCommunityIcons name="file-document-check" size={26} color="#000000" />
                  </View>
                  <View style={styles.step5TitleTextCol}>
                    <Text style={styles.step5MainHeading}>Step 5 – Submit Application</Text>
                    <Text style={styles.step5SubHeading}>
                      Please review your details and submit your loan application.
                    </Text>
                  </View>
                </View>

                {/* 1. Application Summary Card */}
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
                        <MaterialCommunityIcons name="briefcase-outline" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Organization</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>{companyName || 'Corporate'}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <Ionicons name="location-outline" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Location</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>{city}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <MaterialCommunityIcons name="bank-outline" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Salary Bank</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>{salaryBankAccount || 'Primary Bank'}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <MaterialCommunityIcons name="cash-multiple" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Required Loan Amount</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValueHighlight}>{detailedLoanAmount}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <MaterialCommunityIcons name="calendar-clock" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Tenure</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>{detailedTenure.split(' ')[0]} {detailedTenure.includes('Years') ? 'Years' : 'Months'}</Text>
                    </View>
                  </View>
                </View>

                {/* 2. Uploaded Documents (7/7) Card */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="file-document-outline" size={18} color="#002e75" />
                      <Text style={styles.summaryCardTitle}>Uploaded Documents (7/7)</Text>
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
                        <MaterialCommunityIcons name="file-document-outline" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>
                          PAN Card <Text style={styles.mandatoryRed}>(Mandatory)</Text>
                        </Text>
                        <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      </View>

                      <View style={styles.docBadgeBox}>
                        <MaterialCommunityIcons name="card-text-outline" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>
                          Aadhaar Card <Text style={styles.mandatoryRed}>(Mandatory)</Text>
                        </Text>
                        <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      </View>

                      <View style={styles.docBadgeBox}>
                        <MaterialCommunityIcons name="file-document-outline" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>Address Proof</Text>
                        <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      </View>

                      <View style={styles.docBadgeBox}>
                        <MaterialCommunityIcons name="file-document-outline" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>Income Proof</Text>
                        <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      </View>
                    </View>

                    <View style={styles.docGridCol}>
                      <View style={styles.docBadgeBox}>
                        <MaterialCommunityIcons name="file-document-outline" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>Bank Statements</Text>
                        <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      </View>

                      <View style={styles.docBadgeBox}>
                        <MaterialCommunityIcons name="file-document-outline" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>
                          Existing Loan Statement{'\n'}
                          <Text style={styles.optionalGray}>(If Available)</Text>
                        </Text>
                        <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      </View>

                      <View style={styles.docBadgeBox}>
                        <MaterialCommunityIcons name="image-outline" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>
                          Photograph{'\n'}
                          <Text style={styles.optionalGray}>(Applicant)</Text>
                        </Text>
                        <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      </View>
                    </View>
                  </View>
                </View>

                {/* 3. Confirmation Blue Checkbox & Legal Authorization Text */}
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
                    application and documents with relevant banks/NBFCs for Personal Loan processing.
                  </Text>
                </View>

                {formError ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color="#ef4444" />
                    <Text style={styles.errorText}>{formError}</Text>
                  </View>
                ) : null}

                <View style={styles.step2BtnRow}>
                  <TouchableOpacity
                    style={styles.step2BackBtn}
                    onPress={() => {
                      setFormError(null);
                      setCurrentStep(4);
                    }}
                    activeOpacity={0.8}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="arrow-back" size={18} color="#000000" style={{ marginRight: 6 }} />
                    <Text style={styles.step2BackBtnText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.step2ContinueBtn, isSubmitting && { opacity: 0.7 }]}
                    onPress={handleFinalSubmit}
                    activeOpacity={0.88}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <>
                        <Text style={styles.step2ContinueBtnText}>Submit Application</Text>
                        <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* ================= POST-SUBMISSION SUCCESS SCREEN (EXACT MATCH TO REFERENCE IMAGE) ================= */
              <View style={styles.postSubmitContainer}>
                {/* 1. Celebratory Green Badge Header */}
                <View style={styles.celebrationHeroWrap}>
                  <View style={styles.confettiCluster}>
                    <View style={[styles.confettiDot, { top: 0, left: 20, backgroundColor: '#f59e0b' }]} />
                    <View style={[styles.confettiDot, { top: 12, right: 28, backgroundColor: '#38bdf8' }]} />
                    <View style={[styles.confettiDot, { bottom: 6, left: 36, backgroundColor: '#ec4899' }]} />
                    <View style={[styles.confettiDot, { bottom: 10, right: 38, backgroundColor: '#10b981' }]} />

                    {/* Scalloped Green Success Badge */}
                    <View style={styles.scallopedGreenBadge}>
                      <Ionicons name="checkmark" size={38} color="#ffffff" />
                    </View>
                  </View>

                  <Text style={styles.postSubmitTitle}>Application Submitted{'\n'}Successfully!</Text>
                  <Text style={styles.postSubmitSubtitle}>
                    Thank you for choosing Loan Point.{'\n'}Your Personal Loan application has been received.
                  </Text>
                </View>

                {/* 2. Application ID & Submitted On Dual Pill Card */}
                <View style={styles.appMetaDualCard}>
                  {/* Left Pill: Application ID */}
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

                  {/* Right Pill: Submitted On */}
                  <View style={styles.appMetaRightPill}>
                    <View style={styles.appMetaIconWrap}>
                      <MaterialCommunityIcons name="calendar-clock-outline" size={24} color="#004aad" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.appMetaLabel}>Submitted On</Text>
                      <Text style={styles.appMetaDateVal}>
                        {submittedDateString || 'Today'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 3. 4-Stage Lifecycle Process Flow Tracker */}
                <View style={styles.lifecycleCard}>
                  <View style={styles.lifecycleTrack}>
                    {/* Node 1: Application Received */}
                    <View style={styles.lifecycleNode}>
                      <View style={[styles.lifecycleCircle, styles.lifecycleCircleDone]}>
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                      </View>
                      <Text style={styles.lifecycleLabelActive}>Application{'\n'}Received</Text>
                    </View>

                    <View style={styles.lifecycleLine} />

                    {/* Node 2: Document Verification */}
                    <View style={styles.lifecycleNode}>
                      <View style={styles.lifecycleCircle}>
                        <Ionicons name="search" size={16} color="#0f172a" />
                      </View>
                      <Text style={styles.lifecycleLabel}>Document{'\n'}Verification</Text>
                    </View>

                    <View style={styles.lifecycleLine} />

                    {/* Node 3: Lender Assessment */}
                    <View style={styles.lifecycleNode}>
                      <View style={styles.lifecycleCircle}>
                        <MaterialCommunityIcons name="bank" size={16} color="#0f172a" />
                      </View>
                      <Text style={styles.lifecycleLabel}>Lender{'\n'}Assessment</Text>
                    </View>

                    <View style={styles.lifecycleLine} />

                    {/* Node 4: Offer & Approval */}
                    <View style={styles.lifecycleNode}>
                      <View style={styles.lifecycleCircle}>
                        <MaterialCommunityIcons name="handshake" size={16} color="#0f172a" />
                      </View>
                      <Text style={styles.lifecycleLabel}>Offer &{'\n'}Approval</Text>
                    </View>
                  </View>
                </View>

                {/* 4. Relationship Manager Card (Arvind Patil) with Call Now & WhatsApp */}
                <View style={styles.managerCard}>
                  <View style={styles.managerLeftRow}>
                    {/* Manager Avatar Frame */}
                    <View style={styles.managerAvatarFrame}>
                      <MaterialCommunityIcons name="face-agent" size={32} color="#002e75" />
                    </View>
                    <View style={styles.managerInfoCol}>
                      <Text style={styles.managerRoleLabel}>Your Relationship Manager</Text>
                      <Text style={styles.managerNameText}>Arvind Patil</Text>
                      <TouchableOpacity
                        style={styles.managerPhoneRow}
                        onPress={() => Linking.openURL('tel:+919545555999')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="call" size={14} color="#16a34a" />
                        <Text style={styles.managerPhoneText}>+91 95455 55999</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.managerActionsCol}>
                    {/* Call Now Yellow Button */}
                    <TouchableOpacity
                      style={styles.mgrCallBtn}
                      onPress={() => Linking.openURL('tel:+919545555999')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={15} color="#000000" style={{ marginRight: 5 }} />
                      <Text style={styles.mgrCallBtnText}>Call Now</Text>
                    </TouchableOpacity>

                    {/* WhatsApp Green Button */}
                    <TouchableOpacity
                      style={styles.mgrWhatsAppBtn}
                      onPress={() =>
                        Linking.openURL(
                          `https://wa.me/919545555999?text=${encodeURIComponent(
                            `Hello Arvind Patil, I have submitted my Personal Loan application (ID: ${submittedApp.id}). Please assist with the next steps.`
                          )}`
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="#ffffff" style={{ marginRight: 5 }} />
                      <Text style={styles.mgrWhatsAppBtnText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 5. What's Next? Yellow Bell Notice Strip */}
                <View style={styles.whatsNextCard}>
                  <View style={styles.whatsNextBellWrap}>
                    <MaterialCommunityIcons name="bell-ring" size={24} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.whatsNextTitle}>What's Next?</Text>
                    <Text style={styles.whatsNextDesc}>
                      Our team will verify your details and share the best Personal Loan offers from our banking partners within 24–48 hours.
                    </Text>
                  </View>
                </View>

                {/* 6. Bottom Dual Action Buttons: [Go to Home] [Track My Application] */}
                <View style={styles.postSubmitBtnRow}>
                  {/* Go to Home Button */}
                  <TouchableOpacity
                    style={styles.goHomeBtn}
                    onPress={onCancel}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="home-outline" size={18} color="#000000" style={{ marginRight: 6 }} />
                    <Text style={styles.goHomeBtnText}>Go to Home</Text>
                  </TouchableOpacity>

                  {/* Track My Application Button */}
                  <TouchableOpacity
                    style={styles.trackAppBtnYellow}
                    onPress={() => onSuccess(submittedApp)}
                    activeOpacity={0.88}
                  >
                    <MaterialCommunityIcons name="file-document-edit-outline" size={18} color="#000000" style={{ marginRight: 6 }} />
                    <Text style={styles.trackAppBtnYellowText}>Track My Application</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Income Modal */}
      <Modal visible={showIncomeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Monthly Income Range</Text>
              <TouchableOpacity onPress={() => setShowIncomeModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={incomeRanges}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    monthlyIncome === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setMonthlyIncome(item);
                    setShowIncomeModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      monthlyIncome === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {monthlyIncome === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#004aad" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* City Modal */}
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
                placeholder="Search your city or district..."
                placeholderTextColor="#94a3b8"
                value={citySearch}
                onChangeText={setCitySearch}
              />
              {citySearch ? (
                <TouchableOpacity onPress={() => setCitySearch('')}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <FlatList
              data={filteredCities}
              keyExtractor={(item, idx) => `${item.city}-${idx}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    city === item.city && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setCity(item.city);
                    setShowCityModal(false);
                    setCitySearch('');
                  }}
                >
                  <View>
                    <Text
                      style={[
                        styles.modalOptionText,
                        city === item.city && styles.modalOptionTextSelected,
                      ]}
                    >
                      {item.city}
                    </Text>
                    <Text style={styles.modalOptionSubText}>{item.state}</Text>
                  </View>
                  {city === item.city && (
                    <Ionicons name="checkmark-circle" size={20} color="#004aad" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Amount Modal */}
      <Modal visible={showAmountModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
                  style={[
                    styles.modalOption,
                    (currentStep === 3 ? detailedLoanAmount : loanAmount) === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    if (currentStep === 3) {
                      setDetailedLoanAmount(item);
                    } else {
                      setLoanAmount(item);
                      setDetailedLoanAmount(item);
                    }
                    setShowAmountModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      (currentStep === 3 ? detailedLoanAmount : loanAmount) === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {(currentStep === 3 ? detailedLoanAmount : loanAmount) === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#004aad" />
                  )}
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
              <Text style={styles.modalTitle}>Select Loan Tenure</Text>
              <TouchableOpacity onPress={() => setShowTenureModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={tenureOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    (currentStep === 3 ? detailedTenure : loanTenure) === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    if (currentStep === 3) {
                      setDetailedTenure(item);
                    } else {
                      setLoanTenure(item);
                      setDetailedTenure(item);
                    }
                    setShowTenureModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      (currentStep === 3 ? detailedTenure : loanTenure) === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {(currentStep === 3 ? detailedTenure : loanTenure) === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#004aad" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Experience Modal */}
      <Modal visible={showExpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Work Experience</Text>
              <TouchableOpacity onPress={() => setShowExpModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={experienceOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    workExperience === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setWorkExperience(item);
                    setShowExpModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      workExperience === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {workExperience === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#004aad" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Salary Bank Modal */}
      <Modal visible={showBankModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Salary Bank Account</Text>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={bankOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    salaryBankAccount === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSalaryBankAccount(item);
                    setShowBankModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      salaryBankAccount === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {salaryBankAccount === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#004aad" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Company Type Modal */}
      <Modal visible={showCompanyTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Company Type</Text>
              <TouchableOpacity onPress={() => setShowCompanyTypeModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={companyTypeOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    companyType === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setCompanyType(item);
                    setShowCompanyTypeModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      companyType === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {companyType === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#004aad" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Purpose Modal */}
      <Modal visible={showPurposeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Purpose of Loan</Text>
              <TouchableOpacity onPress={() => setShowPurposeModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={purposeOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    loanPurpose === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setLoanPurpose(item);
                    setShowPurposeModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      loanPurpose === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {loanPurpose === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#004aad" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Existing EMI Modal */}
      <Modal visible={showExistingEmiModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Existing Monthly EMI Obligations</Text>
              <TouchableOpacity onPress={() => setShowExistingEmiModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={existingEmiOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    existingEmi === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setExistingEmi(item);
                    setShowExistingEmiModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      existingEmi === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {existingEmi === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#004aad" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* CIBIL Modal */}
      <Modal visible={showCibilModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select CIBIL / Credit Score Range</Text>
              <TouchableOpacity onPress={() => setShowCibilModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={cibilOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    cibilScoreRange === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setCibilScoreRange(item);
                    setShowCibilModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      cibilScoreRange === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {cibilScoreRange === item && (
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
  heroBanner: {
    width: '100%',
    minHeight: 120,
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
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#fbbf24',
    opacity: 0.85,
  },
  heroContentLeft: {
    flex: 1,
    paddingRight: 10,
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 21,
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
  avatarPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001b44',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
    gap: 3,
  },
  avatarPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  avatarCircleFrame: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1d4ed8',
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
  thumbsUpBubble: {
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
  step5TitleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
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
    marginHorizontal: 16,
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
  mandatoryRed: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '700',
  },
  optionalGray: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '500',
  },
  finalConfirmContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
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
  formCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#f8fafc',
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
  docSubHeading: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
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
  empTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  empTypeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  empTypeCardActive: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  empCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  empRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empRadioOuterActive: {
    borderColor: '#0284c7',
  },
  empRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284c7',
  },
  empCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 2,
  },
  empCardSub: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 14,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  inputIconCol: {
    width: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 18,
  },
  inputRightCol: {
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
  textInput: {
    fontSize: 14,
    color: '#0f172a',
    padding: 0,
    margin: 0,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  halfColGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  twoColIconCol: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 18,
  },
  twoColRight: {
    flex: 1,
  },
  dropdownBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
    flex: 1,
  },
  requirementCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#f8fafc',
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
  reqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  reqIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  reqTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  checkboxTouch: {
    marginTop: 2,
    marginRight: 10,
  },
  customBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customBoxChecked: {
    borderColor: '#004aad',
  },
  agreementText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  linkText: {
    color: '#004aad',
    textDecorationLine: 'underline',
  },
  continueButton: {
    marginHorizontal: 16,
    height: 52,
    backgroundColor: '#ffd700',
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    marginRight: 8,
  },
  continueArrow: {
    marginTop: 2,
  },
  step2BtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 6,
  },
  step2BackBtn: {
    width: 100,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  step2BackBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  step2ContinueBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
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
  step2ContinueBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  // ================= POST-SUBMIT SUCCESS SCREEN STYLES (MATCHING REFERENCE IMAGE) =================
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
  confettiCluster: {
    width: 140,
    height: 94,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  confettiDot: {
    position: 'absolute',
    width: 6,
    height: 10,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
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
  lifecycleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  lifecycleTrack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  lifecycleNode: {
    alignItems: 'center',
    width: 70,
  },
  lifecycleCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  lifecycleCircleDone: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  lifecycleLabelActive: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
    textAlign: 'center',
    lineHeight: 13,
  },
  lifecycleLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 13,
  },
  lifecycleLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#cbd5e1',
    marginTop: 15,
    marginHorizontal: 1,
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
  whatsNextCard: {
    backgroundColor: '#fffdf5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fef08a',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  whatsNextBellWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  whatsNextTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 3,
  },
  whatsNextDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  postSubmitBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  goHomeBtn: {
    width: 120,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goHomeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  trackAppBtnYellow: {
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
  trackAppBtnYellowText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
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
  modalOptionTextSelected: {
    color: '#004aad',
    fontWeight: '700',
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
});

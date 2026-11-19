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
import { isUserDocUploaded, getUserIncomeFormatted, getUserEmploymentType, findUserDocument } from '../../utils/formPreFill';
import { LoanDocItemRow } from '../common/LoanDocItemRow';
import { DocumentViewPreviewModal } from '../common/DocumentViewPreviewModal';
import { DocumentItem } from '../../types';
import { documentService } from '../../services/documentService';
import { Platform, Alert } from 'react-native';

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
  // 5-Step Tracker matching Personal Loan: 1: Basic Details, 2: Property & Work, 3: Loan Details, 4: Documents, 5: Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // ---------------- STEP 1: Basic Details ----------------
  const [fullName, setFullName] = useState<string>(user?.name && user.name !== 'Valued Customer' ? user.name : '');
  const [mobileNumber, setMobileNumber] = useState<string>(user?.mobile || '');
  const [emailId, setEmailId] = useState<string>(user?.email || '');
  const [monthlyIncome, setMonthlyIncome] = useState<string>(getUserIncomeFormatted(user));
  const [city, setCity] = useState<string>(user?.city || '');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [loanTenure, setLoanTenure] = useState<string>('');
  const [isAgreedStep1, setIsAgreedStep1] = useState<boolean>(true);

  // ---------------- STEP 2: Property & Employment Details ----------------
  const [propertyType, setPropertyType] = useState<string>('');
  const [propertyLocation, setPropertyLocation] = useState<string>(user?.city || '');
  const [propertyValue, setPropertyValue] = useState<string>('');
  const [employmentType, setEmploymentType] = useState<'Salaried' | 'Self-Employed'>(getUserEmploymentType(user));
  const [companyName, setCompanyName] = useState<string>('');
  const [workExperience, setWorkExperience] = useState<string>('');
  const [salaryBankAccount, setSalaryBankAccount] = useState<string>('');
  const [companyType, setCompanyType] = useState<string>('');

  // ---------------- STEP 3: Customize Loan Details ----------------
  const [detailedLoanAmount, setDetailedLoanAmount] = useState<string>('');
  const [detailedTenure, setDetailedTenure] = useState<string>('');
  const [loanPurpose, setLoanPurpose] = useState<string>('');
  const [existingEmi, setExistingEmi] = useState<string>('');
  const [cibilScoreRange, setCibilScoreRange] = useState<string>(
    user?.cibilEstimateScore ? (user.cibilEstimateScore >= 750 ? '750 and Above (Excellent)' : '700 - 749 (Good)') : ''
  );
  const [hasCoApplicant, setHasCoApplicant] = useState<'Yes' | 'No'>('No');

  // ---------------- STEP 4: Documents (Pre-fill ONLY if authentic document exists in database) ----------------
  const [panNumber, setPanNumber] = useState<string>(user?.panNumber || '');
  const [aadhaarNumber, setAadhaarNumber] = useState<string>(user?.aadhaarNumber || '');
  const [uploadedDocs, setUploadedDocs] = useState<UploadedHomeDocsState>({
    panCard: isUserDocUploaded(user, 'pan_card', ['pan']),
    aadhaarCard: isUserDocUploaded(user, 'aadhaar_card', ['aadhaar', 'uidai']),
    addressProof: isUserDocUploaded(user, 'address_proof', ['electricity', 'utility', 'rent']),
    incomeProof: isUserDocUploaded(user, 'salary_slips', ['salary', 'payslip', 'itr']),
    bankStatements: isUserDocUploaded(user, 'bank_statement', ['statement', 'passbook']),
    existingLoanStatement: false,
    photograph: isUserDocUploaded(user, 'passport_photo', ['photo', 'passport']),
  });

  // ---------------- STEP 5: Final Confirmation & Submitted State ----------------
  const [isFinalConfirmed, setIsFinalConfirmed] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedApp, setSubmittedApp] = useState<LoanApplication | null>(null);
  const [submittedDateString, setSubmittedDateString] = useState<string>('');

  // Document Preview & Upload State
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [isDocUploading, setIsDocUploading] = useState<boolean>(false);

  const handleViewDocument = (doc: DocumentItem) => {
    setPreviewDoc(doc);
    setShowPreviewModal(true);
  };

  const handleUploadOrReuploadDoc = (docKey: string, defaultTitle: string, category: DocumentItem['category']) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.jpg,.jpeg,.png,image/*,application/pdf';
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target?.files?.[0];
        if (!file) return;

        const validation = documentService.validateFile({
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
        });

        if (!validation.valid) {
          Alert.alert('Invalid File', validation.error || 'Please select a valid PDF, JPG, or PNG under 5MB.');
          return;
        }

        setIsDocUploading(true);
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const newDoc = await documentService.uploadDocument(
              {
                name: defaultTitle || file.name,
                size: file.size,
                type: file.type || 'application/pdf',
                uri: reader.result as string,
              },
              category,
              user?.mobile,
              docKey
            );
            if (user) {
              if (!user.documents) user.documents = [];
              const idx = user.documents.findIndex((d) => d.docKey === docKey || d.name.toLowerCase().includes(docKey.replace(/_/g, ' ')));
              if (idx >= 0) {
                user.documents[idx] = newDoc;
              } else {
                user.documents.push(newDoc);
              }
            }
            Alert.alert('Success', `"${defaultTitle}" uploaded successfully!`);
          } catch {
            Alert.alert('Error', 'Document upload failed. Please try again.');
          } finally {
            setIsDocUploading(false);
          }
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    Alert.alert(
      'Upload Document',
      `Upload authentic file for ${defaultTitle}:`,
      [
        {
          text: 'Choose Document (PDF/Doc)',
          onPress: async () => {
            try {
              const DocumentPicker = require('expo-document-picker');
              const res = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
              });
              if (res.canceled || !res.assets || res.assets.length === 0) return;
              const asset = res.assets[0];
              setIsDocUploading(true);
              const newDoc = await documentService.uploadDocument(
                {
                  name: defaultTitle || asset.name,
                  size: asset.size || 0,
                  type: asset.mimeType || 'application/pdf',
                  uri: asset.uri,
                },
                category,
                user?.mobile,
                docKey
              );
              if (user) {
                if (!user.documents) user.documents = [];
                const idx = user.documents.findIndex((d) => d.docKey === docKey || d.name.toLowerCase().includes(docKey.replace(/_/g, ' ')));
                if (idx >= 0) {
                  user.documents[idx] = newDoc;
                } else {
                  user.documents.push(newDoc);
                }
              }
              Alert.alert('Success', `"${defaultTitle}" uploaded successfully!`);
            } catch (err) {
              Alert.alert('Error', 'Unable to pick or upload document.');
            } finally {
              setIsDocUploading(false);
            }
          },
        },
        {
          text: 'Take Photo / Choose Photo',
          onPress: async () => {
            try {
              const ImagePicker = require('expo-image-picker');
              const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
              });
              if (res.canceled || !res.assets || res.assets.length === 0) return;
              const asset = res.assets[0];
              setIsDocUploading(true);
              const newDoc = await documentService.uploadDocument(
                {
                  name: `${defaultTitle}.jpg`,
                  size: asset.fileSize || 0,
                  type: 'image/jpeg',
                  uri: asset.uri,
                },
                category,
                user?.mobile,
                docKey
              );
              if (user) {
                if (!user.documents) user.documents = [];
                const idx = user.documents.findIndex((d) => d.docKey === docKey || d.name.toLowerCase().includes(docKey.replace(/_/g, ' ')));
                if (idx >= 0) {
                  user.documents[idx] = newDoc;
                } else {
                  user.documents.push(newDoc);
                }
              }
              Alert.alert('Success', `"${defaultTitle}" photo uploaded successfully!`);
            } catch (err) {
              Alert.alert('Error', 'Unable to choose photo.');
            } finally {
              setIsDocUploading(false);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // ---------------- Modals State ----------------
  const [showIncomeModal, setShowIncomeModal] = useState<boolean>(false);
  const [showCityModal, setShowCityModal] = useState<boolean>(false);
  const [showAmountModal, setShowAmountModal] = useState<boolean>(false);
  const [showTenureModal, setShowTenureModal] = useState<boolean>(false);
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState<boolean>(false);
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

  // Dropdown Options
  const incomeRanges = [
    '₹25,000 - ₹50,000',
    '₹50,000 - ₹75,000',
    '₹75,000 - ₹1,00,000',
    '₹1,20,000',
    '₹1,00,000 - ₹1,50,000',
    '₹1,50,000 - ₹2,50,000',
    '₹2,50,000 - ₹5,00,000',
    'Above ₹5,00,000',
  ];

  const loanAmountOptions = [
    '₹15,00,000',
    '₹25,00,000',
    '₹35,00,000',
    '₹50,00,000',
    '₹65,00,000',
    '₹75,00,000',
    '₹1,00,00,000',
    '₹1,50,00,000',
    '₹2,00,00,000',
    'Above ₹2 Crore',
  ];

  const tenureOptions = [
    '5 Years (60 Months)',
    '10 Years (120 Months)',
    '15 Years (180 Months)',
    '20 Years (240 Months)',
    '25 Years (300 Months)',
    '30 Years (360 Months)',
  ];

  const propertyTypeOptions = [
    'Ready to Move Flat / Apartment',
    'Under Construction Apartment',
    'Independent House / Row House',
    'Plot Purchase + House Construction',
    'Self-Construction on Existing Land',
    'Home Renovation / Extension',
    'Home Loan Balance Transfer (BT) + Top-up',
  ];

  const experienceOptions = [
    'Less than 1 Year',
    '1 - 3 Years',
    '3 - 5 Years',
    '5 - 10 Years',
    'More than 10 Years',
  ];

  const bankOptions = [
    'State Bank of India (SBI)',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Bank of Baroda',
    'Punjab National Bank (PNB)',
    'Canara Bank',
    'Union Bank of India',
    'Kotak Mahindra Bank',
    'LIC Housing Finance',
    'IDFC FIRST Bank',
    'Other Bank / NBFC',
  ];

  const companyTypeOptions = [
    'Private Limited (Pvt Ltd)',
    'Public Limited',
    'Government / PSU Employee',
    'Proprietorship / Business',
    'Partnership Firm',
    'LLP (Limited Liability Partnership)',
    'MNC (Multinational Corporation)',
    'Professional / Doctor / CA',
  ];

  const purposeOptions = [
    'Home Purchase (New / Resale)',
    'Construction on Own Plot',
    'Balance Transfer from Existing Lender',
    'Home Improvement / Renovation',
    'Plot Purchase + Construction',
    'Top-Up over Existing Home Loan',
  ];

  const existingEmiOptions = [
    'No Existing EMI',
    'Below ₹10,000 / month',
    '₹10,000 - ₹25,000 / month',
    '₹25,000 - ₹50,000 / month',
    'Above ₹50,000 / month',
  ];

  const cibilOptions = [
    '750 and Above (Excellent)',
    '700 - 749 (Good)',
    '650 - 699 (Average)',
    'Below 650 (Needs Review)',
    'New to Credit (No CIBIL Score)',
  ];

  const uploadedCount = Object.values(uploadedDocs).filter(Boolean).length;
  const totalDocsCount = Object.keys(uploadedDocs).length;

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

  const filteredCities =
    citySearch.trim() === ''
      ? allCities.slice(0, 80)
      : allCities
          .filter(
            (c) =>
              c.city.toLowerCase().includes(citySearch.toLowerCase()) ||
              c.state.toLowerCase().includes(citySearch.toLowerCase())
          )
          .slice(0, 80);

  // Handlers for steps
  const handleStep1Continue = () => {
    setFormError(null);
    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError('Please enter your full name');
      return;
    }
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number');
      return;
    }
    // City is optional
    if (!isAgreedStep1) {
      setFormError('Please accept Terms & Privacy Policy to continue');
      return;
    }
    setDetailedLoanAmount(loanAmount);
    setDetailedTenure(loanTenure);
    if (!propertyLocation.trim()) {
      setPropertyLocation(city.trim());
    }
    setCurrentStep(2);
  };

  const handleStep2Continue = () => {
    setFormError(null);
    if (!propertyLocation.trim()) {
      setFormError('Please enter property location/city');
      return;
    }
    if (!companyName.trim()) {
      setFormError('Please enter company or business name');
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
      setFormError('Please confirm the verification checkbox to submit your application');
      return;
    }
    setIsSubmitting(true);

    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      const numericAmount = parseInt(detailedLoanAmount.replace(/[^0-9]/g, ''), 10) || 5000000;
      const tenureMatch = detailedTenure.match(/(\d+)\s*Months/) || detailedTenure.match(/(\d+)\s*Years/);
      let tenureMonths = 240;
      if (tenureMatch) {
        if (detailedTenure.includes('Months')) {
          tenureMonths = parseInt(tenureMatch[1], 10);
        } else {
          tenureMonths = parseInt(tenureMatch[1], 10) * 12;
        }
      }
      const numericIncome = parseInt(monthlyIncome.replace(/[^0-9]/g, ''), 10) || 120000;

      const app = await loanService.submitEnquiry({
        loanType: 'home',
        applicantName: fullName.trim(),
        mobile: cleanMobile,
        requestedAmount: numericAmount,
        tenureMonths: tenureMonths,
        monthlyIncome: numericIncome,
        employmentType: employmentType,
        city: city.trim(),
        panNumber: panNumber.trim().toUpperCase() || undefined,
        aadhaarNumber: aadhaarNumber.replace(/\D/g, '') || undefined,
        bankName: salaryBankAccount || undefined,
        purpose: `Home Loan | Property: ${propertyType} at ${propertyLocation} (Est: ${propertyValue}) | Work: ${companyName.trim()} (${companyType}) | Bank: ${salaryBankAccount} | Purpose: ${loanPurpose} | Co-Applicant: ${hasCoApplicant} | CIBIL: ${cibilScoreRange}`,
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

  const handleToggleDocUpload = (key: keyof UploadedHomeDocsState) => {
    setUploadedDocs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const stepsList = [
    { num: 1, label: 'Basic Details' },
    { num: 2, label: 'Property & Work' },
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
                  <View style={[styles.inputBox, { backgroundColor: '#f8fafc' }]}>
                    <TextInput
                      style={[styles.textInput, { color: '#475569' }]}
                      placeholder="Enter your full name"
                      placeholderTextColor="#94a3b8"
                      value={fullName}
                      onChangeText={setFullName}
                      editable={false}
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
                      editable={false}
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
                        {monthlyIncome || 'Select Income'}
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
                      City (Optional)
                    </Text>
                    <View style={styles.inputBox}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter city name"
                        placeholderTextColor="#94a3b8"
                        value={city}
                        onChangeText={setCity}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Loan Requirement Card */}
            <View style={styles.requirementCard}>
              <View style={styles.reqHeaderRow}>
                <View style={styles.reqIconWrap}>
                  <MaterialCommunityIcons name="home-analytics" size={22} color="#f59e0b" />
                </View>
                <Text style={styles.reqTitle}>Home Loan Requirement</Text>
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
                      Tenure <Text style={styles.requiredStar}>*</Text>
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
                I agree to be contacted by Loan Point & its banking partners for my Home Loan application. I accept the{' '}
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

        {/* ================= STEP 2 VIEW: Property & Employment Details ================= */}
        {currentStep === 2 && (
          <>
            <View style={styles.formCard}>
              <View style={styles.reqHeaderRow}>
                <View style={styles.reqIconWrap}>
                  <FontAwesome5 name="home" size={18} color="#f59e0b" />
                </View>
                <Text style={styles.reqTitle}>Property Details</Text>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIconCol}>
                  <MaterialCommunityIcons name="home-city-outline" size={24} color="#0f172a" />
                </View>
                <View style={styles.inputRightCol}>
                  <Text style={styles.fieldLabel}>
                    Property Type <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownBox}
                    onPress={() => setShowPropertyTypeModal(true)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                      {propertyType}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#0f172a" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.halfColGroup}>
                  <View style={styles.twoColIconCol}>
                    <Ionicons name="location-outline" size={24} color="#0f172a" />
                  </View>
                  <View style={styles.twoColRight}>
                    <Text style={styles.fieldLabel} numberOfLines={1}>
                      Property Location <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <View style={styles.inputBox}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. City Name"
                        placeholderTextColor="#94a3b8"
                        value={propertyLocation}
                        onChangeText={setPropertyLocation}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.halfColGroup}>
                  <View style={styles.twoColIconCol}>
                    <MaterialCommunityIcons name="currency-inr" size={24} color="#0f172a" />
                  </View>
                  <View style={styles.twoColRight}>
                    <Text style={styles.fieldLabel} numberOfLines={1}>
                      Est. Property Cost <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <View style={styles.inputBox}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. ₹65,00,000"
                        placeholderTextColor="#94a3b8"
                        value={propertyValue}
                        onChangeText={setPropertyValue}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Employment Details Section */}
            <View style={styles.formCard}>
              <View style={styles.reqHeaderRow}>
                <View style={styles.reqIconWrap}>
                  <MaterialCommunityIcons name="briefcase-variant" size={22} color="#f59e0b" />
                </View>
                <Text style={styles.reqTitle}>Applicant Employment</Text>
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
                  <Text style={styles.empCardSub}>MNC / Govt / Pvt Ltd</Text>
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
                  <Text style={styles.empCardSub}>Business / Professional</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIconCol}>
                  <MaterialCommunityIcons name="office-building" size={24} color="#0f172a" />
                </View>
                <View style={styles.inputRightCol}>
                  <Text style={styles.fieldLabel}>
                    Company / Business Name <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter company or firm name"
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
                      Experience / Vintage <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.dropdownBox}
                      onPress={() => setShowExpModal(true)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {workExperience || 'Select Vintage'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.halfColGroup}>
                  <View style={styles.twoColIconCol}>
                    <MaterialCommunityIcons name="domain" size={24} color="#0f172a" />
                  </View>
                  <View style={styles.twoColRight}>
                    <Text style={styles.fieldLabel} numberOfLines={1}>
                      Entity Type <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.dropdownBox}
                      onPress={() => setShowCompanyTypeModal(true)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {companyType || 'Select Type'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={[styles.inputGroup, { marginTop: 14 }]}>
                <View style={styles.inputIconCol}>
                  <MaterialCommunityIcons name="bank-outline" size={24} color="#0f172a" />
                </View>
                <View style={styles.inputRightCol}>
                  <Text style={styles.fieldLabel}>
                    Primary Salary / Operating Bank <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownBox}
                    onPress={() => setShowBankModal(true)}
                    activeOpacity={0.75}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                      {salaryBankAccount ? (
                        <BankLogo bank={salaryBankAccount} width={22} height={22} />
                      ) : null}
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {salaryBankAccount || 'Select Bank'}
                      </Text>
                    </View>
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

        {/* ================= STEP 3 VIEW: Loan Details ================= */}
        {currentStep === 3 && (
          <>
            <View style={styles.formCard}>
              <View style={styles.reqHeaderRow}>
                <View style={styles.reqIconWrap}>
                  <MaterialCommunityIcons name="calculator-variant" size={22} color="#f59e0b" />
                </View>
                <Text style={styles.reqTitle}>Customize Home Loan</Text>
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
                    Loan Purpose <Text style={styles.requiredStar}>*</Text>
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

              {/* Co-Applicant Row */}
              <View style={[styles.inputGroup, { marginTop: 14 }]}>
                <View style={styles.inputIconCol}>
                  <MaterialCommunityIcons name="account-multiple-outline" size={24} color="#0f172a" />
                </View>
                <View style={styles.inputRightCol}>
                  <Text style={styles.fieldLabel}>Adding Co-Applicant (Spouse / Parent)?</Text>
                  <View style={styles.coApplicantRow}>
                    <TouchableOpacity
                      style={[
                        styles.coAppChip,
                        hasCoApplicant === 'Yes' && styles.coAppChipActive,
                      ]}
                      onPress={() => setHasCoApplicant('Yes')}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={hasCoApplicant === 'Yes' ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={hasCoApplicant === 'Yes' ? '#004aad' : '#64748b'}
                      />
                      <Text style={[styles.coAppChipText, hasCoApplicant === 'Yes' && styles.coAppChipTextActive]}>
                        Yes (Increases Eligibility)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.coAppChip,
                        hasCoApplicant === 'No' && styles.coAppChipActive,
                      ]}
                      onPress={() => setHasCoApplicant('No')}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={hasCoApplicant === 'No' ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={hasCoApplicant === 'No' ? '#004aad' : '#64748b'}
                      />
                      <Text style={[styles.coAppChipText, hasCoApplicant === 'No' && styles.coAppChipTextActive]}>
                        No
                      </Text>
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

        {/* ================= STEP 4 VIEW (Exact Reference Upload Layout) ================= */}
        {currentStep === 4 && (
          <View style={styles.formCard}>
            <View style={styles.step4BannerHeader}>
              <View style={styles.step4UploadIconBox}>
                <Feather name="upload" size={26} color="#000000" />
              </View>
              <View style={styles.step4BannerTextCol}>
                <Text style={styles.step4BannerTitle}>Step 4 – Upload Documents</Text>
                <Text style={styles.step4BannerSubtitle}>
                  Upload clear and authentic documents for faster Home Loan sanction
                </Text>
              </View>
            </View>

            <View style={styles.docListContainer}>
              {/* Row 1: PAN Card */}
              <LoanDocItemRow
                title="PAN Card"
                subtitle="Copy of applicant's PAN Card (Front Side)"
                isMandatory
                iconNode={
                  <View style={styles.panBadgeFrame}>
                    <Text style={styles.panBadgeText}>PAN</Text>
                    <View style={styles.panBadgeLines}>
                      <View style={styles.panBadgeLine} />
                      <View style={[styles.panBadgeLine, { width: '60%' }]} />
                    </View>
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'pan_card', ['pan'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('pan_card', 'PAN Card', 'Identity Proof')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 2: Aadhaar Card */}
              <LoanDocItemRow
                title="Aadhaar Card"
                subtitle="Front & Back (Both Sides)"
                isMandatory
                iconNode={
                  <View style={styles.aadhaarBadgeFrame}>
                    <Ionicons name="sunny-outline" size={14} color="#dc2626" />
                    <Text style={styles.aadhaarBadgeText}>AADHAAR</Text>
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'aadhaar_card', ['aadhaar', 'uidai'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('aadhaar_card', 'Aadhaar Card', 'Identity Proof')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 3: Address Proof */}
              <LoanDocItemRow
                title="Address Proof"
                subtitle="Utility bill (Electricity / Water / Gas) / Rent Agreement"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <Ionicons name="home-outline" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'address_proof', ['electricity', 'utility', 'rent'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('address_proof', 'Address Proof', 'Address Proof')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 4: Income Proof */}
              <LoanDocItemRow
                title="Income Proof"
                subtitle="Last 3 months' salary slips / Form 16 / 2 Years ITR"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="file-document-outline" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'salary_slips', ['salary', 'payslip', 'itr', 'income'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('salary_slips', 'Income Proof', 'Income Proof')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 5: Bank Statements */}
              <LoanDocItemRow
                title="Bank Statements"
                subtitle="Last 6 months' salary/operating account bank statement"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="bank" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'bank_statement', ['statement', 'passbook'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('bank_statement', 'Bank Statement', 'Income Proof')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 6: Property Documents */}
              <LoanDocItemRow
                title="Property Documents (if finalized)"
                subtitle="Allotment Letter / Sale Agreement / 7/12 Extract (if any)"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="home-search-outline" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'property_doc', ['property', 'sale deed', 'registry'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('property_doc', 'Property Document', 'Property Document')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 7: Photograph (Applicant) */}
              <LoanDocItemRow
                title="Photograph (Applicant)"
                subtitle="Recent passport-size photo (clear and front facing)"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <Ionicons name="person-outline" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'passport_photo', ['photo', 'passport'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('passport_photo', 'Passport Size Photo', 'Identity Proof')}
              />
            </View>

            {/* Safe & Secure Notice */}
            <View style={styles.safeSecureCard}>
              <View style={styles.shieldIconWrap}>
                <MaterialCommunityIcons name="shield-check" size={28} color="#16a34a" />
              </View>
              <View style={styles.safeSecureTextCol}>
                <Text style={styles.safeSecureTitle}>Your documents are 100% safe & secure</Text>
                <Text style={styles.safeSecureDesc}>
                  We use bank-level 256-bit encryption and share documents strictly with verified banking partners for Home Loan sanction.
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

        {/* ================= STEP 5: Review & Final Submission ================= */}
        {currentStep === 5 && (
          <>
            {!submittedApp ? (
              <>
                <View style={styles.step5TitleCard}>
                  <View style={styles.step5TitleIconWrap}>
                    <MaterialCommunityIcons name="file-document-check" size={26} color="#000000" />
                  </View>
                  <View style={styles.step5TitleTextCol}>
                    <Text style={styles.step5MainHeading}>Step 5 – Submit Application</Text>
                    <Text style={styles.step5SubHeading}>
                      Please review your details and submit your Home Loan application.
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
                        <Text style={styles.summaryLabel}>Property Cost</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>{propertyValue}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <MaterialCommunityIcons name="cash-multiple" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Requested Loan</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValueHighlight}>{detailedLoanAmount}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <MaterialCommunityIcons name="calendar-clock" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Preferred Tenure</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>{detailedTenure}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <MaterialCommunityIcons name="briefcase-outline" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>Employment</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>{employmentType} · {companyName}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <View style={styles.rowLabelCol}>
                        <MaterialCommunityIcons name="speedometer" size={16} color="#0f172a" style={styles.rowIcon} />
                        <Text style={styles.summaryLabel}>CIBIL Estimate</Text>
                      </View>
                      <Text style={styles.summaryColon}>:</Text>
                      <Text style={styles.summaryValue}>{cibilScoreRange.split(' ')[0]}</Text>
                    </View>
                  </View>
                </View>

                {/* 2. Uploaded Documents Status Card */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="file-document-outline" size={18} color="#002e75" />
                      <Text style={styles.summaryCardTitle}>
                        Uploaded Documents ({uploadedCount}/{totalDocsCount})
                      </Text>
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
                        <Ionicons name="home-outline" size={18} color="#0f172a" />
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
                        <MaterialCommunityIcons name="bank" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>Bank Statements</Text>
                        <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      </View>

                      <View style={styles.docBadgeBox}>
                        <MaterialCommunityIcons name="file-check-outline" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>
                          Property Papers{'\n'}
                          <Text style={styles.optionalGray}>(If Available)</Text>
                        </Text>
                        <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      </View>

                      <View style={styles.docBadgeBox}>
                        <Ionicons name="person-outline" size={18} color="#0f172a" />
                        <Text style={styles.docBadgeText}>
                          Photograph{'\n'}
                          <Text style={styles.optionalGray}>(Applicant)</Text>
                        </Text>
                        <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      </View>
                    </View>
                  </View>
                </View>

                {/* 3. Confirmation Blue Checkbox */}
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
                    I hereby confirm that the information provided is authentic and correct. I authorize{' '}
                    <Text style={{ fontWeight: '800', color: '#002e75' }}>Loan Point</Text> to share my
                    application and documents with partner banks/NBFCs for Home Loan underwriting & processing.
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
              /* ================= POST-SUBMISSION SUCCESS SCREEN ================= */
              <View style={styles.postSubmitContainer}>
                {/* 1. Celebratory Green Badge Header */}
                <View style={styles.celebrationHeroWrap}>
                  <View style={styles.confettiCluster}>
                    <View style={[styles.confettiDot, { top: 0, left: 20, backgroundColor: '#f59e0b' }]} />
                    <View style={[styles.confettiDot, { top: 12, right: 28, backgroundColor: '#38bdf8' }]} />
                    <View style={[styles.confettiDot, { bottom: 6, left: 36, backgroundColor: '#ec4899' }]} />
                    <View style={[styles.confettiDot, { bottom: 10, right: 38, backgroundColor: '#10b981' }]} />

                    <View style={styles.scallopedGreenBadge}>
                      <Ionicons name="checkmark" size={38} color="#ffffff" />
                    </View>
                  </View>

                  <Text style={styles.postSubmitTitle}>Application Submitted{'\n'}Successfully!</Text>
                  <Text style={styles.postSubmitSubtitle}>
                    Thank you for choosing Loan Point.{'\n'}Your Home Loan application has been received.
                  </Text>
                </View>

                {/* 2. Application ID & Submitted Date Pill */}
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

                {/* 3. 4-Stage Lifecycle Process Flow Tracker */}
                <View style={styles.lifecycleCard}>
                  <View style={styles.lifecycleTrack}>
                    <View style={styles.lifecycleNode}>
                      <View style={[styles.lifecycleCircle, styles.lifecycleCircleDone]}>
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                      </View>
                      <Text style={styles.lifecycleLabelActive}>Application{'\n'}Received</Text>
                    </View>

                    <View style={styles.lifecycleLine} />

                    <View style={styles.lifecycleNode}>
                      <View style={styles.lifecycleCircle}>
                        <Ionicons name="search" size={16} color="#0f172a" />
                      </View>
                      <Text style={styles.lifecycleLabel}>Document{'\n'}Verification</Text>
                    </View>

                    <View style={styles.lifecycleLine} />

                    <View style={styles.lifecycleNode}>
                      <View style={styles.lifecycleCircle}>
                        <MaterialCommunityIcons name="bank" size={16} color="#0f172a" />
                      </View>
                      <Text style={styles.lifecycleLabel}>Legal & Tech{'\n'}Valuation</Text>
                    </View>

                    <View style={styles.lifecycleLine} />

                    <View style={styles.lifecycleNode}>
                      <View style={styles.lifecycleCircle}>
                        <MaterialCommunityIcons name="handshake" size={16} color="#0f172a" />
                      </View>
                      <Text style={styles.lifecycleLabel}>Sanction &{'\n'}Disbursal</Text>
                    </View>
                  </View>
                </View>

                {/* 4. Relationship Manager Card (Arvind Patil) */}
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
                        activeOpacity={0.7}
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
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={15} color="#000000" style={{ marginRight: 5 }} />
                      <Text style={styles.mgrCallBtnText}>Call Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.mgrWhatsAppBtn}
                      onPress={() =>
                        Linking.openURL(
                          `https://wa.me/919545555999?text=${encodeURIComponent(
                            `Hello Arvind Patil, I have submitted my Home Loan application (ID: ${submittedApp.id}). Please assist with the next steps.`
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

                {/* 5. What's Next? Yellow Notice Strip */}
                <View style={styles.whatsNextCard}>
                  <View style={styles.whatsNextBellWrap}>
                    <MaterialCommunityIcons name="bell-ring" size={24} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.whatsNextTitle}>What's Next?</Text>
                    <Text style={styles.whatsNextDesc}>
                      Our Home Loan specialist will review your property & income records to provide custom low-rate sanction offers from top banks within 24–48 hours.
                    </Text>
                  </View>
                </View>

                {/* 6. Dual Action Buttons */}
                <View style={styles.postSubmitBtnRow}>
                  <TouchableOpacity
                    style={styles.goHomeBtn}
                    onPress={onCancel}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="home-outline" size={18} color="#000000" style={{ marginRight: 6 }} />
                    <Text style={styles.goHomeBtnText}>Go to Home</Text>
                  </TouchableOpacity>

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
                  style={[styles.modalOption, monthlyIncome === item && styles.modalOptionSelected]}
                  onPress={() => {
                    setMonthlyIncome(item);
                    setShowIncomeModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, monthlyIncome === item && styles.modalOptionTextSelected]}>
                    {item}
                  </Text>
                  {monthlyIncome === item && <Ionicons name="checkmark-circle" size={20} color="#004aad" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Document View Preview Modal */}
      <DocumentViewPreviewModal
        visible={showPreviewModal}
        doc={previewDoc}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewDoc(null);
        }}
      />

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
                  style={[styles.modalOption, city === item.city && styles.modalOptionSelected]}
                  onPress={() => {
                    setCity(item.city);
                    setShowCityModal(false);
                    setCitySearch('');
                  }}
                >
                  <View>
                    <Text style={[styles.modalOptionText, city === item.city && styles.modalOptionTextSelected]}>
                      {item.city}
                    </Text>
                    <Text style={styles.modalOptionSubText}>{item.state}</Text>
                  </View>
                  {city === item.city && <Ionicons name="checkmark-circle" size={20} color="#004aad" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Loan Amount Modal */}
      <Modal visible={showAmountModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Desired Loan Amount</Text>
              <TouchableOpacity onPress={() => setShowAmountModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={loanAmountOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    (currentStep === 1 ? loanAmount : detailedLoanAmount) === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    if (currentStep === 1) {
                      setLoanAmount(item);
                      setDetailedLoanAmount(item);
                    } else {
                      setDetailedLoanAmount(item);
                    }
                    setShowAmountModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      (currentStep === 1 ? loanAmount : detailedLoanAmount) === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {(currentStep === 1 ? loanAmount : detailedLoanAmount) === item && (
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
              <Text style={styles.modalTitle}>Select Preferred Loan Tenure</Text>
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
                    (currentStep === 1 ? loanTenure : detailedTenure) === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    if (currentStep === 1) {
                      setLoanTenure(item);
                      setDetailedTenure(item);
                    } else {
                      setDetailedTenure(item);
                    }
                    setShowTenureModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      (currentStep === 1 ? loanTenure : detailedTenure) === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {(currentStep === 1 ? loanTenure : detailedTenure) === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#004aad" />
                  )}
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
                  <Text style={[styles.modalOptionText, propertyType === item && styles.modalOptionTextSelected]}>
                    {item}
                  </Text>
                  {propertyType === item && <Ionicons name="checkmark-circle" size={20} color="#004aad" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Vintage / Experience Modal */}
      <Modal visible={showExpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Work Experience / Vintage</Text>
              <TouchableOpacity onPress={() => setShowExpModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={experienceOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, workExperience === item && styles.modalOptionSelected]}
                  onPress={() => {
                    setWorkExperience(item);
                    setShowExpModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, workExperience === item && styles.modalOptionTextSelected]}>
                    {item}
                  </Text>
                  {workExperience === item && <Ionicons name="checkmark-circle" size={20} color="#004aad" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Bank Modal */}
      <Modal visible={showBankModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Primary Bank</Text>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={bankOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, salaryBankAccount === item && styles.modalOptionSelected]}
                  onPress={() => {
                    setSalaryBankAccount(item);
                    setShowBankModal(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <BankLogo bank={item} width={26} height={26} />
                    <Text style={[styles.modalOptionText, salaryBankAccount === item && styles.modalOptionTextSelected]}>
                      {item}
                    </Text>
                  </View>
                  {salaryBankAccount === item && <Ionicons name="checkmark-circle" size={20} color="#004aad" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Entity Type Modal */}
      <Modal visible={showCompanyTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Entity / Company Type</Text>
              <TouchableOpacity onPress={() => setShowCompanyTypeModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={companyTypeOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, companyType === item && styles.modalOptionSelected]}
                  onPress={() => {
                    setCompanyType(item);
                    setShowCompanyTypeModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, companyType === item && styles.modalOptionTextSelected]}>
                    {item}
                  </Text>
                  {companyType === item && <Ionicons name="checkmark-circle" size={20} color="#004aad" />}
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
              <Text style={styles.modalTitle}>Select Home Loan Purpose</Text>
              <TouchableOpacity onPress={() => setShowPurposeModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={purposeOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, loanPurpose === item && styles.modalOptionSelected]}
                  onPress={() => {
                    setLoanPurpose(item);
                    setShowPurposeModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, loanPurpose === item && styles.modalOptionTextSelected]}>
                    {item}
                  </Text>
                  {loanPurpose === item && <Ionicons name="checkmark-circle" size={20} color="#004aad" />}
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
              <Text style={styles.modalTitle}>Existing Monthly EMIs</Text>
              <TouchableOpacity onPress={() => setShowExistingEmiModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={existingEmiOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, existingEmi === item && styles.modalOptionSelected]}
                  onPress={() => {
                    setExistingEmi(item);
                    setShowExistingEmiModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, existingEmi === item && styles.modalOptionTextSelected]}>
                    {item}
                  </Text>
                  {existingEmi === item && <Ionicons name="checkmark-circle" size={20} color="#004aad" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* CIBIL Score Modal */}
      <Modal visible={showCibilModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Estimated CIBIL Score</Text>
              <TouchableOpacity onPress={() => setShowCibilModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={cibilOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, cibilScoreRange === item && styles.modalOptionSelected]}
                  onPress={() => {
                    setCibilScoreRange(item);
                    setShowCibilModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, cibilScoreRange === item && styles.modalOptionTextSelected]}>
                    {item}
                  </Text>
                  {cibilScoreRange === item && <Ionicons name="checkmark-circle" size={20} color="#004aad" />}
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
    width: 62,
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
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  stepLabelActive: {
    fontSize: 9.5,
    color: '#000000',
    fontWeight: '800',
    textAlign: 'center',
  },
  stepLabelCompleted: {
    fontSize: 9.5,
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
  coApplicantRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  coAppChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
  },
  coAppChipActive: {
    borderColor: '#004aad',
    backgroundColor: '#eff6ff',
  },
  coAppChipText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
  coAppChipTextActive: {
    color: '#004aad',
    fontWeight: '800',
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
  // Step 5 Styling
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
  // Post-Submit Success Screen
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
});

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
  Platform,
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
import { isUserDocUploaded, getUserIncomeFormatted, getUserEmploymentType, findUserDocument } from '../../utils/formPreFill';
import { LoanDocItemRow } from '../common/LoanDocItemRow';
import { DocumentViewPreviewModal } from '../common/DocumentViewPreviewModal';
import { DocumentItem } from '../../types';
import { documentService } from '../../services/documentService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CreditCardScreenProps {
  user: UserProfile | null;
  onSuccess?: (newApp: LoanApplication) => void;
  onCancel: () => void;
  onOpenCall?: (phone?: string) => void;
  onOpenWhatsApp?: (phone?: string, text?: string) => void;
}

interface UploadedDocState {
  panCard: boolean;
  aadhaarCard: boolean;
  addressProof: boolean;
  incomeProof: boolean;
  bankStatements: boolean;
  photograph: boolean;
}

interface CardProduct {
  id: string;
  name: string;
  bank: string;
  category: 'Cashback & Rewards' | 'Travel & Airport Lounge' | 'Fuel & Utilities' | 'Lifetime Free';
  joiningFee: string;
  annualFee: string;
  minIncome: string;
  rewardRate: string;
  features: string[];
  bestFor: string;
  tag: string;
  themeColor: string;
  badgeBg: string;
  badgeColor: string;
}

const FEATURED_CARDS: CardProduct[] = [
  {
    id: 'hdfc_millennia',
    name: 'HDFC Millennia Credit Card',
    bank: 'HDFC Bank',
    category: 'Cashback & Rewards',
    joiningFee: '₹1,000 + GST',
    annualFee: '₹1,000 (Waived on ₹1L spend)',
    minIncome: '₹35,000 / month',
    rewardRate: '5% Cashback on Amazon, Flipkart, Swiggy',
    features: ['5% Cashback on Top Partner Brands', '1% on all other spends', '8 Complimentary Domestic Airport Lounges/yr', '1% Fuel Surcharge Waiver'],
    bestFor: 'Online Shopping & Food Delivery',
    tag: 'MOST POPULAR',
    themeColor: '#004c8f',
    badgeBg: '#eff6ff',
    badgeColor: '#1d4ed8',
  },
  {
    id: 'icici_amazon_pay',
    name: 'Amazon Pay ICICI Card',
    bank: 'ICICI Bank',
    category: 'Lifetime Free',
    joiningFee: 'FREE (Lifetime)',
    annualFee: 'FREE (Lifetime)',
    minIncome: '₹25,000 / month',
    rewardRate: '5% Unlimited Cashback for Prime users',
    features: ['No Annual Fee for Lifetime', '5% Cashback on Amazon for Prime', '2% Cashback on 100+ Partner Merchants', 'Direct monthly statement credit'],
    bestFor: 'Everyday Shopping & Bill Payments',
    tag: 'LIFETIME FREE',
    themeColor: '#b02a30',
    badgeBg: '#fef2f2',
    badgeColor: '#b91c1c',
  },
  {
    id: 'sbi_simplyclick',
    name: 'SBI SimplyCLICK Credit Card',
    bank: 'State Bank of India',
    category: 'Cashback & Rewards',
    joiningFee: '₹499 + GST',
    annualFee: '₹499 (Waived on ₹1L spend)',
    minIncome: '₹20,000 / month',
    rewardRate: '10X Reward Points on Online Partners',
    features: ['₹500 Amazon Gift Voucher Welcome Gift', '10X Rewards on Apollo, BookMyShow, Cleartrip', '5X Rewards on all other online spends', '1% Fuel Surcharge Waiver'],
    bestFor: 'Young Professionals & First Card',
    tag: 'EASY APPROVAL',
    themeColor: '#008ecc',
    badgeBg: '#f0f9ff',
    badgeColor: '#0369a1',
  },
  {
    id: 'axis_airtel',
    name: 'Airtel Axis Bank Credit Card',
    bank: 'Axis Bank',
    category: 'Fuel & Utilities',
    joiningFee: '₹500 + GST',
    annualFee: '₹500 (Waived on ₹2L spend)',
    minIncome: '₹25,000 / month',
    rewardRate: '25% Cashback on Airtel bills & recharge',
    features: ['25% Cashback on Airtel Mobile, DTH & Broadband', '10% Cashback on Utility Bills (Electricity, Gas)', '10% Cashback on Swiggy, Zomato & BigBasket', '4 Domestic Lounge Visits/yr'],
    bestFor: 'Utility Bills, Recharges & Groceries',
    tag: 'HIGH SAVINGS',
    themeColor: '#97144d',
    badgeBg: '#fdf2f8',
    badgeColor: '#be185d',
  },
  {
    id: 'kotak_league',
    name: 'Kotak League Platinum Card',
    bank: 'Kotak Mahindra Bank',
    category: 'Travel & Airport Lounge',
    joiningFee: '₹500 + GST',
    annualFee: '₹499 (Waived on ₹50k spend)',
    minIncome: '₹30,000 / month',
    rewardRate: 'Up to 8X Reward Points on Apparels',
    features: ['4 Free PVR Movie Tickets / ₹750 cashback annually', 'Complimentary Airport Lounge Access', 'Special Dining Delights discounts', 'Fuel Surcharge Waiver across India'],
    bestFor: 'Movies, Dining & Lifestyle',
    tag: 'ENTERTAINMENT',
    themeColor: '#ed1c24',
    badgeBg: '#fff1f2',
    badgeColor: '#e11d48',
  },
];

export const CreditCardScreen: React.FC<CreditCardScreenProps> = ({
  user,
  onSuccess,
  onCancel,
  onOpenCall,
  onOpenWhatsApp,
}) => {
  // Navigation / View step (1: Compare & Choose Card, 2: Application Form, 3: Success)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedCard, setSelectedCard] = useState<CardProduct>(FEATURED_CARDS[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Form Fields - Step 1: Personal
  const [fullName, setFullName] = useState<string>(user?.name || '');
  const [mobileNumber, setMobileNumber] = useState<string>(user?.mobile || '');
  const [emailAddress, setEmailAddress] = useState<string>(user?.email || '');
  const [city, setCity] = useState<string>(user?.city || 'Mumbai');
  const [pincode, setPincode] = useState<string>(user?.pincode || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');

  // Form Fields - Step 2: Employment & Income
  const [employmentType, setEmploymentType] = useState<string>(getUserEmploymentType(user));
  const [companyName, setCompanyName] = useState<string>('Tata Consultancy Services');
  const [monthlySalaryInHand, setMonthlySalaryInHand] = useState<string>(getUserIncomeFormatted(user) || '₹65,000');
  const [existingCreditCard, setExistingCreditCard] = useState<'Yes' | 'No'>('Yes');
  const [salaryBank, setSalaryBank] = useState<string>('HDFC Bank');

  // Form Fields - Step 4: Documents
  const [panNumber, setPanNumber] = useState<string>(user?.panNumber || '');
  const [aadhaarNumber, setAadhaarNumber] = useState<string>(user?.aadhaarNumber || '');
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocState>({
    panCard: isUserDocUploaded(user, 'pan_card', ['pan']),
    aadhaarCard: isUserDocUploaded(user, 'aadhaar_card', ['aadhaar', 'uidai']),
    addressProof: isUserDocUploaded(user, 'address_proof', ['electricity', 'utility', 'rent']),
    incomeProof: isUserDocUploaded(user, 'salary_slips', ['salary', 'payslip', 'itr']),
    bankStatements: isUserDocUploaded(user, 'bank_statement', ['statement', 'passbook']),
    photograph: isUserDocUploaded(user, 'passport_photo', ['photo', 'passport']),
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedApp, setSubmittedApp] = useState<LoanApplication | null>(null);
  const [submittedDateString, setSubmittedDateString] = useState<string>('');
  const [isFinalConfirmed, setIsFinalConfirmed] = useState<boolean>(true);

  // Document preview & modal
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [isDocUploading, setIsDocUploading] = useState<boolean>(false);

  const handleViewDocument = (doc: DocumentItem) => {
    setPreviewDoc(doc);
    setShowPreviewModal(true);
  };

  // City modal
  const [allCities, setAllCities] = useState<CityResultItem[]>([]);
  const [citySearch, setCitySearch] = useState<string>('');
  const [showCityModal, setShowCityModal] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    cityLocationService.fetchCitiesData().then((data) => {
      if (isMounted && data && data.length > 0) {
        setAllCities(data);
      }
    });
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

  const syncDocKeyToState = (docKey: string) => {
    setUploadedDocs((prev) => {
      const next = { ...prev };
      if (docKey === 'pan_card') next.panCard = true;
      else if (docKey === 'aadhaar_card') next.aadhaarCard = true;
      else if (docKey === 'address_proof') next.addressProof = true;
      else if (docKey === 'salary_slips') next.incomeProof = true;
      else if (docKey === 'bank_statement') next.bankStatements = true;
      else if (docKey === 'passport_photo') next.photograph = true;
      return next;
    });
  };

  const handleUploadDoc = (docKey: string, defaultTitle: string, category: DocumentItem['category']) => {
    Alert.alert(
      'Upload Document',
      `Upload document for ${defaultTitle}:`,
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
                if (idx >= 0) user.documents[idx] = newDoc;
                else user.documents.push(newDoc);
              }
              syncDocKeyToState(docKey);
              Alert.alert('Success', `"${defaultTitle}" uploaded successfully!`);
            } catch (e) {
              Alert.alert('Error', 'Unable to upload document.');
            } finally {
              setIsDocUploading(false);
            }
          },
        },
        {
          text: 'Take Photo / Image',
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
                if (idx >= 0) user.documents[idx] = newDoc;
                else user.documents.push(newDoc);
              }
              syncDocKeyToState(docKey);
              Alert.alert('Success', `"${defaultTitle}" uploaded successfully!`);
            } catch (e) {
              Alert.alert('Error', 'Unable to upload image.');
            } finally {
              setIsDocUploading(false);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

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
    if (!city.trim()) {
      setFormError('Please select your city');
      return;
    }
    setCurrentStep(2);
  };

  const handleStep2Continue = () => {
    setFormError(null);
    if (!companyName.trim()) {
      setFormError('Please enter company/employer name');
      return;
    }
    if (!monthlySalaryInHand.trim()) {
      setFormError('Please enter your monthly net income');
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
    if (cleanAadhaar && cleanAadhaar.length !== 12 && !aadhaarNumber.includes('XXXX')) {
      setFormError('Aadhaar Number must be 12 digits');
      return;
    }
    setCurrentStep(5);
  };

  const handleFinalSubmit = async () => {
    setFormError(null);
    if (!isFinalConfirmed) {
      setFormError('Please confirm the declaration to submit your application');
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanMobile = mobileNumber.replace(/\D/g, '') || user?.mobile || '9876543210';
      const numericSalary = parseInt(monthlySalaryInHand.replace(/[^0-9]/g, ''), 10) || 65000;

      const app = await loanService.submitEnquiry({
        loanType: 'personal', // registered under personal credit division
        applicantName: fullName.trim(),
        mobile: cleanMobile,
        requestedAmount: 200000,
        tenureMonths: 12,
        monthlyIncome: numericSalary,
        employmentType: employmentType,
        city: city.trim(),
        pincode: pincode.trim() || undefined,
        panNumber: panNumber.trim().toUpperCase() || undefined,
        aadhaarNumber: aadhaarNumber.replace(/\D/g, '') || undefined,
        bankName: selectedCard.bank,
        purpose: `Credit Card Application | ${selectedCard.name} (${selectedCard.bank}) | Category: ${selectedCard.category} | Company: ${companyName.trim()} | Salary: ₹${numericSalary.toLocaleString('en-IN')}`,
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
      if (onSuccess) onSuccess(app);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setFormError(err instanceof Error ? err.message : 'Submission failed');
    }
  };

  const stepsList = [
    { num: 1, label: 'Applicant' },
    { num: 2, label: 'Income' },
    { num: 3, label: 'Card Choice' },
    { num: 4, label: 'Documents' },
    { num: 5, label: 'Submit' },
  ];

  const filteredCards = categoryFilter === 'All'
    ? FEATURED_CARDS
    : FEATURED_CARDS.filter((c) => c.category === categoryFilter);

  const uploadedCount = Object.values(uploadedDocs).filter(Boolean).length;
  const totalDocsCount = Object.keys(uploadedDocs).length;

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
        {/* 2. Top Hero Banner using credit-card-inner.png */}
        <View style={styles.heroBannerImageContainer}>
          <Image
            source={require('../../../assets/inner-banner/credit-card-inner.png')}
            style={styles.heroBannerImage}
            resizeMode="contain"
          />
        </View>

        {/* 3. 5-Step Tracker */}
        {!submittedApp && (
          <View style={styles.stepperContainer}>
            <View style={styles.stepperTrack}>
              {stepsList.map((st) => {
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
                          <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
                            {st.num}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.stepLabelText, isActive && styles.stepLabelTextActive]}>
                        {st.label}
                      </Text>
                    </View>
                    {st.num < 5 && (
                      <View style={[styles.stepConnector, currentStep > st.num && styles.stepConnectorActive]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}

        {/* Form Error Banner */}
        {formError && (
          <View style={styles.errorAlert}>
            <Ionicons name="alert-circle" size={18} color="#dc2626" />
            <Text style={styles.errorAlertText}>{formError}</Text>
          </View>
        )}

        {/* =========================================================================
            STEP 1: APPLICANT BASIC DETAILS
           ========================================================================= */}
        {currentStep === 1 && !submittedApp && (
          <View style={styles.stepContentCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardHeaderIconWrap, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="person" size={18} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.stepTitle}>Applicant Details</Text>
                <Text style={styles.stepSubtitle}>Step 1 of 5 · Basic information for credit eligibility</Text>
              </View>
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name (as per PAN Card) *</Text>
              <View style={styles.inputFieldWrap}>
                <Ionicons name="person-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number (Linked with Aadhaar) *</Text>
              <View style={styles.inputFieldWrap}>
                <Ionicons name="phone-portrait-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address (For e-statements) *</Text>
              <View style={styles.inputFieldWrap}>
                <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. name@example.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                />
              </View>
            </View>

            {/* City Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City of Residence *</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => setShowCityModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="location-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <Text style={[styles.selectBtnText, !city && { color: '#94a3b8' }]}>
                  {city || 'Select your city'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Pincode */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Residential Pincode</Text>
              <View style={styles.inputFieldWrap}>
                <Ionicons name="navigate-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="6-digit pincode"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={pincode}
                  onChangeText={setPincode}
                />
              </View>
            </View>

            {/* Gender Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.pillRow}>
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.optionPill, gender === g && styles.optionPillActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.optionPillText, gender === g && styles.optionPillTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bottom Continue Button */}
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleStep1Continue}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryActionButtonText}>Continue to Employment</Text>
              <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* =========================================================================
            STEP 2: EMPLOYMENT & INCOME
           ========================================================================= */}
        {currentStep === 2 && !submittedApp && (
          <View style={styles.stepContentCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardHeaderIconWrap, { backgroundColor: '#f0fdf4' }]}>
                <MaterialCommunityIcons name="briefcase" size={18} color="#16a34a" />
              </View>
              <View>
                <Text style={styles.stepTitle}>Employment & Income</Text>
                <Text style={styles.stepSubtitle}>Step 2 of 5 · Helps banks determine your credit limit</Text>
              </View>
            </View>

            {/* Employment Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Employment Type *</Text>
              <View style={styles.pillRow}>
                {['Salaried', 'Self-Employed Professional', 'Self-Employed Business'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.optionPill, employmentType === t && styles.optionPillActive]}
                    onPress={() => setEmploymentType(t)}
                  >
                    <Text style={[styles.optionPillText, employmentType === t && styles.optionPillTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Employer / Company Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Company / Business Name *</Text>
              <View style={styles.inputFieldWrap}>
                <Ionicons name="business-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Tata Consultancy Services, Infosys, Self"
                  placeholderTextColor="#94a3b8"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </View>
            </View>

            {/* Monthly In-Hand Salary */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monthly In-Hand Net Income *</Text>
              <View style={styles.inputFieldWrap}>
                <Text style={styles.rupeePrefix}>₹</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 50,000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  value={monthlySalaryInHand}
                  onChangeText={(val) => {
                    const clean = val.replace(/[^0-9]/g, '');
                    if (!clean) {
                      setMonthlySalaryInHand('');
                      return;
                    }
                    const num = parseInt(clean, 10);
                    setMonthlySalaryInHand(`₹${num.toLocaleString('en-IN')}`);
                  }}
                />
              </View>
            </View>

            {/* Primary Salary / Operations Bank */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Salary / Primary Bank Account *</Text>
              <View style={styles.bankPillWrap}>
                {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank'].map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.bankSelectPill, salaryBank === b && styles.bankSelectPillActive]}
                    onPress={() => setSalaryBank(b)}
                  >
                    <BankLogo bank={b} width={20} height={20} />
                    <Text style={[styles.bankSelectPillText, salaryBank === b && styles.bankSelectPillTextActive]}>
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Do you already have a credit card? */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Do you hold an existing Credit Card?</Text>
              <View style={styles.pillRow}>
                {(['Yes', 'No'] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionPill, existingCreditCard === opt && styles.optionPillActive]}
                    onPress={() => setExistingCreditCard(opt)}
                  >
                    <Text style={[styles.optionPillText, existingCreditCard === opt && styles.optionPillTextActive]}>
                      {opt === 'Yes' ? 'Yes, I have card(s)' : 'No, this is my first card'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.dualActionRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setCurrentStep(1)}
              >
                <Ionicons name="arrow-back" size={16} color="#0f172a" />
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryActionButtonFlex}
                onPress={handleStep2Continue}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryActionButtonText}>Choose Your Card</Text>
                <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* =========================================================================
            STEP 3: CARD SELECTION & COMPARISON
           ========================================================================= */}
        {currentStep === 3 && !submittedApp && (
          <View style={styles.stepContentCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardHeaderIconWrap, { backgroundColor: '#fef3c7' }]}>
                <MaterialCommunityIcons name="credit-card-outline" size={18} color="#d97706" />
              </View>
              <View>
                <Text style={styles.stepTitle}>Select Your Credit Card</Text>
                <Text style={styles.stepSubtitle}>Step 3 of 5 · Pick your preferred bank card & benefits</Text>
              </View>
            </View>

            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryFilterRow}>
              {['All', 'Cashback & Rewards', 'Lifetime Free', 'Travel & Airport Lounge', 'Fuel & Utilities'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryFilterPill, categoryFilter === cat && styles.categoryFilterPillActive]}
                  onPress={() => setCategoryFilter(cat)}
                >
                  <Text style={[styles.categoryFilterPillText, categoryFilter === cat && styles.categoryFilterPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Cards List */}
            <View style={styles.cardsListContainer}>
              {filteredCards.map((c) => {
                const isSelected = selectedCard.id === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.cardItemBox, isSelected && styles.cardItemBoxSelected]}
                    onPress={() => setSelectedCard(c)}
                    activeOpacity={0.88}
                  >
                    {/* Top Row: Bank + Tag */}
                    <View style={styles.cardItemTop}>
                      <View style={styles.cardItemBankRow}>
                        <BankLogo bank={c.bank} width={24} height={24} />
                        <Text style={styles.cardItemBankName}>{c.bank}</Text>
                      </View>
                      <View style={[styles.cardTagBadge, { backgroundColor: c.badgeBg }]}>
                        <Text style={[styles.cardTagText, { color: c.badgeColor }]}>{c.tag}</Text>
                      </View>
                    </View>

                    {/* Card Title */}
                    <Text style={styles.cardItemTitle}>{c.name}</Text>
                    <Text style={styles.cardItemRewardText}>{c.rewardRate}</Text>

                    {/* Fee & Min Income Row */}
                    <View style={styles.cardItemFeeRow}>
                      <View style={styles.cardFeeCol}>
                        <Text style={styles.cardFeeLabel}>Joining Fee</Text>
                        <Text style={styles.cardFeeValue}>{c.joiningFee}</Text>
                      </View>
                      <View style={styles.cardFeeDivider} />
                      <View style={styles.cardFeeCol}>
                        <Text style={styles.cardFeeLabel}>Annual Fee</Text>
                        <Text style={styles.cardFeeValue}>{c.annualFee}</Text>
                      </View>
                      <View style={styles.cardFeeDivider} />
                      <View style={styles.cardFeeCol}>
                        <Text style={styles.cardFeeLabel}>Min. Income</Text>
                        <Text style={styles.cardFeeValue}>{c.minIncome}</Text>
                      </View>
                    </View>

                    {/* Features Bullet List */}
                    <View style={styles.cardBulletList}>
                      {c.features.map((f, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <Ionicons name="checkmark-circle" size={14} color="#16a34a" style={{ marginRight: 6 }} />
                          <Text style={styles.bulletText}>{f}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Select indicator */}
                    <View style={[styles.selectIndicatorRow, isSelected && styles.selectIndicatorRowActive]}>
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={isSelected ? '#004aad' : '#94a3b8'}
                      />
                      <Text style={[styles.selectIndicatorText, isSelected && styles.selectIndicatorTextActive]}>
                        {isSelected ? 'Selected Card' : 'Tap to Select'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bottom Actions */}
            <View style={styles.dualActionRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setCurrentStep(2)}
              >
                <Ionicons name="arrow-back" size={16} color="#0f172a" />
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryActionButtonFlex}
                onPress={handleStep3Continue}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryActionButtonText}>Proceed to Documents</Text>
                <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* =========================================================================
            STEP 4: DOCUMENTS UPLOAD
           ========================================================================= */}
        {currentStep === 4 && !submittedApp && (
          <View style={styles.stepContentCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardHeaderIconWrap, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="document-text" size={18} color="#9333ea" />
              </View>
              <View>
                <Text style={styles.stepTitle}>Required Documents</Text>
                <Text style={styles.stepSubtitle}>Step 4 of 5 · Minimal digital documentation</Text>
              </View>
            </View>

            {/* PAN Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PAN Card Number *</Text>
              <View style={styles.inputFieldWrap}>
                <MaterialCommunityIcons name="card-account-details-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="10-digit PAN (e.g. ABCDE1234F)"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="characters"
                  maxLength={10}
                  value={panNumber}
                  onChangeText={(val) => setPanNumber(val.toUpperCase())}
                />
              </View>
            </View>

            {/* Aadhaar Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Aadhaar Card Number *</Text>
              <View style={styles.inputFieldWrap}>
                <MaterialCommunityIcons name="fingerprint" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="12-digit Aadhaar Number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  maxLength={12}
                  value={aadhaarNumber}
                  onChangeText={setAadhaarNumber}
                />
              </View>
            </View>

            {/* Uploaded Count Summary Banner */}
            <View style={styles.docsSummaryBanner}>
              <Ionicons name="cloud-upload" size={18} color="#004aad" />
              <Text style={styles.docsSummaryText}>
                {uploadedCount} of {totalDocsCount} verification documents available
              </Text>
            </View>

            {/* Document Rows */}
            <View style={styles.docRowsList}>
              <LoanDocItemRow
                title="PAN Card Copy"
                subtitle="Clear front photo of your PAN card"
                uploadedDoc={findUserDocument(user, 'pan_card', ['pan'])}
                onUploadOrReupload={() => handleUploadDoc('pan_card', 'PAN Card', 'Identity Proof')}
                onView={handleViewDocument}
              />
              <LoanDocItemRow
                title="Aadhaar Card (Front & Back)"
                subtitle="Front & back image or e-Aadhaar PDF"
                uploadedDoc={findUserDocument(user, 'aadhaar_card', ['aadhaar', 'uidai'])}
                onUploadOrReupload={() => handleUploadDoc('aadhaar_card', 'Aadhaar Card', 'Identity Proof')}
                onView={handleViewDocument}
              />
              <LoanDocItemRow
                title="Current Address Proof"
                subtitle="Electricity bill, rental agreement or passport"
                uploadedDoc={findUserDocument(user, 'address_proof', ['utility', 'electricity'])}
                onUploadOrReupload={() => handleUploadDoc('address_proof', 'Address Proof', 'Address Proof')}
                onView={handleViewDocument}
              />
              <LoanDocItemRow
                title="Latest 3 Months Salary Slips / ITR"
                subtitle="Recent monthly pay slips or Income Tax Return"
                uploadedDoc={findUserDocument(user, 'salary_slips', ['salary', 'payslip', 'itr'])}
                onUploadOrReupload={() => handleUploadDoc('salary_slips', 'Salary Slips', 'Income Proof')}
                onView={handleViewDocument}
              />
              <LoanDocItemRow
                title="Bank Statement (Last 3 Months)"
                subtitle="Salary account statement with bank logo"
                uploadedDoc={findUserDocument(user, 'bank_statement', ['statement', 'passbook'])}
                onUploadOrReupload={() => handleUploadDoc('bank_statement', 'Bank Statement', 'Income Proof')}
                onView={handleViewDocument}
              />
              <LoanDocItemRow
                title="Passport Size Photograph"
                subtitle="Recent front-facing portrait photo"
                uploadedDoc={findUserDocument(user, 'passport_photo', ['photo', 'passport'])}
                onUploadOrReupload={() => handleUploadDoc('passport_photo', 'Photograph', 'Identity Proof')}
                onView={handleViewDocument}
              />
            </View>

            {/* Bottom Actions */}
            <View style={styles.dualActionRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setCurrentStep(3)}
              >
                <Ionicons name="arrow-back" size={16} color="#0f172a" />
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryActionButtonFlex}
                onPress={handleStep4Continue}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryActionButtonText}>Review Application</Text>
                <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* =========================================================================
            STEP 5: REVIEW & FINAL SUBMIT
           ========================================================================= */}
        {currentStep === 5 && !submittedApp && (
          <View style={styles.stepContentCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardHeaderIconWrap, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#d97706" />
              </View>
              <View>
                <Text style={styles.stepTitle}>Review & Submit</Text>
                <Text style={styles.stepSubtitle}>Step 5 of 5 · Please verify your card application details</Text>
              </View>
            </View>

            {/* Selected Card Spotlight */}
            <View style={styles.reviewCardBox}>
              <View style={styles.reviewCardHeader}>
                <BankLogo bank={selectedCard.bank} width={28} height={28} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.reviewCardTitle}>{selectedCard.name}</Text>
                  <Text style={styles.reviewCardSub}>{selectedCard.bank} · {selectedCard.category}</Text>
                </View>
                <View style={[styles.cardTagBadge, { backgroundColor: selectedCard.badgeBg }]}>
                  <Text style={[styles.cardTagText, { color: selectedCard.badgeColor }]}>{selectedCard.tag}</Text>
                </View>
              </View>

              <View style={styles.reviewDivider} />

              <View style={styles.reviewDetailGrid}>
                <View style={styles.reviewGridItem}>
                  <Text style={styles.reviewGridLabel}>Applicant Name</Text>
                  <Text style={styles.reviewGridValue}>{fullName}</Text>
                </View>
                <View style={styles.reviewGridItem}>
                  <Text style={styles.reviewGridLabel}>Mobile</Text>
                  <Text style={styles.reviewGridValue}>{mobileNumber}</Text>
                </View>
                <View style={styles.reviewGridItem}>
                  <Text style={styles.reviewGridLabel}>City</Text>
                  <Text style={styles.reviewGridValue}>{city}</Text>
                </View>
                <View style={styles.reviewGridItem}>
                  <Text style={styles.reviewGridLabel}>Monthly Income</Text>
                  <Text style={styles.reviewGridValue}>{monthlySalaryInHand}</Text>
                </View>
                <View style={styles.reviewGridItem}>
                  <Text style={styles.reviewGridLabel}>Employer</Text>
                  <Text style={styles.reviewGridValue}>{companyName}</Text>
                </View>
                <View style={styles.reviewGridItem}>
                  <Text style={styles.reviewGridLabel}>Salary Bank</Text>
                  <Text style={styles.reviewGridValue}>{salaryBank}</Text>
                </View>
                <View style={styles.reviewGridItem}>
                  <Text style={styles.reviewGridLabel}>PAN Number</Text>
                  <Text style={styles.reviewGridValue}>{panNumber || 'Submitted via KYC'}</Text>
                </View>
                <View style={styles.reviewGridItem}>
                  <Text style={styles.reviewGridLabel}>Joining Fee</Text>
                  <Text style={styles.reviewGridValue}>{selectedCard.joiningFee}</Text>
                </View>
              </View>
            </View>

            {/* Declaration Checkbox */}
            <TouchableOpacity
              style={styles.declarationRow}
              onPress={() => setIsFinalConfirmed(!isFinalConfirmed)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isFinalConfirmed ? 'checkbox' : 'square-outline'}
                size={22}
                color={isFinalConfirmed ? '#004aad' : '#64748b'}
              />
              <Text style={styles.declarationText}>
                I declare that the information provided is true and accurate. I authorize Loan Point and the partner bank to fetch my credit bureau report and initiate card processing.
              </Text>
            </TouchableOpacity>

            {/* Dual Actions */}
            <View style={styles.dualActionRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setCurrentStep(4)}
              >
                <Ionicons name="arrow-back" size={16} color="#0f172a" />
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryActionButtonFlex, isSubmitting && { opacity: 0.7 }]}
                onPress={handleFinalSubmit}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Text style={styles.primaryActionButtonText}>Submit Application</Text>
                    <Ionicons name="checkmark-done" size={18} color="#000000" style={{ marginLeft: 6 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* =========================================================================
            POST-SUBMISSION SUCCESS SCREEN
           ========================================================================= */}
        {submittedApp && (
          <View style={styles.successContainer}>
            {/* Stamp */}
            <View style={styles.successStampContainer}>
              <View style={styles.successBadgeStamp}>
                <Ionicons name="checkmark" size={38} color="#ffffff" />
              </View>
              <View style={[styles.goldSpark, styles.sparkLeftTop]} />
              <View style={[styles.goldSpark, styles.sparkLeftMid]} />
              <View style={[styles.goldSpark, styles.sparkRightTop]} />
              <View style={[styles.goldSpark, styles.sparkRightMid]} />
            </View>

            <Text style={styles.successTitle}>Credit Card Application Submitted!</Text>
            <Text style={styles.successSubtitle}>
              Congratulations! Your card request has been forwarded to {selectedCard.bank} for instant credit assessment.
            </Text>

            {/* Application ID Card with proper flexWrap */}
            <View style={styles.submittedAppCard}>
              <View style={styles.submittedAppCardRow}>
                <View style={styles.submittedAppLeft}>
                  <Text style={styles.submittedAppLabel}>Application ID</Text>
                  <Text style={styles.submittedAppValue} numberOfLines={1} ellipsizeMode="middle">
                    {submittedApp.id}
                  </Text>
                </View>
                <View style={styles.submittedAppRight}>
                  <Text style={styles.submittedAppLabel}>Submitted On</Text>
                  <Text style={styles.submittedAppValueDate}>{submittedDateString}</Text>
                </View>
              </View>
            </View>

            {/* Card Summary Card */}
            <View style={styles.successSummaryBox}>
              <View style={styles.successSummaryRow}>
                <BankLogo bank={selectedCard.bank} width={30} height={30} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.successCardTitle}>{selectedCard.name}</Text>
                  <Text style={styles.successCardCategory}>{selectedCard.category}</Text>
                </View>
                <View style={styles.inReviewPill}>
                  <Text style={styles.inReviewPillText}>Under Process</Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryMetricsRow}>
                <View style={styles.summaryMetricItem}>
                  <Text style={styles.summaryMetricLabel}>Card Provider</Text>
                  <Text style={styles.summaryMetricValue}>{selectedCard.bank}</Text>
                </View>
                <View style={styles.summaryMetricItem}>
                  <Text style={styles.summaryMetricLabel}>Joining Fee</Text>
                  <Text style={styles.summaryMetricValue}>{selectedCard.joiningFee}</Text>
                </View>
                <View style={styles.summaryMetricItem}>
                  <Text style={styles.summaryMetricLabel}>Annual Fee</Text>
                  <Text style={styles.summaryMetricValue}>{selectedCard.annualFee}</Text>
                </View>
              </View>
            </View>

            {/* Relationship Manager Contact Bar */}
            <View style={styles.rmBarContainer}>
              <Image
                source={require('../../../assets/logo/arvind_patil.png')}
                style={styles.rmAvatar}
                resizeMode="cover"
              />
              <View style={styles.rmInfoWrap}>
                <Text style={styles.rmRoleLabel}>Credit Card Relationship Manager</Text>
                <Text style={styles.rmName}>Arvind Patil</Text>
                <Text style={styles.rmContact}>+91 98200 12345 · Available</Text>
              </View>
              <TouchableOpacity
                style={styles.rmCallBtn}
                onPress={() => (onOpenCall ? onOpenCall('+91 98200 12345') : Linking.openURL('tel:9820012345'))}
              >
                <Ionicons name="call" size={16} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rmWaBtn}
                onPress={() => (onOpenWhatsApp ? onOpenWhatsApp('+919820012345', `Hi Arvind, I applied for ${selectedCard.name} (${submittedApp.id})`) : null)}
              >
                <FontAwesome5 name="whatsapp" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Back Action */}
            <TouchableOpacity
              style={styles.backHomeActionButton}
              onPress={onCancel}
              activeOpacity={0.88}
            >
              <Ionicons name="arrow-back" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.backHomeActionText}>Back to Services & Home</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* City Modal */}
      <Modal visible={showCityModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cityModalContainer}>
            <View style={styles.cityModalHeader}>
              <Text style={styles.cityModalTitle}>Select Your City</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <View style={styles.citySearchInputWrap}>
              <Ionicons name="search" size={18} color="#64748b" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.citySearchInput}
                placeholder="Search city or state..."
                placeholderTextColor="#94a3b8"
                value={citySearch}
                onChangeText={setCitySearch}
              />
            </View>
            <FlatList
              data={filteredCities}
              keyExtractor={(item) => `${item.city}-${item.state}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cityListItem}
                  onPress={() => {
                    setCity(item.city);
                    setShowCityModal(false);
                  }}
                >
                  <Ionicons name="location-outline" size={18} color="#004aad" style={{ marginRight: 10 }} />
                  <Text style={styles.cityItemName}>{item.city}, {item.state}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentViewPreviewModal
          visible={showPreviewModal}
          doc={previewDoc}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#f8fafc',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerLogo: {
    width: 140,
    height: 34,
  },
  headerPlaceholder: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 36,
  },
  heroBannerImageContainer: {
    width: '100%',
    aspectRatio: 2.36,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#0a3875',
    shadowColor: '#0a3875',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },

  /* Stepper */
  stepperContainer: {
    marginBottom: 16,
    paddingHorizontal: 6,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#004aad',
    borderColor: '#004aad',
  },
  stepCircleCompleted: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  stepNumberActive: {
    color: '#ffffff',
  },
  stepLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  stepLabelTextActive: {
    color: '#004aad',
    fontWeight: '800',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 2,
    marginBottom: 18,
  },
  stepConnectorActive: {
    backgroundColor: '#16a34a',
  },

  /* Error Alert */
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#fca5a5',
    gap: 8,
  },
  errorAlertText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },

  /* Content Card */
  stepContentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8eff7',
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardHeaderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  stepSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },

  /* Input fields */
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  inputFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  rupeePrefix: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0f172a',
    fontWeight: '600',
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    justifyContent: 'space-between',
  },
  selectBtnText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0f172a',
  },

  /* Pill select */
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionPillActive: {
    backgroundColor: '#004aad',
    borderColor: '#004aad',
  },
  optionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  optionPillTextActive: {
    color: '#ffffff',
  },

  /* Bank selection */
  bankPillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  bankSelectPillActive: {
    borderColor: '#004aad',
    backgroundColor: '#eff6ff',
  },
  bankSelectPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  bankSelectPillTextActive: {
    color: '#004aad',
  },

  /* Step 3: Card Selection */
  categoryFilterRow: {
    gap: 8,
    marginBottom: 14,
  },
  categoryFilterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryFilterPillActive: {
    backgroundColor: '#004aad',
    borderColor: '#004aad',
  },
  categoryFilterPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
  },
  categoryFilterPillTextActive: {
    color: '#ffffff',
  },
  cardsListContainer: {
    gap: 12,
    marginBottom: 16,
  },
  cardItemBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  cardItemBoxSelected: {
    borderColor: '#004aad',
    backgroundColor: '#eff6ff',
    shadowColor: '#004aad',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardItemBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardItemBankName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardTagBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  cardTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cardItemTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  cardItemRewardText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 10,
  },
  cardItemFeeRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8eff7',
  },
  cardFeeCol: {
    flex: 1,
    alignItems: 'center',
  },
  cardFeeDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e2e8f0',
  },
  cardFeeLabel: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
  },
  cardFeeValue: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
    textAlign: 'center',
  },
  cardBulletList: {
    gap: 4,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  selectIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectIndicatorRowActive: {
    backgroundColor: '#ffffff',
    borderColor: '#004aad',
  },
  selectIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  selectIndicatorTextActive: {
    color: '#004aad',
  },

  /* Step 4: Documents */
  docsSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  docsSummaryText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  docRowsList: {
    gap: 8,
    marginBottom: 16,
  },

  /* Step 5: Review Card */
  reviewCardBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  reviewCardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  reviewDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reviewGridItem: {
    width: '47%',
  },
  reviewGridLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  reviewGridValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  declarationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  declarationText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    fontWeight: '500',
  },

  /* Button Actions */
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbbf24',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 22,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryActionButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  dualActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  primaryActionButtonFlex: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbbf24',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 22,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },

  /* Post-Submission Success */
  successContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  successStampContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    marginVertical: 10,
  },
  successBadgeStamp: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  goldSpark: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#fbbf24',
  },
  sparkLeftTop: { top: 12, left: 16 },
  sparkLeftMid: { bottom: 20, left: 10 },
  sparkRightTop: { top: 14, right: 14 },
  sparkRightMid: { bottom: 22, right: 12 },
  successTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  successSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 17,
    paddingHorizontal: 12,
  },
  submittedAppCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  submittedAppCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submittedAppLeft: {
    flex: 1,
    marginRight: 8,
  },
  submittedAppRight: {
    alignItems: 'flex-end',
  },
  submittedAppLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  submittedAppValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#004aad',
    marginTop: 2,
  },
  submittedAppValueDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  successSummaryBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8eff7',
    marginBottom: 12,
  },
  successSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  successCardCategory: {
    fontSize: 11,
    color: '#64748b',
  },
  inReviewPill: {
    backgroundColor: '#eff6ff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  inReviewPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryMetricItem: {
    alignItems: 'center',
  },
  summaryMetricLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  summaryMetricValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  rmBarContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 16,
  },
  rmAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  rmInfoWrap: {
    flex: 1,
  },
  rmRoleLabel: {
    fontSize: 9.5,
    color: '#0284c7',
    fontWeight: '700',
  },
  rmName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  rmContact: {
    fontSize: 10.5,
    color: '#475569',
    marginTop: 1,
  },
  rmCallBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  rmWaBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHomeActionButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#004aad',
    paddingVertical: 13,
    borderRadius: 22,
  },
  backHomeActionText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* City Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  cityModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    padding: 16,
  },
  cityModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cityModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  citySearchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  citySearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
  },
  cityListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cityItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
});

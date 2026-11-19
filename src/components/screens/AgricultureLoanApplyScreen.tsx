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
import { isUserDocUploaded, findUserDocument } from '../../utils/formPreFill';
import { LoanDocItemRow } from '../common/LoanDocItemRow';
import { DocumentViewPreviewModal } from '../common/DocumentViewPreviewModal';
import { CalendarPickerModal } from '../common/CalendarPickerModal';
import { DocumentItem } from '../../types';
import { documentService } from '../../services/documentService';
import { Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AgricultureLoanApplyScreenProps {
  user: UserProfile | null;
  onSuccess: (newApp: LoanApplication) => void;
  onCancel: () => void;
}

interface UploadedDocState {
  panCard: boolean;
  aadhaarCard: boolean;
  satbara712: boolean;
  ferfar8A: boolean;
  cropPikPahani: boolean;
  tractorQuotation: boolean;
  bankPassbook: boolean;
}

export const AgricultureLoanApplyScreen: React.FC<AgricultureLoanApplyScreenProps> = ({
  user,
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // ---------------- STEP 1: Basic Details ----------------
  const [fullName, setFullName] = useState<string>(user?.name && user.name !== 'Valued Customer' ? user.name : '');
  const [mobileNumber, setMobileNumber] = useState<string>(user?.mobile || '');
  const [emailId, setEmailId] = useState<string>(user?.email || '');
  const [dob, setDob] = useState<string>('');
  const [city, setCity] = useState<string>(user?.city || '');
  const [isAgreedStep1, setIsAgreedStep1] = useState<boolean>(true);

  // ---------------- STEP 2: Agriculture & Land Details ----------------
  const [landHoldingAcres, setLandHoldingAcres] = useState<string>('');
  const [talukaVillage, setTalukaVillage] = useState<string>(user?.city ? `Taluka & Dist ${user.city}` : '');
  const [gatNumber, setGatNumber] = useState<string>('');
  const [irrigationSource, setIrrigationSource] = useState<string>('');
  const [primaryCrops, setPrimaryCrops] = useState<string>('');
  const [hasKccCard, setHasKccCard] = useState<'Yes' | 'No'>('No');
  const [farmingType, setFarmingType] = useState<string>('');

  // ---------------- STEP 3: Loan Purpose & Credit Details ----------------
  const [agriLoanType, setAgriLoanType] = useState<string>('');
  const [requiredLoanAmount, setRequiredLoanAmount] = useState<string>('');
  const [loanTenure, setLoanTenure] = useState<string>('');
  const [repaymentPattern, setRepaymentPattern] = useState<string>('');
  const [primaryAgriBank, setPrimaryAgriBank] = useState<string>('');
  const [cibilScoreRange, setCibilScoreRange] = useState<string>(
    user?.cibilEstimateScore ? (user.cibilEstimateScore >= 750 ? '750 and Above (Excellent)' : '700 - 749 (Good)') : ''
  );

  // ---------------- STEP 4: Documents (Pre-fill ONLY if authentic document exists in database) ----------------
  const [panNumber, setPanNumber] = useState<string>(user?.panNumber || '');
  const [aadhaarNumber, setAadhaarNumber] = useState<string>(user?.aadhaarNumber || '');
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocState>({
    panCard: isUserDocUploaded(user, 'pan_card', ['pan']),
    aadhaarCard: isUserDocUploaded(user, 'aadhaar_card', ['aadhaar', 'uidai']),
    satbara712: isUserDocUploaded(user, 'land_records_712', ['7/12', 'satbara', 'land']),
    ferfar8A: isUserDocUploaded(user, 'land_records_712', ['8a', 'ferfar']),
    cropPikPahani: isUserDocUploaded(user, 'crop_cultivation_cert', ['crop', 'pik pahani']),
    tractorQuotation: isUserDocUploaded(user, 'purchase_quotation', ['quotation', 'invoice', 'tractor']),
    bankPassbook: isUserDocUploaded(user, 'bank_statement', ['passbook', 'statement', 'bank']),
  });

  // ---------------- STEP 5: Final Confirmation & Submission ----------------
  const [isFinalConfirmed, setIsFinalConfirmed] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedApp, setSubmittedApp] = useState<LoanApplication | null>(null);
  const [submittedDateString, setSubmittedDateString] = useState<string>('');

  // Calendar & Document Preview & Upload State
  const [showDobCalendar, setShowDobCalendar] = useState<boolean>(false);
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
  const [showCityModal, setShowCityModal] = useState<boolean>(false);
  const [showLandModal, setShowLandModal] = useState<boolean>(false);
  const [showIrrigationModal, setShowIrrigationModal] = useState<boolean>(false);
  const [showFarmingTypeModal, setShowFarmingTypeModal] = useState<boolean>(false);
  const [showAgriTypeModal, setShowAgriTypeModal] = useState<boolean>(false);
  const [showAmountModal, setShowAmountModal] = useState<boolean>(false);
  const [showTenureModal, setShowTenureModal] = useState<boolean>(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState<boolean>(false);
  const [showBankModal, setShowBankModal] = useState<boolean>(false);

  // City Search
  const [citySearch, setCitySearch] = useState<string>('');
  const [allCities, setAllCities] = useState<CityResultItem[]>(cityLocationService.getFallbackCities());

  // Error validation
  const [formError, setFormError] = useState<string | null>(null);

  // Document counts
  const uploadedCount = Object.values(uploadedDocs).filter(Boolean).length;
  const totalDocsCount = Object.keys(uploadedDocs).length;

  const landOptions = [
    'Up to 2 Acres (Small / Marginal Farmer)',
    '2 - 5 Acres (Medium)',
    '5 - 10 Acres',
    '10 - 20 Acres',
    'Above 20 Acres',
  ];

  const irrigationSources = [
    'Borewell & Canal Water',
    'Open Well / Drip Irrigation',
    'River Lift Irrigation',
    'Rainfed (Jirayat / Dryland)',
    'Farm Pond (Shet-tale)',
  ];

  const farmingTypes = [
    'Crop Cultivation (Kharif / Rabi)',
    'Crop Cultivation & Allied Dairy',
    'Fruit Orchard / Horticulture',
    'Poultry / Goat Farming',
    'Polyhouse / Green House Farming',
  ];

  const agriLoanTypes = [
    'Kisan Credit Card (KCC Crop Loan)',
    'Tractor & Farm Machinery Loan',
    'Solar Agriculture Pump & Drip Subsidy',
    'Dairy & Cattle Farming Credit',
    'Warehouse & Cold Storage Financing',
  ];

  const amountOptions = [
    '₹1,00,000',
    '₹2,00,000',
    '₹3,00,000 (Subsidized Interest Limit)',
    '₹5,00,000',
    '₹7,50,000',
    '₹10,00,000',
    '₹15,00,000',
    '₹25,00,000',
  ];

  const tenureOptions = [
    '1 Year (KCC Season Renewal)',
    '3 Years (Renewable Annually)',
    '5 Years (Machinery / Tractor Term Loan)',
    '7 Years (Irrigation & Farm Infra)',
  ];

  const repaymentPatterns = [
    'Seasonal (Post Harvest Clearance)',
    'Half-Yearly (Biannual Installments)',
    'Monthly EMI (Allied Dairy / Term Loan)',
    'Annual Harvest Lump Sum',
  ];

  const agriBanks = [
    'State Bank of India (Agri Branch)',
    'Bank of Maharashtra (Agri Finance)',
    'District Central Co-op Bank (DCCB)',
    'Central Bank of India',
    'Punjab National Bank',
    'Canara Bank',
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
      setFormError('Please enter farmer full name');
      return;
    }
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number');
      return;
    }
    // City is optional
    if (!isAgreedStep1) {
      setFormError('Please accept terms & conditions');
      return;
    }
    setCurrentStep(2);
  };

  const handleStep2Continue = () => {
    setFormError(null);
    if (!talukaVillage.trim()) {
      setFormError('Please enter village and taluka location');
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
      const numericAmount = parseInt(requiredLoanAmount.replace(/[^0-9]/g, ''), 10) || 500000;
      const tenureMatch = loanTenure.match(/(\d+)\s*Years/);
      const tenureMonths = tenureMatch ? parseInt(tenureMatch[1], 10) * 12 : 36;

      const app = await loanService.submitEnquiry({
        loanType: 'agriculture',
        applicantName: fullName.trim(),
        mobile: cleanMobile,
        requestedAmount: numericAmount,
        tenureMonths: tenureMonths,
        monthlyIncome: 65000,
        employmentType: 'Self-Employed',
        city: city.trim(),
        panNumber: panNumber.trim().toUpperCase() || undefined,
        aadhaarNumber: aadhaarNumber.replace(/\D/g, '') || undefined,
        bankName: primaryAgriBank || undefined,
        purpose: `Agriculture Loan | Scheme: ${agriLoanType} | Land: ${landHoldingAcres} (${gatNumber}) | Location: ${talukaVillage} | Crops: ${primaryCrops} | Irrigation: ${irrigationSource} | Bank: ${primaryAgriBank} | KCC Active: ${hasKccCard}`,
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
    { num: 2, label: 'Agri Details' },
    { num: 3, label: 'Loan Details' },
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
        {/* 2. Hero Section: Top Banner with assets/inner-banner/agriculture-inner.png */}
        <View style={styles.heroBannerImageContainer}>
          <Image
            source={require('../../../assets/inner-banner/agriculture-inner.png')}
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
                <Text style={styles.stepHeaderTitle}>Step 1 – Farmer Details</Text>
                <Text style={styles.stepHeaderSubtitle}>Tell us about applicant / landowner</Text>
              </View>
            </View>

            {/* Farmer Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Farmer Full Name (As per 7/12 Extract) <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="person-outline" size={20} color="#64748b" />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter farmer full name"
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
                  placeholder="Enter email ID"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={emailId}
                  onChangeText={setEmailId}
                />
              </View>
            </View>

            {/* DOB & District Row */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>Date of Birth <Text style={styles.asterisk}>*</Text></Text>
                <TouchableOpacity
                  style={styles.dropdownPickerBox}
                  onPress={() => setShowDobCalendar(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.inputIconBox}>
                    <Ionicons name="calendar-outline" size={18} color="#64748b" />
                  </View>
                  <Text style={[styles.dropdownPickerText, !dob && { color: '#94a3b8' }]} numberOfLines={1}>
                    {dob || 'DD/MM/YYYY'}
                  </Text>
                  <Ionicons name="calendar" size={16} color="#004aad" />
                </TouchableOpacity>
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.fieldLabel}>District / City (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconBox}>
                    <Ionicons name="location-outline" size={18} color="#64748b" />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter district/city"
                    placeholderTextColor="#94a3b8"
                    value={city}
                    onChangeText={setCity}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            {/* Safety Strip */}
            <View style={styles.safetyStrip}>
              <View style={styles.safetyIconBox}>
                <Ionicons name="shield-checkmark" size={18} color="#16a34a" />
              </View>
              <View style={styles.safetyTextBox}>
                <Text style={styles.safetyTitle}>Government Interest Subvention Eligible</Text>
                <Text style={styles.safetyDesc}>Direct credit assistance through NABARD & leading rural banking schemes.</Text>
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
                I authorize Loan Point & agricultural lending partners to verify 7/12 extract and contact me. I accept{' '}
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
                <Text style={styles.continueButtonText}>Continue to Agriculture Details</Text>
                <Ionicons name="arrow-forward" size={18} color="#002e75" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ---------------- STEP 2: Agriculture & Land Details ---------------- */}
        {currentStep === 2 && !submittedApp && (
          <View style={styles.cardContainer}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepHeaderIconBox}>
                <MaterialCommunityIcons name="image-filter-hdr" size={22} color="#002e75" />
              </View>
              <View style={styles.stepHeaderTextCol}>
                <Text style={styles.stepHeaderTitle}>Step 2 – Land & Crop Details</Text>
                <Text style={styles.stepHeaderSubtitle}>Land holding, location, Gat No. & irrigation</Text>
              </View>
            </View>

            {/* Land Holding */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Total Agricultural Land Holding <Text style={styles.asterisk}>*</Text></Text>
              <TouchableOpacity
                style={styles.dropdownPickerBox}
                onPress={() => setShowLandModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.inputIconBox}>
                  <MaterialCommunityIcons name="terrain" size={18} color="#64748b" />
                </View>
                <Text style={styles.dropdownPickerText}>{landHoldingAcres}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Village & Taluka */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Village & Taluka Location <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="map-outline" size={20} color="#64748b" />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Village, Taluka / Block"
                  placeholderTextColor="#94a3b8"
                  value={talukaVillage}
                  onChangeText={setTalukaVillage}
                />
              </View>
            </View>

            {/* Gat No. & Survey Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Gat Number / Survey Number</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconBox}>
                  <MaterialCommunityIcons name="numeric" size={20} color="#64748b" />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Gat No. 142/A & 143"
                  placeholderTextColor="#94a3b8"
                  value={gatNumber}
                  onChangeText={setGatNumber}
                />
              </View>
            </View>

            {/* Irrigation & Farming Activity Row */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>Irrigation Source</Text>
                <TouchableOpacity
                  style={styles.dropdownPickerBox}
                  onPress={() => setShowIrrigationModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownPickerText} numberOfLines={1}>{irrigationSource}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.fieldLabel}>Farming Activity</Text>
                <TouchableOpacity
                  style={styles.dropdownPickerBox}
                  onPress={() => setShowFarmingTypeModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownPickerText} numberOfLines={1}>{farmingType}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Major Crops */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Major Cultivated Crops</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconBox}>
                  <MaterialCommunityIcons name="barley" size={20} color="#64748b" />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Soybean, Cotton, Tur, Sugarcane"
                  placeholderTextColor="#94a3b8"
                  value={primaryCrops}
                  onChangeText={setPrimaryCrops}
                />
              </View>
            </View>

            {/* Existing KCC Card */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Do you hold an active Kisan Credit Card (KCC)?</Text>
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    hasKccCard === 'Yes' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setHasKccCard('Yes')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={hasKccCard === 'Yes' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={hasKccCard === 'Yes' ? '#004aad' : '#94a3b8'}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      hasKccCard === 'Yes' && styles.segmentButtonTextActive,
                    ]}
                  >
                    Yes (Existing KCC)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    hasKccCard === 'No' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setHasKccCard('No')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={hasKccCard === 'No' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={hasKccCard === 'No' ? '#004aad' : '#94a3b8'}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      hasKccCard === 'No' && styles.segmentButtonTextActive,
                    ]}
                  >
                    No (New Application)
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
                <Text style={styles.primaryActionButtonText}>Continue to Loan Details</Text>
                <Ionicons name="arrow-forward" size={18} color="#002e75" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ---------------- STEP 3: Loan Purpose & Credit Details ---------------- */}
        {currentStep === 3 && !submittedApp && (
          <View style={styles.cardContainer}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepHeaderIconBox}>
                <MaterialCommunityIcons name="cash-multiple" size={22} color="#002e75" />
              </View>
              <View style={styles.stepHeaderTextCol}>
                <Text style={styles.stepHeaderTitle}>Step 3 – Agriculture Credit Scheme</Text>
                <Text style={styles.stepHeaderSubtitle}>Select credit scheme, loan quantum & bank</Text>
              </View>
            </View>

            {/* Agri Scheme Type */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Agricultural Loan Scheme <Text style={styles.asterisk}>*</Text></Text>
              <TouchableOpacity
                style={styles.dropdownPickerBox}
                onPress={() => setShowAgriTypeModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.inputIconBox}>
                  <MaterialCommunityIcons name="seed-outline" size={18} color="#64748b" />
                </View>
                <Text style={styles.dropdownPickerText}>{agriLoanType}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Required Loan Amount */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Required Loan Amount <Text style={styles.asterisk}>*</Text>
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

            {/* Tenure & Repayment Row */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>Loan Tenure</Text>
                <TouchableOpacity
                  style={styles.dropdownPickerBox}
                  onPress={() => setShowTenureModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownPickerText} numberOfLines={1}>{loanTenure}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.fieldLabel}>Repayment Pattern</Text>
                <TouchableOpacity
                  style={styles.dropdownPickerBox}
                  onPress={() => setShowRepaymentModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownPickerText} numberOfLines={1}>{repaymentPattern}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Preferred Bank */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Preferred Agricultural Bank</Text>
              <TouchableOpacity
                style={styles.dropdownPickerBox}
                onPress={() => setShowBankModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.inputIconBox}>
                  {primaryAgriBank ? (
                    <BankLogo bank={primaryAgriBank} width={22} height={22} />
                  ) : (
                    <MaterialCommunityIcons name="bank" size={18} color="#64748b" />
                  )}
                </View>
                <Text style={styles.dropdownPickerText}>{primaryAgriBank}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </TouchableOpacity>
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
                  Upload clear and valid land ownership records for faster loan approval
                </Text>
              </View>
            </View>

            {/* Document List (7 Rows) */}
            <View style={styles.docListContainer}>
              {/* Row 1: PAN Card (Mandatory) */}
              <LoanDocItemRow
                title="Farmer PAN Card"
                subtitle="Copy of applicant PAN Card (Front Side)"
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

              {/* Row 2: Aadhaar Card (Mandatory) */}
              <LoanDocItemRow
                title="Farmer Aadhaar Card"
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

              {/* Row 3: 7/12 (Satbara) Extract */}
              <LoanDocItemRow
                title="7/12 (Satbara) Extract"
                subtitle="Digitally signed latest 7/12 land record showing land ownership"
                isMandatory
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="file-document-outline" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'satbara_712', ['7/12', 'satbara', 'land'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('satbara_712', '7/12 (Satbara) Extract', 'Property Document')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 4: 8A Land Holding Extract */}
              <LoanDocItemRow
                title="8A Land Holding Extract"
                subtitle="Village Form 8-A displaying total land holding and khata number"
                isMandatory
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="file-chart-outline" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'ferfar_8a', ['8a', 'khata', 'holding'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('ferfar_8a', '8A Extract', 'Property Document')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 5: Crop Inspection (Pik Pahani) */}
              <LoanDocItemRow
                title="Crop Inspection (Pik Pahani)"
                subtitle="E-Pik Pahani registered entry or Talathi verification certificate"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="sprout-outline" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'crop_pik_pahani', ['crop', 'pik pahani', 'cultivation'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('crop_pik_pahani', 'Crop Inspection (Pik Pahani)', 'Other')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 6: Bank Passbook Front Page */}
              <LoanDocItemRow
                title="Bank Passbook Front Page"
                subtitle="Active savings account passbook with IFSC code"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="bank" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'bank_statement', ['passbook', 'statement', 'bank'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('bank_statement', 'Bank Passbook', 'Income Proof')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 7: Equipment / Tractor Quotation (if Available) */}
              <LoanDocItemRow
                title="Tractor / Equipment Quotation"
                subtitle="Dealer proforma invoice for machinery or solar pump (if any)"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="tractor" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'tractor_quotation', ['tractor', 'machinery', 'quotation'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('tractor_quotation', 'Equipment Quotation', 'Other')}
              />
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
                  Please review your land details and submit your agriculture loan application.
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
                    <Text style={styles.summaryLabel}>Farmer Name</Text>
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
                    <MaterialCommunityIcons name="seed-outline" size={16} color="#0f172a" style={styles.rowIcon} />
                    <Text style={styles.summaryLabel}>Agri Scheme</Text>
                  </View>
                  <Text style={styles.summaryColon}>:</Text>
                  <Text style={styles.summaryValue}>{agriLoanType}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.rowLabelCol}>
                    <MaterialCommunityIcons name="terrain" size={16} color="#0f172a" style={styles.rowIcon} />
                    <Text style={styles.summaryLabel}>Land Holding</Text>
                  </View>
                  <Text style={styles.summaryColon}>:</Text>
                  <Text style={styles.summaryValue}>{landHoldingAcres}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.rowLabelCol}>
                    <Ionicons name="location-outline" size={16} color="#0f172a" style={styles.rowIcon} />
                    <Text style={styles.summaryLabel}>Village Location</Text>
                  </View>
                  <Text style={styles.summaryColon}>:</Text>
                  <Text style={styles.summaryValue}>{talukaVillage}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.rowLabelCol}>
                    <MaterialCommunityIcons name="bank" size={16} color="#0f172a" style={styles.rowIcon} />
                    <Text style={styles.summaryLabel}>Agri Bank</Text>
                  </View>
                  <Text style={styles.summaryColon}>:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
                    {primaryAgriBank ? <BankLogo bank={primaryAgriBank} width={18} height={18} /> : null}
                    <Text style={styles.summaryValue}>{primaryAgriBank}</Text>
                  </View>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.rowLabelCol}>
                    <MaterialCommunityIcons name="currency-inr" size={16} color="#0f172a" style={styles.rowIcon} />
                    <Text style={styles.summaryLabel}>Required Credit</Text>
                  </View>
                  <Text style={styles.summaryColon}>:</Text>
                  <Text style={styles.summaryValueHighlight}>{requiredLoanAmount}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.rowLabelCol}>
                    <Ionicons name="calendar-outline" size={16} color="#0f172a" style={styles.rowIcon} />
                    <Text style={styles.summaryLabel}>Repayment</Text>
                  </View>
                  <Text style={styles.summaryColon}>:</Text>
                  <Text style={styles.summaryValue}>{repaymentPattern}</Text>
                </View>
              </View>
            </View>

            {/* Uploaded Documents Grid (7/7) */}
            <View style={styles.docsSummaryCard}>
              <View style={styles.docsSummaryHeader}>
                <View style={styles.docsSummaryTitleRow}>
                  <MaterialCommunityIcons name="file-check-outline" size={18} color="#004aad" />
                  <Text style={styles.docsSummaryTitle}>Uploaded Land Documents ({uploadedCount}/{totalDocsCount})</Text>
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
                      Farmer PAN <Text style={styles.mandatoryBadge}>(Mandatory)</Text>
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
                      Farmer Aadhaar <Text style={styles.mandatoryBadge}>(Mandatory)</Text>
                    </Text>
                    <Ionicons
                      name={uploadedDocs.aadhaarCard ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={uploadedDocs.aadhaarCard ? '#16a34a' : '#94a3b8'}
                      style={styles.checkIconEnd}
                    />
                  </View>

                  <View style={styles.docCheckItem}>
                    <MaterialCommunityIcons name="file-document-outline" size={16} color="#334155" />
                    <Text style={styles.docCheckText}>7/12 Satbara</Text>
                    <Ionicons
                      name={uploadedDocs.satbara712 ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={uploadedDocs.satbara712 ? '#16a34a' : '#94a3b8'}
                      style={styles.checkIconEnd}
                    />
                  </View>

                  <View style={styles.docCheckItem}>
                    <MaterialCommunityIcons name="file-certificate-outline" size={16} color="#334155" />
                    <Text style={styles.docCheckText}>8A Certificate</Text>
                    <Ionicons
                      name={uploadedDocs.ferfar8A ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={uploadedDocs.ferfar8A ? '#16a34a' : '#94a3b8'}
                      style={styles.checkIconEnd}
                    />
                  </View>
                </View>

                <View style={styles.docGridCol}>
                  <View style={styles.docCheckItem}>
                    <MaterialCommunityIcons name="sprout" size={16} color="#334155" />
                    <Text style={styles.docCheckText}>e-Pik Pahani</Text>
                    <Ionicons
                      name={uploadedDocs.cropPikPahani ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={uploadedDocs.cropPikPahani ? '#16a34a' : '#94a3b8'}
                      style={styles.checkIconEnd}
                    />
                  </View>

                  <View style={styles.docCheckItem}>
                    <MaterialCommunityIcons name="bank" size={16} color="#334155" />
                    <Text style={styles.docCheckText}>Bank Passbook</Text>
                    <Ionicons
                      name={uploadedDocs.bankPassbook ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={uploadedDocs.bankPassbook ? '#16a34a' : '#94a3b8'}
                      style={styles.checkIconEnd}
                    />
                  </View>

                  <View style={styles.docCheckItem}>
                    <MaterialCommunityIcons name="tractor" size={16} color="#334155" />
                    <Text style={styles.docCheckText}>Machinery / Tractor</Text>
                    <Ionicons
                      name={uploadedDocs.tractorQuotation ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={uploadedDocs.tractorQuotation ? '#16a34a' : '#94a3b8'}
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
                I hereby declare that the agricultural land details and 7/12 extract information provided are genuine. I authorize{' '}
                <Text style={styles.declarationBold}>Loan Point</Text> to coordinate with rural bank branches and agriculture
                underwriters for crop/farm loan sanctions.
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
                Thank you for choosing Loan Point. Your Agriculture Loan application has been received.
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
                    <Ionicons name="search-outline" size={16} color="#64748b" />
                  </View>
                  <Text style={styles.lifecycleLabel}>7/12 & Land Inspection</Text>
                </View>

                <View style={styles.lifecycleConnector} />

                <View style={styles.lifecycleNode}>
                  <View style={styles.lifecycleCircle}>
                    <MaterialCommunityIcons name="bank-outline" size={16} color="#64748b" />
                  </View>
                  <Text style={styles.lifecycleLabel}>Bank Agro Appraisal</Text>
                </View>

                <View style={styles.lifecycleConnector} />

                <View style={styles.lifecycleNode}>
                  <View style={styles.lifecycleCircle}>
                    <MaterialCommunityIcons name="handshake-outline" size={16} color="#64748b" />
                  </View>
                  <Text style={styles.lifecycleLabel}>Subsidy & Sanction</Text>
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
                  <Text style={styles.rmRoleLabel}>Your Rural Agri Officer</Text>
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
                        `Hello Arvind Patil, I submitted Agriculture Loan Application ${submittedApp.id} for ${agriLoanType} in ${talukaVillage}. Please assist.`
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
                    Our agricultural loan coordinator will verify your 7/12 extract and prepare the bank scale of finance application.
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

      {/* Calendar Picker Modal for DOB */}
      <CalendarPickerModal
        visible={showDobCalendar}
        currentDateStr={dob}
        onSelectDate={(selectedDate) => {
          setDob(selectedDate);
          setShowDobCalendar(false);
        }}
        onClose={() => setShowDobCalendar(false)}
      />

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
      <Modal visible={showCityModal} animationType="slide" transparent onRequestClose={() => setShowCityModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select District / City</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchBox}>
              <Ionicons name="search" size={18} color="#64748b" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search district or taluka..."
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

      {/* Land Holding Modal */}
      <Modal visible={showLandModal} animationType="slide" transparent onRequestClose={() => setShowLandModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Land Holding</Text>
              <TouchableOpacity onPress={() => setShowLandModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={landOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionItem}
                  onPress={() => {
                    setLandHoldingAcres(item);
                    setShowLandModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Irrigation Modal */}
      <Modal visible={showIrrigationModal} animationType="slide" transparent onRequestClose={() => setShowIrrigationModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Irrigation Source</Text>
              <TouchableOpacity onPress={() => setShowIrrigationModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={irrigationSources}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionItem}
                  onPress={() => {
                    setIrrigationSource(item);
                    setShowIrrigationModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Farming Type Modal */}
      <Modal visible={showFarmingTypeModal} animationType="slide" transparent onRequestClose={() => setShowFarmingTypeModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Farming Activity</Text>
              <TouchableOpacity onPress={() => setShowFarmingTypeModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={farmingTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionItem}
                  onPress={() => {
                    setFarmingType(item);
                    setShowFarmingTypeModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Agri Loan Type Modal */}
      <Modal visible={showAgriTypeModal} animationType="slide" transparent onRequestClose={() => setShowAgriTypeModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Loan Scheme</Text>
              <TouchableOpacity onPress={() => setShowAgriTypeModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={agriLoanTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionItem}
                  onPress={() => {
                    setAgriLoanType(item);
                    setShowAgriTypeModal(false);
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

      {/* Repayment Pattern Modal */}
      <Modal visible={showRepaymentModal} animationType="slide" transparent onRequestClose={() => setShowRepaymentModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Repayment Pattern</Text>
              <TouchableOpacity onPress={() => setShowRepaymentModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={repaymentPatterns}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionItem}
                  onPress={() => {
                    setRepaymentPattern(item);
                    setShowRepaymentModal(false);
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
              <Text style={styles.modalTitle}>Select Agriculture Bank</Text>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={agriBanks}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOptionItem, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}
                  onPress={() => {
                    setPrimaryAgriBank(item);
                    setShowBankModal(false);
                  }}
                >
                  <BankLogo bank={item} width={26} height={26} />
                  <Text style={[styles.modalOptionText, { flex: 1 }]}>{item}</Text>
                  {primaryAgriBank === item && (
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

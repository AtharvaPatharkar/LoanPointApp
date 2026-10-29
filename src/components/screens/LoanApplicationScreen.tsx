import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoanCategory, LoanApplication, UserProfile } from '../../types';
import {
  calculateEMI,
  formatINR,
  validatePAN,
  validateAadhaar,
  validateMonthlyIncome,
} from '../../utils/calculator';
import { loanService } from '../../services/loanService';
import { cityLocationService, CityResultItem } from '../../services/cityLocationService';
import { colors } from '../../theme/colors';
import { CustomSlider } from '../common/CustomSlider';
import { LoanIcon } from '../common/LoanIcon';
import { IsometricTile } from '../common/IsometricTile';

const LOAN_PRODUCT_META: Record<
  string,
  {
    type:
      | 'personal'
      | 'business'
      | 'home'
      | 'mortgage'
      | 'car'
      | 'education'
      | 'agriculture'
      | 'mudra';
    badgeTag?: string;
    badgeColor?: string;
    cardBorderColor: string;
    cardBg: string;
  }
> = {
  personal: {
    type: 'personal',
    badgeTag: 'Highest Approval',
    badgeColor: '#10b981',
    cardBorderColor: '#fed7aa',
    cardBg: '#fffbf5',
  },
  home: {
    type: 'home',
    badgeTag: 'Lowest 8.40%',
    badgeColor: '#0284c7',
    cardBorderColor: '#fecdd3',
    cardBg: '#fff8f8',
  },
  business: {
    type: 'business',
    badgeTag: 'No Collateral',
    badgeColor: '#6366f1',
    cardBorderColor: '#ddd6fe',
    cardBg: '#faf8ff',
  },
  mortgage: {
    type: 'mortgage',
    badgeTag: 'Max Funding',
    badgeColor: '#0d9488',
    cardBorderColor: '#bae6fd',
    cardBg: '#f7fbff',
  },
  car: {
    type: 'car',
    badgeTag: 'Up to 90%',
    badgeColor: '#2563eb',
    cardBorderColor: '#bfdbfe',
    cardBg: '#f6faff',
  },
  education: {
    type: 'education',
    badgeTag: 'Study India/Abroad',
    badgeColor: '#c026d3',
    cardBorderColor: '#fbcfe8',
    cardBg: '#fdf8fa',
  },
  agriculture: {
    type: 'agriculture',
    badgeTag: 'Govt Subsidy',
    badgeColor: '#16a34a',
    cardBorderColor: '#bbf7d0',
    cardBg: '#f7fdf9',
  },
  mudra: {
    type: 'mudra',
    badgeTag: 'PMMY 0% Security',
    badgeColor: '#ea580c',
    cardBorderColor: '#fde68a',
    cardBg: '#fffdf5',
  },
};

interface LoanApplicationScreenProps {
  category: LoanCategory;
  user: UserProfile | null;
  onCategoryChange?: (category: LoanCategory) => void;
  onNavigateToProfile?: () => void;
  onSuccess: (newApplication: LoanApplication) => void;
  onCancel: () => void;
}

export const LoanApplicationScreen: React.FC<LoanApplicationScreenProps> = ({
  category: initialCategory,
  user,
  onCategoryChange,
  onNavigateToProfile,
  onSuccess,
  onCancel,
}) => {
  const categories = loanService.getCategories();

  // Selected Loan Category
  const [selectedCat, setSelectedCat] = useState<LoanCategory>(initialCategory);

  useEffect(() => {
    setSelectedCat(initialCategory);
  }, [initialCategory]);

  // Loan Amount
  const [amount, setAmount] = useState<number>(() => {
    const defaultVal = initialCategory.id === 'personal' ? 300000 : 1500000;
    return Math.min(initialCategory.maxAmount, Math.max(initialCategory.minAmount, defaultVal));
  });
  const [amountInput, setAmountInput] = useState<string>(amount.toString());

  // Tenure Mode: 'years' or 'months'
  const [tenureMode, setTenureMode] = useState<'years' | 'months'>('years');
  const [tenureYears, setTenureYears] = useState<number>(3);
  const [tenureMonths, setTenureMonths] = useState<number>(36);
  const [tenureInput, setTenureInput] = useState<string>('3');

  // Unified Total Months for EMI & Submission
  const totalTenureMonths = tenureMode === 'years'
    ? Math.max(1, Math.round(tenureYears * 12))
    : Math.max(1, Math.round(tenureMonths));

  // Progressive Step state for Applicant Information (1: Name, 2: Mobile, 3: Income, 4: Employment, 5: City, 6: Optional Details)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields
  const [name, setName] = useState<string>(user?.name || '');
  const [mobile, setMobile] = useState<string>(user?.mobile || '');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(user?.monthlyIncome || 50000);
  const [incomeInput, setIncomeInput] = useState<string>((user?.monthlyIncome || 50000).toString());
  const [employmentType, setEmploymentType] = useState<string>(user?.employmentType || 'Salaried');

  // India Cities (Fetched from GitHub json via .env)
  const [allIndiaCities, setAllIndiaCities] = useState<CityResultItem[]>(cityLocationService.getFallbackCities());
  const [isCitiesLoading, setIsCitiesLoading] = useState<boolean>(false);
  const [city, setCity] = useState<string>(user?.city || '');
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);
  const [citySearchFilter, setCitySearchFilter] = useState<string>('');
  const [isCitySelected, setIsCitySelected] = useState<boolean>(false);
  const [showEmploymentDropdown, setShowEmploymentDropdown] = useState<boolean>(false);

  // Optional Parameters
  const [panNumber, setPanNumber] = useState<string>(user?.panNumber || '');
  const [aadhaarNumber, setAadhaarNumber] = useState<string>(user?.aadhaarNumber || '');
  const [loanPurpose, setLoanPurpose] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  // Step Entrance Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Rate & EMI Calculation
  const rateMatch = selectedCat.indicativeInterestRate.match(/\d+(\.\d+)?/);
  const baseRate = rateMatch ? parseFloat(rateMatch[0]) : 11.5;
  const estimatedEmi = calculateEMI(amount, baseRate, totalTenureMonths);

  // Fetch all cities of India from GitHub URL in .env on mount
  useEffect(() => {
    let isMounted = true;
    const loadCities = async () => {
      setIsCitiesLoading(true);
      try {
        const data = await cityLocationService.fetchCitiesData();
        if (isMounted && data && data.length > 0) {
          setAllIndiaCities(data);
        }
      } catch (e) {
        console.warn('Failed loading India cities:', e);
      } finally {
        if (isMounted) setIsCitiesLoading(false);
      }
    };
    loadCities();
    return () => {
      isMounted = false;
    };
  }, []);

  // Trigger animation whenever step changes
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(14);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  // Loan Category Switch
  const handleSelectCategory = (cat: LoanCategory) => {
    setSelectedCat(cat);
    if (onCategoryChange) {
      onCategoryChange(cat);
    }
    const clampedAmount = Math.min(cat.maxAmount, Math.max(cat.minAmount, amount));
    setAmount(clampedAmount);
    setAmountInput(clampedAmount.toString());
  };

  // Amount Handlers
  const handleAmountSlider = (val: number) => {
    setAmount(val);
    setAmountInput(val.toString());
  };

  const handleAmountInputChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmountInput(cleaned);
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed)) {
      setAmount(Math.min(selectedCat.maxAmount, Math.max(selectedCat.minAmount, parsed)));
    }
  };

  const handleAmountBlur = () => {
    const parsed = parseInt(amountInput, 10);
    if (isNaN(parsed) || parsed < selectedCat.minAmount) {
      setAmount(selectedCat.minAmount);
      setAmountInput(selectedCat.minAmount.toString());
    } else if (parsed > selectedCat.maxAmount) {
      setAmount(selectedCat.maxAmount);
      setAmountInput(selectedCat.maxAmount.toString());
    } else {
      setAmount(parsed);
      setAmountInput(parsed.toString());
    }
  };

  // Tenure Mode Switch (Years <-> Months)
  const handleSwitchTenureMode = (mode: 'years' | 'months') => {
    if (mode === tenureMode) return;
    setTenureMode(mode);
    if (mode === 'years') {
      const yrs = Math.max(0.5, Math.min(30, parseFloat((totalTenureMonths / 12).toFixed(1))));
      setTenureYears(yrs);
      setTenureInput(yrs.toString());
    } else {
      const mos = Math.max(6, Math.min(360, Math.round(tenureYears * 12)));
      setTenureMonths(mos);
      setTenureInput(mos.toString());
    }
  };

  const handleTenureSlider = (val: number) => {
    if (tenureMode === 'years') {
      setTenureYears(val);
      setTenureInput(val.toString());
    } else {
      setTenureMonths(val);
      setTenureInput(val.toString());
    }
  };

  const handleTenureInputChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setTenureInput(cleaned);
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      if (tenureMode === 'years') {
        setTenureYears(Math.min(30, Math.max(0.5, parsed)));
      } else {
        setTenureMonths(Math.min(360, Math.round(parsed)));
      }
    }
  };

  const handleTenureBlur = () => {
    const parsed = parseFloat(tenureInput);
    if (tenureMode === 'years') {
      if (isNaN(parsed) || parsed < 0.5) {
        setTenureYears(1);
        setTenureInput('1');
      } else if (parsed > 30) {
        setTenureYears(30);
        setTenureInput('30');
      } else {
        setTenureYears(parsed);
        setTenureInput(parsed.toString());
      }
    } else {
      if (isNaN(parsed) || parsed < 6) {
        setTenureMonths(6);
        setTenureInput('6');
      } else if (parsed > 360) {
        setTenureMonths(360);
        setTenureInput('360');
      } else {
        const rounded = Math.round(parsed);
        setTenureMonths(rounded);
        setTenureInput(rounded.toString());
      }
    }
  };

  // Income Input
  const handleIncomeChange = (text: string) => {
    setIncomeInput(text);
    const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
    setMonthlyIncome(!isNaN(parsed) ? parsed : 0);
  };

  // Income Validation
  const incomeValidation = validateMonthlyIncome(incomeInput);
  const isStep3Valid = incomeValidation.isValid;

  // PAN and Aadhaar Validation for Step 6
  const isPanEntered = panNumber.trim().length > 0;
  const isPanValid = !isPanEntered || validatePAN(panNumber);

  const isAadhaarEntered = aadhaarNumber.replace(/[\s-]/g, '').length > 0;
  const aadhaarValidation = isAadhaarEntered ? validateAadhaar(aadhaarNumber) : { isValid: true };
  const isAadhaarValid = aadhaarValidation.isValid;

  // Step Validation Helpers
  const isStep1Valid = name.trim().length >= 2;
  const isStep2Valid = mobile.replace(/\D/g, '').length === 10;
  const isStep4Valid = !!employmentType;
  const isCityWrong = city.trim().length >= 3 && cityLocationService.isWrongCity(city);
  const isStep5Valid = city.trim().length >= 2 && !isCityWrong;
  const isStep6Valid = isPanValid && isAadhaarValid;

  // STRICT REQUIREMENT CHECK: Do not display submit button until all 6 parameters/steps are completed
  const isAllRequiredFulfilled =
    isStep1Valid &&
    isStep2Valid &&
    isStep3Valid &&
    isStep4Valid &&
    isStep5Valid &&
    isStep6Valid &&
    currentStep === 6;


  // Next Step Action
  const handleNextStep = () => {
    setError(null);
    if (currentStep === 1 && !isStep1Valid) {
      setError('Please enter your full name (at least 2 characters)');
      return;
    }
    if (currentStep === 2 && !isStep2Valid) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (currentStep === 3 && !isStep3Valid) {
      setError('Please enter a valid monthly income (min ₹10,000)');
      return;
    }
    if (currentStep === 4 && !isStep4Valid) {
      setError('Please select an employment type');
      return;
    }
    if (currentStep === 5 && !isStep5Valid) {
      setError('Please enter or select your city in India');
      return;
    }

    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Submit Handler
  const handleSubmit = async () => {
    setError(null);

    setIsSubmitting(true);
    try {
      const app = await loanService.submitEnquiry({
        loanType: selectedCat.id,
        applicantName: (name || user?.name || 'Customer').trim(),
        mobile: (mobile || user?.mobile || '9545555999').replace(/\D/g, '').slice(-10),
        requestedAmount: amount,
        tenureMonths: totalTenureMonths,
        monthlyIncome: monthlyIncome || user?.monthlyIncome || 50000,
        employmentType: employmentType || user?.employmentType || 'Salaried',
        city: (city || user?.city || 'Nanded').trim(),
        panNumber: (panNumber || user?.panNumber || '').trim().toUpperCase() || undefined,
        aadhaarNumber: (aadhaarNumber || user?.aadhaarNumber || '').replace(/\D/g, '') || undefined,
        purpose: loanPurpose.trim() || `Online application for ${selectedCat.title}`,
      });

      onSuccess(app);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Name', required: true, isDone: isStep1Valid },
    { num: 2, title: 'Mobile', required: true, isDone: isStep2Valid },
    { num: 3, title: 'Income', required: true, isDone: isStep3Valid },
    { num: 4, title: 'Employment', required: true, isDone: isStep4Valid },
    { num: 5, title: 'City', required: true, isDone: isStep5Valid },
    { num: 6, title: 'Optional Info', required: false, isDone: isStep6Valid },
  ];


  // Filter India cities by user query or typed city
  const query = (citySearchFilter || city || '').toLowerCase().trim();
  const filteredIndiaCities = query.length === 0
    ? allIndiaCities.slice(0, 100)
    : allIndiaCities.filter((c) =>
        c.city.toLowerCase().includes(query) || c.state.toLowerCase().includes(query)
      ).slice(0, 80);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {/* HERO PREMIUM EMI CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlowCircle} />

          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>INSTANT ESTIMATE</Text>
            </View>
            <View style={styles.heroRateChip}>
              <Text style={styles.heroRateText}>~{baseRate}% p.a.</Text>
            </View>
          </View>

          <View style={styles.heroEmiRow}>
            <Text style={styles.heroEmiVal}>{formatINR(estimatedEmi)}</Text>
            <Text style={styles.heroEmiUnit}>/ month</Text>
          </View>

          <View style={styles.heroDetailsPill}>
            <Ionicons name="shield-checkmark" size={14} color="#38bdf8" />
            <Text style={styles.heroDetailsText}>
              {formatINR(amount)} for {tenureMode === 'years' ? `${tenureYears} Years` : `${tenureMonths} Months`} • No hidden fees
            </Text>
          </View>
        </View>

        {/* 1. SELECT LOAN TYPE (ALL LOANS WITH 3D ISOMETRIC TILES) */}
        <View style={styles.glassCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.headerIconWrapper3D}>
              <View style={styles.headerIconSheen} />
              <Ionicons name="apps" size={18} color="#008ecc" />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.sectionMainTitle}>Choose Loan Category</Text>
              <Text style={styles.sectionSubtitle}>Select category to adjust rates & criteria</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const isSelected = selectedCat.id === cat.id;
              const meta = LOAN_PRODUCT_META[cat.id] || {
                type: 'personal',
                badgeTag: 'Best Rate',
                badgeColor: '#008ecc',
                cardBorderColor: '#e2e8f0',
                cardBg: '#ffffff',
              };

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catCard3D,
                    {
                      borderColor: isSelected ? '#008ecc' : meta.cardBorderColor,
                      backgroundColor: isSelected ? '#f0f9ff' : meta.cardBg,
                    },
                    isSelected && styles.catCardActive3D,
                  ]}
                  onPress={() => handleSelectCategory(cat)}
                  activeOpacity={0.82}
                >
                  {/* 3D Isometric FinTech Icon with Specular Platform Sheen */}
                  <View style={styles.catIconWrap3D}>
                    <IsometricTile
                      type={meta.type}
                      size={54}
                      badgeTag={meta.badgeTag}
                      badgeColor={meta.badgeColor}
                      animated={isSelected}
                    />
                  </View>

                  <Text
                    style={[
                      styles.catTitle3D,
                      isSelected && styles.catTitleActive3D,
                    ]}
                    numberOfLines={1}
                  >
                    {cat.title}
                  </Text>

                  <View
                    style={[
                      styles.catLimitPill3D,
                      isSelected && styles.catLimitPillActive3D,
                    ]}
                  >
                    <Text
                      style={[
                        styles.catLimitText3D,
                        isSelected && styles.catLimitTextActive3D,
                      ]}
                    >
                      Up to ₹{(cat.maxAmount / 100000).toFixed(0)}L
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. LOAN PARAMETERS (AMOUNT & TENURE) */}
        <View style={styles.glassCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.headerIconWrapper3D, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
              <View style={styles.headerIconSheen} />
              <Ionicons name="wallet" size={18} color="#d97706" />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.sectionMainTitle}>Loan Amount & Duration</Text>
              <Text style={styles.sectionSubtitle}>Adjust values using input box or slider bar</Text>
            </View>
          </View>

          {/* Amount Block */}
          <View style={styles.controlBlock}>
            <View style={styles.controlLabelRow}>
              <View style={styles.controlTitleGroup}>
                <Text style={styles.controlTitle}>Loan Amount</Text>
                <Text style={styles.controlSub} numberOfLines={1}>
                  Min {formatINR(selectedCat.minAmount)} • Max {formatINR(selectedCat.maxAmount)}
                </Text>
              </View>

              {/* Attractive Elevated Input Box */}
              <View style={styles.stylishInputBox}>
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyBadgeText}>₹</Text>
                </View>
                <TextInput
                  style={styles.stylishTextInput}
                  keyboardType="numeric"
                  value={amountInput}
                  onChangeText={handleAmountInputChange}
                  onBlur={handleAmountBlur}
                  selectTextOnFocus
                />
              </View>
            </View>

            {/* Premium Bar */}
            <View style={styles.sliderContainer}>
              <CustomSlider
                value={amount}
                min={selectedCat.minAmount}
                max={selectedCat.maxAmount}
                step={selectedCat.id === 'personal' ? 10000 : 50000}
                onValueChange={handleAmountSlider}
                minLabel={formatINR(selectedCat.minAmount)}
                maxLabel={formatINR(selectedCat.maxAmount)}
                accentColor="colors.primary"
              />
            </View>

            {/* Quick Select Chips */}
            <View style={styles.pillChipRow}>
              {[100000, 300000, 500000, 1000000, 2000000]
                .filter((v) => v >= selectedCat.minAmount && v <= selectedCat.maxAmount)
                .map((val) => {
                  const isMatch = amount === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[styles.pillChip, isMatch && styles.pillChipActiveBlue]}
                      onPress={() => {
                        setAmount(val);
                        setAmountInput(val.toString());
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillChipText, isMatch && styles.pillChipTextActive]}>
                        ₹{val >= 100000 ? `${val / 100000} Lakh` : `${val / 1000}K`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Tenure Block */}
          <View style={styles.controlBlock}>
            <View style={styles.controlLabelRow}>
              <View style={styles.controlTitleGroup}>
                <Text style={styles.controlTitle}>Loan Tenure (Period)</Text>
                <Text style={styles.controlSub} numberOfLines={1}>
                  {tenureMode === 'years'
                    ? `${totalTenureMonths} total installments`
                    : `${(totalTenureMonths / 12).toFixed(1)} approx years`}
                </Text>
              </View>

              {/* Attractive Elevated Input Box */}
              <View style={styles.stylishInputBox}>
                <TextInput
                  style={styles.stylishTextInput}
                  keyboardType="numeric"
                  value={tenureInput}
                  onChangeText={handleTenureInputChange}
                  onBlur={handleTenureBlur}
                  selectTextOnFocus
                />
                <View style={[styles.currencyBadge, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.currencyBadgeText, { color: '#16a34a' }]}>
                    {tenureMode === 'years' ? 'Yr' : 'Mo'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Premium Two-Option Toggle Button (Years vs Months) */}
            <View style={styles.modernSegmentedContainer}>
              <TouchableOpacity
                style={[styles.modernSegmentBtn, tenureMode === 'years' && styles.modernSegmentBtnActive]}
                onPress={() => handleSwitchTenureMode('years')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="calendar"
                  size={15}
                  color={tenureMode === 'years' ? colors.white : '#64748b'}
                />
                <Text style={[styles.modernSegmentText, tenureMode === 'years' && styles.modernSegmentTextActive]}>
                  Years
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modernSegmentBtn, tenureMode === 'months' && styles.modernSegmentBtnActive]}
                onPress={() => handleSwitchTenureMode('months')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="time"
                  size={15}
                  color={tenureMode === 'months' ? colors.white : '#64748b'}
                />
                <Text style={[styles.modernSegmentText, tenureMode === 'months' && styles.modernSegmentTextActive]}>
                  Months
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bar Slider */}
            <View style={styles.sliderContainer}>
              {tenureMode === 'years' ? (
                <CustomSlider
                  value={tenureYears}
                  min={1}
                  max={25}
                  step={0.5}
                  onValueChange={handleTenureSlider}
                  minLabel="1 Yr"
                  maxLabel="25 Yrs"
                  accentColor="#16a34a"
                />
              ) : (
                <CustomSlider
                  value={tenureMonths}
                  min={6}
                  max={300}
                  step={6}
                  onValueChange={handleTenureSlider}
                  minLabel="6 Mos"
                  maxLabel="300 Mos"
                  accentColor="#16a34a"
                />
              )}
            </View>

            {/* Quick Chips */}
            <View style={styles.pillChipRow}>
              {tenureMode === 'years'
                ? [1, 2, 3, 5, 7, 10].map((yr) => {
                    const isMatch = tenureYears === yr;
                    return (
                      <TouchableOpacity
                        key={yr}
                        style={[styles.pillChip, isMatch && styles.pillChipActiveGreen]}
                        onPress={() => {
                          setTenureYears(yr);
                          setTenureInput(yr.toString());
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pillChipText, isMatch && styles.pillChipTextActive]}>
                          {yr} {yr === 1 ? 'Year' : 'Years'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                : [6, 12, 24, 36, 48, 60, 120].map((mo) => {
                    const isMatch = tenureMonths === mo;
                    return (
                      <TouchableOpacity
                        key={mo}
                        style={[styles.pillChip, isMatch && styles.pillChipActiveGreen]}
                        onPress={() => {
                          setTenureMonths(mo);
                          setTenureInput(mo.toString());
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pillChipText, isMatch && styles.pillChipTextActive]}>
                          {mo} Mos
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
            </View>
          </View>
        </View>

        {/* 3. APPLICANT INFORMATION (READ-ONLY WITH DIRECT PROFILE EDIT LINK) */}
        <View style={styles.glassCard}>
          <View style={styles.applicantHeaderWrap}>
            <View style={styles.applicantHeaderTopRow}>
              <View style={[styles.headerIconWrapper3D, { backgroundColor: '#e0e7ff', borderColor: '#c7d2fe' }]}>
                <View style={styles.headerIconSheen} />
                <Ionicons name="person" size={18} color="#4338ca" />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.sectionMainTitle}>Applicant Information</Text>
                <Text style={styles.sectionSubtitle}>
                  Verified borrower details from profile
                </Text>
              </View>
              {onNavigateToProfile && (
                <TouchableOpacity
                  style={styles.editProfileDirectLink}
                  onPress={onNavigateToProfile}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={13} color="#008ecc" />
                  <Text style={styles.editProfileDirectText}>Edit Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Read-Only Applicant Profile Display Card */}
          <View style={styles.readOnlyApplicantCard}>
            {/* Full Legal Name */}
            <View style={styles.readOnlyRow}>
              <View style={styles.readOnlyLeft}>
                <View style={[styles.readOnlyIconBox, { backgroundColor: '#e0f2fe' }]}>
                  <Ionicons name="person" size={13} color="#0284c7" />
                </View>
                <Text style={styles.readOnlyLabel}>Full Legal Name</Text>
              </View>
              <View style={styles.readOnlyRight}>
                <Text style={styles.readOnlyValue}>{name || user?.name || 'Customer'}</Text>
                <View style={styles.verifiedMiniPill}>
                  <Ionicons name="shield-checkmark" size={10} color="#059669" />
                  <Text style={styles.verifiedMiniText}>Verified</Text>
                </View>
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.readOnlyRow}>
              <View style={styles.readOnlyLeft}>
                <View style={[styles.readOnlyIconBox, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="logo-whatsapp" size={13} color="#16a34a" />
                </View>
                <Text style={styles.readOnlyLabel}>Mobile Number</Text>
              </View>
              <View style={styles.readOnlyRight}>
                <Text style={styles.readOnlyValue}>+91 {mobile || user?.mobile || '9545555999'}</Text>
                <View style={styles.verifiedMiniPill}>
                  <Ionicons name="lock-closed" size={10} color="#059669" />
                  <Text style={styles.verifiedMiniText}>Fixed</Text>
                </View>
              </View>
            </View>

            {/* Monthly Net Income */}
            <View style={styles.readOnlyRow}>
              <View style={styles.readOnlyLeft}>
                <View style={[styles.readOnlyIconBox, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="cash" size={13} color="#16a34a" />
                </View>
                <Text style={styles.readOnlyLabel}>Monthly Net Income</Text>
              </View>
              <View style={styles.readOnlyRight}>
                <Text style={[styles.readOnlyValue, { color: '#16a34a', fontWeight: '800' }]}>
                  ₹{(monthlyIncome || user?.monthlyIncome || 50000).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Employment Type */}
            <View style={styles.readOnlyRow}>
              <View style={styles.readOnlyLeft}>
                <View style={[styles.readOnlyIconBox, { backgroundColor: '#e0e7ff' }]}>
                  <Ionicons name="briefcase" size={13} color="#2d3091" />
                </View>
                <Text style={styles.readOnlyLabel}>Employment Type</Text>
              </View>
              <View style={styles.readOnlyRight}>
                <Text style={styles.readOnlyValue}>{employmentType || user?.employmentType || 'Salaried'}</Text>
              </View>
            </View>

            {/* City / Location */}
            <View style={styles.readOnlyRow}>
              <View style={styles.readOnlyLeft}>
                <View style={[styles.readOnlyIconBox, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="location" size={13} color="#d97706" />
                </View>
                <Text style={styles.readOnlyLabel}>City / Location</Text>
              </View>
              <View style={styles.readOnlyRight}>
                <Text style={styles.readOnlyValue}>{city || user?.city || 'Nanded'}</Text>
              </View>
            </View>

            {/* PAN Card */}
            <View style={styles.readOnlyRow}>
              <View style={styles.readOnlyLeft}>
                <View style={[styles.readOnlyIconBox, { backgroundColor: '#e0e7ff' }]}>
                  <Ionicons name="card" size={13} color="#4f46e5" />
                </View>
                <Text style={styles.readOnlyLabel}>PAN Card</Text>
              </View>
              <View style={styles.readOnlyRight}>
                <Text style={styles.readOnlyValue}>{panNumber || user?.panNumber || 'Provided in Vault'}</Text>
              </View>
            </View>

            {/* Aadhaar Card */}
            <View style={[styles.readOnlyRow, { borderBottomWidth: 0 }]}>
              <View style={styles.readOnlyLeft}>
                <View style={[styles.readOnlyIconBox, { backgroundColor: '#e0f2fe' }]}>
                  <Ionicons name="finger-print" size={13} color="#0284c7" />
                </View>
                <Text style={styles.readOnlyLabel}>Aadhaar Card</Text>
              </View>
              <View style={styles.readOnlyRight}>
                <Text style={styles.readOnlyValue}>
                  {aadhaarNumber || user?.aadhaarNumber ? `XXXX-XXXX-${(aadhaarNumber || user?.aadhaarNumber || '1234').slice(-4)}` : 'Verified KYC'}
                </Text>
              </View>
            </View>
          </View>

          {/* Profile Edit Callout Note */}
          {onNavigateToProfile && (
            <TouchableOpacity
              style={styles.profileEditNotice}
              onPress={onNavigateToProfile}
              activeOpacity={0.8}
            >
              <Ionicons name="information-circle" size={18} color="#008ecc" />
              <View style={{ flex: 1 }}>
                <Text style={styles.profileEditNoticeTitle}>Need to update your details?</Text>
                <Text style={styles.profileEditNoticeSub}>
                  Tap here to edit your name, city, income, or KYC in your Profile page.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#008ecc" />
            </TouchableOpacity>
          )}
        </View>

        {/* Error Notification */}
        {error && (
          <View style={styles.errorAlert}>
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
            <Text style={styles.errorAlertText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* FLOATING ACTION BOTTOM BAR */}
      <View style={styles.bottomBarContainer}>
        <TouchableOpacity style={styles.bottomBackBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.bottomBackText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomSubmitBtn}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.bottomSubmitText}>Submit Application</Text>
              <Ionicons name="arrow-forward-circle" size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  // HERO CARD
  heroCard: {
    backgroundColor: colors.cardNavyFrom,
    borderRadius: 0,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: colors.cardNavyFrom,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  heroGlowCircle: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#bae6fd',
    letterSpacing: 0.8,
  },
  heroRateChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroRateText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroEmiRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  heroEmiVal: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.6,
  },
  heroEmiUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryBorder,
  },
  heroDetailsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 14,
  },
  heroDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e0f2fe',
  },

  // GLASS CARD
  glassCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerIconWrapper3D: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerIconSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  catCard3D: {
    width: 126,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  catCardActive3D: {
    borderWidth: 2,
    borderColor: '#008ecc',
    backgroundColor: '#f0f9ff',
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  catIconWrap3D: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  catTitle3D: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 6,
  },
  catTitleActive3D: {
    color: '#008ecc',
    fontWeight: '900',
  },
  catLimitPill3D: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catLimitPillActive3D: {
    backgroundColor: '#e0f2fe',
    borderColor: '#7dd3fc',
  },
  catLimitText3D: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  catLimitTextActive3D: {
    color: '#0369a1',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  applicantHeaderWrap: {
    marginBottom: 14,
  },
  applicantHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextGroup: {
    flex: 1,
  },
  sectionMainTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },

  // CATEGORY HORIZONTAL CARDS
  categoryScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  catCard: {
    width: 120,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 12,
    alignItems: 'center',
  },
  catCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  catIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catIconCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 6,
  },
  catTitleActive: {
    color: colors.primaryDark,
  },
  catLimitPill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catLimitPillActive: {
    backgroundColor: colors.primaryBorder,
  },
  catLimitText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  catLimitTextActive: {
    color: colors.indigoNavy,
  },

  // CONTROLS & STYLISH INPUT BOX
  controlBlock: {
    marginTop: 2,
  },
  controlLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  controlTitleGroup: {
    flex: 1,
    minWidth: 0,
  },
  controlTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  controlSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  stylishInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === 'ios' ? 4 : 2,
    maxWidth: 130,
    flexShrink: 0,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currencyBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 4,
  },
  currencyBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  stylishTextInput: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    maxWidth: 90,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },

  sliderContainer: {
    marginVertical: 4,
  },
  pillChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  pillChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillChipActiveBlue: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillChipActiveGreen: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  pillChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  pillChipTextActive: {
    color: '#ffffff',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 18,
  },

  // MODERN SEGMENTED TOGGLE
  modernSegmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modernSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  modernSegmentBtnActive: {
    backgroundColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  modernSegmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  modernSegmentTextActive: {
    color: '#ffffff',
  },

  // STEPPER PROGRESS BAR
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 16,
  },
  stepperCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperCircleCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepperCircleFinished: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  stepperNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  stepperNumberCurrent: {
    color: '#ffffff',
  },
  stepperLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
    borderRadius: 2,
  },
  stepperLineActive: {
    backgroundColor: '#22c55e',
  },

  // ANIMATED STEP FORM
  stepFormBox: {
    minHeight: 200,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepQuestion: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  badgeRequired: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeRequiredText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  badgeOptional: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeOptionalText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  stepHint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
  },

  // MODERN INPUT GROUP
  modernInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.8,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  modernInputGroupValid: {
    borderColor: colors.primary,
    backgroundColor: '#ffffff',
  },
  modernInputIconWrap: {
    marginRight: 10,
  },
  countryCodePill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  modernTextInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },


  // DROPDOWN SELECT STYLES
  dropdownSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1.8,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  dropdownSelectBoxActive: {
    borderColor: colors.primary,
    backgroundColor: '#f8faff',
  },
  dropdownLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownSelectedText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  dropdownSelectedSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  dropdownMenuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: colors.primary,
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
    backgroundColor: colors.primaryLight,
  },

  // CITY DROPDOWN STYLES
  cityDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  cityDropdownTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  modernInputGroupError: {
    borderColor: '#ef4444',
    backgroundColor: '#fff5f5',
  },
  cityDropdownTriggerError: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  cityErrorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 6,
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
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    marginTop: 8,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  autoSuggestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight,
  },
  autoSuggestHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  autoSuggestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    padding: 14,
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
    borderColor: colors.primaryBorder,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
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
    maxHeight: 200,
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
    backgroundColor: colors.primaryLight,
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
    color: colors.primaryDark,
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
  quickChipsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },

  // BUTTONS
  primaryNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryNextBtnFlex: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryNextBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  stepActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  secondaryBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  secondaryBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },

  // REVIEW BUTTON (Styled distinctly with Navy/Sky outline rather than green submit button)
  reviewStepBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewStepBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
  },

  // READ-ONLY REVIEW SUMMARY CARD
  reviewCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    marginTop: 16,
    padding: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  reviewHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reviewHeaderTextWrap: {
    flex: 1,
  },
  reviewCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  reviewCardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  reviewCloseBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  reviewItemsGrid: {
    gap: 8,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  reviewItemDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  reviewItemLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  reviewItemValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'right',
  },

  // EMPLOYMENT STACK
  verticalOptionsStack: {
    gap: 10,
    marginBottom: 10,
  },
  employmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  employmentCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  empIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  empIconWrapActive: {
    backgroundColor: colors.primary,
  },
  empTextGroup: {
    flex: 1,
  },
  empTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  empTitleActive: {
    color: colors.primaryDark,
  },
  empDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  empCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  empCheckActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  // OPTIONAL FIELDS
  styledOptionalBox: {
    marginBottom: 6,
  },
  styledOptionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  styledOptionalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  styledOptionalSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },

  // ERROR ALERT
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  errorAlertText: {
    fontSize: 13,
    color: '#dc2626',
    flex: 1,
    fontWeight: '600',
  },

  // BOTTOM FLOATING BAR
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomBackBtn: {
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  bottomBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  bottomSubmitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#008ecc',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomSubmitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  // READ-ONLY APPLICANT INFORMATION STYLES
  editProfileDirectLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  editProfileDirectText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#008ecc',
  },
  readOnlyApplicantCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 12,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
    gap: 8,
  },
  readOnlyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  readOnlyIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  readOnlyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  readOnlyValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'right',
  },
  verifiedMiniPill: {
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
  verifiedMiniText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  profileEditNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    borderRadius: 12,
    padding: 12,
  },
  profileEditNoticeTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0369a1',
  },
  profileEditNoticeSub: {
    fontSize: 11,
    color: '#0284c7',
    marginTop: 1,
  },
  bottomIncompleteBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bottomIncompleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
});

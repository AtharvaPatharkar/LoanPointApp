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

interface LoanApplicationScreenProps {
  category: LoanCategory;
  user: UserProfile | null;
  onSuccess: (newApplication: LoanApplication) => void;
  onCancel: () => void;
}

export const LoanApplicationScreen: React.FC<LoanApplicationScreenProps> = ({
  category: initialCategory,
  user,
  onSuccess,
  onCancel,
}) => {
  const categories = loanService.getCategories();

  // Selected Loan Category
  const [selectedCat, setSelectedCat] = useState<LoanCategory>(initialCategory);

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

    if (!name.trim()) {
      setError('Please enter applicant full name');
      setCurrentStep(1);
      return;
    }
    if (!mobile.trim() || mobile.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      setCurrentStep(2);
      return;
    }
    if (!isStep3Valid) {
      setError(incomeValidation.error || 'Please enter a valid monthly income');
      setCurrentStep(3);
      return;
    }
    if (!employmentType) {
      setError('Please select your employment type');
      setCurrentStep(4);
      return;
    }
    if (!city.trim() || isCityWrong) {
      setError('Please enter or select a valid Indian city');
      setCurrentStep(5);
      return;
    }
    if (!isPanValid) {
      setError('Please enter a valid 10-character PAN number format (e.g. ABCDE1234F)');
      setCurrentStep(6);
      return;
    }
    if (!isAadhaarValid) {
      setError(aadhaarValidation.error || 'Please enter a valid 12-digit Aadhaar number');
      setCurrentStep(6);
      return;
    }

    setIsSubmitting(true);
    try {
      const app = await loanService.submitEnquiry({
        loanType: selectedCat.id,
        applicantName: name.trim(),
        mobile: mobile.replace(/\D/g, '').slice(-10),
        requestedAmount: amount,
        tenureMonths: totalTenureMonths,
        monthlyIncome: incomeValidation.value || monthlyIncome,
        employmentType,
        city: city.trim(),
        panNumber: panNumber.trim().toUpperCase() || undefined,
        aadhaarNumber: aadhaarNumber.replace(/\D/g, '') || undefined,
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

        {/* 1. SELECT LOAN TYPE (ALL LOANS) */}
        <View style={styles.glassCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.headerIconWrapper}>
              <Ionicons name="apps" size={18} color={colors.primary} />
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
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catCard, isSelected && styles.catCardActive]}
                  onPress={() => handleSelectCategory(cat)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.catIconCircle, isSelected && styles.catIconCircleActive]}>
                    <LoanIcon
                      name={cat.iconName}
                      size={20}
                      color={isSelected ? colors.white : colors.primary}
                    />
                  </View>
                  <Text style={[styles.catTitle, isSelected && styles.catTitleActive]}>
                    {cat.title}
                  </Text>
                  <View style={[styles.catLimitPill, isSelected && styles.catLimitPillActive]}>
                    <Text style={[styles.catLimitText, isSelected && styles.catLimitTextActive]}>
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
            <View style={[styles.headerIconWrapper, { backgroundColor: '#fef3c7' }]}>
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
              <View>
                <Text style={styles.controlTitle}>Loan Amount</Text>
                <Text style={styles.controlSub}>
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
              <View>
                <Text style={styles.controlTitle}>Loan Tenure (Period)</Text>
                <Text style={styles.controlSub}>
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

        {/* 3. PROGRESSIVE ANIMATED APPLICANT FORM */}
        <View style={styles.glassCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.headerIconWrapper, { backgroundColor: '#e0e7ff' }]}>
              <Ionicons name="person" size={18} color="#4338ca" />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.sectionMainTitle}>Applicant Information</Text>
              <Text style={styles.sectionSubtitle}>
                Step {currentStep} of {stepsList.length} • {stepsList[currentStep - 1].title}
              </Text>
            </View>
          </View>

          {/* Stepper Progress Bar */}
          <View style={styles.stepperContainer}>
            {stepsList.map((st, idx) => {
              const isCurrent = st.num === currentStep;
              const isFinished = st.num < currentStep || st.isDone;
              return (
                <React.Fragment key={st.num}>
                  <TouchableOpacity
                    style={[
                      styles.stepperCircle,
                      isCurrent && styles.stepperCircleCurrent,
                      isFinished && !isCurrent && styles.stepperCircleFinished,
                    ]}
                    onPress={() => {
                      if (st.num <= currentStep || st.isDone) {
                        setCurrentStep(st.num);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    {isFinished && !isCurrent ? (
                      <Ionicons name="checkmark" size={14} color="#16a34a" />
                    ) : (
                      <Text
                        style={[
                          styles.stepperNumber,
                          isCurrent && styles.stepperNumberCurrent,
                        ]}
                      >
                        {st.num}
                      </Text>
                    )}
                  </TouchableOpacity>
                  {idx < stepsList.length - 1 && (
                    <View
                      style={[
                        styles.stepperLine,
                        isFinished && styles.stepperLineActive,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {/* Animated Input Card Container */}
          <Animated.View
            style={[
              styles.stepFormBox,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* STEP 1: Full Name */}
            {currentStep === 1 && (
              <View>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepQuestion}>What is your full name?</Text>
                  <View style={styles.badgeRequired}>
                    <Text style={styles.badgeRequiredText}>REQUIRED</Text>
                  </View>
                </View>
                <Text style={styles.stepHint}>Please provide the exact name as on your PAN/Aadhaar card</Text>

                <View style={[styles.modernInputGroup, isStep1Valid && styles.modernInputGroupValid]}>
                  <View style={styles.modernInputIconWrap}>
                    <Ionicons name="person-outline" size={20} color={isStep1Valid ? 'colors.primary' : '#94a3b8'} />
                  </View>
                  <TextInput
                    style={styles.modernTextInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Rahul V. Sharma"
                    placeholderTextColor="#94a3b8"
                    autoFocus
                  />
                  {isStep1Valid && (
                    <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
                  )}
                </View>

                {/* DYNAMIC NEXT BUTTON */}
                {isStep1Valid && (
                  <TouchableOpacity
                    style={styles.primaryNextBtn}
                    onPress={handleNextStep}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryNextBtnText}>Continue to Mobile Number</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* STEP 2: Mobile Number */}
            {currentStep === 2 && (
              <View>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepQuestion}>Enter your 10-digit mobile number</Text>
                  <View style={styles.badgeRequired}>
                    <Text style={styles.badgeRequiredText}>REQUIRED</Text>
                  </View>
                </View>
                <Text style={styles.stepHint}>For real-time SMS updates, tracking and verification</Text>

                <View style={[styles.modernInputGroup, isStep2Valid && styles.modernInputGroupValid]}>
                  <View style={styles.countryCodePill}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.modernTextInput}
                    value={mobile}
                    onChangeText={(val) => setMobile(val.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9545555999"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    autoFocus
                  />
                  {isStep2Valid && (
                    <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
                  )}
                </View>

                <View style={styles.stepActionsRow}>
                  <TouchableOpacity style={styles.secondaryBackBtn} onPress={handlePrevStep}>
                    <Ionicons name="arrow-back" size={16} color="#64748b" />
                    <Text style={styles.secondaryBackText}>Back</Text>
                  </TouchableOpacity>
                  {isStep2Valid && (
                    <TouchableOpacity
                      style={styles.primaryNextBtnFlex}
                      onPress={handleNextStep}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryNextBtnText}>Next: Monthly Income</Text>
                      <Ionicons name="arrow-forward" size={18} color={colors.white} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* STEP 3: Monthly Net Income */}
            {currentStep === 3 && (
              <View>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepQuestion}>What is your monthly net income?</Text>
                  <View style={styles.badgeRequired}>
                    <Text style={styles.badgeRequiredText}>REQUIRED</Text>
                  </View>
                </View>
                <Text style={styles.stepHint}>Assists banks in calculating your highest eligible sanction</Text>

                <View
                  style={[
                    styles.modernInputGroup,
                    isStep3Valid && styles.modernInputGroupValid,
                    !isStep3Valid && styles.modernInputGroupError,
                  ]}
                >
                  <View style={[styles.countryCodePill, !isStep3Valid && { backgroundColor: '#fee2e2' }]}>
                    <Text style={[styles.countryCodeText, !isStep3Valid && { color: '#dc2626' }]}>₹</Text>
                  </View>
                  <TextInput
                    style={[styles.modernTextInput, !isStep3Valid && { color: '#dc2626' }]}
                    value={incomeInput}
                    onChangeText={handleIncomeChange}
                    placeholder="50000"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    autoFocus
                  />
                  {isStep3Valid && (
                    <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
                  )}
                  {!isStep3Valid && (
                    <Ionicons name="alert-circle" size={22} color="#dc2626" />
                  )}
                </View>

                {/* Red Line Error Note for Income */}
                {!isStep3Valid && (
                  <View style={styles.cityErrorAlert}>
                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
                    <Text style={styles.cityErrorAlertText}>
                      {incomeValidation.error || 'Please enter valid monthly net income (min ₹10,000)'}
                    </Text>
                  </View>
                )}

                {/* Popular Income Chips */}
                <View style={styles.pillChipRow}>
                  {[25000, 40000, 60000, 80000, 100000, 150000].map((inc) => {
                    const isMatch = monthlyIncome === inc;
                    return (
                      <TouchableOpacity
                        key={inc}
                        style={[styles.pillChip, isMatch && styles.pillChipActiveBlue]}
                        onPress={() => {
                          setMonthlyIncome(inc);
                          setIncomeInput(inc.toString());
                        }}
                      >
                        <Text style={[styles.pillChipText, isMatch && styles.pillChipTextActive]}>
                          ₹{inc >= 100000 ? `${inc / 100000} Lakh` : `${inc / 1000}K`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.stepActionsRow}>
                  <TouchableOpacity style={styles.secondaryBackBtn} onPress={handlePrevStep}>
                    <Ionicons name="arrow-back" size={16} color="#64748b" />
                    <Text style={styles.secondaryBackText}>Back</Text>
                  </TouchableOpacity>
                  {isStep3Valid && (
                    <TouchableOpacity
                      style={styles.primaryNextBtnFlex}
                      onPress={handleNextStep}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryNextBtnText}>Next: Employment</Text>
                      <Ionicons name="arrow-forward" size={18} color={colors.white} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* STEP 4: Employment Type */}
            {currentStep === 4 && (
              <View>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepQuestion}>Select employment type</Text>
                  <View style={styles.badgeRequired}>
                    <Text style={styles.badgeRequiredText}>REQUIRED</Text>
                  </View>
                </View>
                <Text style={styles.stepHint}>Select your primary occupation category</Text>

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
                          ? 'briefcase'
                          : employmentType === 'Self Employed'
                          ? 'ribbon'
                          : employmentType === 'Business Owner'
                          ? 'storefront'
                          : employmentType === 'Agriculturist'
                          ? 'leaf'
                          : 'apps'
                      }
                      size={20}
                      color="colors.primary"
                      style={{ marginRight: 10 }}
                    />
                    <View>
                      <Text style={styles.dropdownSelectedText}>{employmentType}</Text>
                      <Text style={styles.dropdownSelectedSubText}>
                        {employmentType === 'Salaried'
                          ? 'Working in Govt, Pvt Ltd, MNC or Corporate'
                          : employmentType === 'Self Employed'
                          ? 'Doctor, Chartered Accountant, Architect, Lawyer'
                          : employmentType === 'Business Owner'
                          ? 'Proprietorship, Partnership, MSME, Retailer'
                          : employmentType === 'Agriculturist'
                          ? 'Agricultural land owner / farming income'
                          : 'Freelancer, Consultant, Retired, or other income'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={showEmploymentDropdown ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="colors.primary"
                  />
                </TouchableOpacity>

                {/* Dropdown Options List */}
                {showEmploymentDropdown && (
                  <View style={styles.dropdownMenuCard}>
                    {[
                      { key: 'Salaried', label: 'Salaried Employee', desc: 'Working in Govt, Pvt Ltd, MNC or Corporate', icon: 'briefcase' },
                      { key: 'Self Employed', label: 'Self Employed Professional', desc: 'Doctor, Chartered Accountant, Architect, Lawyer', icon: 'ribbon' },
                      { key: 'Business Owner', label: 'Business Owner / Trader', desc: 'Proprietorship, Partnership, MSME, Retailer', icon: 'storefront' },
                      { key: 'Agriculturist', label: 'Agriculturist / Farmer', desc: 'Agricultural land owner / dairy & farming income', icon: 'leaf' },
                      { key: 'Others', label: 'Others / Miscellaneous', desc: 'Freelancer, Consultant, Retired, or other income', icon: 'apps' },
                    ].map((emp) => {
                      const isSelected = employmentType === emp.key;
                      return (
                        <TouchableOpacity
                          key={emp.key}
                          style={[styles.dropdownOptionItem, isSelected && styles.dropdownOptionItemActive]}
                          onPress={() => {
                            setEmploymentType(emp.key);
                            setShowEmploymentDropdown(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.empIconWrap, isSelected && styles.empIconWrapActive]}>
                            <Ionicons
                              name={emp.icon as any}
                              size={18}
                              color={isSelected ? colors.white : '#475569'}
                            />
                          </View>
                          <View style={styles.empTextGroup}>
                            <Text style={[styles.empTitle, isSelected && styles.empTitleActive]}>
                              {emp.label}
                            </Text>
                            <Text style={styles.empDesc}>{emp.desc}</Text>
                          </View>
                          <View style={[styles.empCheck, isSelected && styles.empCheckActive]}>
                            {isSelected && <Ionicons name="checkmark" size={14} color={colors.white} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <View style={styles.stepActionsRow}>
                  <TouchableOpacity style={styles.secondaryBackBtn} onPress={handlePrevStep}>
                    <Ionicons name="arrow-back" size={16} color="#64748b" />
                    <Text style={styles.secondaryBackText}>Back</Text>
                  </TouchableOpacity>
                  {isStep4Valid && (
                    <TouchableOpacity
                      style={styles.primaryNextBtnFlex}
                      onPress={handleNextStep}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryNextBtnText}>Next: City & Location</Text>
                      <Ionicons name="arrow-forward" size={18} color={colors.white} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* STEP 5: City in India (First input box + Live GitHub India JSON Data Picker) */}
            {currentStep === 5 && (
              <View>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepQuestion}>Enter or Select Your City / District in India</Text>
                  <View style={styles.badgeRequired}>
                    <Text style={styles.badgeRequiredText}>REQUIRED</Text>
                  </View>
                </View>
                <Text style={styles.stepHint}>
                  Type in the input box or select from all states and districts of India
                </Text>

                {/* 1. First Display Input Box */}
                <View
                  style={[
                    styles.modernInputGroup,
                    isStep5Valid && styles.modernInputGroupValid,
                    isCityWrong && styles.modernInputGroupError,
                  ]}
                >
                  <View style={styles.modernInputIconWrap}>
                    <Ionicons
                      name="location"
                      size={20}
                      color={isCityWrong ? '#dc2626' : isStep5Valid ? 'colors.primary' : '#94a3b8'}
                    />
                  </View>
                  <TextInput
                    style={[styles.modernTextInput, isCityWrong && { color: '#dc2626' }]}
                    value={city}
                    onChangeText={(text) => {
                      setCity(text);
                      setCitySearchFilter(text);
                      setIsCitySelected(false);
                    }}
                    placeholder="Type city/district (e.g. Nanded, Pune, Bengaluru)"
                    placeholderTextColor="#94a3b8"
                    autoFocus
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
                      <Ionicons name="close-circle" size={18} color={isCityWrong ? '#dc2626' : '#94a3b8'} />
                    </TouchableOpacity>
                  )}
                  {/* Select Option Dropdown Trigger Button */}
                  <TouchableOpacity
                    style={[styles.cityDropdownTrigger, isCityWrong && styles.cityDropdownTriggerError]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowCityPicker((prev) => !prev);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cityDropdownTriggerText, isCityWrong && { color: '#dc2626' }]}>
                      {showCityPicker ? 'Close' : 'Select City'}
                    </Text>
                    <Ionicons
                      name={showCityPicker ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={isCityWrong ? '#dc2626' : 'colors.primary'}
                    />
                  </TouchableOpacity>
                </View>

                {/* RED ERROR MESSAGE IF WRONG CITY ENTERED */}
                {isCityWrong && (
                  <View style={styles.cityErrorAlert}>
                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
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
                        key={`loan-sug-${item.city}-${item.stateCode}-${idx}`}
                        style={styles.autoSuggestItem}
                        onPress={() => {
                          setCity(item.city);
                          setCitySearchFilter(item.city);
                          setIsCitySelected(true);
                          Keyboard.dismiss();
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="location-outline" size={15} color="colors.primary" style={{ marginRight: 8 }} />
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

                {/* 2. Select Option Dropdown List for all India Cities/Districts */}
                {showCityPicker && (
                  <View style={styles.cityDropdownCard}>
                    <View style={styles.cityDropdownHeader}>
                      <Ionicons name="map-outline" size={14} color="#64748b" />
                      <Text style={styles.cityDropdownTitle}>
                        All India Cities & Districts ({allIndiaCities.length} available)
                      </Text>
                      {isCitiesLoading && <ActivityIndicator size="small" color="colors.primary" />}
                    </View>

                    {/* Quick Search inside picker */}
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
                                <Ionicons name="checkmark-circle" size={16} color="colors.primary" />
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

                <View style={styles.stepActionsRow}>
                  <TouchableOpacity style={styles.secondaryBackBtn} onPress={handlePrevStep}>
                    <Ionicons name="arrow-back" size={16} color="#64748b" />
                    <Text style={styles.secondaryBackText}>Back</Text>
                  </TouchableOpacity>
                  {isStep5Valid && (
                    <TouchableOpacity
                      style={styles.primaryNextBtnFlex}
                      onPress={handleNextStep}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryNextBtnText}>Next: Additional Details</Text>
                      <Ionicons name="arrow-forward" size={18} color={colors.white} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* STEP 6: Optional Parameters */}
            {currentStep === 6 && (
              <View>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepQuestion}>Additional Information</Text>
                  <View style={styles.badgeOptional}>
                    <Text style={styles.badgeOptionalText}>OPTIONAL</Text>
                  </View>
                </View>
                <Text style={styles.stepHint}>Providing these parameters speeds up bank processing</Text>

                {/* PAN Number */}
                <View style={styles.styledOptionalBox}>
                  <View style={styles.styledOptionalHeader}>
                    <Text style={styles.styledOptionalLabel}>PAN Card Number</Text>
                    <Text style={styles.styledOptionalSub}>Optional (10 characters)</Text>
                  </View>
                  <View
                    style={[
                      styles.modernInputGroup,
                      isPanEntered && isPanValid && styles.modernInputGroupValid,
                      isPanEntered && !isPanValid && styles.modernInputGroupError,
                    ]}
                  >
                    <View style={styles.modernInputIconWrap}>
                      <Ionicons
                        name="card-outline"
                        size={18}
                        color={isPanEntered && !isPanValid ? '#dc2626' : isPanEntered && isPanValid ? '#16a34a' : '#94a3b8'}
                      />
                    </View>
                    <TextInput
                      style={[
                        styles.modernTextInput,
                        { letterSpacing: 1.5, fontWeight: '700' },
                        isPanEntered && !isPanValid && { color: '#dc2626' },
                      ]}
                      value={panNumber}
                      onChangeText={(val) => setPanNumber(val.toUpperCase())}
                      placeholder="e.g. ABCDE1234F"
                      placeholderTextColor="#94a3b8"
                      autoCapitalize="characters"
                      maxLength={10}
                    />
                    {isPanEntered && isPanValid && (
                      <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    )}
                    {isPanEntered && !isPanValid && (
                      <Ionicons name="alert-circle" size={20} color="#dc2626" />
                    )}
                  </View>
                  {isPanEntered && !isPanValid && (
                    <View style={styles.cityErrorAlert}>
                      <Ionicons name="alert-circle" size={14} color="#dc2626" />
                      <Text style={styles.cityErrorAlertText}>
                        Invalid PAN format. Must be 5 uppercase letters, 4 numbers, 1 letter (e.g. ABCDE1234F).
                      </Text>
                    </View>
                  )}
                </View>

                {/* Aadhaar Number (Optional) */}
                <View style={styles.styledOptionalBox}>
                  <View style={styles.styledOptionalHeader}>
                    <Text style={styles.styledOptionalLabel}>Aadhaar Card Number</Text>
                    <Text style={styles.styledOptionalSub}>
                      {aadhaarNumber.length > 0 ? `${aadhaarNumber.replace(/[\s-]/g, '').length}/12 Digits` : 'Optional'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.modernInputGroup,
                      isAadhaarEntered && isAadhaarValid && styles.modernInputGroupValid,
                      isAadhaarEntered && !isAadhaarValid && styles.modernInputGroupError,
                    ]}
                  >
                    <View style={styles.modernInputIconWrap}>
                      <Ionicons
                        name="finger-print-outline"
                        size={18}
                        color={isAadhaarEntered && !isAadhaarValid ? '#dc2626' : isAadhaarEntered && isAadhaarValid ? '#16a34a' : '#94a3b8'}
                      />
                    </View>
                    <TextInput
                      style={[
                        styles.modernTextInput,
                        { letterSpacing: 1.5, fontWeight: '700' },
                        isAadhaarEntered && !isAadhaarValid && { color: '#dc2626' },
                      ]}
                      value={aadhaarNumber}
                      onChangeText={(val) => {
                        const clean = val.replace(/\D/g, '').slice(0, 12);
                        setAadhaarNumber(clean);
                      }}
                      placeholder="e.g. 5489 1234 5678"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      maxLength={12}
                    />
                    {isAadhaarEntered && isAadhaarValid && (
                      <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    )}
                    {isAadhaarEntered && !isAadhaarValid && (
                      <Ionicons name="alert-circle" size={20} color="#dc2626" />
                    )}
                  </View>
                  {isAadhaarEntered && !isAadhaarValid && (
                    <View style={styles.cityErrorAlert}>
                      <Ionicons name="alert-circle" size={14} color="#dc2626" />
                      <Text style={styles.cityErrorAlertText}>
                        {aadhaarValidation.error || 'Aadhaar must be exactly 12 numeric digits.'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Purpose / Remarks */}
                <View style={styles.styledOptionalBox}>
                  <View style={styles.styledOptionalHeader}>
                    <Text style={styles.styledOptionalLabel}>Loan Purpose / Notes</Text>
                    <Text style={styles.styledOptionalSub}>Optional</Text>
                  </View>
                  <View style={styles.modernInputGroup}>

                    <View style={styles.modernInputIconWrap}>
                      <Ionicons name="document-text-outline" size={18} color="#94a3b8" />
                    </View>
                    <TextInput
                      style={styles.modernTextInput}
                      value={loanPurpose}
                      onChangeText={setLoanPurpose}
                      placeholder="e.g. Wedding, education, property expansion"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View style={styles.stepActionsRow}>
                  <TouchableOpacity style={styles.secondaryBackBtn} onPress={handlePrevStep}>
                    <Ionicons name="arrow-back" size={16} color="#64748b" />
                    <Text style={styles.secondaryBackText}>Back</Text>
                  </TouchableOpacity>
                  {isAllRequiredFulfilled && (
                    <TouchableOpacity
                      style={styles.reviewStepBtn}
                      onPress={() => setShowReviewModal(true)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="eye-outline" size={18} color="colors.cardNavyFrom" />
                      <Text style={styles.reviewStepBtnText}>Review Application</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* READ-ONLY REVIEW SUMMARY CARD (Appears when user clicks Review button) */}
                {showReviewModal && (
                  <View style={styles.reviewCardContainer}>
                    <View style={styles.reviewCardHeader}>
                      <View style={styles.reviewHeaderIcon}>
                        <Ionicons name="document-text" size={18} color="colors.primary" />
                      </View>
                      <View style={styles.reviewHeaderTextWrap}>
                        <Text style={styles.reviewCardTitle}>Review Details (Read-Only)</Text>
                        <Text style={styles.reviewCardSubtitle}>Verify all provided information</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.reviewCloseBtn}
                        onPress={() => setShowReviewModal(false)}
                      >
                        <Ionicons name="close" size={18} color="#64748b" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.reviewItemsGrid}>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewItemLabel}>Loan Category</Text>
                        <Text style={styles.reviewItemValue}>{selectedCat.title}</Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewItemLabel}>Requested Amount</Text>
                        <Text style={[styles.reviewItemValue, { color: 'colors.primary' }]}>{formatINR(amount)}</Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewItemLabel}>Tenure Period</Text>
                        <Text style={styles.reviewItemValue}>
                          {tenureMode === 'years' ? `${tenureYears} Years` : `${tenureMonths} Months`} ({totalTenureMonths} Mo)
                        </Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewItemLabel}>Estimated EMI</Text>
                        <Text style={[styles.reviewItemValue, { color: '#16a34a' }]}>{formatINR(estimatedEmi)}/mo</Text>
                      </View>
                      <View style={styles.reviewItemDivider} />
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewItemLabel}>Applicant Name</Text>
                        <Text style={styles.reviewItemValue}>{name}</Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewItemLabel}>Mobile Number</Text>
                        <Text style={styles.reviewItemValue}>+91 {mobile}</Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewItemLabel}>Monthly Income</Text>
                        <Text style={styles.reviewItemValue}>{formatINR(monthlyIncome)}/mo</Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewItemLabel}>Employment</Text>
                        <Text style={styles.reviewItemValue}>{employmentType}</Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewItemLabel}>City / Location</Text>
                        <Text style={styles.reviewItemValue}>{city}</Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewItemLabel}>PAN Card</Text>
                        <Text style={styles.reviewItemValue}>{panNumber || 'Not Provided'}</Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewItemLabel}>Aadhaar Card</Text>
                        <Text style={styles.reviewItemValue}>
                          {aadhaarNumber ? `XXXX-XXXX-${aadhaarNumber.slice(-4)}` : 'Not Provided'}
                        </Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewItemLabel}>Purpose / Notes</Text>
                        <Text style={styles.reviewItemValue}>{loanPurpose || 'General application'}</Text>
                      </View>
                    </View>
                  </View>

                )}
              </View>
            )}
          </Animated.View>
        </View>

        {/* Error Notification */}
        {error && (
          <View style={styles.errorAlert}>
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
            <Text style={styles.errorAlertText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* FLOATING ACTION BOTTOM BAR:
          STRICT RULE: Do NOT display the Submit Application button before fulfilling all required parameters!
      */}
      <View style={styles.bottomBarContainer}>
        <TouchableOpacity style={styles.bottomBackBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.bottomBackText}>Cancel</Text>
        </TouchableOpacity>

        {isAllRequiredFulfilled ? (
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
        ) : (
          <View style={styles.bottomIncompleteBadge}>
            <Ionicons name="information-circle-outline" size={16} color="#64748b" />
            <Text style={styles.bottomIncompleteText}>
              Complete all 6 parameters (Step {currentStep}/6)
            </Text>
          </View>
        )}
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
    backgroundColor: 'colors.cardNavyFrom',
    borderRadius: 0,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: 'colors.cardNavyFrom',
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
    color: 'colors.primaryBorder',
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'colors.primaryLight',
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
    backgroundColor: 'colors.primaryLight',
    borderColor: 'colors.primary',
    shadowColor: 'colors.primary',
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
    backgroundColor: 'colors.primary',
    borderColor: 'colors.primary',
  },
  catTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 6,
  },
  catTitleActive: {
    color: 'colors.primaryDark',
  },
  catLimitPill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catLimitPillActive: {
    backgroundColor: 'colors.primaryBorder',
  },
  catLimitText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  catLimitTextActive: {
    color: 'colors.indigoNavy',
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
  },
  controlTitle: {
    fontSize: 14,
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
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 6 : 3,
    minWidth: 115,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currencyBadge: {
    backgroundColor: 'colors.primaryLight',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 4,
  },
  currencyBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: 'colors.primary',
  },
  stylishTextInput: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    minWidth: 50,
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
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
    backgroundColor: 'colors.primary',
    borderColor: 'colors.primary',
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
    backgroundColor: 'colors.primary',
    borderColor: 'colors.primary',
    shadowColor: 'colors.primary',
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
    borderColor: 'colors.primary',
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
    borderColor: 'colors.primary',
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
    borderColor: 'colors.primaryBorder',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: 'colors.primary',
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
    backgroundColor: 'colors.primaryLight',
  },

  // CITY DROPDOWN STYLES
  cityDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'colors.primaryLight',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'colors.primaryBorder',
  },
  cityDropdownTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'colors.primary',
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
    borderColor: 'colors.primaryBorder',
    marginTop: 8,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: 'colors.primaryDark',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  autoSuggestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'colors.primaryLight',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'colors.primaryLight',
  },
  autoSuggestHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'colors.primaryDark',
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
    borderColor: 'colors.primaryBorder',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: 'colors.primary',
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
    backgroundColor: 'colors.primaryLight',
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
    color: 'colors.primaryDark',
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
    backgroundColor: 'colors.primary',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
    shadowColor: 'colors.primary',
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
    backgroundColor: 'colors.primary',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: 'colors.primary',
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
    backgroundColor: 'colors.primaryLight',
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
    color: 'colors.primaryDark',
  },

  // READ-ONLY REVIEW SUMMARY CARD
  reviewCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'colors.primaryBorder',
    marginTop: 16,
    padding: 16,
    shadowColor: 'colors.primary',
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
    backgroundColor: 'colors.primaryLight',
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
    backgroundColor: 'colors.primaryLight',
    borderColor: 'colors.primary',
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
    backgroundColor: 'colors.primary',
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
    color: 'colors.primaryDark',
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
    backgroundColor: 'colors.primary',
    borderColor: 'colors.primary',
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
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomBackBtn: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  bottomBackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  bottomSubmitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomSubmitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
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

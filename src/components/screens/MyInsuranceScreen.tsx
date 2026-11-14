import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { UserProfile } from '../../types';

interface MyInsuranceScreenProps {
  user: UserProfile | null;
  onOpenCall?: (phone?: string) => void;
  onOpenWhatsApp?: (phone?: string, text?: string) => void;
  onNavigateTab?: (tab: string) => void;
}

interface InsuranceCategoryCard {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  iconType: 'ionicons' | 'material' | 'fontawesome';
  iconColor: string;
  buttonColor: string;
  borderColor: string;
  bgColor: string;
}

export interface UserPolicyItem {
  id: string;
  type: 'health' | 'life' | 'motor';
  typeTitle: string;
  provider: string;
  policyNo: string;
  coverageLabel: string;
  coverageAmount: string;
  status: 'Active' | 'Expiring Soon' | 'Expired';
  validityLabel: string;
  validityDate: string;
}

export const MyInsuranceScreen: React.FC<MyInsuranceScreenProps> = ({
  user,
  onOpenCall,
  onOpenWhatsApp,
  onNavigateTab,
}) => {
  // Screen views: 'overview' | 'insurance_request' | 'my_policies'
  const [currentView, setCurrentView] = useState<'overview' | 'insurance_request' | 'my_policies'>('overview');

  // Filter tab on "My Policies" screen: 'all' | 'active' | 'expiring' | 'expired'
  const [policyFilterTab, setPolicyFilterTab] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');

  // Currently selected insurance type for the request form (e.g. 'Health Insurance', 'Life Insurance')
  const [selectedInsuranceType, setSelectedInsuranceType] = useState<string>('Health Insurance');

  const [selectedProductModal, setSelectedProductModal] = useState<string | null>(null);

  // Form Fields for "Insurance Request Details"
  const [fullName, setFullName] = useState<string>(user?.name || '');
  const [mobileNumber, setMobileNumber] = useState<string>(user?.mobile || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const expertPhone = '+91 98230 45678';

  // EXACT Policies data matching reference image
  const policiesList: UserPolicyItem[] = [
    {
      id: 'pol-1',
      type: 'health',
      typeTitle: 'Health Insurance',
      provider: 'Niva Bupa Health Insurance',
      policyNo: 'NBHI78456321',
      coverageLabel: 'Sum Insured:',
      coverageAmount: '₹10,00,000',
      status: 'Active',
      validityLabel: 'Valid Till :',
      validityDate: '20 Nov 2027',
    },
    {
      id: 'pol-2',
      type: 'life',
      typeTitle: 'Life Insurance',
      provider: 'HDFC Life',
      policyNo: 'HDFCL87654219',
      coverageLabel: 'Sum Assured:',
      coverageAmount: '₹50,00,000',
      status: 'Active',
      validityLabel: 'Valid Till :',
      validityDate: '14 Aug 2035',
    },
    {
      id: 'pol-3',
      type: 'motor',
      typeTitle: 'Motor Insurance',
      provider: 'ICICI Lombard',
      policyNo: 'ICIMT99887766',
      coverageLabel: 'IDV:',
      coverageAmount: '₹8,50,000',
      status: 'Expiring Soon',
      validityLabel: 'Expires On :',
      validityDate: '05 Dec 2026',
    },
  ];

  const handleCallExpert = () => {
    if (onOpenCall) {
      onOpenCall(expertPhone);
    } else {
      Linking.openURL(`tel:${expertPhone}`);
    }
  };

  const handleExploreProduct = (productId: string, productTitle: string) => {
    const formattedTitle = productTitle.replace('\n', ' ');
    setSelectedInsuranceType(formattedTitle);
    setCurrentView('insurance_request');
  };

  const handleRenewPolicy = (policy: UserPolicyItem) => {
    const text = `Hi Loan Point Team, I want to renew my ${policy.typeTitle} (Policy No: ${policy.policyNo}) with ${policy.provider}. Please assist me with renewal quote.`;
    if (onOpenWhatsApp) {
      onOpenWhatsApp(expertPhone, text);
    } else {
      Linking.openURL(`https://api.whatsapp.com/send?phone=919823045678&text=${encodeURIComponent(text)}`);
    }
  };

  const handleSubmitInsuranceRequest = () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your Full Name.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.replace(/\D/g, '').length < 10) {
      Alert.alert('Required Field', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Insurance Request Submitted! 🎉',
        `Thank you ${fullName}! Your ${selectedInsuranceType} request has been recorded.\n\nA dedicated Relationship Manager (RM) will be assigned automatically and will reach out to you at +91 ${mobileNumber.replace(/\D/g, '').slice(-10)} within 2 business hours.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onNavigateTab) {
                onNavigateTab('home');
              } else {
                setCurrentView('overview');
              }
            },
          },
        ]
      );
    }, 600);
  };

  // 6 Overview Insurance Categories
  const insuranceCategories: InsuranceCategoryCard[] = [
    {
      id: 'health',
      title: 'Health\nInsurance',
      subtitle: 'Complete Health Cover\nfor You & Your Family',
      iconName: 'heart-pulse',
      iconType: 'material',
      iconColor: '#e11d48',
      buttonColor: '#004aad',
      borderColor: '#bfdbfe',
      bgColor: '#ffffff',
    },
    {
      id: 'life',
      title: 'Life\nInsurance',
      subtitle: 'Financial Security\nfor Your Loved Ones',
      iconName: 'umbrella',
      iconType: 'fontawesome',
      iconColor: '#dc2626',
      buttonColor: '#d97706',
      borderColor: '#fed7aa',
      bgColor: '#ffffff',
    },
    {
      id: 'motor',
      title: 'Motor\nInsurance',
      subtitle: 'Stay Protected\non Every Journey',
      iconName: 'shield-car',
      iconType: 'material',
      iconColor: '#7c3aed',
      buttonColor: '#6d28d9',
      borderColor: '#e9d5ff',
      bgColor: '#ffffff',
    },
    {
      id: 'home',
      title: 'Home\nInsurance',
      subtitle: 'Protect Your Home\n& Valuables',
      iconName: 'home',
      iconType: 'ionicons',
      iconColor: '#16a34a',
      buttonColor: '#16a34a',
      borderColor: '#bbf7d0',
      bgColor: '#ffffff',
    },
    {
      id: 'travel',
      title: 'Travel\nInsurance',
      subtitle: 'Travel Worry-Free\nAnywhere in the World',
      iconName: 'airplane',
      iconType: 'ionicons',
      iconColor: '#0284c7',
      buttonColor: '#004aad',
      borderColor: '#bae6fd',
      bgColor: '#ffffff',
    },
    {
      id: 'personal_accident',
      title: 'Personal Accident\nInsurance',
      subtitle: 'Financial Support\nin Case of Accidents',
      iconName: 'heart-half-full',
      iconType: 'material',
      iconColor: '#ea580c',
      buttonColor: '#d97706',
      borderColor: '#fed7aa',
      bgColor: '#ffffff',
    },
  ];

  // Filtered policies based on active filter tab
  const filteredPolicies = policiesList.filter((p) => {
    if (policyFilterTab === 'all') return true;
    if (policyFilterTab === 'active') return p.status === 'Active';
    if (policyFilterTab === 'expiring') return p.status === 'Expiring Soon';
    if (policyFilterTab === 'expired') return p.status === 'Expired';
    return true;
  });

  // =========================================================================
  // VIEW: 1. MY POLICIES SCREEN (EXACT COPY OF NEW USER REF IMAGE)
  // =========================================================================
  if (currentView === 'my_policies') {
    return (
      <View style={styles.screenWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header Row with Golden Policy Shield + Title & Subtitle + Umbrella Illustration */}
          <View style={styles.myPoliciesHeaderRow}>
            {/* Left: Back Arrow + Icon & Title */}
            <TouchableOpacity
              style={styles.backButtonTouch}
              onPress={() => setCurrentView('overview')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={26} color="#002e75" />
            </TouchableOpacity>

            <View style={styles.myPoliciesTitleCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.myPoliciesShieldWrap}>
                  <Ionicons name="shield-checkmark" size={24} color="#ffd700" />
                  <View style={styles.shieldDocumentMiniBadge}>
                    <Ionicons name="document-text" size={12} color="#002e75" />
                  </View>
                </View>
                <Text style={styles.myPoliciesTitleText}>My Policies</Text>
              </View>
              <Text style={styles.myPoliciesSubtitleText}>
                View & manage all your insurance policies
              </Text>
            </View>

            {/* Right: Golden Umbrella Family Protection Graphic */}
            <View style={styles.umbrellaGraphicWrap}>
              <View style={styles.yellowUmbrellaTop}>
                <Ionicons name="umbrella" size={40} color="#eab308" />
              </View>
              <View style={styles.umbrellaFamilyShieldRow}>
                <View style={styles.umbrellaShieldSmall}>
                  <Ionicons name="add" size={12} color="#ffffff" />
                </View>
                <Ionicons name="people" size={18} color="#002e75" />
                <View style={styles.checklistMiniIcon}>
                  <Ionicons name="checkbox" size={14} color="#16a34a" />
                </View>
              </View>
            </View>
          </View>

          {/* 4 Stats Cards Row: Total Policies (3) | Active (2) | Expiring Soon (1) | Expired (0) */}
          <View style={styles.policyStatsCardsRow}>
            {/* Card 1: Total Policies */}
            <View style={styles.policyStatCardBlue}>
              <View style={styles.statDocIconWrap}>
                <Ionicons name="document-text-outline" size={22} color="#ffffff" />
              </View>
              <Text style={styles.statCardBlueLabel}>Total{'\n'}Policies</Text>
              <Text style={styles.statCardBlueNumber}>3</Text>
            </View>

            {/* Card 2: Active */}
            <View style={styles.policyStatCardGreen}>
              <View style={styles.statCheckIconWrap}>
                <Ionicons name="checkmark" size={16} color="#ffffff" />
              </View>
              <Text style={styles.statCardLightLabel}>Active</Text>
              <Text style={styles.statCardGreenNumber}>2</Text>
            </View>

            {/* Card 3: Expiring Soon */}
            <View style={styles.policyStatCardOrange}>
              <View style={styles.statCalendarIconWrap}>
                <Ionicons name="calendar-outline" size={16} color="#d97706" />
              </View>
              <Text style={styles.statCardLightLabel}>Expiring Soon</Text>
              <Text style={styles.statCardOrangeNumber}>1</Text>
            </View>

            {/* Card 4: Expired */}
            <View style={styles.policyStatCardRed}>
              <View style={styles.statCrossIconWrap}>
                <Ionicons name="close" size={16} color="#ffffff" />
              </View>
              <Text style={styles.statCardLightLabel}>Expired</Text>
              <Text style={styles.statCardRedNumber}>0</Text>
            </View>
          </View>

          {/* 4 Navigation Filter Pills: All (3) | Active (2) | Expiring Soon (1) | Expired (0) */}
          <View style={styles.filterPillsRow}>
            {/* Pill 1: All (3) */}
            <TouchableOpacity
              style={[
                styles.policyFilterPill,
                policyFilterTab === 'all' && styles.policyFilterPillActive,
              ]}
              onPress={() => setPolicyFilterTab('all')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.policyFilterPillText,
                  policyFilterTab === 'all' && styles.policyFilterPillTextActive,
                ]}
              >
                All (3)
              </Text>
            </TouchableOpacity>

            {/* Pill 2: Active (2) */}
            <TouchableOpacity
              style={[
                styles.policyFilterPill,
                policyFilterTab === 'active' && styles.policyFilterPillActive,
              ]}
              onPress={() => setPolicyFilterTab('active')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.policyFilterPillText,
                  policyFilterTab === 'active' && styles.policyFilterPillTextActive,
                ]}
              >
                Active (2)
              </Text>
            </TouchableOpacity>

            {/* Pill 3: Expiring Soon (1) */}
            <TouchableOpacity
              style={[
                styles.policyFilterPill,
                policyFilterTab === 'expiring' && styles.policyFilterPillActive,
              ]}
              onPress={() => setPolicyFilterTab('expiring')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.policyFilterPillText,
                  policyFilterTab === 'expiring' && styles.policyFilterPillTextActive,
                ]}
              >
                Expiring Soon (1)
              </Text>
            </TouchableOpacity>

            {/* Pill 4: Expired (0) */}
            <TouchableOpacity
              style={[
                styles.policyFilterPill,
                policyFilterTab === 'expired' && styles.policyFilterPillActive,
              ]}
              onPress={() => setPolicyFilterTab('expired')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.policyFilterPillText,
                  policyFilterTab === 'expired' && styles.policyFilterPillTextActive,
                ]}
              >
                Expired (0)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Policy Cards List */}
          {filteredPolicies.map((policy) => {
            const isHealth = policy.type === 'health';
            const isLife = policy.type === 'life';
            const isMotor = policy.type === 'motor';
            const isExpiring = policy.status === 'Expiring Soon';

            return (
              <View
                key={policy.id}
                style={[
                  styles.policyCardBox,
                  isHealth && { borderColor: '#bbf7d0' },
                  isLife && { borderColor: '#bfdbfe' },
                  isMotor && { borderColor: '#fed7aa' },
                ]}
              >
                {/* Left Col: Type Icon + Provider Details */}
                <View style={styles.policyCardLeftCol}>
                  {/* Left Rounded Square Icon */}
                  <View
                    style={[
                      styles.policyTypeIconSquare,
                      isHealth && { backgroundColor: '#f0fdf4' },
                      isLife && { backgroundColor: '#eff6ff' },
                      isMotor && { backgroundColor: '#fffbeb' },
                    ]}
                  >
                    {isHealth && (
                      <MaterialCommunityIcons name="heart-pulse" size={30} color="#e11d48" />
                    )}
                    {isLife && (
                      <FontAwesome5 name="umbrella" size={26} color="#004aad" />
                    )}
                    {isMotor && (
                      <Ionicons name="car" size={30} color="#d97706" />
                    )}
                  </View>

                  {/* Policy Info Column */}
                  <View style={styles.policyCardInfoCol}>
                    <Text style={styles.policyCardTitle}>{policy.typeTitle}</Text>
                    <Text style={styles.policyCardProvider}>{policy.provider}</Text>
                    <Text style={styles.policyCardNo}>Policy No.: {policy.policyNo}</Text>
                    <Text style={styles.policyCardCover}>
                      {policy.coverageLabel}{' '}
                      <Text style={styles.policyCardCoverBold}>{policy.coverageAmount}</Text>
                    </Text>
                  </View>
                </View>

                {/* Right Col: Status Badge + Validity + Action / Chevron */}
                <View style={styles.policyCardRightCol}>
                  {/* Top Status Badge */}
                  {policy.status === 'Active' ? (
                    <View style={styles.activePillGreen}>
                      <Ionicons name="checkmark-circle" size={15} color="#16a34a" style={{ marginRight: 4 }} />
                      <Text style={styles.activePillText}>Active</Text>
                    </View>
                  ) : (
                    <View style={styles.expiringPillOrange}>
                      <Ionicons name="alert-circle" size={15} color="#d97706" style={{ marginRight: 4 }} />
                      <Text style={styles.expiringPillText}>Expiring Soon</Text>
                    </View>
                  )}

                  {/* Validity Row */}
                  <View style={styles.validityRow}>
                    <Ionicons name="calendar-outline" size={14} color="#002e75" style={{ marginRight: 4 }} />
                    <Text style={styles.validityText}>
                      {policy.validityLabel} {policy.validityDate}
                    </Text>
                  </View>

                  {/* Renew Now Button for Expiring Soon */}
                  {isExpiring && (
                    <TouchableOpacity
                      style={styles.renewNowActionBtn}
                      onPress={() => handleRenewPolicy(policy)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="sync" size={14} color="#ffffff" style={{ marginRight: 5 }} />
                      <Text style={styles.renewNowActionBtnText}>Renew Now</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Chevron Forward Link */}
                <Ionicons name="chevron-forward" size={20} color="#002e75" style={{ marginLeft: 4 }} />
              </View>
            );
          })}

          {/* 3 Bottom Navigation Actions: Buy New Insurance | Renew Policies | Refer & Earn */}
          <View style={styles.bottomNavPillsRow}>
            {/* Pill 1: Buy New Insurance */}
            <TouchableOpacity
              style={styles.bottomNavPill}
              onPress={() => setCurrentView('overview')}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={18} color="#002e75" style={{ marginRight: 5 }} />
              <Text style={styles.bottomNavPillText}>Buy New{'\n'}Insurance</Text>
            </TouchableOpacity>

            {/* Pill 2: Renew Policies */}
            <TouchableOpacity
              style={styles.bottomNavPill}
              onPress={() => {
                const expiringPolicy = policiesList.find((p) => p.status === 'Expiring Soon');
                if (expiringPolicy) {
                  handleRenewPolicy(expiringPolicy);
                } else {
                  handleCallExpert();
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="sync-outline" size={18} color="#002e75" style={{ marginRight: 5 }} />
              <Text style={styles.bottomNavPillText}>Renew{'\n'}Policies</Text>
            </TouchableOpacity>

            {/* Pill 3: Refer & Earn */}
            <TouchableOpacity
              style={[styles.bottomNavPill, styles.bottomNavPillHighlight]}
              onPress={() => {
                if (onNavigateTab) {
                  onNavigateTab('refer');
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="people-outline" size={18} color="#b45309" style={{ marginRight: 5 }} />
              <Text style={[styles.bottomNavPillText, styles.bottomNavPillTextHighlight]}>
                Refer & Earn
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // =========================================================================
  // VIEW: 2. INSURANCE REQUEST DETAILS SCREEN
  // Auto-assigned RM + Fixed Selected Insurance Type + Submit Insurance Request
  // =========================================================================
  if (currentView === 'insurance_request') {
    return (
      <View style={styles.screenWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header Card Title with Golden Heart Pulse Shield + Back Button */}
          <View style={styles.headerTitleRow}>
            <TouchableOpacity
              style={styles.backButtonTouch}
              onPress={() => setCurrentView('overview')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={26} color="#002e75" />
            </TouchableOpacity>
            <View style={styles.headerShieldIconWrap}>
              <MaterialCommunityIcons name="heart-pulse" size={24} color="#ffd700" />
            </View>
            <Text style={styles.headerTitleText}>{selectedInsuranceType}</Text>
          </View>

          {/* 1. Hero Banner: Request an Insurance Quote + Avatar + Family Shield */}
          <View style={styles.heroBannerCard}>
            <View style={[styles.heroSpark, styles.spark1]} />
            <View style={[styles.heroSpark, styles.spark2]} />
            <View style={[styles.heroSpark, styles.spark3]} />

            {/* Left Avatar Thumbs-Up Illustration */}
            <View style={styles.heroAvatarWrap}>
              <View style={styles.avatarCircleGlow}>
                <Ionicons name="person" size={44} color="#002e75" />
              </View>
              <View style={styles.thumbsUpBadge}>
                <Ionicons name="thumbs-up" size={15} color="#d97706" />
              </View>
            </View>

            {/* Center Titles Banner: Request an Insurance Quote */}
            <View style={styles.heroCenterContent}>
              <Text style={styles.heroRequestTitle}>
                Request{'\n'}a {selectedInsuranceType}{'\n'}Quote
              </Text>
              <View style={styles.quoteAccentWave} />
            </View>

            {/* Right Family Shield Frame Illustration */}
            <View style={styles.familyShieldFrameWrap}>
              <View style={styles.shieldGoldOuter}>
                <View style={styles.shieldInnerWhite}>
                  <View style={styles.familyAvatarsGroup}>
                    <View style={styles.parentsRow}>
                      <View style={styles.parentAvatarPink}>
                        <Ionicons name="person" size={20} color="#db2777" />
                      </View>
                      <View style={styles.parentAvatarBlue}>
                        <Ionicons name="person" size={22} color="#002e75" />
                      </View>
                    </View>
                    <View style={styles.kidsRow}>
                      <View style={styles.kidAvatarYellow}>
                        <Ionicons name="person" size={14} color="#b45309" />
                      </View>
                      <View style={styles.kidAvatarGreen}>
                        <Ionicons name="person" size={14} color="#15803d" />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 2. Insurance Request Details Card */}
          <View style={styles.formCardOuter}>
            <View style={styles.sectionHeaderBanner}>
              <MaterialCommunityIcons name="clipboard-edit-outline" size={18} color="#ffd700" style={{ marginRight: 6 }} />
              <Text style={styles.sectionHeaderBannerText}>Insurance Request Details</Text>
            </View>

            {/* Field 1: Fixed Insurance Type */}
            <View style={styles.formRow}>
              <View style={styles.fieldLabelRow}>
                <View style={styles.shieldPlusIconSquare}>
                  <Ionicons name="shield-checkmark" size={16} color="#002e75" />
                </View>
                <Text style={styles.fieldLabelText}>Insurance Type</Text>
              </View>
              <View style={styles.fixedTypeContainer}>
                <Text style={styles.fixedTypeText}>{selectedInsuranceType}</Text>
                <View style={styles.greenCheckCircleBadge}>
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                </View>
              </View>
            </View>

            {/* Field 2: Full Name * */}
            <View style={styles.formRow}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="person" size={18} color="#002e75" style={{ marginRight: 8 }} />
                <Text style={styles.fieldLabelText}>
                  Full Name <Text style={{ color: '#dc2626' }}>*</Text>
                </Text>
              </View>
              <View style={styles.textInputBox}>
                <TextInput
                  style={styles.textInputField}
                  placeholder="Enter full name"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Field 3: Mobile Number * */}
            <View style={styles.formRow}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="call" size={18} color="#002e75" style={{ marginRight: 8 }} />
                <Text style={styles.fieldLabelText}>
                  Mobile Number <Text style={{ color: '#dc2626' }}>*</Text>
                </Text>
              </View>
              <View style={styles.textInputBox}>
                <TextInput
                  style={styles.textInputField}
                  placeholder="Enter 10 digit mobile number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                />
              </View>
            </View>

            {/* Auto RM Assignment Informational Card */}
            <View style={styles.autoRmNoticeCard}>
              <View style={styles.autoRmAvatarWrap}>
                <MaterialCommunityIcons name="account-cog" size={24} color="#002e75" />
              </View>
              <View style={styles.autoRmVerticalDivider} />
              <View style={{ flex: 1 }}>
                <Text style={styles.autoRmNoticeText}>
                  <Text style={{ fontWeight: '800', color: '#0f172a' }}>Relationship Manager (RM) will be assigned </Text>
                  <View style={styles.autoBadge}>
                    <Text style={styles.autoBadgeText}>automatically</Text>
                  </View>
                  <Text style={{ fontWeight: '800', color: '#0f172a' }}> for your request.</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* 3. Submit Insurance Request Button */}
          <TouchableOpacity
            style={styles.submitInsuranceBtn}
            onPress={handleSubmitInsuranceRequest}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <View style={styles.submitBtnIconWrap}>
              <Ionicons name="paper-plane" size={18} color="#ffffff" />
            </View>
            <View style={styles.submitBtnDivider} />
            <Text style={styles.submitInsuranceBtnText}>
              {isSubmitting ? 'Submitting Request...' : 'Submit Insurance Request'}
            </Text>
          </TouchableOpacity>

          {/* 4. Back to Home Outline Button */}
          <TouchableOpacity
            style={styles.backToHomeOutlineBtn}
            onPress={() => {
              if (onNavigateTab) {
                onNavigateTab('home');
              } else {
                setCurrentView('overview');
              }
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="home-outline" size={22} color="#002e75" style={{ marginRight: 8 }} />
            <Text style={styles.backToHomeOutlineBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // =========================================================================
  // VIEW: 3. MY INSURANCE OVERVIEW SCREEN (DEFAULT)
  // =========================================================================
  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Card Title with Golden Shield */}
        <View style={styles.headerTitleRow}>
          <View style={styles.headerShieldIconWrap}>
            <Ionicons name="shield-checkmark" size={26} color="#ffd700" />
          </View>
          <Text style={styles.headerTitleText}>My Insurance</Text>
        </View>

        {/* 1. Hero Banner: Secure Yourself & Your Family with the Right Insurance! */}
        <View style={styles.heroBannerCard}>
          <View style={[styles.heroSpark, styles.spark1]} />
          <View style={[styles.heroSpark, styles.spark2]} />
          <View style={[styles.heroSpark, styles.spark3]} />

          <View style={styles.heroAvatarWrap}>
            <View style={styles.avatarCircleGlow}>
              <Ionicons name="person" size={44} color="#002e75" />
            </View>
            <View style={styles.thumbsUpBadge}>
              <Ionicons name="thumbs-up" size={15} color="#d97706" />
            </View>
          </View>

          <View style={styles.heroCenterContent}>
            <Text style={styles.heroMainTitle}>
              Secure{'\n'}Yourself &{'\n'}Your Family
            </Text>

            <View style={styles.goldRibbonBanner}>
              <Text style={styles.goldRibbonSubtitle}>with the Right</Text>
              <Text style={styles.goldRibbonMainText}>Insurance!</Text>
            </View>
          </View>

          <View style={styles.familyShieldFrameWrap}>
            <View style={styles.shieldGoldOuter}>
              <View style={styles.shieldInnerWhite}>
                <View style={styles.familyAvatarsGroup}>
                  <View style={styles.parentsRow}>
                    <View style={styles.parentAvatarPink}>
                      <Ionicons name="person" size={20} color="#db2777" />
                    </View>
                    <View style={styles.parentAvatarBlue}>
                      <Ionicons name="person" size={22} color="#002e75" />
                    </View>
                  </View>
                  <View style={styles.kidsRow}>
                    <View style={styles.kidAvatarYellow}>
                      <Ionicons name="person" size={14} color="#b45309" />
                    </View>
                    <View style={styles.kidAvatarGreen}>
                      <Ionicons name="person" size={14} color="#15803d" />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 2. 6-Grid Insurance Products (2 Columns) */}
        <View style={styles.productsGrid}>
          {insuranceCategories.map((item) => (
            <View key={item.id} style={[styles.productCard, { borderColor: item.borderColor }]}>
              <View style={styles.productCardHeaderRow}>
                <View style={styles.productIconWrap}>
                  {item.iconType === 'material' ? (
                    <MaterialCommunityIcons name={item.iconName as any} size={30} color={item.iconColor} />
                  ) : item.iconType === 'fontawesome' ? (
                    <FontAwesome5 name={item.iconName as any} size={26} color={item.iconColor} />
                  ) : (
                    <Ionicons name={item.iconName as any} size={28} color={item.iconColor} />
                  )}
                </View>
                <Text style={styles.productTitleText}>{item.title}</Text>
              </View>

              <Text style={styles.productSubtitleText}>{item.subtitle}</Text>

              <TouchableOpacity
                style={[styles.exploreBtn, { backgroundColor: item.buttonColor }]}
                onPress={() => handleExploreProduct(item.id, item.title)}
                activeOpacity={0.85}
              >
                <Text style={styles.exploreBtnText}>Explore</Text>
                <Ionicons name="play" size={11} color="#ffffff" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* 3. 4 Trust / Value Proposition Pills Bar */}
        <View style={styles.trustPropositionBar}>
          <View style={styles.trustItem}>
            <Ionicons name="thumbs-up-outline" size={18} color="#002e75" />
            <Text style={styles.trustItemText}>Multiple{'\n'}Insurer Options</Text>
          </View>

          <View style={styles.trustDivider} />

          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#002e75" />
            <Text style={styles.trustItemText}>Expert{'\n'}Guidance</Text>
          </View>

          <View style={styles.trustDivider} />

          <View style={styles.trustItem}>
            <View style={styles.rupeeShieldWrap}>
              <Text style={styles.rupeeShieldText}>₹</Text>
            </View>
            <Text style={styles.trustItemText}>Best Premium{'\n'}Plans</Text>
          </View>

          <View style={styles.trustDivider} />

          <View style={styles.trustItem}>
            <Ionicons name="document-text-outline" size={18} color="#002e75" />
            <Text style={styles.trustItemText}>Claim{'\n'}Assistance</Text>
          </View>
        </View>

        {/* 4. Expert Banner */}
        <View style={styles.expertAssistanceBanner}>
          <View style={styles.expertLeftContent}>
            <View style={styles.headphoneIconWrap}>
              <Ionicons name="headset" size={28} color="#ffd700" />
            </View>
            <View style={styles.expertTextCol}>
              <Text style={styles.expertQuestionText}>Need Help to Choose</Text>
              <Text style={styles.expertQuestionHighlight}>the Right Insurance?</Text>
            </View>
          </View>

          <View style={styles.expertVerticalDivider} />

          <TouchableOpacity
            style={styles.talkToExpertBtn}
            onPress={handleCallExpert}
            activeOpacity={0.85}
          >
            <Ionicons name="call" size={16} color="#78350f" style={{ marginRight: 6 }} />
            <Text style={styles.talkToExpertBtnText}>Talk to Our Insurance Expert</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Bottom Navigation Actions: My Policies | Renew Policies | Refer & Earn */}
        <View style={styles.bottomNavPillsRow}>
          {/* Pill 1: My Policies (Navigates to the My Policies Screen) */}
          <TouchableOpacity
            style={styles.bottomNavPill}
            onPress={() => setCurrentView('my_policies')}
            activeOpacity={0.8}
          >
            <Ionicons name="newspaper-outline" size={18} color="#002e75" style={{ marginRight: 5 }} />
            <Text style={styles.bottomNavPillText}>My Policies</Text>
          </TouchableOpacity>

          {/* Pill 2: Renew Policies (Opens My Policies with Expiring filter) */}
          <TouchableOpacity
            style={styles.bottomNavPill}
            onPress={() => {
              setPolicyFilterTab('expiring');
              setCurrentView('my_policies');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="sync-outline" size={18} color="#002e75" style={{ marginRight: 5 }} />
            <Text style={styles.bottomNavPillText}>Renew Policies</Text>
          </TouchableOpacity>

          {/* Pill 3: Refer & Earn */}
          <TouchableOpacity
            style={[styles.bottomNavPill, styles.bottomNavPillHighlight]}
            onPress={() => {
              if (onNavigateTab) {
                onNavigateTab('refer');
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="people-outline" size={18} color="#b45309" style={{ marginRight: 5 }} />
            <Text style={[styles.bottomNavPillText, styles.bottomNavPillTextHighlight]}>Refer & Earn</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 110,
  },

  // ---------------- MY POLICIES SCREEN STYLES ----------------
  myPoliciesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 2,
  },
  myPoliciesTitleCol: {
    flex: 1,
    paddingHorizontal: 8,
  },
  myPoliciesShieldWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#002e75',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  shieldDocumentMiniBadge: {
    position: 'absolute',
    top: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myPoliciesTitleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#002e75',
    letterSpacing: -0.3,
  },
  myPoliciesSubtitleText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  umbrellaGraphicWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yellowUmbrellaTop: {
    alignItems: 'center',
    marginBottom: -10,
  },
  umbrellaFamilyShieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  umbrellaShieldSmall: {
    width: 14,
    height: 16,
    backgroundColor: '#004aad',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistMiniIcon: {
    marginLeft: 2,
  },

  // Policy 4 Stats Cards Row
  policyStatsCardsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  policyStatCardBlue: {
    flex: 1,
    backgroundColor: '#002e75',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  statDocIconWrap: {
    marginBottom: 2,
  },
  statCardBlueLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#bae6fd',
    textAlign: 'center',
    lineHeight: 11,
  },
  statCardBlueNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#facc15',
    marginTop: 2,
  },

  // Green Active Stat Card
  policyStatCardGreen: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#86efac',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCheckIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statCardLightLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  statCardGreenNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803d',
    marginTop: 2,
  },

  // Orange Expiring Stat Card
  policyStatCardOrange: {
    flex: 1.1,
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCalendarIconWrap: {
    marginBottom: 4,
  },
  statCardOrangeNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#b45309',
    marginTop: 2,
  },

  // Red Expired Stat Card
  policyStatCardRed: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCrossIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statCardRedNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#b91c1c',
    marginTop: 2,
  },

  // Policy Filter Pills Row
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  policyFilterPill: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  policyFilterPillActive: {
    backgroundColor: '#002e75',
    borderColor: '#002e75',
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  policyFilterPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#002e75',
    textAlign: 'center',
  },
  policyFilterPillTextActive: {
    color: '#ffffff',
  },

  // Policy Item Box Card
  policyCardBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  policyCardLeftCol: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  policyTypeIconSquare: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyCardInfoCol: {
    flex: 1,
  },
  policyCardTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#002e75',
    marginBottom: 1,
  },
  policyCardProvider: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 1,
  },
  policyCardNo: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 1,
  },
  policyCardCover: {
    fontSize: 10,
    color: '#002e75',
    fontWeight: '700',
  },
  policyCardCoverBold: {
    fontWeight: '900',
    color: '#002e75',
  },
  policyCardRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  activePillGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#15803d',
  },
  expiringPillOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  expiringPillText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#b45309',
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  validityText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  renewNowActionBtn: {
    backgroundColor: '#002e75',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#38bdf8',
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  renewNowActionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
  },

  // ---------------- COMMON HEADER TITLE ----------------
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: 2,
  },
  backButtonTouch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  headerShieldIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#002e75',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#002e75',
    letterSpacing: -0.3,
  },

  // ---------------- 1. HERO BANNER CARD ----------------
  heroBannerCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#004aad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  heroSpark: {
    position: 'absolute',
    width: 3,
    height: 10,
    borderRadius: 1.5,
    backgroundColor: '#fbbf24',
  },
  spark1: {
    left: '32%',
    top: 6,
    transform: [{ rotate: '-25deg' }],
  },
  spark2: {
    left: '42%',
    top: 4,
    transform: [{ rotate: '0deg' }],
  },
  spark3: {
    left: '50%',
    top: 8,
    transform: [{ rotate: '25deg' }],
  },
  heroAvatarWrap: {
    width: 66,
    height: 66,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleGlow: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#e0f2fe',
    borderWidth: 2,
    borderColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbsUpBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#d97706',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCenterContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  heroMainTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#002e75',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  heroRequestTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#002e75',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 2,
  },
  quoteAccentWave: {
    width: 48,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#f59e0b',
    marginTop: 2,
  },
  goldRibbonBanner: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#d97706',
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  goldRibbonSubtitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#78350f',
    lineHeight: 11,
  },
  goldRibbonMainText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#78350f',
    letterSpacing: 0.2,
  },

  // Family Shield Frame on Right
  familyShieldFrameWrap: {
    width: 76,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldGoldOuter: {
    width: 72,
    height: 76,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  shieldInnerWhite: {
    width: 64,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  familyAvatarsGroup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  parentAvatarPink: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fce7f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentAvatarBlue: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kidsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kidAvatarYellow: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kidAvatarGreen: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---------------- 2. INSURANCE REQUEST DETAILS FORM CARD ----------------
  formCardOuter: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    paddingTop: 22,
    paddingBottom: 16,
    paddingHorizontal: 12,
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeaderBanner: {
    position: 'absolute',
    top: -14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002e75',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionHeaderBannerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.1,
  },
  fieldLabelText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#002e75',
  },
  shieldPlusIconSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  fixedTypeContainer: {
    flex: 1.4,
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fixedTypeText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#002e75',
  },
  greenCheckCircleBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputBox: {
    flex: 1.4,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
  },
  textInputField: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },

  // Automatic RM Notice Card
  autoRmNoticeCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  autoRmAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoRmVerticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 10,
  },
  autoRmNoticeText: {
    fontSize: 12,
    color: '#0f172a',
    lineHeight: 18,
  },
  autoBadge: {
    backgroundColor: '#fde047',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  autoBadgeText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#78350f',
  },

  // ---------------- 3. SUBMIT INSURANCE REQUEST BUTTON ----------------
  submitInsuranceBtn: {
    backgroundColor: '#002e75',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 12,
  },
  submitBtnIconWrap: {
    marginRight: 10,
  },
  submitBtnDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginRight: 12,
  },
  submitInsuranceBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },

  // ---------------- 4. BACK TO HOME OUTLINE BUTTON ----------------
  backToHomeOutlineBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#002e75',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 20,
  },
  backToHomeOutlineBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#002e75',
  },

  // ---------------- 5. BOTTOM NAVIGATION PILLS ----------------
  bottomNavPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  bottomNavPill: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#002e75',
    paddingVertical: 10,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bottomNavPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#002e75',
    textAlign: 'center',
    lineHeight: 14,
  },
  bottomNavPillHighlight: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  bottomNavPillTextHighlight: {
    color: '#92400e',
    fontWeight: '900',
  },

  // ---------------- OVERVIEW PRODUCTS GRID ----------------
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  productCard: {
    width: '31.8%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 154,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1.5,
  },
  productCardHeaderRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  productIconWrap: {
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  productTitleText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#002e75',
    textAlign: 'center',
    lineHeight: 15,
  },
  productSubtitleText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 12,
    marginBottom: 8,
    flex: 1,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  exploreBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },

  // ---------------- TRUST PROPOSITION BAR ----------------
  trustPropositionBar: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  trustItemText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 11,
    marginTop: 4,
  },
  trustDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e2e8f0',
  },
  rupeeShieldWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#002e75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rupeeShieldText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#002e75',
  },

  // ---------------- EXPERT BANNER ----------------
  expertAssistanceBanner: {
    backgroundColor: '#002e75',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  expertLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  headphoneIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertTextCol: {
    flex: 1,
  },
  expertQuestionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  expertQuestionHighlight: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#fde047',
    marginTop: 1,
  },
  expertVerticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 8,
  },
  talkToExpertBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  talkToExpertBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#78350f',
  },
});

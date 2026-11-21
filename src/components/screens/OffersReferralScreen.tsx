import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Dimensions,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Modal,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  Feather,
} from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { UserProfile, ReferralLead } from '../../types';
import { dbSyncService } from '../../services/dbSyncService';
import { LoanIcon } from '../common/LoanIcon';

interface OffersReferralScreenProps {
  user?: UserProfile | null;
  onNavigateLoan?: (loanType: string) => void;
  onNavigateHome?: () => void;
}

export interface ReferralItem {
  id: string;
  fullName: string;
  mobileNumber: string;
  city: string;
  loanProduct: 'Home Loan' | 'Personal Loan' | 'Business Loan' | 'Car Loan' | 'Loan Against Property';
  loanAmount: string;
  status: 'Disbursed' | 'Approved' | 'Application / Login' | 'In Process';
  earning: string;
  earningRate?: string;
  date: string;
}

interface SubmittedReferral {
  id: string;
  fullName: string;
  mobileNumber: string;
  loanType: string;
  city: string;
  submittedOn: string;
  status: 'Referral Submitted' | 'Login / Application' | 'Loan Approval' | 'Disbursement & Earning';
  estimatedCommission: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const OffersReferralScreen: React.FC<OffersReferralScreenProps> = ({
  user,
  onNavigateLoan,
  onNavigateHome,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showPolicyModal, setShowPolicyModal] = useState<boolean>(false);
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);

  // Screen mode: 'form' | 'submitted_success' | 'view_my_referrals'
  const [screenMode, setScreenMode] = useState<'form' | 'submitted_success' | 'view_my_referrals'>('form');

  // Selected Referral Lead for detailed sheet/modal
  const [selectedReferralItem, setSelectedReferralItem] = useState<ReferralItem | null>(null);

  // Customer self-fill referral lead form state
  const [friendName, setFriendName] = useState<string>('');
  const [friendMobile, setFriendMobile] = useState<string>('');
  const [selectedLoan, setSelectedLoan] = useState<string>('Home Loan');
  const [friendLoanAmount, setFriendLoanAmount] = useState<string>('');
  const [friendCity, setFriendCity] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Tab filter in "View My Referrals": 'all' | 'in_process' | 'disbursed' | 'earnings'
  const [referralFilterTab, setReferralFilterTab] = useState<'all' | 'in_process' | 'disbursed' | 'earnings'>('all');

  // Active submitted referral being displayed on the success screen
  const [currentSubmitted, setCurrentSubmitted] = useState<SubmittedReferral | null>(null);

  // Live dataset purely from user actions & Neon Postgres DB
  const [myReferralsList, setMyReferralsList] = useState<ReferralItem[]>([]);

  const loanOptions = [
    { label: 'Home Loan', rate: 'Up to 1.5%', icon: 'home-outline', product: 'Home Loan' },
    { label: 'Business Loan', rate: 'Up to 1.5%', icon: 'briefcase-outline', product: 'Business Loan' },
    { label: 'Personal Loan', rate: 'Up to 1.5%', icon: 'person-outline', product: 'Personal Loan' },
    { label: 'Loan Against Property', rate: 'Up to 1.25%', icon: 'business-outline', product: 'Mortgage Loan' },
    { label: 'Car Loan', rate: 'Up to 1.0%', icon: 'car-outline', product: 'Car Loan' },
    { label: 'Education Loan', rate: 'Up to 1.0%', icon: 'school-outline', product: 'Education Loan' },
  ];

  // Referral link
  const referralCode = user?.referralCode || `LP${(user?.mobile || '9999').slice(-4)}`;
  const referralLink = `https://loanpoint.app/refer/${referralCode}`;

  // Live submitted referrals from Neon DB
  const [dbReferrals, setDbReferrals] = useState<ReferralLead[]>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState<boolean>(false);

  // Fetch referrals submitted by the current user from Neon DB
  const loadReferrals = async () => {
    if (!user?.mobile) return;
    setIsLoadingReferrals(true);
    try {
      const records = await dbSyncService.getReferralLeadsByReferrer(user.mobile);
      setDbReferrals(records || []);
    } catch (err) {
      console.warn('Failed to load referral leads from DB:', err);
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, [user?.mobile]);

  // Combine DB referrals and any newly submitted in-session leads into unified ReferralItem list
  const combinedReferralsList = useMemo(() => {
    const list: ReferralItem[] = [];
    const seenIds = new Set<string>();

    // 1. First add from dbReferrals (database source of truth for the logged-in user)
    dbReferrals.forEach((d) => {
      seenIds.add(d.id);
      const isDisbursed = d.status === 'Disbursed';
      const isApproved = d.status === 'Loan Approval' || d.status === 'Approved';
      let displayStatus: ReferralItem['status'] = 'In Process';
      if (isDisbursed) displayStatus = 'Disbursed';
      else if (isApproved) displayStatus = 'Approved';
      else if (d.status === 'Login / Application' || d.status === 'Application / Login') displayStatus = 'Application / Login';

      list.push({
        id: d.id,
        fullName: d.friendName,
        mobileNumber: `+91 ${d.friendMobile}`,
        city: d.city,
        loanProduct: (d.loanProduct as any) || 'Home Loan',
        loanAmount: d.loanAmount && d.loanAmount > 0 ? `₹${d.loanAmount.toLocaleString('en-IN')}` : 'To be evaluated',
        status: displayStatus,
        earning: d.payoutAmount > 0 ? `₹${d.payoutAmount.toLocaleString('en-IN')}` : '—',
        earningRate: isDisbursed ? 'Credited' : undefined,
        date: d.statusUpdatedAt ? new Date(d.statusUpdatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Recent',
      });
    });

    // 2. Add any newly submitted session items not yet in dbReferrals
    myReferralsList.forEach((m) => {
      if (!seenIds.has(m.id)) {
        list.unshift(m);
        seenIds.add(m.id);
      }
    });

    return list;
  }, [dbReferrals, myReferralsList]);

  // Dynamic Live Metrics from database referrals
  const allCurrentRefs = useMemo(() => {
    return combinedReferralsList.map((m) => ({
      status: m.status,
      payout: parseFloat(m.earning.replace(/[^0-9.]/g, '')) || 0,
    }));
  }, [combinedReferralsList]);

  const statsTotalReferrals = allCurrentRefs.length;
  const statsApplicationsLogin = allCurrentRefs.filter(
    (r) => r.status === 'Application / Login'
  ).length;
  const statsLoansApproved = allCurrentRefs.filter(
    (r) => r.status === 'Approved'
  ).length;
  const statsLoansDisbursed = allCurrentRefs.filter(
    (r) => r.status === 'Disbursed'
  ).length;
  const sumTotalEarnings = allCurrentRefs.reduce((acc, r) => acc + (r.payout || 0), 0);
  const statsTotalEarnings = sumTotalEarnings > 0 ? `₹${sumTotalEarnings.toLocaleString('en-IN')}` : '₹0';

  // Dynamic counts for filter tabs
  const countInProcess = allCurrentRefs.filter(
    (r) => r.status === 'In Process' || r.status === 'Application / Login'
  ).length;
  const countDisbursed = statsLoansDisbursed;
  const countEarnings = allCurrentRefs.filter(
    (r) => (r.payout && r.payout > 0) || r.status === 'Disbursed'
  ).length;

  const handleCopyLink = () => {
    setCopied(true);
    Alert.alert('Link Copied!', `Referral link copied to clipboard:\n${referralLink}`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `Refer Your Friends & Family and Earn in Lakhs! Also enjoy recurring income for Loan Top Ups. Earn up to 1.5% of disbursal amount.\nApply using my link:\n${referralLink}`;
    const cleanUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    const webUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(webUrl, '_blank');
      return;
    }

    Linking.canOpenURL(cleanUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(cleanUrl);
        }
        return Linking.openURL(webUrl);
      })
      .catch(() => {
        handleShareMore();
      });
  };

  const handleShareMore = async () => {
    const message = `Refer Your Friends & Family and Earn in Lakhs! Recurring income on loan top ups and up to 1.5% on disbursals.\nApply here: ${referralLink}`;
    try {
      await Share.share({
        message,
        url: referralLink,
        title: 'Refer & Earn with Loan Point',
      });
    } catch {
      // Ignore
    }
  };

  const handleDownloadReport = () => {
    Alert.alert(
      'Download Referral Report',
      'Your detailed referral and payout commission statement (PDF / Excel) is being generated and will be sent to your registered email.',
      [{ text: 'OK' }]
    );
  };

  const handleSubmitLead = async () => {
    if (!friendName.trim()) {
      Alert.alert('Validation Error', 'Please enter your friend\'s full name.');
      return;
    }
    if (!friendMobile.trim() || friendMobile.replace(/\D/g, '').length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!friendCity.trim()) {
      Alert.alert('Validation Error', 'Please enter friend\'s city / location.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanFriendMobile = friendMobile.replace(/\D/g, '').slice(-10);
      const referrerPhone = (user?.mobile || '').replace(/\D/g, '').slice(-10);

      // Check self-referral
      if (referrerPhone && cleanFriendMobile === referrerPhone) {
        Alert.alert('Invalid Referral', 'You cannot refer your own mobile number.');
        return;
      }

      // Quick local check against already loaded referrals
      const alreadyReferredInList = dbReferrals.some(
        (r) => (r.friendMobile || '').replace(/\D/g, '').slice(-10) === cleanFriendMobile
      );
      if (alreadyReferredInList) {
        Alert.alert('User are present', 'This mobile number has already been referred.');
        return;
      }

      const cleanAmt = parseFloat(friendLoanAmount.replace(/[^0-9]/g, '')) || 0;

      const savedLead = await dbSyncService.createReferralLead({
        referrerMobile: referrerPhone || '9545555999',
        referrerUserId: user?.id,
        friendName: friendName.trim(),
        friendMobile: cleanFriendMobile,
        loanProduct: selectedLoan,
        city: friendCity.trim(),
        loanAmount: cleanAmt,
      });

      const now = new Date();
      const timeStr = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const newLead: SubmittedReferral = {
        id: savedLead.id,
        fullName: savedLead.friendName,
        mobileNumber: `+91 ${savedLead.friendMobile}`,
        loanType: savedLead.loanProduct,
        city: savedLead.city,
        submittedOn: timeStr,
        status: 'Referral Submitted',
        estimatedCommission: 'Up to 1.5% on Disbursal',
      };

      const newReferralItem: ReferralItem = {
        id: savedLead.id,
        fullName: savedLead.friendName,
        mobileNumber: `+91 ${savedLead.friendMobile}`,
        city: savedLead.city,
        loanProduct: (savedLead.loanProduct as any) || 'Home Loan',
        loanAmount: cleanAmt > 0 ? `₹${cleanAmt.toLocaleString('en-IN')}` : 'To be evaluated',
        status: 'In Process',
        earning: '—',
        date: 'Today',
      };

      setMyReferralsList([newReferralItem, ...myReferralsList]);
      setCurrentSubmitted(newLead);
      await loadReferrals();

      setFriendName('');
      setFriendMobile('');
      setFriendLoanAmount('');
      setFriendCity('');

      // Open Referral Submitted Successfully view
      setScreenMode('submitted_success');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('User are present')) {
        Alert.alert('User are present', 'This user is already registered or referred in Loan Point.');
      } else if (msg.includes('own mobile')) {
        Alert.alert('Invalid Referral', 'You cannot refer your own mobile number.');
      } else {
        console.error('Error submitting referral lead:', err);
        Alert.alert('Error', msg || 'Failed to submit referral lead. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for loan icon in list using attractive colourful 3D asset image from exploreAllLoanProducts
  const renderProductIcon = (product: string) => {
    return (
      <LoanIcon
        type={product}
        name={product}
        size={24}
        containerSize={36}
        borderRadius={10}
        useAssetImage={true}
        style={{ marginBottom: 3 }}
      />
    );
  };

  // Helper for avatar colors
  const getAvatarBg = (index: number) => {
    const bgs = ['#dbeafe', '#f3e8ff', '#ffedd5', '#dbeafe', '#ffe4e6'];
    const colors = ['#004aad', '#9333ea', '#c2410c', '#0284c7', '#e11d48'];
    return { bg: bgs[index % bgs.length], color: colors[index % colors.length] };
  };

  // Filtered referrals list for View My Referrals (dynamically fed from DB & live session)
  const filteredReferrals = combinedReferralsList.filter((item) => {
    if (referralFilterTab === 'all') return true;
    if (referralFilterTab === 'in_process') {
      return item.status === 'In Process' || item.status === 'Application / Login';
    }
    if (referralFilterTab === 'disbursed') {
      return item.status === 'Disbursed';
    }
    if (referralFilterTab === 'earnings') {
      return item.status === 'Disbursed' || item.status === 'Approved';
    }
    return true;
  });

  // =========================================================================
  // VIEW: 1. VIEW MY REFERRALS SCREEN (EXACT COPY OF USER REF IMAGE)
  // =========================================================================
  if (screenMode === 'view_my_referrals') {
    return (
      <View style={styles.screenWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header Card Title with People Icon */}
          <View style={styles.viewRefHeaderRow}>
            <TouchableOpacity
              style={styles.backButtonTouch}
              onPress={() => setScreenMode('form')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={26} color="#002e75" />
            </TouchableOpacity>
            <View style={styles.viewRefTitleRow}>
              <View style={styles.viewRefPeopleIconWrap}>
                <Ionicons name="people" size={24} color="#ffd700" />
              </View>
              <Text style={styles.viewRefTitleText}>View My Referrals</Text>
            </View>
            <TouchableOpacity
              onPress={() => setScreenMode('form')}
              style={styles.headerPlusTouch}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={18} color="#002e75" />
            </TouchableOpacity>
          </View>

          {/* 5 Metrics Summary Cards in Responsive Grid */}
          <View style={styles.metricsGridContainer}>
            <View style={styles.metricsGridRow}>
              {/* Card 1: Total Referrals */}
              <View style={styles.metricCardGridItem}>
                <View style={styles.metricIconWrapBlue}>
                  <Ionicons name="people-outline" size={18} color="#004aad" />
                </View>
                <Text style={styles.metricCardLabel} numberOfLines={2}>Total Referrals</Text>
                <Text style={styles.metricCardValue}>{statsTotalReferrals}</Text>
              </View>

              {/* Card 2: Applications Login */}
              <View style={styles.metricCardGridItem}>
                <View style={styles.metricIconWrapGreen}>
                  <Ionicons name="document-text-outline" size={18} color="#16a34a" />
                </View>
                <Text style={styles.metricCardLabel} numberOfLines={2}>Apps Login</Text>
                <Text style={styles.metricCardValue}>{statsApplicationsLogin}</Text>
              </View>

              {/* Card 3: Loans Approved */}
              <View style={styles.metricCardGridItem}>
                <View style={styles.metricIconWrapOrange}>
                  <Ionicons name="thumbs-up-outline" size={18} color="#d97706" />
                </View>
                <Text style={styles.metricCardLabel} numberOfLines={2}>Loans Approved</Text>
                <Text style={styles.metricCardValue}>{statsLoansApproved}</Text>
              </View>
            </View>

            <View style={styles.metricsGridRow}>
              {/* Card 4: Loans Disbursed */}
              <View style={styles.metricCardGridItem}>
                <View style={styles.metricIconWrapPurple}>
                  <MaterialCommunityIcons name="sack" size={18} color="#7c3aed" />
                </View>
                <Text style={styles.metricCardLabel} numberOfLines={2}>Loans Disbursed</Text>
                <Text style={styles.metricCardValue}>{statsLoansDisbursed}</Text>
              </View>

              {/* Card 5: Total Earnings (Highlighted Gold Card) */}
              <View style={[styles.metricCardGridItem, styles.metricCardGoldGridItem]}>
                <View style={styles.metricIconWrapRed}>
                  <Ionicons name="gift" size={18} color="#dc2626" />
                </View>
                <Text style={styles.metricCardLabelGold} numberOfLines={2}>Total Earnings</Text>
                <Text style={styles.metricCardValueGold}>{statsTotalEarnings}</Text>
              </View>
            </View>
          </View>

          {/* Golden Ribbon Banner: Earn up to 1.5% of Disbursal Amount* + Recurring Income */}
          <View style={styles.bannerPotentialCard}>
            {/* Left 3D Coin Stack Graphic / 3D Icon */}
            <View style={styles.bannerCoinsStack}>
              <View style={styles.coinBadgeContainer}>
                <Ionicons name="sparkles" size={14} color="#fde047" style={styles.sparkleFloating} />
                <MaterialCommunityIcons name="hand-coin" size={28} color="#fde047" />
              </View>
            </View>

            {/* Center Content Text */}
            <View style={styles.bannerCenterContent}>
              <Text style={styles.bannerMainHeading} numberOfLines={2}>
                Earn up to <Text style={styles.bannerHighlightYellow}>1.5%</Text> of Disbursal Amount*
              </Text>
              <Text style={styles.bannerSubHeading} numberOfLines={1}>
                + Recurring Income on Eligible Loan Top-Ups!
              </Text>
            </View>

            {/* Right Upward Trend Growth Chart Graphic */}
            <View style={styles.growthChartWrap}>
              <Ionicons name="trending-up" size={26} color="#fde047" />
              <View style={styles.chartBarsMiniRow}>
                <View style={[styles.chartBar, { height: 7 }]} />
                <View style={[styles.chartBar, { height: 12 }]} />
                <View style={[styles.chartBar, { height: 18 }]} />
                <View style={[styles.chartBar, { height: 24 }]} />
              </View>
            </View>
          </View>

          {/* 4 Navigation Filter Pills */}
          <View style={styles.filterPillsRow}>
            {/* Pill 1: All Referrals */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                referralFilterTab === 'all' && styles.filterPillActive,
              ]}
              onPress={() => setReferralFilterTab('all')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  referralFilterTab === 'all' && styles.filterPillTextActive,
                ]}
              >
                All Referrals ({statsTotalReferrals})
              </Text>
            </TouchableOpacity>

            {/* Pill 2: In Process */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                referralFilterTab === 'in_process' && styles.filterPillActive,
              ]}
              onPress={() => setReferralFilterTab('in_process')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  referralFilterTab === 'in_process' && styles.filterPillTextActive,
                ]}
              >
                In Process ({countInProcess})
              </Text>
            </TouchableOpacity>

            {/* Pill 3: Disbursed */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                referralFilterTab === 'disbursed' && styles.filterPillActive,
              ]}
              onPress={() => setReferralFilterTab('disbursed')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  referralFilterTab === 'disbursed' && styles.filterPillTextActive,
                ]}
              >
                Disbursed ({countDisbursed})
              </Text>
            </TouchableOpacity>

            {/* Pill 4: Earnings */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                referralFilterTab === 'earnings' && styles.filterPillActive,
              ]}
              onPress={() => setReferralFilterTab('earnings')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  referralFilterTab === 'earnings' && styles.filterPillTextActive,
                ]}
              >
                Earnings ({countEarnings})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Live Referrals Table */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="people" size={18} color="#002e75" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#002e75' }}>
                  Referral Records ({filteredReferrals.length})
                </Text>
              </View>
              <TouchableOpacity onPress={loadReferrals} style={{ padding: 4 }} activeOpacity={0.7}>
                <Ionicons name="refresh" size={16} color="#004aad" />
              </TouchableOpacity>
            </View>

            {isLoadingReferrals && (
              <View style={{ padding: 12, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#004aad" />
                <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Syncing referrals with server...</Text>
              </View>
            )}
          </View>

          {filteredReferrals.length > 0 ? (
            <>
          {/* Table Header Bar: Referral Details | Loan Product | Amount | Status & Earning */}
          <View style={styles.tableHeaderBar}>
            <View style={{ flex: 1.4 }}>
              <Text style={styles.tableHeaderText}>Referral Details</Text>
            </View>
            <View style={styles.tableHeaderDivider} />
            <View style={{ flex: 1.1, alignItems: 'center' }}>
              <Text style={styles.tableHeaderText}>Loan Product</Text>
            </View>
            <View style={styles.tableHeaderDivider} />
            <View style={{ flex: 1.1, alignItems: 'center' }}>
              <Text style={styles.tableHeaderText}>Amount</Text>
            </View>
            <View style={styles.tableHeaderDivider} />
            <View style={{ flex: 1.4, alignItems: 'center' }}>
              <Text style={styles.tableHeaderText}>Status & Earning</Text>
            </View>
          </View>

          {/* Referral Rows List */}
          {filteredReferrals.map((item, index) => {
            const avatar = getAvatarBg(index);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.referralTableRow}
                onPress={() => setSelectedReferralItem(item)}
                activeOpacity={0.82}
              >
                {/* Col 1: Referral Details (Avatar, Name, Phone, City) */}
                <View style={styles.tableColDetails}>
                  <View style={[styles.userAvatarCircle, { backgroundColor: avatar.bg }]}>
                    <Ionicons name="person" size={18} color={avatar.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userNameText} numberOfLines={1}>
                      {item.fullName}
                    </Text>
                    <View style={styles.userPhoneRow}>
                      <Ionicons name="call" size={10} color="#002e75" style={{ marginRight: 3 }} />
                      <Text style={styles.userPhoneText}>{item.mobileNumber}</Text>
                    </View>
                    <View style={styles.userCityRow}>
                      <Ionicons name="location" size={10} color="#004aad" style={{ marginRight: 3 }} />
                      <Text style={styles.userCityText}>{item.city}</Text>
                    </View>
                  </View>
                </View>

                {/* Col 2: Loan Product (Icon + Name) */}
                <View style={styles.tableColProduct}>
                  {renderProductIcon(item.loanProduct)}
                  <Text style={styles.loanProductText} numberOfLines={2}>
                    {item.loanProduct}
                  </Text>
                </View>

                {/* Col 3: Amount */}
                <View style={styles.tableColAmount}>
                  <Text style={styles.loanAmountText}>{item.loanAmount}</Text>
                </View>

                {/* Col 4: Status & Earning */}
                <View style={styles.tableColStatus}>
                  {/* Status Badges */}
                  {item.status === 'Disbursed' && (
                    <View style={styles.statusBadgeGreen}>
                      <Ionicons name="checkmark-circle" size={14} color="#16a34a" style={{ marginRight: 4 }} />
                      <Text style={styles.statusTextGreen}>Disbursed</Text>
                    </View>
                  )}

                  {item.status === 'Approved' && (
                    <View style={styles.statusBadgeOrange}>
                      <Ionicons name="thumbs-up" size={13} color="#d97706" style={{ marginRight: 4 }} />
                      <Text style={styles.statusTextOrange}>Approved</Text>
                    </View>
                  )}

                  {item.status === 'Application / Login' && (
                    <View style={styles.statusBadgeBlue}>
                      <Ionicons name="document-text" size={13} color="#0284c7" style={{ marginRight: 4 }} />
                      <Text style={styles.statusTextBlue}>Application / Login</Text>
                    </View>
                  )}

                  {item.status === 'In Process' && (
                    <View style={styles.statusBadgeGray}>
                      <Ionicons name="time" size={13} color="#64748b" style={{ marginRight: 4 }} />
                      <Text style={styles.statusTextGray}>In Process</Text>
                    </View>
                  )}

                  {/* Earning Label and Amount */}
                  <View style={styles.earningRow}>
                    <Text style={styles.earningPrefixText}>
                      {item.status === 'Disbursed'
                        ? 'Your Earning:'
                        : item.status === 'Approved'
                          ? 'Estimated Earning:'
                          : 'Earning:'}{' '}
                    </Text>
                    {item.earning !== '—' ? (
                      <Text style={styles.earningValueRed}>
                        {item.earning}{' '}
                        {item.earningRate && (
                          <Text style={styles.earningRateSub}>({item.earningRate})</Text>
                        )}
                      </Text>
                    ) : (
                      <Text style={styles.earningDashText}>—</Text>
                    )}
                  </View>
                </View>

                {/* Right Arrow Chevron */}
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            );
          })}

            </>
          ) : (
            <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 20, alignItems: 'center', marginVertical: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <Ionicons name="gift-outline" size={38} color="#94a3b8" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 8 }}>
                No Referrals Yet
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                You have not referred any friends or family yet. Share your referral link or submit a lead to start earning up to 1.5% commission!
              </Text>
            </View>
          )}

          {/* Bottom Actions Row: Filter | Download Report | Referral Policy */}
          <View style={styles.bottomActionsRow}>
            {/* Action 1: Filter */}
            <TouchableOpacity
              style={styles.actionPillBtn}
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="funnel-outline" size={16} color="#002e75" style={{ marginRight: 5 }} />
              <Text style={styles.actionPillBtnText}>Filter</Text>
            </TouchableOpacity>

            {/* Action 2: Download Report */}
            <TouchableOpacity
              style={styles.actionPillBtn}
              onPress={handleDownloadReport}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={18} color="#002e75" style={{ marginRight: 5 }} />
              <Text style={styles.actionPillBtnText}>Download Report</Text>
            </TouchableOpacity>

            {/* Action 3: Referral Policy */}
            <TouchableOpacity
              style={styles.actionPillBtn}
              onPress={() => setShowPolicyModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="information-circle" size={18} color="#002e75" style={{ marginRight: 5 }} />
              <Text style={styles.actionPillBtnText}>Referral Policy</Text>
            </TouchableOpacity>
          </View>

          {/* Back to Refer Dashboard */}
          <TouchableOpacity
            style={styles.backToHomeBigBtn}
            onPress={() => setScreenMode('form')}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.backToHomeBigBtnText}>Back to Refer & Earn</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          >
            <View style={styles.modalContentCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Filter Referrals by Status</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close-circle" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              {[
                { key: 'all', label: `All Referrals (${statsTotalReferrals})` },
                { key: 'in_process', label: `In Process (${countInProcess})` },
                { key: 'disbursed', label: `Disbursed (${countDisbursed})` },
                { key: 'earnings', label: `Completed Earnings (${countEarnings})` },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.modalFilterOption,
                    referralFilterTab === opt.key && styles.modalFilterOptionActive,
                  ]}
                  onPress={() => {
                    setReferralFilterTab(opt.key as any);
                    setFilterModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalFilterText,
                      referralFilterTab === opt.key && styles.modalFilterTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {referralFilterTab === opt.key && (
                    <Ionicons name="checkmark-circle" size={20} color="#002e75" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Referral Policy Modal */}
        <Modal
          visible={showPolicyModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPolicyModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPolicyModal(false)}
          >
            <View style={styles.modalContentCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Loan Point Referral Policy</Text>
                <TouchableOpacity onPress={() => setShowPolicyModal(false)}>
                  <Ionicons name="close-circle" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalBullet}>
                  • <Text style={{ fontWeight: '700' }}>Disbursal Commission:</Text> Referrers earn up to 1.5% of the gross loan amount disbursed directly by partner banks.
                </Text>
                <Text style={styles.modalBullet}>
                  • <Text style={{ fontWeight: '700' }}>Product Payouts:</Text> Home Loans (up to 1.5%), Business Loans (up to 1.5%), Personal Loans (up to 1.5%), LAP (up to 1.25%), Car Loans (up to 1.0%).
                </Text>
                <Text style={styles.modalBullet}>
                  • <Text style={{ fontWeight: '700' }}>Recurring Top-Up Commission:</Text> Whenever your referred client applies and gets a top-up loan sanctioned, recurring commissions are credited automatically.
                </Text>
                <Text style={styles.modalBullet}>
                  • <Text style={{ fontWeight: '700' }}>Payout Cycle:</Text> Commissions are settled on the 10th and 25th of every month directly to your verified bank account.
                </Text>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Selected Referral Record Detail Modal */}
        <Modal
          visible={!!selectedReferralItem}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedReferralItem(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedReferralItem(null)}
          >
            <View style={styles.recordDetailCard} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.recordDetailIconBadge}>
                    <Ionicons name="person" size={20} color="#002e75" />
                  </View>
                  <Text style={styles.modalTitle}>Referral Details</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedReferralItem(null)}>
                  <Ionicons name="close-circle" size={26} color="#64748b" />
                </TouchableOpacity>
              </View>

              {selectedReferralItem && (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                  {/* Lead Header Highlight */}
                  <View style={styles.recordLeadHighlightBox}>
                    <Text style={styles.recordDetailName}>{selectedReferralItem.fullName}</Text>
                    <View style={styles.recordStatusBadgeRow}>
                      <View style={[
                        styles.statusBadgeSmall,
                        selectedReferralItem.status === 'Disbursed'
                          ? styles.statusBadgeGreen
                          : selectedReferralItem.status === 'Approved'
                          ? styles.statusBadgeOrange
                          : styles.statusBadgeBlue
                      ]}>
                        <Text style={styles.statusBadgeSmallText}>{selectedReferralItem.status}</Text>
                      </View>
                      <Text style={styles.recordDetailDate}>Date: {selectedReferralItem.date}</Text>
                    </View>
                  </View>

                  {/* Information Rows */}
                  <View style={styles.recordInfoRow}>
                    <Text style={styles.recordInfoLabel}>Mobile Number</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const cleanPhone = selectedReferralItem.mobileNumber.replace(/\D/g, '');
                        if (cleanPhone) Linking.openURL(`tel:${cleanPhone}`);
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <Ionicons name="call" size={14} color="#004aad" />
                      <Text style={[styles.recordInfoValue, { color: '#004aad', fontWeight: '800' }]}>
                        {selectedReferralItem.mobileNumber}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.recordInfoRow}>
                    <Text style={styles.recordInfoLabel}>City / Location</Text>
                    <Text style={styles.recordInfoValue}>{selectedReferralItem.city}</Text>
                  </View>

                  <View style={styles.recordInfoRow}>
                    <Text style={styles.recordInfoLabel}>Loan Product</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <LoanIcon
                        type={selectedReferralItem.loanProduct}
                        size={22}
                        containerSize={30}
                        borderRadius={8}
                        useAssetImage={true}
                      />
                      <Text style={styles.recordInfoValue}>{selectedReferralItem.loanProduct}</Text>
                    </View>
                  </View>

                  <View style={styles.recordInfoRow}>
                    <Text style={styles.recordInfoLabel}>Requested Amount</Text>
                    <Text style={styles.recordInfoValue}>{selectedReferralItem.loanAmount}</Text>
                  </View>

                  <View style={styles.recordInfoRow}>
                    <Text style={styles.recordInfoLabel}>Commission / Earning</Text>
                    <Text style={[styles.recordInfoValue, { color: '#b45309', fontWeight: '900' }]}>
                      {selectedReferralItem.earning !== '—' ? selectedReferralItem.earning : 'Up to 1.5% on disbursal'}
                    </Text>
                  </View>

                  {/* RM Assistance Note */}
                  <View style={styles.rmAssistBox}>
                    <Ionicons name="shield-checkmark" size={18} color="#059669" />
                    <Text style={styles.rmAssistText}>
                      Loan Point CRM automatically tracks this lead until disbursal. Commission will be credited directly to your account.
                    </Text>
                  </View>

                  {/* Close button */}
                  <TouchableOpacity
                    style={styles.closeRecordModalBtn}
                    onPress={() => setSelectedReferralItem(null)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.closeRecordModalBtnText}>Close Details</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  // =========================================================================
  // VIEW: 2. REFERRAL SUBMITTED SUCCESSFULLY SCREEN
  // =========================================================================
  if (screenMode === 'submitted_success') {
    if (!currentSubmitted) {
      return (
        <View style={styles.screenWrapper}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Ionicons name="checkmark-circle-outline" size={56} color="#16a34a" />
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#002e75', marginTop: 12 }}>
              Referral Submitted Successfully
            </Text>
            <TouchableOpacity
              style={[styles.backToHomeBigBtn, { marginTop: 24, width: '100%' }]}
              onPress={() => setScreenMode('form')}
            >
              <Text style={styles.backToHomeBigBtnText}>Back to Refer & Earn</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.screenWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Status Header Row with Back Button */}
          <View style={styles.successHeaderRow}>
            <TouchableOpacity
              style={styles.backButtonTouch}
              onPress={() => setScreenMode('form')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={26} color="#002e75" />
            </TouchableOpacity>
            <View style={styles.successHeaderCenter}>
              <View style={styles.headerTitleRowCompact}>
                <MaterialCommunityIcons name="bullhorn" size={22} color="#002e75" />
                <Text style={styles.headerTitleTextCompact}>Refer & Earn</Text>
              </View>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Hero Banner: Avatar Thumbs-Up + Green Checkmark + Referral Submitted Successfully! */}
          <View style={styles.successHeroBanner}>
            {/* Left Professional Avatar with Thumbs Up */}
            <View style={styles.successAvatarWrap}>
              <Image
                source={require('../../../assets/logo/arvind_patil.png')}
                style={styles.successCustomerAvatarImage}
                resizeMode="cover"
              />
              <View style={styles.successThumbsBadge}>
                <Ionicons name="thumbs-up" size={14} color="#d97706" />
              </View>
            </View>

            {/* Center Checkmark & Headline */}
            <View style={styles.successHeroTextWrap}>
              <View style={styles.successBigCheckCircle}>
                <Ionicons name="checkmark" size={24} color="#ffffff" />
              </View>

              <Text style={styles.successHeroTitle} numberOfLines={2}>
                Referral Submitted{'\n'}Successfully!
              </Text>
            </View>
          </View>

          {/* "Thank you! Your referral has been received." Subtext */}
          <View style={styles.thankYouRow}>
            <Text style={styles.thankYouText}>Thank you!</Text>
            <Text style={styles.thankYouSubtext}>
              Your referral has been received.
            </Text>
          </View>

          {/* Referral ID & Submitted On Header Card */}
          <View style={styles.refIdCard}>
            <View style={styles.refIdLeftCol}>
              <View style={styles.refIdIconCircle}>
                <Ionicons name="people" size={22} color="#004aad" />
              </View>
              <View>
                <Text style={styles.refIdLabel}>Referral ID</Text>
                <View style={styles.refIdPillBadge}>
                  <Text style={styles.refIdPillText}>{currentSubmitted.id}</Text>
                </View>
              </View>
            </View>

            <View style={styles.refIdDivider} />

            <View style={styles.refIdRightCol}>
              <Ionicons name="calendar-outline" size={24} color="#004aad" style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.refIdLabel}>Submitted On</Text>
                <Text style={styles.refIdDateText}>{currentSubmitted.submittedOn}</Text>
              </View>
            </View>
          </View>

          {/* Referral Details Card */}
          <View style={styles.detailsOuterCard}>
            <View style={styles.sectionHeaderBanner}>
              <Ionicons name="list" size={16} color="#ffd700" style={{ marginRight: 6 }} />
              <Text style={styles.sectionHeaderBannerText}>Referral Details</Text>
            </View>

            <View style={styles.detailsGridRow}>
              {/* Row 1: Full Name & Mobile Number */}
              <View style={styles.detailsGridSubRow}>
                <View style={styles.detailGridCol}>
                  <View style={styles.detailGridTopMeta}>
                    <View style={styles.gridIconCircle}>
                      <Ionicons name="person-outline" size={15} color="#004aad" />
                    </View>
                    <Text style={styles.detailGridLabel} numberOfLines={1}>Full Name</Text>
                  </View>
                  <Text style={styles.detailGridValue} numberOfLines={1} ellipsizeMode="tail">
                    {currentSubmitted.fullName}
                  </Text>
                </View>

                <View style={styles.detailGridDivider} />

                <View style={styles.detailGridCol}>
                  <View style={styles.detailGridTopMeta}>
                    <View style={styles.gridIconCircle}>
                      <Ionicons name="call" size={15} color="#004aad" />
                    </View>
                    <Text style={styles.detailGridLabel} numberOfLines={1}>Mobile Number</Text>
                  </View>
                  <Text style={styles.detailGridValue} numberOfLines={1} ellipsizeMode="tail">
                    {currentSubmitted.mobileNumber}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsGridHorizontalDivider} />

              {/* Row 2: Loan Required & City / Location */}
              <View style={styles.detailsGridSubRow}>
                <View style={styles.detailGridCol}>
                  <View style={styles.detailGridTopMeta}>
                    <View style={styles.gridIconCircleGold}>
                      <Ionicons name="cash" size={15} color="#d97706" />
                    </View>
                    <Text style={styles.detailGridLabel} numberOfLines={1}>Loan Required</Text>
                  </View>
                  <View style={styles.yellowLoanPill}>
                    <Text style={styles.yellowLoanPillText} numberOfLines={1} ellipsizeMode="tail">
                      {currentSubmitted.loanType}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailGridDivider} />

                <View style={styles.detailGridCol}>
                  <View style={styles.detailGridTopMeta}>
                    <View style={styles.gridIconCircleBlue}>
                      <Ionicons name="location" size={15} color="#004aad" />
                    </View>
                    <Text style={styles.detailGridLabel} numberOfLines={1}>City / Location</Text>
                  </View>
                  <Text style={styles.detailGridValue} numberOfLines={1} ellipsizeMode="tail">
                    {currentSubmitted.city || '—'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Referral Tracking Card (4 Step Horizontal Stepper) */}
          <View style={styles.trackingOuterCard}>
            <View style={styles.sectionHeaderBanner}>
              <Ionicons name="bar-chart" size={16} color="#ffd700" style={{ marginRight: 6 }} />
              <Text style={styles.sectionHeaderBannerText}>Referral Tracking</Text>
            </View>

            <View style={styles.stepperContainer}>
              <View style={styles.stepperTrackBase}>
                <View style={styles.stepperTrackActive} />
              </View>

              <View style={styles.stepperStepsRow}>
                {/* Step 1: Referral Submitted */}
                <View style={styles.stepNodeItem}>
                  <View style={styles.stepNodeCircleActive}>
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  </View>
                  <View style={styles.stepPillActive}>
                    <Text style={styles.stepPillActiveTitle}>Referral</Text>
                    <Text style={styles.stepPillActiveTitle}>Submitted</Text>
                  </View>
                  <Text style={styles.stepTimeSubtext}>
                    {currentSubmitted.submittedOn ? currentSubmitted.submittedOn.split(',')[0] : 'Today'}
                  </Text>
                </View>

                {/* Step 2: Login / Application */}
                <View style={styles.stepNodeItem}>
                  <View style={styles.stepNodeCircleInactive} />
                  <View style={styles.stepPillInactive}>
                    <Text style={styles.stepPillInactiveTitle}>Login /</Text>
                    <Text style={styles.stepPillInactiveTitle}>Application</Text>
                  </View>
                </View>

                {/* Step 3: Loan Approval */}
                <View style={styles.stepNodeItem}>
                  <View style={styles.stepNodeCircleInactive} />
                  <View style={styles.stepPillInactive}>
                    <Text style={styles.stepPillInactiveTitle}>Loan</Text>
                    <Text style={styles.stepPillInactiveTitle}>Approval</Text>
                  </View>
                </View>

                {/* Step 4: Disbursement & Earning */}
                <View style={styles.stepNodeItem}>
                  <View style={styles.stepNodeCircleInactive} />
                  <View style={styles.stepPillInactive}>
                    <Text style={styles.stepPillInactiveTitle}>Disbursement</Text>
                    <Text style={styles.stepPillInactiveTitle}>& Earning</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Your Earning Potential Card */}
          <View style={styles.earningPotentialCard}>
            <View style={styles.moneyBagWrap}>
              <View style={styles.moneyBagBody}>
                <MaterialCommunityIcons name="sack-percent" size={36} color="#d97706" />
              </View>
            </View>

            <View style={styles.earningContentCol}>
              <View style={styles.earningTopRow}>
                <View style={styles.earningPotentialBadge}>
                  <Text style={styles.earningPotentialBadgeText}>Your Earning Potential</Text>
                </View>
                <Text style={styles.earningDisbursalText}>
                  of Loan Disbursal Amount*
                </Text>
              </View>

              <View style={styles.earningRateRow}>
                <Text style={styles.earningRatePrefix}>Up to </Text>
                <Text style={styles.earningRateRed}>1.5%</Text>
              </View>

              <View style={styles.recurringYellowBanner}>
                <Text style={styles.recurringYellowBannerText}>
                  + Recurring Income on Eligible Loan Top-Ups!
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons Row: Add Another Referral + View My Referrals */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.addAnotherBtn}
              onPress={() => setScreenMode('form')}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={22} color="#002e75" style={{ marginRight: 6 }} />
              <Text style={styles.addAnotherBtnText}>Add Another Referral</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewMyReferralsBtn}
              onPress={() => setScreenMode('view_my_referrals')}
              activeOpacity={0.85}
            >
              <Ionicons name="list-outline" size={20} color="#002e75" style={{ marginRight: 6 }} />
              <Text style={styles.viewMyReferralsBtnText}>View My Referrals</Text>
            </TouchableOpacity>
          </View>

          {/* Big Glossy Blue Button: Back to Home */}
          <TouchableOpacity
            style={styles.backToHomeBigBtn}
            onPress={() => {
              if (onNavigateHome) {
                onNavigateHome();
              } else {
                setScreenMode('form');
              }
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="home-outline" size={22} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.backToHomeBigBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // =========================================================================
  // VIEW: 3. REFER & EARN FORM & SHARING DASHBOARD (MAIN SCREEN)
  // =========================================================================
  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Card Title with Megaphone Badge */}
        <View style={styles.headerTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <View style={styles.headerMegaphoneIconWrap}>
              <MaterialCommunityIcons name="bullhorn" size={20} color="#ffd700" />
            </View>
            <View style={styles.headerTitleTextWrap}>
              <Text style={styles.headerTitleText} numberOfLines={1}>Refer & Earn</Text>
              <Text style={styles.headerSubtitleText} numberOfLines={1}>Earn in Lakhs & Recurring</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.myReferralsQuickBtn}
            onPress={() => setScreenMode('view_my_referrals')}
            activeOpacity={0.8}
          >
            <Ionicons name="people" size={14} color="#002e75" style={{ marginRight: 4 }} />
            <Text style={styles.myReferralsQuickBtnText} numberOfLines={1}>My Referrals ({statsTotalReferrals})</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Hero Banner: Refer & Earn Banner from assets/refer-earn */}
        <View style={styles.referBannerContainer}>
          <Image
            source={require('../../../assets/refer-earn/refer-earn-banner.png')}
            style={styles.referBannerImage}
            resizeMode="contain"
          />
        </View>

        {/* Recurring Income Highlight Badge */}
        <View style={styles.recurringBanner}>
          <View style={styles.recurringPulseIcon}>
            <Ionicons name="repeat" size={18} color="#002e75" />
          </View>
          <Text style={styles.recurringBannerText}>
            <Text style={{ fontWeight: '800', color: '#002e75' }}>Also Recurring Income:</Text> Earn recurring rewards every time your referred borrower takes a <Text style={{ fontWeight: '800', color: '#b45309' }}>Loan Top Up</Text>!
          </Text>
        </View>

        {/* 2. 3-Step Process Flow Card (Refer >> Apply >> Earn) */}
        <View style={styles.processCard}>
          <View style={styles.processStepItem}>
            <View style={styles.stepCircleBlue}>
              <Ionicons name="share-social" size={20} color="#004aad" />
            </View>
            <View style={styles.stepContentWrap}>
              <Text style={styles.stepHeaderNumber}>1. Refer</Text>
              <Text style={styles.stepDescriptionText}>Fill details or share</Text>
            </View>
          </View>

          <Text style={styles.processChevron}>»</Text>

          <View style={styles.processStepItem}>
            <View style={styles.stepCircleYellow}>
              <Ionicons name="clipboard-outline" size={20} color="#854d0e" />
            </View>
            <View style={styles.stepContentWrap}>
              <Text style={styles.stepHeaderNumber}>2. Apply</Text>
              <Text style={styles.stepDescriptionText}>Friend applies for loan</Text>
            </View>
          </View>

          <Text style={styles.processChevron}>»</Text>

          <View style={styles.processStepItem}>
            <View style={styles.stepCircleGreen}>
              <Ionicons name="gift-outline" size={20} color="#15803d" />
            </View>
            <View style={styles.stepContentWrap}>
              <Text style={styles.stepHeaderNumber}>3. Earn</Text>
              <Text style={styles.stepDescriptionText}>Get up to 1.5% in bank</Text>
            </View>
          </View>
        </View>

        {/* 3. Your Reward Banner Card */}
        <View style={styles.rewardCard}>
          <View style={styles.rewardTrophyHeaderTab}>
            <Ionicons name="trophy" size={17} color="#fbbf24" style={{ marginRight: 6 }} />
            <Text style={styles.rewardTrophyHeaderText}>Your Reward</Text>
          </View>

          <View style={styles.rewardContentRow}>
            <View style={styles.rewardTextCol}>
              <Text style={styles.rewardHeading}>
                Earn up to <Text style={styles.rewardHeadingRed}>1.5%*</Text>
              </Text>
              <Text style={styles.rewardSubheading}>
                of Disbursal amount depends upon loan products!
              </Text>
              <View style={styles.rewardPillsRow}>
                <View style={styles.miniProductPill}>
                  <Text style={styles.miniProductPillText}>Home Loan: 1.5%</Text>
                </View>
                <View style={styles.miniProductPill}>
                  <Text style={styles.miniProductPillText}>Business Loan: 1.5%</Text>
                </View>
              </View>
            </View>

            <View style={styles.coinsStackWrap}>
              <View style={styles.reward3dCoinCircle}>
                <Ionicons name="sparkles" size={16} color="#f59e0b" style={styles.sparkleFloating} />
                <MaterialCommunityIcons name="currency-inr" size={32} color="#b45309" />
              </View>
            </View>
          </View>
        </View>

        {/* 4. CUSTOMER SELF-FILL REFERRAL DETAILS FORM */}
        <View style={styles.referralFormCard}>
          <View style={styles.formCardHeader}>
            <View style={styles.formCardIconWrap}>
              <Ionicons name="person-add" size={18} color="#002e75" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.formCardTitle}>Fill Referral Details Directly</Text>
              <Text style={styles.formCardSubtitle}>Submit details & open track screen instantly</Text>
            </View>
          </View>

          {/* Field 1: Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Friend's Full Name <Text style={{ color: '#dc2626' }}>*</Text>
            </Text>
            <View style={styles.inputBoxWrap}>
              <Ionicons name="person-outline" size={18} color="#64748b" style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Rahul Deshmukh"
                placeholderTextColor="#94a3b8"
                value={friendName}
                onChangeText={setFriendName}
              />
            </View>
          </View>

          {/* Field 2: Mobile Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Mobile Number <Text style={{ color: '#dc2626' }}>*</Text>
            </Text>
            <View style={styles.inputBoxWrap}>
              <Ionicons name="call-outline" size={18} color="#64748b" style={styles.fieldIcon} />
              <Text style={styles.countryCodeText}>+91</Text>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={10}
                value={friendMobile}
                onChangeText={setFriendMobile}
              />
            </View>
          </View>

          {/* Field 3: Which Loan Required? */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Which Loan Required? <Text style={{ color: '#dc2626' }}>*</Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.loanChipsRow}
            >
              {loanOptions.map((opt) => {
                const isSelected = selectedLoan === opt.label;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[
                      styles.loanChip,
                      isSelected && styles.loanChipSelected,
                    ]}
                    onPress={() => setSelectedLoan(opt.label)}
                    activeOpacity={0.8}
                  >
                    <LoanIcon
                      type={opt.product}
                      size={18}
                      containerSize={26}
                      borderRadius={13}
                      useAssetImage={true}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.loanChipText,
                        isSelected && styles.loanChipTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <View
                      style={[
                        styles.chipRateTag,
                        isSelected && styles.chipRateTagSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipRateText,
                          isSelected && styles.chipRateTextSelected,
                        ]}
                      >
                        {opt.rate}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Field 4: Approximate Loan Amount (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Expected Loan Amount (₹)</Text>
            <View style={styles.inputBoxWrap}>
              <MaterialCommunityIcons name="currency-inr" size={18} color="#64748b" style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 5,00,000 (Optional)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={friendLoanAmount}
                onChangeText={(t) => {
                  const num = t.replace(/[^0-9]/g, '');
                  if (!num) {
                    setFriendLoanAmount('');
                  } else {
                    setFriendLoanAmount(parseInt(num, 10).toLocaleString('en-IN'));
                  }
                }}
              />
            </View>
          </View>

          {/* Field 5: City / Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              City / Location <Text style={{ color: '#dc2626' }}>*</Text>
            </Text>
            <View style={styles.inputBoxWrap}>
              <Ionicons name="location-outline" size={18} color="#64748b" style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. City Name"
                placeholderTextColor="#94a3b8"
                value={friendCity}
                onChangeText={setFriendCity}
              />
            </View>
          </View>

          {/* Submit Referral Button */}
          <TouchableOpacity
            style={styles.submitLeadBtn}
            onPress={handleSubmitLead}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.submitLeadBtnText}>
              {isSubmitting ? 'Submitting Details...' : 'Submit Referral'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5. Your Referral Link Card */}
        <View style={styles.referralLinkCard}>
          <View style={styles.referralLinkHeaderRow}>
            <View style={styles.chainIconCircle}>
              <Ionicons name="link" size={18} color="#ffd700" />
            </View>
            <Text style={styles.referralLinkTitle}>Or Share Your Referral Link</Text>
          </View>

          <TouchableOpacity
            style={styles.linkDisplayWrap}
            onPress={handleCopyLink}
            activeOpacity={0.85}
          >
            <Text style={styles.linkDisplayText} numberOfLines={1}>
              {referralLink}
            </Text>
            <TouchableOpacity onPress={handleCopyLink} style={styles.copyButtonTouch}>
              <Ionicons name="copy-outline" size={24} color="#002e75" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* 6. Dual Social Sharing Buttons */}
        <View style={styles.shareButtonsRow}>
          <TouchableOpacity
            style={styles.shareWhatsAppBtn}
            onPress={handleShareWhatsApp}
            activeOpacity={0.85}
          >
            <FontAwesome5 name="whatsapp" size={22} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.shareWhatsAppBtnText}>Share on WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareMoreBtn}
            onPress={handleShareMore}
            activeOpacity={0.85}
          >
            <Ionicons name="share-social-outline" size={20} color="#002e75" style={{ marginRight: 6 }} />
            <Text style={styles.shareMoreBtnText}>Share More</Text>
          </TouchableOpacity>
        </View>

        {/* 7. Action Button to View My Referrals */}
        <TouchableOpacity
          style={styles.openAllReferralsCardBtn}
          onPress={() => setScreenMode('view_my_referrals')}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.openAllRefIconCircle}>
              <Ionicons name="people" size={20} color="#002e75" />
            </View>
            <View>
              <Text style={styles.openAllRefTitle}>View My Referrals Tracker</Text>
              <Text style={styles.openAllRefSub}>
                {statsTotalReferrals} Total Referral{statsTotalReferrals === 1 ? '' : 's'} • {statsTotalEarnings} Earned
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#002e75" />
        </TouchableOpacity>

        {/* 8. Terms & Conditions Button */}
        <TouchableOpacity
          style={styles.termsPillButton}
          onPress={() => setShowTermsModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="information-circle" size={18} color="#002e75" style={{ marginRight: 6 }} />
          <Text style={styles.termsPillButtonText}>
            Refer & Earn – Terms & Conditions
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTermsModal(false)}
        >
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Refer & Earn – Terms & Conditions</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalBullet}>
                • <Text style={{ fontWeight: '700' }}>Up to 1.5% Disbursal Commission:</Text> Commission is paid directly into your verified bank account based on the final disbursed amount and loan product category.
              </Text>
              <Text style={styles.modalBullet}>
                • <Text style={{ fontWeight: '700' }}>Earn in Lakhs:</Text> For large disbursals (e.g. ₹1 Crore Home/Business Loan), your 1.5% commission reaches up to ₹1,50,000 per deal.
              </Text>
              <Text style={styles.modalBullet}>
                • <Text style={{ fontWeight: '700' }}>Recurring Income for Top Ups:</Text> If any referred customer avails a Loan Top Up anytime in the future, you receive recurring payouts automatically.
              </Text>
              <Text style={styles.modalBullet}>
                • <Text style={{ fontWeight: '700' }}>Self-Fill Leads:</Text> When you fill referral details directly, our RM contacts the client on priority within 2 business hours.
              </Text>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  referBannerContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  referBannerImage: {
    width: '100%',
    aspectRatio: 1024 / 341,
    maxHeight: 140,
  },

  screenWrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 110,
  },

  // ---------------- VIEW MY REFERRALS HEADER ----------------
  viewRefHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 2,
  },
  viewRefTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewRefPeopleIconWrap: {
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
  viewRefTitleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#002e75',
    letterSpacing: -0.3,
  },

  // ---------------- 5 METRICS CARDS GRID ----------------
  metricsGridContainer: {
    marginBottom: 12,
    gap: 8,
  },
  metricsGridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCardGridItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricCardGoldGridItem: {
    flex: 1.4,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
    shadowColor: '#b45309',
    shadowOpacity: 0.15,
  },
  metricsCardsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  metricCard: {
    width: 82,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricIconWrapBlue: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricIconWrapGreen: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricIconWrapOrange: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricIconWrapPurple: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricCardLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 12,
    minHeight: 24,
  },
  metricCardValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#002e75',
    marginTop: 2,
  },
  metricCardGold: {
    minWidth: 110,
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  metricIconWrapRed: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricCardLabelGold: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350f',
    textAlign: 'center',
    minHeight: 24,
  },
  metricCardValueGold: {
    fontSize: 18,
    fontWeight: '900',
    color: '#78350f',
    marginTop: 2,
  },

  // ---------------- POTENTIAL BANNER CARD ----------------
  bannerPotentialCard: {
    backgroundColor: '#002e75',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerCoinsStack: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  coinBadgeContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(253, 224, 71, 0.2)',
    borderWidth: 1.5,
    borderColor: '#fde047',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sparkleFloating: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  coinStackCylinderSmall: {
    width: 34,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fde047',
    borderWidth: 1.5,
    borderColor: '#ca8a04',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiltedCoinSmall: {
    position: 'absolute',
    right: -2,
    bottom: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fbbf24',
    borderWidth: 1.5,
    borderColor: '#ca8a04',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '15deg' }],
  },
  coinTextSmall: {
    fontSize: 8,
    fontWeight: '900',
    color: '#713f12',
  },
  bannerCenterContent: {
    flex: 1,
    paddingHorizontal: 4,
  },
  bannerMainHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 16,
  },
  bannerHighlightYellow: {
    fontSize: 15,
    fontWeight: '900',
    color: '#facc15',
  },
  bannerSubHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: '#bae6fd',
    marginTop: 2,
  },
  growthChartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 4,
  },
  chartBarsMiniRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  chartBar: {
    width: 4,
    backgroundColor: '#facc15',
    borderRadius: 2,
  },

  // ---------------- 4 FILTER PILLS ----------------
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterPill: {
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
  filterPillActive: {
    backgroundColor: '#002e75',
    borderColor: '#002e75',
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  filterPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#002e75',
    textAlign: 'center',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },

  // ---------------- TABLE HEADER BAR ----------------
  tableHeaderBar: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  tableHeaderText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#002e75',
  },
  tableHeaderDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#93c5fd',
    marginHorizontal: 4,
  },

  // ---------------- REFERRAL ROW CARD ----------------
  referralTableRow: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tableColDetails: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 4,
  },
  userAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 1,
  },
  userPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  userPhoneText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },
  userCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userCityText: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
  },

  // Loan product col
  tableColProduct: {
    flex: 1.1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  loanProdCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  loanProductText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },

  // Amount col
  tableColAmount: {
    flex: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  loanAmountText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },

  // Status & Earning col
  tableColStatus: {
    flex: 1.45,
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  statusBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 3,
  },
  statusTextGreen: {
    fontSize: 10,
    fontWeight: '900',
    color: '#15803d',
  },
  statusBadgeOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 3,
  },
  statusTextOrange: {
    fontSize: 10,
    fontWeight: '900',
    color: '#b45309',
  },
  statusBadgeBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 3,
  },
  statusTextBlue: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0284c7',
  },
  statusBadgeGray: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 3,
  },
  statusTextGray: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
  },
  earningRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  earningPrefixText: {
    fontSize: 8.5,
    color: '#64748b',
    fontWeight: '600',
  },
  earningValueRed: {
    fontSize: 10,
    fontWeight: '900',
    color: '#dc2626',
  },
  earningRateSub: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#dc2626',
  },
  earningDashText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
  },

  // ---------------- BOTTOM ACTIONS ROW ----------------
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    marginBottom: 16,
    width: '100%',
    flexWrap: 'nowrap',
  },
  actionPillBtn: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 4,
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
  },
  actionPillBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#002e75',
  },

  // Modal Filter Option
  modalFilterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  modalFilterOptionActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#002e75',
  },
  modalFilterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  modalFilterTextActive: {
    color: '#002e75',
    fontWeight: '800',
  },

  // Record Detail Modal Styles
  recordDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    width: '94%',
    maxWidth: 400,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    alignSelf: 'center',
  },
  recordDetailIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordLeadHighlightBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recordDetailName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002e75',
    marginBottom: 4,
  },
  recordStatusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeSmallText: {
    fontSize: 10,
    fontWeight: '800',
  },
  recordDetailDate: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  recordInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  recordInfoLabel: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
  recordInfoValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
    maxWidth: '55%',
  },
  rmAssistBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    padding: 9,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  rmAssistText: {
    flex: 1,
    fontSize: 10.5,
    color: '#065f46',
    lineHeight: 14,
    fontWeight: '500',
  },
  closeRecordModalBtn: {
    backgroundColor: '#002e75',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 4,
    width: '100%',
  },
  closeRecordModalBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  // ---------------- HEADER STYLES IN FORM ----------------
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 2,
    width: '100%',
    gap: 8,
  },
  headerMegaphoneIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#002e75',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#002e75',
    letterSpacing: -0.3,
  },
  headerSubtitleText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#0284c7',
    marginTop: 1,
  },
  myReferralsQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    flexShrink: 0,
    alignSelf: 'center',
  },
  myReferralsQuickBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#78350f',
  },

  // ---------------- SUCCESS SCREEN SPECIFIC STYLES ----------------
  successHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
  successHeaderCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitleTextCompact: {
    fontSize: 20,
    fontWeight: '900',
    color: '#002e75',
  },
  headerPlusTouch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
  },

  // Hero Banner in Success Screen
  successHeroBanner: {
    backgroundColor: '#002e75',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  successAvatarWrap: {
    width: 68,
    height: 68,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  successCustomerAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: '#38bdf8',
    backgroundColor: '#ffffff',
  },
  successThumbsBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#d97706',
    borderRadius: 13,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successHeroTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  successBigCheckCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#86efac',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  successHeroTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 22,
    flex: 1,
  },

  // Thank You Subtitle
  thankYouRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  thankYouText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#002e75',
    marginBottom: 2,
  },
  thankYouSubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },

  // Referral ID & Submitted On Card
  refIdCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    backgroundColor: '#fffdf5',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    gap: 8,
  },
  refIdLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  refIdIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  refIdLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#002e75',
    marginBottom: 2,
  },
  refIdPillBadge: {
    backgroundColor: '#fef08a',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#f59e0b',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  refIdPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  refIdDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#cbd5e1',
  },
  refIdRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  refIdDateText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
    flexShrink: 1,
  },

  // Section Outer Card & Tab Header Banner
  detailsOuterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    paddingTop: 20,
    paddingBottom: 14,
    paddingHorizontal: 12,
    marginBottom: 14,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeaderBanner: {
    position: 'absolute',
    top: -12,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002e75',
    paddingHorizontal: 12,
    paddingVertical: 4,
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
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  detailsGridRow: {
    flexDirection: 'column',
    paddingTop: 4,
  },
  detailsGridSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailsGridHorizontalDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 6,
  },
  detailGridCol: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 6,
    minWidth: 0,
  },
  detailGridTopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  gridIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIconCircleGold: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIconCircleBlue: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailGridLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    flexShrink: 1,
  },
  detailGridValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'left',
    width: '100%',
  },
  yellowLoanPill: {
    backgroundColor: '#fef08a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
    maxWidth: '100%',
  },
  yellowLoanPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#78350f',
  },
  detailGridDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#f1f5f9',
  },

  // Referral Tracking Stepper Card
  trackingOuterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    paddingTop: 22,
    paddingBottom: 14,
    paddingHorizontal: 4,
    marginBottom: 14,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  stepperContainer: {
    position: 'relative',
    paddingTop: 8,
  },
  stepperTrackBase: {
    position: 'absolute',
    top: 22,
    left: '12%',
    right: '12%',
    height: 4,
    backgroundColor: '#cbd5e1',
    zIndex: 1,
  },
  stepperTrackActive: {
    width: '33%',
    height: 4,
    backgroundColor: '#16a34a',
  },
  stepperStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  stepNodeItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
    minWidth: 0,
  },
  stepNodeCircleActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    marginBottom: 6,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  stepNodeCircleInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#cbd5e1',
    marginBottom: 8,
  },
  stepPillActive: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    width: '95%',
  },
  stepPillActiveTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#065f46',
    textAlign: 'center',
    lineHeight: 11,
  },
  stepTimeSubtext: {
    fontSize: 8,
    color: '#059669',
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
  },
  stepPillInactive: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    width: '95%',
  },
  stepPillInactiveTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 11,
  },

  // Earning Potential Card
  earningPotentialCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  moneyBagWrap: {
    width: 60,
    height: 60,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  moneyBagBody: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningContentCol: {
    flex: 1,
    minWidth: 0,
  },
  earningTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  earningPotentialBadge: {
    backgroundColor: '#002e75',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  earningPotentialBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  earningDisbursalText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a',
    flexShrink: 1,
  },
  earningRateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  earningRatePrefix: {
    fontSize: 15,
    fontWeight: '900',
    color: '#002e75',
  },
  earningRateRed: {
    fontSize: 22,
    fontWeight: '900',
    color: '#dc2626',
  },
  recurringYellowBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#fbbf24',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  recurringYellowBannerText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#92400e',
    flexWrap: 'wrap',
  },

  // Action Buttons Row (Add Another Referral + View My Referrals)
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addAnotherBtn: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#002e75',
    borderRadius: 14,
    paddingVertical: 12,
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
  addAnotherBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#002e75',
    textAlign: 'center',
    flexShrink: 1,
  },
  viewMyReferralsBtn: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#002e75',
    borderRadius: 14,
    paddingVertical: 12,
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
  viewMyReferralsBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#002e75',
    textAlign: 'center',
    flexShrink: 1,
  },

  // Big Blue Button: Back to Home
  backToHomeBigBtn: {
    backgroundColor: '#002e75',
    borderRadius: 24,
    paddingVertical: 14,
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
    marginBottom: 20,
  },
  backToHomeBigBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },

  // Button to open "View My Referrals" from Main screen
  openAllReferralsCardBtn: {
    backgroundColor: '#f0f9ff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  openAllRefIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openAllRefTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#002e75',
  },
  openAllRefSub: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '600',
    marginTop: 1,
  },

  // ---------------- HERO BANNER MAIN SCREEN ----------------
  heroBannerCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#004aad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  heroAvatarWrap: {
    width: 66,
    height: 66,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCustomerAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#0284c7',
    backgroundColor: '#ffffff',
  },
  thumbsUpBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
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
    paddingHorizontal: 8,
  },
  heroMainTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#002e75',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 5,
  },
  goldRibbonBanner: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#d97706',
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  goldRibbonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#78350f',
    letterSpacing: 0.2,
  },
  heroGiftBoxWrap: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGiftCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },

  // Recurring Income Banner
  recurringBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  recurringPulseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#451a03',
    lineHeight: 17,
  },

  // 3-Step Process Flow Card
  processCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  processStepItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  stepCircleBlue: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleYellow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleGreen: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    borderWidth: 1.5,
    borderColor: '#4ade80',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepContentWrap: {
    alignItems: 'center',
  },
  stepHeaderNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  stepDescriptionText: {
    fontSize: 9.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 12,
  },
  processChevron: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94a3b8',
    marginHorizontal: -2,
    marginTop: -16,
  },

  // Reward Banner Card
  rewardCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    paddingTop: 24,
    paddingBottom: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    position: 'relative',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardTrophyHeaderTab: {
    position: 'absolute',
    top: -12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002e75',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  rewardTrophyHeaderText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  rewardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  rewardHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#002e75',
    marginBottom: 2,
  },
  rewardHeadingRed: {
    fontSize: 22,
    fontWeight: '900',
    color: '#dc2626',
  },
  rewardSubheading: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 16,
    marginBottom: 6,
  },
  rewardPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  miniProductPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  miniProductPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e',
  },
  coinsStackWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reward3dCoinCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  // Referral Direct Form Card
  referralFormCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  formCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#002e75',
  },
  formCardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 5,
  },
  inputBoxWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  fieldIcon: {
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002e75',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    height: '100%',
  },
  loanChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  loanChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  loanChipSelected: {
    backgroundColor: '#002e75',
    borderColor: '#002e75',
  },
  loanChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#002e75',
  },
  loanChipTextSelected: {
    color: '#ffffff',
  },
  chipRateTag: {
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 5,
  },
  chipRateTagSelected: {
    backgroundColor: '#f59e0b',
  },
  chipRateText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284c7',
  },
  chipRateTextSelected: {
    color: '#78350f',
  },
  submitLeadBtn: {
    backgroundColor: '#002e75',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitLeadBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // Referral Link Card
  referralLinkCard: {
    backgroundColor: '#002e75',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  referralLinkHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  chainIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralLinkTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  linkDisplayWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  linkDisplayText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#002e75',
    marginRight: 8,
  },
  copyButtonTouch: {
    padding: 4,
  },

  // Sharing Buttons
  shareButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  shareWhatsAppBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  shareWhatsAppBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  shareMoreBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
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
  },
  shareMoreBtnText: {
    color: '#002e75',
    fontSize: 13.5,
    fontWeight: '800',
  },

  // Terms Pill Button
  termsPillButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#002e75',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  termsPillButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#002e75',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002e75',
    flex: 1,
    marginRight: 8,
  },
  modalBullet: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 12,
  },
});

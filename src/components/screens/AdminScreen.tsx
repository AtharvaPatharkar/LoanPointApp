import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  LoanApplication,
  ApplicationStatus,
  UserProfile,
  InsuranceApplication,
  InsuranceStatus,
  ReferralLead,
  ReferralStatus,
  DocumentItem,
} from '../../types';
import { loanService } from '../../services/loanService';
import { dbSyncService } from '../../services/dbSyncService';
import { COMPANY_INFO } from '../../data/mockData';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AdminScreenProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  onSwitchToCustomerView?: () => void;
}

const ALL_STATUSES: ApplicationStatus[] = [
  'Application Sent',
  'Enquiry Received',
  'Documents Pending',
  'Application Submitted',
  'Processing',
  'Approved',
  'Disbursed',
  'Rejected',
];

const ALL_INSURANCE_STATUSES: InsuranceStatus[] = [
  'Request Received',
  'Quote Shared',
  'Inspection Scheduled',
  'Documents Verified',
  'Policy Issued',
  'Rejected',
];

const ALL_REFERRAL_STATUSES: ReferralStatus[] = [
  'Referral Submitted',
  'Login / Application',
  'Loan Approval',
  'Disbursed',
  'Rejected',
];

export const AdminScreen: React.FC<AdminScreenProps> = ({
  currentUser,
  onLogout,
  onSwitchToCustomerView,
}) => {
  // Main Module Tabs
  const [activeAdminTab, setActiveAdminTab] = useState<'loans' | 'insurance' | 'referrals' | 'users'>('loans');

  // Datasets
  const [applications, setApplications] = useState<LoanApplication[]>(loanService.getApplications());
  const [insuranceApps, setInsuranceApps] = useState<InsuranceApplication[]>([]);
  const [referralLeads, setReferralLeads] = useState<ReferralLead[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);

  // Filtering & Search
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [selectedInsFilter, setSelectedInsFilter] = useState<string>('All');
  const [selectedRefFilter, setSelectedRefFilter] = useState<string>('All');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(false);

  // Selected User Detail Modal State
  const [detailedUser, setDetailedUser] = useState<UserProfile | null>(null);
  const [activeUserDetailTab, setActiveUserDetailTab] = useState<'overview' | 'loans' | 'documents' | 'referrals'>('overview');

  // Edit User State
  const [isEditingUser, setIsEditingUser] = useState<boolean>(false);
  const [editUserName, setEditUserName] = useState<string>('');
  const [editUserEmail, setEditUserEmail] = useState<string>('');
  const [editUserCity, setEditUserCity] = useState<string>('');
  const [editUserEmployment, setEditUserEmployment] = useState<UserProfile['employmentType']>('Salaried');
  const [editUserIncome, setEditUserIncome] = useState<string>('0');
  const [editUserPan, setEditUserPan] = useState<string>('');
  const [editUserAadhaar, setEditUserAadhaar] = useState<string>('');
  const [editUserKyc, setEditUserKyc] = useState<boolean>(false);
  const [isSavingUserEdit, setIsSavingUserEdit] = useState<boolean>(false);
  const [userEditSuccessMsg, setUserEditSuccessMsg] = useState<string | null>(null);

  // Notification Modal State
  const [notificationTargetUser, setNotificationTargetUser] = useState<UserProfile | null>(null);
  const [notifTitle, setNotifTitle] = useState<string>('Loan Point Update');
  const [notifMessage, setNotifMessage] = useState<string>('');
  const [isSendingNotif, setIsSendingNotif] = useState<boolean>(false);
  const [notifSuccessMsg, setNotifSuccessMsg] = useState<string | null>(null);

  // Status Update Modal State for Loans
  const [editingApp, setEditingApp] = useState<LoanApplication | null>(null);
  const [viewingLoanDetail, setViewingLoanDetail] = useState<LoanApplication | null>(null);
  const [activeLoanDetailTab, setActiveLoanDetailTab] = useState<'loan' | 'user' | 'property_asset' | 'documents'>('loan');
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('Enquiry Received');
  const [adminRemarks, setAdminRemarks] = useState<string>('');
  const [nextActionNote, setNextActionNote] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSavingLoan, setIsSavingLoan] = useState<boolean>(false);

  // Status Update Modal State for Insurance
  const [editingInsApp, setEditingInsApp] = useState<InsuranceApplication | null>(null);
  const [newInsStatus, setNewInsStatus] = useState<string>('Request Received');
  const [adminInsRemarks, setAdminInsRemarks] = useState<string>('');
  const [nextInsActionNote, setNextInsActionNote] = useState<string>('');
  const [insSaveSuccessMsg, setInsSaveSuccessMsg] = useState<string | null>(null);
  const [isSavingIns, setIsSavingIns] = useState<boolean>(false);

  // Status Update Modal State for Referrals
  const [editingRefLead, setEditingRefLead] = useState<ReferralLead | null>(null);
  const [newRefStatus, setNewRefStatus] = useState<string>('Referral Submitted');
  const [adminRefRemarks, setAdminRefRemarks] = useState<string>('');
  const [nextRefActionNote, setNextRefActionNote] = useState<string>('');
  const [refPayoutAmount, setRefPayoutAmount] = useState<string>('0');
  const [refPayoutStatus, setRefPayoutStatus] = useState<string>('Pending');
  const [refSaveSuccessMsg, setRefSaveSuccessMsg] = useState<string | null>(null);
  const [isSavingRef, setIsSavingRef] = useState<boolean>(false);

  // Document Inspection Viewer Modal
  const [viewingDocsUser, setViewingDocsUser] = useState<{
    name: string;
    mobile: string;
    documents: DocumentItem[];
  } | null>(null);
  const [selectedDocPreview, setSelectedDocPreview] = useState<DocumentItem | null>(null);

  // Refresh application list from Neon Postgres DB
  const refreshList = async () => {
    setIsLoadingDb(true);
    try {
      const [dbApps, dbIns, dbRefs, dbUsers] = await Promise.all([
        dbSyncService.getAllApplications(),
        dbSyncService.getAllInsuranceApplications(),
        dbSyncService.getAllReferralLeads(),
        dbSyncService.getAllUsers(),
      ]);

      if (dbApps && dbApps.length > 0) {
        setApplications(dbApps);
      } else {
        setApplications(loanService.getApplications());
      }

      setInsuranceApps(dbIns || []);
      setReferralLeads(dbRefs || []);
      setRegisteredUsers(dbUsers || []);
    } catch {
      setApplications(loanService.getApplications());
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    refreshList();
  }, []);

  // Open edit modal for Loan
  const handleOpenEdit = (app: LoanApplication) => {
    setEditingApp(app);
    setNewStatus(app.status);
    setAdminRemarks(app.remarks || '');
    setNextActionNote(app.nextAction || '');
    setSaveSuccessMsg(null);
  };

  // Open edit modal for Insurance
  const handleOpenInsEdit = (app: InsuranceApplication) => {
    setEditingInsApp(app);
    setNewInsStatus(app.status);
    setAdminInsRemarks(app.remarks || '');
    setNextInsActionNote(app.nextAction || '');
    setInsSaveSuccessMsg(null);
  };

  // Open edit modal for Referral
  const handleOpenRefEdit = (ref: ReferralLead) => {
    setEditingRefLead(ref);
    setNewRefStatus(ref.status);
    setAdminRefRemarks(ref.remarks || '');
    setNextRefActionNote(ref.nextAction || '');
    setRefPayoutAmount(ref.payoutAmount ? ref.payoutAmount.toString() : '0');
    setRefPayoutStatus(ref.payoutStatus || 'Pending');
    setRefSaveSuccessMsg(null);
  };

  // View documents for applicant
  const handleViewApplicantDocs = (applicantName?: string, mobile?: string, appDocs?: DocumentItem[]) => {
    if (appDocs && appDocs.length > 0) {
      setViewingDocsUser({
        name: applicantName || 'Applicant',
        mobile: mobile || 'N/A',
        documents: appDocs,
      });
      return;
    }

    // Try finding matching user by mobile
    if (mobile) {
      const cleanMob = mobile.replace(/\D/g, '').slice(-10);
      const matched = registeredUsers.find((u) => u.mobile.replace(/\D/g, '').slice(-10) === cleanMob);
      if (matched && matched.documents && matched.documents.length > 0) {
        setViewingDocsUser({
          name: matched.name || applicantName || 'Applicant',
          mobile: matched.mobile,
          documents: matched.documents,
        });
        return;
      }
    }

    Alert.alert(
      'No Documents Uploaded',
      `No KYC or income documents have been uploaded yet for ${applicantName || 'this customer'}.`
    );
  };

  // Open detailed user view modal
  const handleOpenUserDetail = (user: UserProfile) => {
    setDetailedUser(user);
    setActiveUserDetailTab('overview');
    setIsEditingUser(false);
    setUserEditSuccessMsg(null);
  };

  // Prepare Edit User form
  const handleStartEditUser = (user: UserProfile) => {
    setEditUserName(user.name || '');
    setEditUserEmail(user.email || '');
    setEditUserCity(user.city || '');
    setEditUserEmployment(user.employmentType || 'Salaried');
    setEditUserIncome(user.monthlyIncome ? user.monthlyIncome.toString() : '0');
    setEditUserPan(user.panNumber || '');
    setEditUserAadhaar(user.aadhaarNumber || '');
    setEditUserKyc(Boolean(user.isKycCompleted));
    setIsEditingUser(true);
    setUserEditSuccessMsg(null);
  };

  // Save Edit User changes
  const handleSaveUserEdit = async () => {
    if (!detailedUser) return;
    setIsSavingUserEdit(true);
    setUserEditSuccessMsg(null);

    try {
      const updates: Partial<UserProfile> = {
        name: editUserName.trim(),
        email: editUserEmail.trim(),
        city: editUserCity.trim(),
        employmentType: editUserEmployment,
        monthlyIncome: parseFloat(editUserIncome) || 0,
        panNumber: editUserPan.trim().toUpperCase(),
        aadhaarNumber: editUserAadhaar.trim(),
        isKycCompleted: editUserKyc,
      };

      const updatedUser = await dbSyncService.adminUpdateUser(detailedUser.id, updates);
      const mergedUser = updatedUser || { ...detailedUser, ...updates };

      setDetailedUser(mergedUser);
      setRegisteredUsers((prev) =>
        prev.map((u) => (u.id === detailedUser.id ? mergedUser : u))
      );
      setUserEditSuccessMsg('User profile updated successfully in database!');
      setIsEditingUser(false);
    } catch {
      Alert.alert('Error', 'Failed to update user profile in database.');
    } finally {
      setIsSavingUserEdit(false);
    }
  };

  // Open send notification modal
  const handleOpenSendNotification = (user: UserProfile) => {
    setNotificationTargetUser(user);
    setNotifTitle('Loan Point Update');
    setNotifMessage(`Hello ${user.name || 'Customer'}, your application is being reviewed by the Loan Point team.`);
    setNotifSuccessMsg(null);
  };

  // Send Push Notification / In-App Message
  const handleSendNotification = async () => {
    if (!notificationTargetUser) return;
    if (!notifMessage.trim()) {
      Alert.alert('Required', 'Please enter a notification message.');
      return;
    }

    setIsSendingNotif(true);
    try {
      // In production, triggers Firebase/APNs or WhatsApp message. Simulated here.
      await new Promise((res) => setTimeout(res, 600));
      setNotifSuccessMsg(`Notification successfully dispatched to +91 ${notificationTargetUser.mobile}!`);
      setTimeout(() => {
        setNotificationTargetUser(null);
        setNotifSuccessMsg(null);
      }, 1500);
    } catch {
      Alert.alert('Error', 'Failed to dispatch notification.');
    } finally {
      setIsSendingNotif(false);
    }
  };

  // Save Loan Status
  const handleSaveStatus = async () => {
    if (!editingApp) return;
    setIsSavingLoan(true);

    try {
      const nowFormatted = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      // Update in-memory loan service
      loanService.updateApplicationStatus(
        editingApp.id,
        newStatus,
        adminRemarks,
        nextActionNote,
        nowFormatted
      );

      // Save directly to Neon Lakebase Postgres
      await dbSyncService.updateApplicationStatus(
        editingApp.id,
        newStatus,
        adminRemarks,
        nextActionNote,
        nowFormatted
      );

      // Also update local state instantly for snappy UI
      setApplications((prev) =>
        prev.map((a) =>
          a.id === editingApp.id
            ? {
                ...a,
                status: newStatus,
                remarks: adminRemarks,
                nextAction: nextActionNote,
                statusUpdatedDate: nowFormatted,
              }
            : a
        )
      );

      setSaveSuccessMsg(`Application ${editingApp.id} updated to "${newStatus}"!`);
      setTimeout(() => {
        setEditingApp(null);
        setSaveSuccessMsg(null);
      }, 700);
    } catch {
      Alert.alert('Error', 'Failed to update application');
    } finally {
      setIsSavingLoan(false);
    }
  };

  // Save Insurance Status
  const handleSaveInsStatus = async () => {
    if (!editingInsApp) return;
    setIsSavingIns(true);

    try {
      const nowIso = new Date().toISOString();
      await dbSyncService.updateInsuranceApplicationStatus(
        editingInsApp.id,
        newInsStatus,
        adminInsRemarks,
        nextInsActionNote,
        nowIso
      );

      setInsuranceApps((prev) =>
        prev.map((ins) =>
          ins.id === editingInsApp.id
            ? {
                ...ins,
                status: newInsStatus as any,
                remarks: adminInsRemarks,
                nextAction: nextInsActionNote,
                statusUpdatedAt: nowIso,
              }
            : ins
        )
      );

      setInsSaveSuccessMsg(`Insurance ${editingInsApp.id} updated to "${newInsStatus}"!`);
      setTimeout(() => {
        setEditingInsApp(null);
        setInsSaveSuccessMsg(null);
      }, 700);
    } catch (err) {
      console.error('Failed to update insurance status:', err);
      Alert.alert('Error', 'Failed to update insurance status');
    } finally {
      setIsSavingIns(false);
    }
  };

  // Save Referral Status
  const handleSaveRefStatus = async () => {
    if (!editingRefLead) return;
    setIsSavingRef(true);

    try {
      const nowIso = new Date().toISOString();
      const numPayout = parseFloat(refPayoutAmount) || 0;
      await dbSyncService.updateReferralLeadStatus(
        editingRefLead.id,
        newRefStatus,
        adminRefRemarks,
        nextRefActionNote,
        numPayout,
        refPayoutStatus,
        nowIso
      );

      setReferralLeads((prev) =>
        prev.map((r) =>
          r.id === editingRefLead.id
            ? {
                ...r,
                status: newRefStatus as any,
                remarks: adminRefRemarks,
                nextAction: nextRefActionNote,
                payoutAmount: numPayout,
                payoutStatus: refPayoutStatus as any,
                statusUpdatedAt: nowIso,
              }
            : r
        )
      );

      setRefSaveSuccessMsg(`Referral ${editingRefLead.id} updated to "${newRefStatus}"!`);
      setTimeout(() => {
        setEditingRefLead(null);
        setRefSaveSuccessMsg(null);
      }, 700);
    } catch (err) {
      console.error('Failed to update referral status:', err);
      Alert.alert('Error', 'Failed to update referral status');
    } finally {
      setIsSavingRef(false);
    }
  };

  // Make direct phone call or WhatsApp to applicant
  const handleCallApplicant = (phone?: string) => {
    const targetPhone = phone || COMPANY_INFO.contactPhoneRaw;
    Linking.openURL(`tel:${targetPhone}`).catch(() => {});
  };

  const handleWhatsAppApplicant = (app: LoanApplication) => {
    const targetPhone = app.applicantMobile || COMPANY_INFO.contactPhoneRaw;
    const msg = encodeURIComponent(
      `Hello, this is Loan Point Admin regarding your ${app.loanTypeName} application (${app.id}). Current status: ${app.status}.`
    );
    Linking.openURL(`https://wa.me/91${targetPhone.replace(/\D/g, '').slice(-10)}?text=${msg}`).catch(() => {});
  };

  // Open Document File URI
  const handleOpenDocFile = (doc: DocumentItem) => {
    if (!doc.fileUri) {
      Alert.alert('File Unavailable', 'Document file link is missing or not provided.');
      return;
    }
    const isImage =
      doc.fileType?.includes('jpg') ||
      doc.fileType?.includes('jpeg') ||
      doc.fileType?.includes('png') ||
      doc.mimeType?.includes('image') ||
      doc.fileUri.startsWith('data:image');

    if (isImage) {
      setSelectedDocPreview(doc);
    } else {
      Linking.openURL(doc.fileUri).catch(() => {
        Alert.alert('Notice', 'Cannot open document preview directly.');
      });
    }
  };

  // Filtered Loans
  const filteredApps = applications.filter((app) => {
    const matchesFilter = selectedFilter === 'All' ? true : app.status === selectedFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      query === '' ||
      app.id.toLowerCase().includes(query) ||
      app.loanTypeName.toLowerCase().includes(query) ||
      (app.applicantName && app.applicantName.toLowerCase().includes(query)) ||
      (app.applicantMobile && app.applicantMobile.includes(query)) ||
      app.requestedAmount.toString().includes(query);

    return matchesFilter && matchesQuery;
  });

  // Filtered Insurance
  const filteredInsuranceApps = insuranceApps.filter((app) => {
    const matchesFilter = selectedInsFilter === 'All' ? true : app.status === selectedInsFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      query === '' ||
      app.id.toLowerCase().includes(query) ||
      (app.insuranceTypeName && app.insuranceTypeName.toLowerCase().includes(query)) ||
      app.insuranceType.toLowerCase().includes(query) ||
      (app.applicantName && app.applicantName.toLowerCase().includes(query)) ||
      (app.mobile && app.mobile.includes(query));

    return matchesFilter && matchesQuery;
  });

  // Filtered Referrals
  const filteredReferralLeads = referralLeads.filter((ref) => {
    const matchesFilter = selectedRefFilter === 'All' ? true : ref.status === selectedRefFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      query === '' ||
      ref.id.toLowerCase().includes(query) ||
      ref.friendName.toLowerCase().includes(query) ||
      ref.friendMobile.includes(query) ||
      ref.loanProduct.toLowerCase().includes(query) ||
      ref.referrerMobile.includes(query);

    return matchesFilter && matchesQuery;
  });

  // Helper functions for user status classification
  const isUserActive = (u: UserProfile) => {
    const cleanMob = u.mobile.replace(/\D/g, '').slice(-10);
    const hasOpenLoan = applications.some((a) => {
      const mob = (a.applicantMobile || '').replace(/\D/g, '').slice(-10);
      return mob === cleanMob && a.status !== 'Disbursed' && a.status !== 'Rejected';
    });
    const hasOpenIns = insuranceApps.some((ins) => {
      const mob = (ins.mobile || '').replace(/\D/g, '').slice(-10);
      return mob === cleanMob && ins.status !== 'Policy Issued' && ins.status !== 'Rejected';
    });
    return hasOpenLoan || hasOpenIns || Boolean(u.isKycCompleted);
  };

  const isUserClosed = (u: UserProfile) => {
    const cleanMob = u.mobile.replace(/\D/g, '').slice(-10);
    const userLoans = applications.filter((a) => (a.applicantMobile || '').replace(/\D/g, '').slice(-10) === cleanMob);
    if (userLoans.length === 0) return !u.isKycCompleted;
    return userLoans.every((a) => a.status === 'Disbursed' || a.status === 'Rejected');
  };

  const isUserNew = (u: UserProfile) => {
    if (u.createdAt) {
      const createdTime = new Date(u.createdAt).getTime();
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return createdTime >= thirtyDaysAgo;
    }
    return false;
  };

  // Filtered & Sorted Users (Newest on top)
  const sortedUsers = [...registeredUsers].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const filteredUsers = sortedUsers.filter((u) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      query === '' ||
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.mobile && u.mobile.includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.city && u.city.toLowerCase().includes(query)) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(query)) ||
      (u.id && u.id.toLowerCase().includes(query));

    let matchesFilter = true;
    if (selectedUserFilter === 'Active') {
      matchesFilter = isUserActive(u);
    } else if (selectedUserFilter === 'New') {
      matchesFilter = isUserNew(u);
    } else if (selectedUserFilter === 'Closed') {
      matchesFilter = isUserClosed(u);
    } else if (selectedUserFilter === 'KYC Verified') {
      matchesFilter = Boolean(u.isKycCompleted);
    } else if (selectedUserFilter === 'KYC Pending') {
      matchesFilter = !u.isKycCompleted;
    }

    return matchesQuery && matchesFilter;
  });

  // User tab specific counters
  const totalUserCount = registeredUsers.length;
  const activeUserCount = registeredUsers.filter(isUserActive).length;
  const newUserCount = registeredUsers.filter((u, index) => isUserNew(u) || index < 5).length;
  const closedUserCount = registeredUsers.filter(isUserClosed).length;

  // Status Badges
  const getStatusBadgeStyle = (status: ApplicationStatus) => {
    switch (status) {
      case 'Approved':
        return { bg: '#ecfdf5', text: '#15803d', border: '#86efac' };
      case 'Disbursed':
        return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
      case 'Processing':
        return { bg: '#eef0fa', text: '#2d3091', border: '#c7d2fe' };
      case 'Rejected':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };
      case 'Application Submitted':
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Documents Pending':
        return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
      case 'Application Sent':
        return { bg: '#fef9c3', text: '#a16207', border: '#fef08a' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  const getInsuranceBadgeStyle = (status: string) => {
    switch (status) {
      case 'Policy Issued':
        return { bg: '#ecfdf5', text: '#15803d', border: '#86efac' };
      case 'Rejected':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' };
      case 'Quote Shared':
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Inspection Scheduled':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
      case 'Documents Verified':
        return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  const getReferralBadgeStyle = (status: string) => {
    switch (status) {
      case 'Disbursed':
        return { bg: '#ecfdf5', text: '#15803d', border: '#86efac' };
      case 'Loan Approval':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
      case 'Login / Application':
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Rejected':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  // Metrics
  const totalVolume = applications.reduce((acc, app) => acc + (app.requestedAmount || 0), 0);
  const approvedCount = applications.filter((a) => a.status === 'Approved' || a.status === 'Disbursed').length;
  const pendingCount = applications.filter(
    (a) => a.status === 'Documents Pending' || a.status === 'Enquiry Received' || a.status === 'Application Sent'
  ).length;

  return (
    <View style={styles.container}>
      {/* Top Admin Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#ffffff" />
            <Text style={styles.adminBadgeText}>ADMIN CONSOLE</Text>
          </View>
          <View style={styles.headerActions}>
            {onSwitchToCustomerView && (
              <TouchableOpacity
                style={styles.switchModeBtn}
                onPress={onSwitchToCustomerView}
                activeOpacity={0.7}
              >
                <Ionicons name="person-outline" size={14} color={colors.primary} />
                <Text style={styles.switchModeText}>Customer View</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={16} color="#ef4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.headerWelcome}>
          Welcome, {currentUser?.name || 'Loan Point Administrator'}
        </Text>
        <Text style={styles.headerSub}>Loan Point Central Management System</Text>

        {/* 4 Segmented Tabs: Loans, Insurance, Referrals, Registered Users */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topTabsContainer}
        >
          {/* 1. Loan Applications */}
          <TouchableOpacity
            style={[styles.topTabBtn, activeAdminTab === 'loans' && styles.topTabBtnActive]}
            onPress={() => setActiveAdminTab('loans')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="cash"
              size={15}
              color={activeAdminTab === 'loans' ? '#003399' : '#ffffff'}
            />
            <Text
              style={[styles.topTabBtnText, activeAdminTab === 'loans' && styles.topTabBtnTextActive]}
              numberOfLines={1}
            >
              Loans ({applications.length})
            </Text>
          </TouchableOpacity>

          {/* 2. Insurance Requests */}
          <TouchableOpacity
            style={[styles.topTabBtn, activeAdminTab === 'insurance' && styles.topTabBtnActive]}
            onPress={() => setActiveAdminTab('insurance')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="shield-checkmark"
              size={15}
              color={activeAdminTab === 'insurance' ? '#003399' : '#ffffff'}
            />
            <Text
              style={[styles.topTabBtnText, activeAdminTab === 'insurance' && styles.topTabBtnTextActive]}
              numberOfLines={1}
            >
              Insurance ({insuranceApps.length})
            </Text>
          </TouchableOpacity>

          {/* 3. Referrals */}
          <TouchableOpacity
            style={[styles.topTabBtn, activeAdminTab === 'referrals' && styles.topTabBtnActive]}
            onPress={() => setActiveAdminTab('referrals')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="gift"
              size={15}
              color={activeAdminTab === 'referrals' ? '#003399' : '#ffffff'}
            />
            <Text
              style={[styles.topTabBtnText, activeAdminTab === 'referrals' && styles.topTabBtnTextActive]}
              numberOfLines={1}
            >
              Referrals ({referralLeads.length})
            </Text>
          </TouchableOpacity>

          {/* 4. Registered Users */}
          <TouchableOpacity
            style={[styles.topTabBtn, activeAdminTab === 'users' && styles.topTabBtnActive]}
            onPress={() => setActiveAdminTab('users')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="people"
              size={15}
              color={activeAdminTab === 'users' ? '#003399' : '#ffffff'}
            />
            <Text
              style={[styles.topTabBtnText, activeAdminTab === 'users' && styles.topTabBtnTextActive]}
              numberOfLines={1}
            >
              Total Users ({registeredUsers.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI / Analytics Cards */}
        {activeAdminTab === 'users' ? (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderLeftColor: '#002e75' }]}>
              <Text style={styles.statLabel}>Total Users</Text>
              <Text style={[styles.statValue, { color: '#002e75' }]}>{totalUserCount}</Text>
              <Text style={styles.statSub}>All Registered</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: colors.success }]}>
              <Text style={styles.statLabel}>Active Users</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>{activeUserCount}</Text>
              <Text style={styles.statSub}>In Loan / KYC</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#0284c7' }]}>
              <Text style={styles.statLabel}>New Registrations</Text>
              <Text style={[styles.statValue, { color: '#0284c7' }]}>{newUserCount}</Text>
              <Text style={styles.statSub}>Recent 30 Days</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#64748b' }]}>
              <Text style={styles.statLabel}>Closed Users</Text>
              <Text style={[styles.statValue, { color: '#64748b' }]}>{closedUserCount}</Text>
              <Text style={styles.statSub}>Disbursed / Inactive</Text>
            </View>
          </View>
        ) : (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
              <Text style={styles.statLabel}>Applications</Text>
              <Text style={styles.statValue}>{applications.length}</Text>
              <Text style={styles.statSub}>₹{(totalVolume / 100000).toFixed(1)}L Total</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: colors.success }]}>
              <Text style={styles.statLabel}>Sanctioned</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>{approvedCount}</Text>
              <Text style={styles.statSub}>Approved/Disbursed</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: colors.secondaryRed }]}>
              <Text style={styles.statLabel}>Action Req.</Text>
              <Text style={[styles.statValue, { color: colors.secondaryRed }]}>{pendingCount}</Text>
              <Text style={styles.statSub}>Pending / Review</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#8b5cf6' }]}>
              <Text style={styles.statLabel}>Registered</Text>
              <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{registeredUsers.length}</Text>
              <Text style={styles.statSub}>Total Users</Text>
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeAdminTab === 'loans'
                ? 'Search by ID, Customer, Loan Type, or Amount...'
                : activeAdminTab === 'insurance'
                ? 'Search by Request ID, Customer, or Insurance Type...'
                : activeAdminTab === 'referrals'
                ? 'Search by Friend, Product, or Mobile...'
                : 'Search registered users by Name, Mobile, City, or Code...'
            }
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters according to active tab */}
        {activeAdminTab === 'loans' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {['All', ...ALL_STATUSES].map((status) => {
              const isActive = selectedFilter === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(status)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {activeAdminTab === 'insurance' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {['All', ...ALL_INSURANCE_STATUSES].map((status) => {
              const isActive = selectedInsFilter === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedInsFilter(status)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {activeAdminTab === 'referrals' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {['All', ...ALL_REFERRAL_STATUSES].map((status) => {
              const isActive = selectedRefFilter === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedRefFilter(status)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {activeAdminTab === 'users' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {['All', 'Active', 'New', 'Closed', 'KYC Verified', 'KYC Pending'].map((cat) => {
              const isActive = selectedUserFilter === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedUserFilter(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Section List Header */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listSectionTitle}>
            {activeAdminTab === 'loans'
              ? `Loan Applications (${filteredApps.length})`
              : activeAdminTab === 'insurance'
              ? `Insurance Requests (${filteredInsuranceApps.length})`
              : activeAdminTab === 'referrals'
              ? `Referral Leads (${filteredReferralLeads.length})`
              : `Registered Customers (${filteredUsers.length})`}
          </Text>
          <TouchableOpacity onPress={refreshList} style={styles.refreshBtn} activeOpacity={0.75}>
            <Ionicons name="reload" size={13} color={colors.primary} />
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- 1. LOANS LIST ---------------- */}
        {activeAdminTab === 'loans' && (
          filteredApps.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="file-tray-outline" size={44} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Loan Applications Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your filter or search query</Text>
            </View>
          ) : (
            filteredApps.map((app) => {
              const badge = getStatusBadgeStyle(app.status);
              return (
                <View key={app.id} style={styles.appCard}>
                  {/* Card Header */}
                  <View style={styles.appCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.appIdRow}>
                        <Text style={styles.appIdText}>{app.id}</Text>
                      </View>
                      <Text style={styles.appLoanType}>{app.loanTypeName}</Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                        {app.status}
                      </Text>
                    </View>
                  </View>

                  {/* Applicant Info & Loan Amount */}
                  <View style={styles.appDetailsRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Requested Amount</Text>
                      <Text style={styles.detailAmount}>
                        ₹{app.requestedAmount.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.detailSub}>{app.tenureMonths} Months Tenure</Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Applicant</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {app.applicantName || 'Customer'}
                      </Text>
                      <Text style={styles.detailSub}>
                        {app.applicantMobile ? `+91 ${app.applicantMobile}` : `Sub: ${app.submissionDate}`}
                      </Text>
                    </View>
                  </View>

                  {/* Remarks & Next Action */}
                  <View style={styles.notesBox}>
                    <Text style={styles.noteTitle}>Next Action:</Text>
                    <Text style={styles.noteText}>{app.nextAction || 'Under Review by Admin'}</Text>
                    {app.remarks && (
                      <Text style={[styles.noteText, { marginTop: 4, color: '#475569' }]}>
                        <Text style={{ fontWeight: '700' }}>Remarks: </Text>
                        {app.remarks}
                      </Text>
                    )}
                  </View>

                  {/* Quick Action Buttons */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => handleCallApplicant(app.applicantMobile)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call-outline" size={13} color="#059669" />
                      <Text style={styles.contactBtnText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => handleWhatsAppApplicant(app)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="logo-whatsapp" size={13} color="#16a34a" />
                      <Text style={styles.contactBtnText}>WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.loanDetailViewBtn}
                      onPress={() => {
                        setViewingLoanDetail(app);
                        setActiveLoanDetailTab('loan');
                      }}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="information-circle-outline" size={14} color="#002e75" />
                      <Text style={styles.loanDetailViewBtnText}>Full Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.viewDocsBtn}
                      onPress={() => handleViewApplicantDocs(app.applicantName, app.applicantMobile, app.documents)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="document-text-outline" size={13} color="#0284c7" />
                      <Text style={styles.viewDocsBtnText}>Docs</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.manageBtn}
                      onPress={() => handleOpenEdit(app)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="create-outline" size={13} color="#ffffff" />
                      <Text style={styles.manageBtnText}>Update</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )
        )}

        {/* ---------------- 2. INSURANCE REQUESTS LIST ---------------- */}
        {activeAdminTab === 'insurance' && (
          filteredInsuranceApps.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="shield-outline" size={44} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Insurance Requests Found</Text>
              <Text style={styles.emptySubtitle}>No requests submitted or matching filter</Text>
            </View>
          ) : (
            filteredInsuranceApps.map((ins) => {
              const badge = getInsuranceBadgeStyle(ins.status);
              return (
                <View key={ins.id} style={styles.appCard}>
                  <View style={styles.appCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.appIdRow}>
                        <Text style={styles.appIdText}>{ins.id}</Text>
                      </View>
                      <Text style={styles.appLoanType}>
                        {ins.insuranceTypeName || ins.insuranceType}
                      </Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                        {ins.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.appDetailsRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Applicant Name</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {ins.applicantName || 'Valued Customer'}
                      </Text>
                      <Text style={styles.detailSub}>Mob: {ins.mobile || 'N/A'}</Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Insurance Category</Text>
                      <Text style={[styles.detailValue, { color: '#003399' }]} numberOfLines={1}>
                        {ins.insuranceType?.toUpperCase()}
                      </Text>
                      <Text style={styles.detailSub}>
                        {ins.createdAt ? new Date(ins.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.notesBox}>
                    <Text style={styles.noteTitle}>Customer Next Action:</Text>
                    <Text style={styles.noteText}>{ins.nextAction || 'Advisor will share quotes shortly'}</Text>
                    {ins.remarks && (
                      <Text style={[styles.noteText, { marginTop: 4, color: '#475569' }]}>
                        <Text style={{ fontWeight: '700' }}>Remarks: </Text>
                        {ins.remarks}
                      </Text>
                    )}
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => handleCallApplicant(ins.mobile)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call-outline" size={14} color="#059669" />
                      <Text style={styles.contactBtnText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => {
                        const cleanMob = ins.mobile ? ins.mobile.replace(/\D/g, '').slice(-10) : '';
                        const msg = encodeURIComponent(
                          `Hello, this is Loan Point Insurance Advisor regarding your enquiry (${ins.id}).`
                        );
                        Linking.openURL(`https://wa.me/91${cleanMob}?text=${msg}`).catch(() => {});
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="logo-whatsapp" size={14} color="#16a34a" />
                      <Text style={styles.contactBtnText}>WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.viewDocsBtn}
                      onPress={() => handleViewApplicantDocs(ins.applicantName, ins.mobile)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="document-text-outline" size={14} color="#0284c7" />
                      <Text style={styles.viewDocsBtnText}>Docs</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.manageBtn}
                      onPress={() => handleOpenInsEdit(ins)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="create-outline" size={15} color="#ffffff" />
                      <Text style={styles.manageBtnText}>Update</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )
        )}

        {/* ---------------- 3. REFERRALS LIST ---------------- */}
        {activeAdminTab === 'referrals' && (
          filteredReferralLeads.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={44} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Referral Leads Found</Text>
              <Text style={styles.emptySubtitle}>No referral entries recorded yet</Text>
            </View>
          ) : (
            filteredReferralLeads.map((ref) => {
              const badge = getReferralBadgeStyle(ref.status);
              return (
                <View key={ref.id} style={styles.appCard}>
                  <View style={styles.appCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.appIdRow}>
                        <Text style={styles.appIdText}>{ref.id}</Text>
                      </View>
                      <Text style={styles.appLoanType}>{ref.friendName}</Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                        {ref.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.appDetailsRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Product & Details</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {ref.loanProduct || 'Loan'}{ref.city ? ` • ${ref.city}` : ''}
                      </Text>
                      <Text style={styles.detailSub}>Friend Mob: {ref.friendMobile}</Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Referrer Mobile / Payout</Text>
                      <Text style={[styles.detailValue, { color: '#059669' }]} numberOfLines={1}>
                        ₹{ref.payoutAmount || 0} ({ref.payoutStatus || 'Pending'})
                      </Text>
                      <Text style={styles.detailSub}>By: {ref.referrerMobile}</Text>
                    </View>
                  </View>

                  {ref.remarks || ref.nextAction ? (
                    <View style={styles.notesBox}>
                      {ref.nextAction ? <Text style={styles.noteText}><Text style={{ fontWeight: '700' }}>Next Action: </Text>{ref.nextAction}</Text> : null}
                      {ref.remarks ? <Text style={[styles.noteText, { marginTop: 2 }]}><Text style={{ fontWeight: '700' }}>Remarks: </Text>{ref.remarks}</Text> : null}
                    </View>
                  ) : null}

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => handleCallApplicant(ref.friendMobile)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call-outline" size={14} color="#059669" />
                      <Text style={styles.contactBtnText}>Call Friend</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.manageBtn}
                      onPress={() => handleOpenRefEdit(ref)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="create-outline" size={15} color="#ffffff" />
                      <Text style={styles.manageBtnText}>Update Lead</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )
        )}

        {/* ---------------- 4. REGISTERED CUSTOMERS LIST ---------------- */}
        {activeAdminTab === 'users' && (
          filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={44} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Registered Users Found</Text>
              <Text style={styles.emptySubtitle}>Adjust your filter or search query</Text>
            </View>
          ) : (
            filteredUsers.map((u) => {
              const docCount = u.documents?.length || 0;
              const formattedDate = u.createdAt
                ? new Date(u.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : u.memberSince || 'Registered';

              return (
                <TouchableOpacity
                  key={u.id}
                  style={styles.appCard}
                  onPress={() => handleOpenUserDetail(u)}
                  activeOpacity={0.9}
                >
                  <View style={styles.appCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text style={styles.userCardName}>{u.name || 'Valued Customer'}</Text>
                        <Text style={styles.userRegistrationDateBadge}>• {formattedDate}</Text>
                      </View>
                      <Text style={styles.userCardMobile}>+91 {u.mobile} • ID: {u.id}</Text>
                    </View>
                    <View
                      style={[
                        styles.kycStatusBadge,
                        {
                          backgroundColor: u.isKycCompleted ? '#ecfdf5' : '#fef3c7',
                          borderColor: u.isKycCompleted ? '#86efac' : '#fde68a',
                        },
                      ]}
                    >
                      <Ionicons
                        name={u.isKycCompleted ? 'checkmark-circle' : 'time'}
                        size={12}
                        color={u.isKycCompleted ? '#15803d' : '#b45309'}
                      />
                      <Text
                        style={[
                          styles.kycStatusText,
                          { color: u.isKycCompleted ? '#15803d' : '#b45309' },
                        ]}
                      >
                        {u.isKycCompleted ? 'KYC Verified' : 'KYC Pending'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.appDetailsRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Email / City</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {u.email || 'N/A'}
                      </Text>
                      <Text style={styles.detailSub}>{u.city || 'Not specified'}</Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Income / Ref Code</Text>
                      <Text style={styles.detailValue}>
                        {u.monthlyIncome ? `₹${u.monthlyIncome.toLocaleString('en-IN')}/m` : 'Not stated'}
                      </Text>
                      <Text style={styles.detailSub}>Ref: {u.referralCode || 'N/A'}</Text>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleCallApplicant(u.mobile);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call-outline" size={14} color="#059669" />
                      <Text style={styles.contactBtnText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        const cleanMob = u.mobile.replace(/\D/g, '').slice(-10);
                        const msg = encodeURIComponent(`Hello ${u.name || 'Customer'}, this is Loan Point Admin.`);
                        Linking.openURL(`https://wa.me/91${cleanMob}?text=${msg}`).catch(() => {});
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="logo-whatsapp" size={14} color="#16a34a" />
                      <Text style={styles.contactBtnText}>WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.manageBtn, { backgroundColor: '#002e75' }]}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleOpenUserDetail(u);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="person" size={14} color="#ffffff" />
                      <Text style={styles.manageBtnText}>View Profile</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )
        )}
      </ScrollView>

      {/* ---------------- LOAN STATUS UPDATE MODAL ---------------- */}
      {editingApp && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditingApp(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Update Loan Status</Text>
                  <Text style={styles.modalSub}>{editingApp.id} • {editingApp.loanTypeName}</Text>
                </View>
                <TouchableOpacity onPress={() => setEditingApp(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              {saveSuccessMsg && (
                <View style={styles.modalSuccessBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#15803d" />
                  <Text style={styles.modalSuccessText}>{saveSuccessMsg}</Text>
                </View>
              )}

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputGroupLabel}>Select Next Stage / Status:</Text>
                <View style={styles.statusGrid}>
                  {ALL_STATUSES.map((st) => {
                    const isSelected = newStatus === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[styles.statusOptionPill, isSelected && styles.statusOptionPillActive]}
                        onPress={() => setNewStatus(st)}
                        activeOpacity={0.7}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={13} color="#ffffff" style={{ marginRight: 4 }} />
                        )}
                        <Text style={[styles.statusOptionText, isSelected && styles.statusOptionTextActive]}>
                          {st}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.inputGroupLabel}>Customer Next Action Instruction:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nextActionNote}
                  onChangeText={setNextActionNote}
                  placeholder="e.g. Bank technical inspection scheduled for Friday..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={2}
                />

                <Text style={styles.inputGroupLabel}>Admin Remarks / Underwriting Notes:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={adminRemarks}
                  onChangeText={setAdminRemarks}
                  placeholder="e.g. Sanctioned at 10.75% p.a. Awaiting NACH mandate sign-off."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={2}
                />
              </ScrollView>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditingApp(null)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSaveBtn, isSavingLoan && { opacity: 0.8 }]}
                  onPress={handleSaveStatus}
                  disabled={isSavingLoan}
                  activeOpacity={0.85}
                >
                  {isSavingLoan ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={16} color="#ffffff" />
                      <Text style={styles.modalSaveText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ---------------- COMPREHENSIVE LOAN & USER PROFILE DETAILS MODAL ---------------- */}
      {viewingLoanDetail && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setViewingLoanDetail(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '92%', height: '92%' }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={styles.loanDetailTypeIcon}>
                      <Ionicons name="document-text" size={16} color="#002e75" />
                    </View>
                    <Text style={styles.modalTitle} numberOfLines={1}>
                      {viewingLoanDetail.loanTypeName}
                    </Text>
                  </View>
                  <Text style={styles.modalSub} numberOfLines={1}>
                    ID: {viewingLoanDetail.id} • {viewingLoanDetail.applicantName || 'Applicant'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setViewingLoanDetail(null)}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Segmented Detail Tabs */}
              <View style={styles.modalSubTabsRow}>
                <TouchableOpacity
                  style={[styles.modalSubTabBtn, activeLoanDetailTab === 'loan' && styles.modalSubTabBtnActive]}
                  onPress={() => setActiveLoanDetailTab('loan')}
                >
                  <Ionicons name="cash-outline" size={13} color={activeLoanDetailTab === 'loan' ? '#002e75' : '#64748b'} />
                  <Text style={[styles.modalSubTabText, activeLoanDetailTab === 'loan' && styles.modalSubTabTextActive]}>
                    Loan Summary
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubTabBtn, activeLoanDetailTab === 'user' && styles.modalSubTabBtnActive]}
                  onPress={() => setActiveLoanDetailTab('user')}
                >
                  <Ionicons name="person-outline" size={13} color={activeLoanDetailTab === 'user' ? '#002e75' : '#64748b'} />
                  <Text style={[styles.modalSubTabText, activeLoanDetailTab === 'user' && styles.modalSubTabTextActive]}>
                    User Profile ({viewingLoanDetail.applicantProfile ? 'Live DB' : 'Basic'})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubTabBtn, activeLoanDetailTab === 'property_asset' && styles.modalSubTabBtnActive]}
                  onPress={() => setActiveLoanDetailTab('property_asset')}
                >
                  <Ionicons name="layers-outline" size={13} color={activeLoanDetailTab === 'property_asset' ? '#002e75' : '#64748b'} />
                  <Text style={[styles.modalSubTabText, activeLoanDetailTab === 'property_asset' && styles.modalSubTabTextActive]}>
                    Asset / Collateral
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubTabBtn, activeLoanDetailTab === 'documents' && styles.modalSubTabBtnActive]}
                  onPress={() => setActiveLoanDetailTab('documents')}
                >
                  <Ionicons name="folder-open-outline" size={13} color={activeLoanDetailTab === 'documents' ? '#002e75' : '#64748b'} />
                  <Text style={[styles.modalSubTabText, activeLoanDetailTab === 'documents' && styles.modalSubTabTextActive]}>
                    Docs ({viewingLoanDetail.documents?.length || 0})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Scrollable Content Body */}
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingVertical: 10 }}>
                {/* 1. LOAN APPLICATION TAB */}
                {activeLoanDetailTab === 'loan' && (
                  <View style={{ gap: 10 }}>
                    <View style={styles.detailSectionBox}>
                      <Text style={styles.detailSectionHeader}>Application Details</Text>
                      <View style={styles.detailGridTwoCol}>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Requested Amount</Text>
                          <Text style={styles.detailGridFieldValueHighlight}>
                            ₹{viewingLoanDetail.requestedAmount?.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Tenure</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.tenureMonths} Months
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Application Status</Text>
                          <View style={{ alignSelf: 'flex-start', marginTop: 3 }}>
                            <View style={[styles.statusBadge, {
                              backgroundColor: getStatusBadgeStyle(viewingLoanDetail.status).bg,
                              borderColor: getStatusBadgeStyle(viewingLoanDetail.status).border,
                            }]}>
                              <Text style={[styles.statusBadgeText, { color: getStatusBadgeStyle(viewingLoanDetail.status).text }]}>
                                {viewingLoanDetail.status}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Submission Date</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.submissionDate || 'Recently'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Assigned Bank</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.bankName || 'State Bank of India'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Last Status Update</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.statusUpdatedDate || 'Recently'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Next Action & Admin Notes Box */}
                    <View style={styles.detailSectionBox}>
                      <Text style={styles.detailSectionHeader}>Underwriting & Next Steps</Text>
                      <View style={{ gap: 6 }}>
                        <Text style={styles.detailGridFieldLabel}>Customer Next Action Instruction:</Text>
                        <Text style={styles.detailBoxNoteText}>
                          {viewingLoanDetail.nextAction || 'Under Review by Admin Team'}
                        </Text>
                        <Text style={[styles.detailGridFieldLabel, { marginTop: 4 }]}>Admin Remarks:</Text>
                        <Text style={styles.detailBoxNoteText}>
                          {viewingLoanDetail.remarks || 'No specific underwriting remarks recorded.'}
                        </Text>
                      </View>
                    </View>

                    {/* Quick Call / WhatsApp / Update Action Banner */}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      <TouchableOpacity
                        style={[styles.contactBtn, { flex: 1, justifyContent: 'center' }]}
                        onPress={() => handleCallApplicant(viewingLoanDetail.applicantMobile)}
                      >
                        <Ionicons name="call" size={14} color="#059669" />
                        <Text style={styles.contactBtnText}>Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.contactBtn, { flex: 1, justifyContent: 'center' }]}
                        onPress={() => handleWhatsAppApplicant(viewingLoanDetail)}
                      >
                        <Ionicons name="logo-whatsapp" size={14} color="#16a34a" />
                        <Text style={styles.contactBtnText}>WhatsApp</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.manageBtn, { flex: 1 }]}
                        onPress={() => {
                          const appToEdit = viewingLoanDetail;
                          setViewingLoanDetail(null);
                          handleOpenEdit(appToEdit);
                        }}
                      >
                        <Ionicons name="create" size={14} color="#ffffff" />
                        <Text style={styles.manageBtnText}>Update</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* 2. USER PROFILE TAB (FROM DATABASE USERS TABLE) */}
                {activeLoanDetailTab === 'user' && (
                  <View style={{ gap: 10 }}>
                    {/* Basic Identity & Contact */}
                    <View style={styles.detailSectionBox}>
                      <Text style={styles.detailSectionHeader}>Personal & Identity (Users DB)</Text>
                      <View style={styles.detailGridTwoCol}>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Full Name</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.name || viewingLoanDetail.applicantName || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Mobile Number</Text>
                          <Text style={styles.detailGridFieldValueHighlight}>
                            +91 {viewingLoanDetail.applicantProfile?.mobile || viewingLoanDetail.applicantMobile || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Email Address</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.email || 'Not Provided'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>City / Location</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.city || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Date of Birth (DOB)</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.dob || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>KYC Status</Text>
                          <Text style={[styles.detailGridFieldValue, { color: viewingLoanDetail.applicantProfile?.isKycCompleted ? '#16a34a' : '#d97706', fontWeight: '800' }]}>
                            {viewingLoanDetail.applicantProfile?.isKycCompleted ? '✓ KYC Completed' : 'Pending Verification'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>PAN Number</Text>
                          <Text style={[styles.detailGridFieldValue, { letterSpacing: 1 }]}>
                            {viewingLoanDetail.applicantProfile?.panNumber || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Aadhaar Number</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.aadhaarNumber
                              ? `XXXX-XXXX-${viewingLoanDetail.applicantProfile.aadhaarNumber.slice(-4)}`
                              : viewingLoanDetail.applicantProfile?.aadhaarLastFour
                              ? `XXXX-XXXX-${viewingLoanDetail.applicantProfile.aadhaarLastFour}`
                              : '—'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Employment & Financials */}
                    <View style={styles.detailSectionBox}>
                      <Text style={styles.detailSectionHeader}>Employment & Income Profile</Text>
                      <View style={styles.detailGridTwoCol}>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Employment Type</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.employmentType || 'Salaried'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Monthly Income</Text>
                          <Text style={styles.detailGridFieldValueHighlight}>
                            {viewingLoanDetail.applicantProfile?.monthlyIncome
                              ? `₹${Number(viewingLoanDetail.applicantProfile.monthlyIncome).toLocaleString('en-IN')}`
                              : '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Company / Employer</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.companyName || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Work Experience</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.workExperience || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Salary Bank</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.salaryBank || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>CIBIL Score Band</Text>
                          <Text style={[styles.detailGridFieldValue, { color: '#0284c7' }]}>
                            {viewingLoanDetail.applicantProfile?.cibilScoreRange || '750+ (Good)'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Credit Card Holder</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.hasCreditCard || 'No'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Existing Total EMIs</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.existingEmi ? `₹${viewingLoanDetail.applicantProfile.existingEmi}` : 'None reported'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Referral Tracking */}
                    <View style={styles.detailSectionBox}>
                      <Text style={styles.detailSectionHeader}>Referral & Network Attribution</Text>
                      <View style={styles.detailGridTwoCol}>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>User's Referral Code</Text>
                          <Text style={[styles.detailGridFieldValueHighlight, { color: '#78350f' }]}>
                            {viewingLoanDetail.applicantProfile?.referralCode || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Referred By Code</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.referredBy || 'Organic (Direct Sign-up)'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* 3. ASSET / COLLATERAL / PRODUCT SPECIFIC TAB */}
                {activeLoanDetailTab === 'property_asset' && (
                  <View style={{ gap: 10 }}>
                    {/* Business Profile */}
                    <View style={styles.detailSectionBox}>
                      <Text style={styles.detailSectionHeader}>Business / MSME Profile</Text>
                      <View style={styles.detailGridTwoCol}>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Business Constitution</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.businessConstitution || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Annual Turnover</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.annualTurnover ? `₹${viewingLoanDetail.applicantProfile.annualTurnover}` : '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>GST Registered</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.isGstRegistered || 'No'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>GSTIN</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.gstin || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Udyam Number</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.udyamRegNumber || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Business Vintage</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.businessVintage || '—'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Property / LAP Profile */}
                    <View style={styles.detailSectionBox}>
                      <Text style={styles.detailSectionHeader}>Property / Real Estate Collateral</Text>
                      <View style={styles.detailGridTwoCol}>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Property Type</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.propertyType || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Estimated Valuation</Text>
                          <Text style={styles.detailGridFieldValueHighlight}>
                            {viewingLoanDetail.applicantProfile?.marketValuation || viewingLoanDetail.applicantProfile?.estPropertyValue ? `₹${viewingLoanDetail.applicantProfile.marketValuation || viewingLoanDetail.applicantProfile.estPropertyValue}` : '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Property Location</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.propertyLocation || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Existing Loan on Property</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.hasExistingLoanOnProperty || 'No'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Vehicle / Car Loan Profile */}
                    <View style={styles.detailSectionBox}>
                      <Text style={styles.detailSectionHeader}>Vehicle / Car Loan Profile</Text>
                      <View style={styles.detailGridTwoCol}>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Make & Model</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.carMakeModel || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Condition</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.carCondition || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>On-Road Price</Text>
                          <Text style={styles.detailGridFieldValueHighlight}>
                            {viewingLoanDetail.applicantProfile?.carOnRoadPrice ? `₹${viewingLoanDetail.applicantProfile.carOnRoadPrice}` : '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Down Payment</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.carDownPayment ? `₹${viewingLoanDetail.applicantProfile.carDownPayment}` : '—'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Agriculture & Education Profile */}
                    <View style={styles.detailSectionBox}>
                      <Text style={styles.detailSectionHeader}>Agriculture & Education Extra Data</Text>
                      <View style={styles.detailGridTwoCol}>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Agri Land (Acres)</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.landHoldingAcres || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>KCC Card Holder</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.hasKccCard || 'No'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Education Destination</Text>
                          <Text style={styles.detailGridFieldValue}>
                            {viewingLoanDetail.applicantProfile?.studyDestination || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailGridField}>
                          <Text style={styles.detailGridFieldLabel}>Total Course Cost</Text>
                          <Text style={styles.detailGridFieldValueHighlight}>
                            {viewingLoanDetail.applicantProfile?.totalCourseCost ? `₹${viewingLoanDetail.applicantProfile.totalCourseCost}` : '—'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* 4. DOCUMENTS TAB */}
                {activeLoanDetailTab === 'documents' && (
                  <View style={{ gap: 10 }}>
                    <View style={styles.detailSectionBox}>
                      <Text style={styles.detailSectionHeader}>Applicant Uploaded Documents</Text>
                      {(!viewingLoanDetail.documents || viewingLoanDetail.documents.length === 0) ? (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                          <Ionicons name="folder-open-outline" size={36} color="#94a3b8" />
                          <Text style={{ fontSize: 13, color: '#64748b', marginTop: 6, fontWeight: '600' }}>
                            No documents attached to this profile or application.
                          </Text>
                        </View>
                      ) : (
                        <View style={{ gap: 8, marginTop: 4 }}>
                          {viewingLoanDetail.documents.map((doc, idx) => (
                            <TouchableOpacity
                              key={doc.id || idx}
                              style={styles.docViewerRow}
                              onPress={() => handleOpenDocFile(doc)}
                              activeOpacity={0.75}
                            >
                              <View style={styles.docViewerIconBadge}>
                                <Ionicons name="document-text" size={18} color="#002e75" />
                              </View>
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={styles.docViewerTitle} numberOfLines={1}>
                                  {doc.name || `Document #${idx + 1}`}
                                </Text>
                                <Text style={styles.docViewerSub}>
                                  {doc.uploadDate || 'Uploaded'} • {doc.status || 'Submitted'}
                                </Text>
                              </View>
                              <Ionicons name="eye-outline" size={20} color="#0284c7" />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Modal Footer Close Button */}
              <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: '#e2e8f0' }}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { width: '100%' }]}
                  onPress={() => setViewingLoanDetail(null)}
                >
                  <Text style={styles.modalCancelText}>Close Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ---------------- INSURANCE STATUS UPDATE MODAL ---------------- */}
      {editingInsApp && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditingInsApp(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Update Insurance Request</Text>
                  <Text style={styles.modalSub}>
                    {editingInsApp.id} • {editingInsApp.insuranceTypeName || editingInsApp.insuranceType}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setEditingInsApp(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              {insSaveSuccessMsg && (
                <View style={styles.modalSuccessBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#15803d" />
                  <Text style={styles.modalSuccessText}>{insSaveSuccessMsg}</Text>
                </View>
              )}

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputGroupLabel}>Select Status:</Text>
                <View style={styles.statusGrid}>
                  {ALL_INSURANCE_STATUSES.map((st) => {
                    const isSelected = newInsStatus === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[styles.statusOptionPill, isSelected && styles.statusOptionPillActive]}
                        onPress={() => setNewInsStatus(st)}
                        activeOpacity={0.7}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={13} color="#ffffff" style={{ marginRight: 4 }} />
                        )}
                        <Text style={[styles.statusOptionText, isSelected && styles.statusOptionTextActive]}>
                          {st}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.inputGroupLabel}>Customer Next Action Instruction:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nextInsActionNote}
                  onChangeText={setNextInsActionNote}
                  placeholder="e.g. Policy quote comparison sent via WhatsApp..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={2}
                />

                <Text style={styles.inputGroupLabel}>Admin Remarks / Notes:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={adminInsRemarks}
                  onChangeText={setAdminInsRemarks}
                  placeholder="e.g. Verified previous policy NCB 20%. Quote shared."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={2}
                />
              </ScrollView>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditingInsApp(null)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSaveBtn, isSavingIns && { opacity: 0.8 }]}
                  onPress={handleSaveInsStatus}
                  disabled={isSavingIns}
                  activeOpacity={0.85}
                >
                  {isSavingIns ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={16} color="#ffffff" />
                      <Text style={styles.modalSaveText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ---------------- REFERRAL STATUS UPDATE MODAL ---------------- */}
      {editingRefLead && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditingRefLead(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Update Referral Lead</Text>
                  <Text style={styles.modalSub}>{editingRefLead.id} • {editingRefLead.friendName}</Text>
                </View>
                <TouchableOpacity onPress={() => setEditingRefLead(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              {refSaveSuccessMsg && (
                <View style={styles.modalSuccessBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#15803d" />
                  <Text style={styles.modalSuccessText}>{refSaveSuccessMsg}</Text>
                </View>
              )}

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputGroupLabel}>Select Status:</Text>
                <View style={styles.statusGrid}>
                  {ALL_REFERRAL_STATUSES.map((st) => {
                    const isSelected = newRefStatus === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[styles.statusOptionPill, isSelected && styles.statusOptionPillActive]}
                        onPress={() => setNewRefStatus(st)}
                        activeOpacity={0.7}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={13} color="#ffffff" style={{ marginRight: 4 }} />
                        )}
                        <Text style={[styles.statusOptionText, isSelected && styles.statusOptionTextActive]}>
                          {st}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.inputGroupLabel}>Commission / Payout Amount (₹):</Text>
                <TextInput
                  style={styles.modalInput}
                  value={refPayoutAmount}
                  onChangeText={setRefPayoutAmount}
                  placeholder="e.g. 5000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />

                <Text style={styles.inputGroupLabel}>Payout Status:</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  {['Pending', 'Approved', 'Paid'].map((ps) => {
                    const isSelected = refPayoutStatus === ps;
                    return (
                      <TouchableOpacity
                        key={ps}
                        style={[styles.statusOptionPill, isSelected && styles.statusOptionPillActive]}
                        onPress={() => setRefPayoutStatus(ps)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.statusOptionText, isSelected && styles.statusOptionTextActive]}>
                          {ps}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.inputGroupLabel}>Next Action Instruction:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nextRefActionNote}
                  onChangeText={setNextRefActionNote}
                  placeholder="e.g. Loan file logged with bank. Payout on disbursement."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={2}
                />

                <Text style={styles.inputGroupLabel}>Admin Remarks:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={adminRefRemarks}
                  onChangeText={setAdminRefRemarks}
                  placeholder="Internal audit notes..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={2}
                />
              </ScrollView>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditingRefLead(null)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSaveBtn, isSavingRef && { opacity: 0.8 }]}
                  onPress={handleSaveRefStatus}
                  disabled={isSavingRef}
                  activeOpacity={0.85}
                >
                  {isSavingRef ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={16} color="#ffffff" />
                      <Text style={styles.modalSaveText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ---------------- DOCUMENT VIEWER MODAL ---------------- */}
      {viewingDocsUser && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setViewingDocsUser(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '85%' }]}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Applicant Uploaded Documents</Text>
                  <Text style={styles.modalSub}>
                    {viewingDocsUser.name} • {viewingDocsUser.mobile}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setViewingDocsUser(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {viewingDocsUser.documents.map((doc, idx) => (
                  <View key={doc.id || idx} style={styles.docItemCard}>
                    <View style={styles.docItemIconWrap}>
                      <Ionicons
                        name={
                          doc.fileType?.includes('pdf') || doc.mimeType?.includes('pdf')
                            ? 'document-text'
                            : 'image'
                        }
                        size={22}
                        color={doc.fileType?.includes('pdf') ? '#ef4444' : '#0284c7'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docItemTitle} numberOfLines={1}>
                        {doc.name || 'Document'}
                      </Text>
                      <Text style={styles.docItemSub}>
                        {doc.category || 'KYC'} • {doc.uploadDate || 'Uploaded'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.docItemOpenBtn}
                      onPress={() => handleOpenDocFile(doc)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="eye" size={14} color="#ffffff" />
                      <Text style={styles.docItemOpenBtnText}>View</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ---------------- IMAGE PREVIEW FULL MODAL ---------------- */}
      {selectedDocPreview && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedDocPreview(null)}
        >
          <View style={styles.imageModalOverlay}>
            <View style={styles.imageModalHeader}>
              <Text style={styles.imageModalTitle} numberOfLines={1}>
                {selectedDocPreview.name}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDocPreview(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={26} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.imageModalBody}>
              {selectedDocPreview.fileUri ? (
                <Image
                  source={{ uri: selectedDocPreview.fileUri }}
                  style={styles.fullPreviewImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ color: '#ffffff' }}>No image data found</Text>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* ---------------- COMPREHENSIVE USER DETAIL MODAL ---------------- */}
      {detailedUser && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setDetailedUser(null);
            setIsEditingUser(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '92%', height: '92%' }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.userAvatarWrap}>
                    <Text style={styles.userAvatarText}>
                      {(detailedUser.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle} numberOfLines={1}>
                      {detailedUser.name || 'Valued Customer'}
                    </Text>
                    <Text style={styles.modalSub}>
                      ID: {detailedUser.id} • +91 {detailedUser.mobile}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setDetailedUser(null);
                    setIsEditingUser(false);
                  }}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              {userEditSuccessMsg && (
                <View style={styles.modalSuccessBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#15803d" />
                  <Text style={styles.modalSuccessText}>{userEditSuccessMsg}</Text>
                </View>
              )}

              {/* Action Toolbar */}
              <View style={styles.detailActionToolbar}>
                <TouchableOpacity
                  style={[styles.quickActionPill, { backgroundColor: '#ecfdf5', borderColor: '#86efac' }]}
                  onPress={() => handleCallApplicant(detailedUser.mobile)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={13} color="#059669" />
                  <Text style={[styles.quickActionText, { color: '#059669' }]}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickActionPill, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
                  onPress={() => {
                    const cleanMob = detailedUser.mobile.replace(/\D/g, '').slice(-10);
                    const msg = encodeURIComponent(`Hello ${detailedUser.name || 'Customer'}, this is Loan Point Admin regarding your profile.`);
                    Linking.openURL(`https://wa.me/91${cleanMob}?text=${msg}`).catch(() => {});
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-whatsapp" size={13} color="#16a34a" />
                  <Text style={[styles.quickActionText, { color: '#16a34a' }]}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickActionPill, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
                  onPress={() => handleOpenSendNotification(detailedUser)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="notifications" size={13} color="#2563eb" />
                  <Text style={[styles.quickActionText, { color: '#2563eb' }]}>Notify</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickActionPill, { backgroundColor: isEditingUser ? '#fef3c7' : '#f8fafc', borderColor: '#cbd5e1' }]}
                  onPress={() => (isEditingUser ? setIsEditingUser(false) : handleStartEditUser(detailedUser))}
                  activeOpacity={0.7}
                >
                  <Ionicons name={isEditingUser ? 'eye-outline' : 'create-outline'} size={13} color="#334155" />
                  <Text style={[styles.quickActionText, { color: '#334155' }]}>{isEditingUser ? 'View' : 'Edit'}</Text>
                </TouchableOpacity>
              </View>

              {/* Internal Tabs */}
              {!isEditingUser && (
                <View style={styles.userDetailTabsBar}>
                  {(
                    [
                      { key: 'overview', label: 'Overview', icon: 'person-outline' },
                      { key: 'loans', label: `Loans (${applications.filter((a) => (a.applicantMobile || '').replace(/\D/g, '').slice(-10) === detailedUser.mobile.replace(/\D/g, '').slice(-10)).length})`, icon: 'cash-outline' },
                      { key: 'documents', label: `Docs (${detailedUser.documents?.length || 0})`, icon: 'document-text-outline' },
                      { key: 'referrals', label: `Referrals (${referralLeads.filter((r) => r.referrerMobile.replace(/\D/g, '').slice(-10) === detailedUser.mobile.replace(/\D/g, '').slice(-10)).length})`, icon: 'gift-outline' },
                    ] as const
                  ).map((tab) => {
                    const isActive = activeUserDetailTab === tab.key;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        style={[styles.userDetailTabBtn, isActive && styles.userDetailTabBtnActive]}
                        onPress={() => setActiveUserDetailTab(tab.key)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name={tab.icon as any} size={13} color={isActive ? '#003399' : '#64748b'} />
                        <Text style={[styles.userDetailTabText, isActive && styles.userDetailTabTextActive]}>
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Modal Content Scroll Area */}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                {isEditingUser ? (
                  /* Edit User Form */
                  <View style={{ marginTop: 6 }}>
                    <Text style={[styles.inputGroupLabel, { marginTop: 0 }]}>Full Legal Name:</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editUserName}
                      onChangeText={setEditUserName}
                      placeholder="Customer Full Name"
                    />

                    <Text style={styles.inputGroupLabel}>Email Address:</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editUserEmail}
                      onChangeText={setEditUserEmail}
                      placeholder="e.g. name@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <Text style={styles.inputGroupLabel}>City / Location:</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editUserCity}
                      onChangeText={setEditUserCity}
                      placeholder="e.g. City Name"
                    />

                    <Text style={styles.inputGroupLabel}>Employment Type:</Text>
                    <View style={styles.statusGrid}>
                      {(['Salaried', 'Self Employed', 'Business Owner', 'Agriculturist', 'Others'] as const).map((emp) => {
                        const isSelected = editUserEmployment === emp;
                        return (
                          <TouchableOpacity
                            key={emp}
                            style={[styles.statusOptionPill, isSelected && styles.statusOptionPillActive]}
                            onPress={() => setEditUserEmployment(emp)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.statusOptionText, isSelected && styles.statusOptionTextActive]}>
                              {emp}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.inputGroupLabel}>Monthly Net Income (₹):</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editUserIncome}
                      onChangeText={setEditUserIncome}
                      placeholder="Monthly Income"
                      keyboardType="numeric"
                    />

                    <Text style={styles.inputGroupLabel}>PAN Card Number:</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editUserPan}
                      onChangeText={setEditUserPan}
                      placeholder="ABCDE1234F"
                      autoCapitalize="characters"
                      maxLength={10}
                    />

                    <Text style={styles.inputGroupLabel}>Aadhaar Card Number:</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editUserAadhaar}
                      onChangeText={setEditUserAadhaar}
                      placeholder="12-digit Aadhaar Number"
                      keyboardType="numeric"
                      maxLength={14}
                    />

                    <Text style={styles.inputGroupLabel}>KYC Verification Status:</Text>
                    <TouchableOpacity
                      style={[
                        styles.kycToggleBtn,
                        { backgroundColor: editUserKyc ? '#ecfdf5' : '#fef2f2', borderColor: editUserKyc ? '#86efac' : '#fecaca' },
                      ]}
                      onPress={() => setEditUserKyc(!editUserKyc)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={editUserKyc ? 'checkmark-circle' : 'close-circle'}
                        size={18}
                        color={editUserKyc ? '#15803d' : '#dc2626'}
                      />
                      <Text style={[styles.kycToggleText, { color: editUserKyc ? '#15803d' : '#dc2626' }]}>
                        {editUserKyc ? 'KYC Complete (Verified)' : 'KYC Incomplete (Pending)'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.modalBtnRow}>
                      <TouchableOpacity
                        style={styles.modalCancelBtn}
                        onPress={() => setIsEditingUser(false)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.modalCancelText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.modalSaveBtn}
                        onPress={handleSaveUserEdit}
                        disabled={isSavingUserEdit}
                        activeOpacity={0.8}
                      >
                        {isSavingUserEdit ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                            <Text style={styles.modalSaveText}>Update Database</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : activeUserDetailTab === 'overview' ? (
                  /* Overview Tab */
                  <View style={{ gap: 12, marginTop: 8 }}>
                    {/* Status Highlights */}
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardHeader}>Account & KYC Status</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Customer ID</Text>
                        <Text style={styles.detailHighlightValue}>{detailedUser.id}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Registration Date</Text>
                        <Text style={styles.detailDataValue}>
                          {detailedUser.createdAt
                            ? new Date(detailedUser.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : detailedUser.memberSince || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>KYC Status</Text>
                        <View
                          style={[
                            styles.kycStatusBadge,
                            {
                              backgroundColor: detailedUser.isKycCompleted ? '#ecfdf5' : '#fef3c7',
                              borderColor: detailedUser.isKycCompleted ? '#86efac' : '#fde68a',
                            },
                          ]}
                        >
                          <Ionicons
                            name={detailedUser.isKycCompleted ? 'checkmark-circle' : 'time'}
                            size={12}
                            color={detailedUser.isKycCompleted ? '#15803d' : '#b45309'}
                          />
                          <Text
                            style={[
                              styles.kycStatusText,
                              { color: detailedUser.isKycCompleted ? '#15803d' : '#b45309' },
                            ]}
                          >
                            {detailedUser.isKycCompleted ? 'KYC Verified' : 'KYC Pending'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>CIBIL Estimate</Text>
                        <Text style={[styles.detailDataValue, { color: '#059669', fontWeight: '800' }]}>
                          {detailedUser.cibilEstimateScore || 740} (Good)
                        </Text>
                      </View>
                    </View>

                    {/* Personal Information */}
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardHeader}>Personal & Contact Details</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Full Name</Text>
                        <Text style={styles.detailDataValue}>{detailedUser.name || 'Valued Customer'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Mobile Number</Text>
                        <Text style={styles.detailDataValue}>+91 {detailedUser.mobile}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Email Address</Text>
                        <Text style={styles.detailDataValue}>{detailedUser.email || 'Not provided'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>City / Address</Text>
                        <Text style={styles.detailDataValue}>{detailedUser.city || 'Not specified'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Pincode</Text>
                        <Text style={styles.detailDataValue}>{detailedUser.pincode || '431601'}</Text>
                      </View>
                    </View>

                    {/* Financial Information */}
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardHeader}>Financial & Employment Information</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Employment Type</Text>
                        <Text style={styles.detailDataValue}>{detailedUser.employmentType || 'Salaried'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Monthly Income</Text>
                        <Text style={[styles.detailDataValue, { color: '#002e75', fontWeight: '800' }]}>
                          {detailedUser.monthlyIncome ? `₹${detailedUser.monthlyIncome.toLocaleString('en-IN')}` : 'Not stated'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>PAN Card</Text>
                        <Text style={styles.detailDataValue}>{detailedUser.panNumber || 'Not provided'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Aadhaar Card</Text>
                        <Text style={styles.detailDataValue}>{detailedUser.aadhaarNumber || 'Not provided'}</Text>
                      </View>
                    </View>

                    {/* Referral & Growth */}
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardHeader}>Referrals & Partnership</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Referral Code</Text>
                        <Text style={styles.detailHighlightValue}>{detailedUser.referralCode || 'N/A'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelText}>Referred By</Text>
                        <Text style={styles.detailDataValue}>{detailedUser.referredBy || 'Direct Registration'}</Text>
                      </View>
                    </View>
                  </View>
                ) : activeUserDetailTab === 'loans' ? (
                  /* Loan Applications Tab */
                  <View style={{ marginTop: 8 }}>
                    {(() => {
                      const cleanMob = detailedUser.mobile.replace(/\D/g, '').slice(-10);
                      const userLoans = applications.filter(
                        (a) => (a.applicantMobile || '').replace(/\D/g, '').slice(-10) === cleanMob
                      );
                      const userIns = insuranceApps.filter(
                        (ins) => (ins.mobile || '').replace(/\D/g, '').slice(-10) === cleanMob
                      );

                      if (userLoans.length === 0 && userIns.length === 0) {
                        return (
                          <View style={styles.emptyState}>
                            <Ionicons name="folder-open-outline" size={36} color="#94a3b8" />
                            <Text style={styles.emptyTitle}>No Applications Yet</Text>
                            <Text style={styles.emptySubtitle}>Customer has not submitted any loan enquiries yet.</Text>
                          </View>
                        );
                      }

                      return (
                        <View style={{ gap: 10 }}>
                          {userLoans.map((app) => {
                            const badge = getStatusBadgeStyle(app.status);
                            return (
                              <View key={app.id} style={styles.innerAppItemCard}>
                                <View style={styles.appCardHeader}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.appIdText}>{app.id}</Text>
                                    <Text style={styles.appLoanType}>{app.loanTypeName}</Text>
                                  </View>
                                  <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                                      {app.status}
                                    </Text>
                                  </View>
                                </View>

                                <View style={styles.innerDetailRow}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Bank Name</Text>
                                    <Text style={styles.detailValue}>{app.bankName || 'Partner Bank'}</Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Requested Amount</Text>
                                    <Text style={styles.detailAmount}>₹{app.requestedAmount.toLocaleString('en-IN')}</Text>
                                  </View>
                                </View>

                                <View style={styles.innerDetailRow}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Tenure</Text>
                                    <Text style={styles.detailSub}>{app.tenureMonths} Months</Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Submission Date</Text>
                                    <Text style={styles.detailSub}>{app.submissionDate}</Text>
                                  </View>
                                </View>

                                {app.remarks || app.nextAction ? (
                                  <View style={styles.notesBox}>
                                    <Text style={styles.noteTitle}>Action: {app.nextAction || 'Under Review'}</Text>
                                    {app.remarks && <Text style={styles.noteText}>Remarks: {app.remarks}</Text>}
                                  </View>
                                ) : null}

                                <TouchableOpacity
                                  style={[styles.manageBtn, { marginTop: 6, alignSelf: 'flex-end', paddingVertical: 6 }]}
                                  onPress={() => {
                                    setDetailedUser(null);
                                    handleOpenEdit(app);
                                  }}
                                  activeOpacity={0.8}
                                >
                                  <Ionicons name="create-outline" size={13} color="#ffffff" />
                                  <Text style={styles.manageBtnText}>Update Loan</Text>
                                </TouchableOpacity>
                              </View>
                            );
                          })}

                          {userIns.map((ins) => (
                            <View key={ins.id} style={styles.innerAppItemCard}>
                              <View style={styles.appCardHeader}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.appIdText}>{ins.id}</Text>
                                  <Text style={styles.appLoanType}>{ins.insuranceTypeName || ins.insuranceType}</Text>
                                </View>
                                <View style={styles.statusBadge}>
                                  <Text style={styles.statusBadgeText}>{ins.status}</Text>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    })()}
                  </View>
                ) : activeUserDetailTab === 'documents' ? (
                  /* Documents Tab */
                  <View style={{ marginTop: 8 }}>
                    {(!detailedUser.documents || detailedUser.documents.length === 0) ? (
                      <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={36} color="#94a3b8" />
                        <Text style={styles.emptyTitle}>No Documents Uploaded</Text>
                        <Text style={styles.emptySubtitle}>Customer has not uploaded KYC or income proofs yet.</Text>
                      </View>
                    ) : (
                      detailedUser.documents.map((doc, idx) => (
                        <View key={doc.id || idx} style={styles.docItemCard}>
                          <View style={styles.docItemIconWrap}>
                            <Ionicons
                              name={
                                doc.fileType?.includes('pdf') || doc.mimeType?.includes('pdf')
                                  ? 'document-text'
                                  : 'image'
                              }
                              size={22}
                              color={doc.fileType?.includes('pdf') ? '#ef4444' : '#0284c7'}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.docItemTitle} numberOfLines={1}>
                              {doc.name || 'Document'}
                            </Text>
                            <Text style={styles.docItemSub}>
                              {doc.category || 'KYC'} • {doc.uploadDate || 'Uploaded'}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.docItemOpenBtn}
                            onPress={() => handleOpenDocFile(doc)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="eye" size={14} color="#ffffff" />
                            <Text style={styles.docItemOpenBtnText}>View</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                ) : (
                  /* Referrals Tab */
                  <View style={{ marginTop: 8 }}>
                    {(() => {
                      const cleanMob = detailedUser.mobile.replace(/\D/g, '').slice(-10);
                      const userRefs = referralLeads.filter(
                        (r) => r.referrerMobile.replace(/\D/g, '').slice(-10) === cleanMob
                      );

                      if (userRefs.length === 0) {
                        return (
                          <View style={styles.emptyState}>
                            <Ionicons name="gift-outline" size={36} color="#94a3b8" />
                            <Text style={styles.emptyTitle}>No Referrals Yet</Text>
                            <Text style={styles.emptySubtitle}>Customer has not referred any leads yet.</Text>
                          </View>
                        );
                      }

                      return (
                        <View style={{ gap: 10 }}>
                          {userRefs.map((r) => (
                            <View key={r.id} style={styles.innerAppItemCard}>
                              <View style={styles.appCardHeader}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.userCardName}>{r.friendName}</Text>
                                  <Text style={styles.userCardMobile}>+91 {r.friendMobile}</Text>
                                </View>
                                <View style={styles.statusBadge}>
                                  <Text style={styles.statusBadgeText}>{r.status}</Text>
                                </View>
                              </View>
                              <View style={styles.innerDetailRow}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.detailLabel}>Product</Text>
                                  <Text style={styles.detailValue}>{r.loanProduct}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.detailLabel}>Payout Status</Text>
                                  <Text style={[styles.detailValue, { color: '#059669' }]}>
                                    ₹{r.payoutAmount || 0} • {r.payoutStatus || 'Pending'}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    })()}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ---------------- SEND NOTIFICATION MODAL ---------------- */}
      {notificationTargetUser && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setNotificationTargetUser(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Send Message / Notification</Text>
                  <Text style={styles.modalSub}>
                    To: {notificationTargetUser.name || 'Customer'} (+91 {notificationTargetUser.mobile})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setNotificationTargetUser(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              {notifSuccessMsg && (
                <View style={styles.modalSuccessBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#15803d" />
                  <Text style={styles.modalSuccessText}>{notifSuccessMsg}</Text>
                </View>
              )}

              <Text style={styles.inputGroupLabel}>Notification Title:</Text>
              <TextInput
                style={styles.modalInput}
                value={notifTitle}
                onChangeText={setNotifTitle}
                placeholder="e.g. Loan Point Update"
              />

              <Text style={styles.inputGroupLabel}>Message Body:</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 90 }]}
                value={notifMessage}
                onChangeText={setNotifMessage}
                placeholder="Write your push notification / message to customer..."
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setNotificationTargetUser(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSaveBtn, { backgroundColor: '#2563eb' }]}
                  onPress={handleSendNotification}
                  disabled={isSendingNotif}
                  activeOpacity={0.8}
                >
                  {isSendingNotif ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="send" size={15} color="#ffffff" />
                      <Text style={styles.modalSaveText}>Dispatch Notification</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    backgroundColor: '#002e75',
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  adminBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  switchModeText: {
    color: '#003399',
    fontSize: 11.5,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  logoutText: {
    color: '#fca5a5',
    fontSize: 11.5,
    fontWeight: '700',
  },
  headerWelcome: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  headerSub: {
    color: '#cbd5e1',
    fontSize: 11.5,
    marginTop: 2,
  },
  topTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingBottom: 2,
  },
  topTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  topTabBtnActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  topTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  topTabBtnTextActive: {
    color: '#003399',
    fontWeight: '900',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  statLabel: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '700',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 2,
  },
  statSub: {
    fontSize: 9.5,
    color: '#94a3b8',
    fontWeight: '600',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    padding: 0,
  },
  filterScroll: {
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  filterChipActive: {
    backgroundColor: '#003399',
    borderColor: '#003399',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  refreshBtnText: {
    fontSize: 11.5,
    color: colors.primary,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  appCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  appCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appIdText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.4,
  },
  appLoanType: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  appDetailsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
  },
  detailAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#003399',
    marginTop: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  detailSub: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
    fontWeight: '600',
  },
  notesBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 9,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noteTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
  },
  noteText: {
    fontSize: 11.5,
    color: '#334155',
    marginTop: 2,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 3,
    flexShrink: 0,
  },
  contactBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  loanDetailViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 8,
    gap: 4,
    flexShrink: 0,
  },
  loanDetailViewBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#002e75',
  },
  viewDocsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 3,
    flexShrink: 0,
  },
  viewDocsBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
  },
  manageBtn: {
    flex: 1,
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#002e75',
    paddingVertical: 7.5,
    borderRadius: 8,
    gap: 4,
  },
  manageBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Full Details Modal Tabs & Styles
  loanDetailTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    marginTop: 10,
    marginBottom: 4,
  },
  modalSubTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  modalSubTabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalSubTabText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
  },
  modalSubTabTextActive: {
    color: '#002e75',
    fontWeight: '900',
  },
  detailSectionBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 4,
  },
  detailSectionHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: '#002e75',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  detailGridTwoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailGridField: {
    width: '48%',
    marginBottom: 6,
  },
  detailGridFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  detailGridFieldValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  detailGridFieldValueHighlight: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#002e75',
    marginTop: 2,
  },
  detailBoxNoteText: {
    fontSize: 11.5,
    color: '#334155',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    lineHeight: 16,
  },
  docViewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  docViewerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docViewerTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  docViewerSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  userCardName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  userCardMobile: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003399',
    marginTop: 1,
  },
  kycStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  kycStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  modalSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  modalSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  inputGroupLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginTop: 10,
    marginBottom: 6,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  statusOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  statusOptionPillActive: {
    backgroundColor: '#003399',
    borderColor: '#003399',
  },
  statusOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  statusOptionTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    fontSize: 12.5,
    color: '#0f172a',
    textAlignVertical: 'top',
  },
  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  modalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  docItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  docItemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  docItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  docItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  docItemOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  docItemOpenBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'space-between',
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  imageModalTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginRight: 12,
  },
  imageModalBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  fullPreviewImage: {
    width: '100%',
    height: '100%',
  },
  userRegistrationDateBadge: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  userAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#002e75',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  detailActionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 6,
  },
  quickActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  userDetailTabsBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
    gap: 2,
  },
  userDetailTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    gap: 4,
  },
  userDetailTabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userDetailTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  userDetailTabTextActive: {
    color: '#003399',
    fontWeight: '800',
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  detailCardHeader: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#002e75',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  detailLabelText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
  detailDataValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  detailHighlightValue: {
    fontSize: 12,
    color: '#003399',
    fontWeight: '800',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  innerAppItemCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
  },
  innerDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
  },
  kycToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  kycToggleText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
});

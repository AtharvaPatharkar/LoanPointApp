import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoanApplication, ApplicationStatus, UserProfile } from '../../types';
import { loanService } from '../../services/loanService';
import { COMPANY_INFO } from '../../data/mockData';
import { colors } from '../../theme/colors';

interface AdminScreenProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  onSwitchToCustomerView?: () => void;
}

const ALL_STATUSES: ApplicationStatus[] = [
  'Enquiry Received',
  'Documents Pending',
  'Application Submitted',
  'Under Bank Processing',
  'Approved',
  'Disbursed',
  'Rejected',
];

export const AdminScreen: React.FC<AdminScreenProps> = ({
  currentUser,
  onLogout,
  onSwitchToCustomerView,
}) => {
  const [applications, setApplications] = useState<LoanApplication[]>(loanService.getApplications());
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Status Update Modal State
  const [editingApp, setEditingApp] = useState<LoanApplication | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('Enquiry Received');
  const [adminRemarks, setAdminRemarks] = useState<string>('');
  const [nextActionNote, setNextActionNote] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Refresh application list
  const refreshList = () => {
    setApplications(loanService.getApplications());
  };

  // Open edit modal
  const handleOpenEdit = (app: LoanApplication) => {
    setEditingApp(app);
    setNewStatus(app.status);
    setAdminRemarks(app.remarks || '');
    setNextActionNote(app.nextAction || '');
    setSaveSuccessMsg(null);
  };

  // Save changes
  const handleSaveStatus = () => {
    if (!editingApp) return;

    try {
      loanService.updateApplicationStatus(
        editingApp.id,
        newStatus,
        adminRemarks,
        nextActionNote
      );
      refreshList();
      setSaveSuccessMsg(`Application ${editingApp.id} updated to "${newStatus}"!`);
      setTimeout(() => {
        setEditingApp(null);
        setSaveSuccessMsg(null);
      }, 900);
    } catch {
      Alert.alert('Error', 'Failed to update application');
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

  // Filtering
  const filteredApps = applications.filter((app) => {
    const matchesFilter =
      selectedFilter === 'All' ? true : app.status === selectedFilter;
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

  // Calculate Metrics
  const totalVolume = applications.reduce((acc, app) => acc + app.requestedAmount, 0);
  const approvedCount = applications.filter(
    (a) => a.status === 'Approved' || a.status === 'Disbursed'
  ).length;
  const pendingCount = applications.filter(
    (a) => a.status === 'Documents Pending' || a.status === 'Enquiry Received'
  ).length;

  const getStatusBadgeStyle = (status: ApplicationStatus) => {
    switch (status) {
      case 'Approved':
      case 'Disbursed':
        return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
      case 'Rejected':
        return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
      case 'Under Bank Processing':
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Documents Pending':
        return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

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
                <Ionicons name="person-outline" size={14} color="#2563eb" />
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
          Welcome, {currentUser?.name || 'Loan Point Branch Administrator'}
        </Text>
        <Text style={styles.headerSub}>Loan Point Nanded Central Application Management</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI / Analytics Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: '#2563eb' }]}>
            <Text style={styles.statLabel}>Total Apps</Text>
            <Text style={styles.statValue}>{applications.length}</Text>
            <Text style={styles.statSub}>₹{(totalVolume / 100000).toFixed(1)}L Requested</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#059669' }]}>
            <Text style={styles.statLabel}>Sanctioned</Text>
            <Text style={[styles.statValue, { color: '#059669' }]}>{approvedCount}</Text>
            <Text style={styles.statSub}>Approved / Disbursed</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#d97706' }]}>
            <Text style={styles.statLabel}>Action Req.</Text>
            <Text style={[styles.statValue, { color: '#d97706' }]}>{pendingCount}</Text>
            <Text style={styles.statSub}>Pending / Review</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, Customer, Loan Type, or Amount..."
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

        {/* Status Filter Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {['All', ...ALL_STATUSES].map((status) => {
            const isActive = selectedFilter === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedFilter(status)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Application Cards List */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listSectionTitle}>
            Loan Applications ({filteredApps.length})
          </Text>
          <TouchableOpacity onPress={refreshList} style={styles.refreshBtn}>
            <Ionicons name="reload" size={13} color="#2563eb" />
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {filteredApps.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={44} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Applications Found</Text>
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
                      {app.isDemoRecord && (
                        <View style={styles.demoBadge}>
                          <Text style={styles.demoBadgeText}>DEMO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.appLoanType}>{app.loanTypeName}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: badge.bg, borderColor: badge.border },
                    ]}
                  >
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
                    <Text style={styles.detailValue}>
                      {app.applicantName || 'Customer / Rahul Sharma'}
                    </Text>
                    <Text style={styles.detailSub}>
                      Sub: {app.submissionDate}
                    </Text>
                  </View>
                </View>

                {/* Remarks & Next Action */}
                <View style={styles.notesBox}>
                  <Text style={styles.noteTitle}>Next Action:</Text>
                  <Text style={styles.noteText}>{app.nextAction}</Text>
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
                    <Ionicons name="call-outline" size={14} color="#059669" />
                    <Text style={styles.contactBtnText}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => handleWhatsAppApplicant(app)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="logo-whatsapp" size={14} color="#16a34a" />
                    <Text style={styles.contactBtnText}>WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.manageBtn}
                    onPress={() => handleOpenEdit(app)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="create-outline" size={15} color="#ffffff" />
                    <Text style={styles.manageBtnText}>Update Status</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Status Update Modal */}
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
                <View>
                  <Text style={styles.modalTitle}>Update Application</Text>
                  <Text style={styles.modalSub}>{editingApp.id} • {editingApp.loanTypeName}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setEditingApp(null)}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {saveSuccessMsg && (
                <View style={styles.modalSuccessBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#15803d" />
                  <Text style={styles.modalSuccessText}>{saveSuccessMsg}</Text>
                </View>
              )}

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {/* Select New Status */}
                <Text style={styles.inputGroupLabel}>Select Status:</Text>
                <View style={styles.statusGrid}>
                  {ALL_STATUSES.map((st) => {
                    const isSelected = newStatus === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.statusOptionPill,
                          isSelected && styles.statusOptionPillActive,
                        ]}
                        onPress={() => setNewStatus(st)}
                        activeOpacity={0.7}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={13} color="#ffffff" style={{ marginRight: 4 }} />
                        )}
                        <Text
                          style={[
                            styles.statusOptionText,
                            isSelected && styles.statusOptionTextActive,
                          ]}
                        >
                          {st}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Edit Next Action */}
                <Text style={styles.inputGroupLabel}>Customer Next Action Instruction:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nextActionNote}
                  onChangeText={setNextActionNote}
                  placeholder="e.g. Bank technical verification scheduled for Friday..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={2}
                />

                {/* Edit Internal Admin Remarks */}
                <Text style={styles.inputGroupLabel}>Admin Remarks / Underwriting Notes:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={adminRemarks}
                  onChangeText={setAdminRemarks}
                  placeholder="e.g. Sanctioned at 10.75% p.a. Awaiting NACH sign-off."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={2}
                />
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setEditingApp(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveStatus}
                  activeOpacity={0.85}
                >
                  <Ionicons name="save-outline" size={16} color="#ffffff" />
                  <Text style={styles.modalSaveText}>Save Changes</Text>
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
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#0f172a',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
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
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
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
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  switchModeText: {
    color: '#2563eb',
    fontSize: 11.5,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 11.5,
    fontWeight: '700',
  },
  headerWelcome: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  headerSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 2,
  },
  statSub: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
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
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
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
    fontWeight: '800',
    color: '#0f172a',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  refreshBtnText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.4,
  },
  demoBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  demoBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },
  appLoanType: {
    fontSize: 16,
    fontWeight: '800',
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
    fontWeight: '700',
  },
  appDetailsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748b',
  },
  detailAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563eb',
    marginTop: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  detailSub: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
  },
  notesBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 10.5,
    fontWeight: '700',
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
    gap: 8,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  manageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  manageBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    gap: 6,
  },
  modalSuccessText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
  },
  inputGroupLabel: {
    fontSize: 12,
    fontWeight: '700',
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
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  statusOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  statusOptionTextActive: {
    color: '#ffffff',
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
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
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});


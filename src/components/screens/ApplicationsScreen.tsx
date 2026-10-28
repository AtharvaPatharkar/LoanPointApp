import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoanApplication, ApplicationStatus } from '../../types';
import { formatINR } from '../../utils/calculator';
import { colors } from '../../theme/colors';
import { LoanIcon } from '../common/LoanIcon';
import { LOAN_CATEGORIES } from '../../data/mockData';

interface ApplicationsScreenProps {
  applications: LoanApplication[];
  onSelectApplication: (app: LoanApplication) => void;
  onApplyNew: () => void;
  onUploadDocForApp: (app: LoanApplication, docName: string) => void;
}

export const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({
  applications,
  onSelectApplication,
  onApplyNew,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'In Progress' },
    { id: 'Approved', label: 'Approved' },
    { id: 'Disbursed', label: 'Disbursed' },
  ];

  const filtered = applications.filter((app) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') {
      return app.status !== 'Disbursed' && app.status !== 'Rejected';
    }
    return app.status === statusFilter;
  });

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Approved':
        // Green: Approved
        return { bg: '#ecfdf5', text: '#15803d', border: '#86efac' };
      case 'Disbursed':
        // Red: Disbursed
        return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
      case 'Processing':
        // Distinct Indigo/Navy: Processing (without bank name)
        return { bg: '#eef0fa', text: '#2d3091', border: '#c7d2fe' };
      case 'Application Submitted':
        return { bg: colors.primaryLight, text: colors.primaryDeep, border: colors.primaryBorder };
      case 'Documents Pending':
        return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
      case 'Rejected':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };
      default:
        return { bg: colors.surfaceSubtle, text: colors.text, border: colors.border };
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Header Row with Simple + New Button */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>My Applications</Text>
          <Text style={styles.subtitle}>{applications.length} loan records</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={onApplyNew}
          activeOpacity={0.82}
        >
          <View style={styles.newBtnIconCircle}>
            <Ionicons name="add" size={15} color="#008ecc" />
          </View>
          <Text style={styles.newBtnText}>New Loan</Text>
        </TouchableOpacity>
      </View>

      {/* Clean Segmented Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setStatusFilter(tab.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Clean List Items */}
      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={36} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No Applications Found</Text>
          <Text style={styles.emptySub}>Tap 'New Loan' above to start an application</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map((app) => {
            const badge = getStatusBadge(app.status);
            const matchedCategory = LOAN_CATEGORIES.find((c) => c.id === app.loanType);
            const iconName = matchedCategory ? matchedCategory.iconName : 'UserCheck';

            return (
              <TouchableOpacity
                key={app.id}
                style={styles.card}
                onPress={() => onSelectApplication(app)}
                activeOpacity={0.82}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    <View style={styles.loanIconWrap}>
                      <LoanIcon name={iconName} size={22} />
                    </View>
                    <View style={styles.titleInfo}>
                      <Text style={styles.loanType}>{app.loanTypeName}</Text>
                      <Text style={styles.appId}>{app.id} · {app.submissionDate}</Text>
                    </View>
                  </View>

                  <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>{app.status}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.metaLabel}>Loan Amount</Text>
                    <Text style={styles.metaVal}>{formatINR(app.requestedAmount)}</Text>
                  </View>
                  <View>
                    <Text style={styles.metaLabel}>Tenure</Text>
                    <Text style={styles.metaVal}>{app.tenureMonths} Mo</Text>
                  </View>
                  <View style={styles.viewAction}>
                    <Text style={styles.viewText}>Track</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008ecc', // Vivid Logo Sky Cyan
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 6,
    borderRadius: 22,
    gap: 7,
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  newBtnIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  newBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  filterScroll: {
    marginBottom: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.white,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
    shadowColor: '#2d3091',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  loanIconWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  titleInfo: {
    flex: 1,
  },
  loanType: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  appId: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceSubtle,
    marginVertical: 10,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 1,
  },
  viewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});

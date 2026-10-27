import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoanApplication, ApplicationStatus } from '../../types';
import { formatINR } from '../../utils/calculator';
import { colors } from '../../theme/colors';

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
      case 'Disbursed':
        return { bg: '#ecfdf5', text: '#065f46' };
      case 'Under Bank Processing':
      case 'Application Submitted':
        return { bg: '#eff6ff', text: '#1d4ed8' };
      case 'Documents Pending':
        return { bg: '#fffbeb', text: '#b45309' };
      case 'Rejected':
        return { bg: '#fef2f2', text: '#dc2626' };
      default:
        return { bg: colors.surfaceSubtle, text: colors.text };
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
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={16} color={colors.white} />
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
            return (
              <TouchableOpacity
                key={app.id}
                style={styles.card}
                onPress={() => onSelectApplication(app)}
                activeOpacity={0.7}
              >
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.loanType}>{app.loanTypeName}</Text>
                    <Text style={styles.appId}>{app.id} · {app.submissionDate}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
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
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  newBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
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
    gap: 10,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  loanType: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  appId: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
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

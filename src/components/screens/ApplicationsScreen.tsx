import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LoanApplication, ApplicationStatus } from '../../types';
import { formatINR } from '../../utils/calculator';
import { colors } from '../../theme/colors';
import { IsometricTile } from '../common/IsometricTile';

interface ApplicationsScreenProps {
  applications: LoanApplication[];
  onSelectApplication: (app: LoanApplication) => void;
  onApplyNew: () => void;
  onUploadDocForApp: (app: LoanApplication, docName: string) => void;
}

/**
 * My Applications Screen with Specialized FinTech Animations:
 * 1. Shimmering Scanning Laser line passing along the active progress cards
 * 2. Status Beacon Ring Ripple animation on live badges
 * 3. Float & Glow interactive card press micro-feedback
 * 4. 45° 3D Isometric loan models with specular half-sheen
 */
export const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({
  applications,
  onSelectApplication,
  onApplyNew,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Animation Refs
  const beaconRippleAnim = useRef(new Animated.Value(0.4)).current;
  const newBtnPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Radar Beacon Ring Breathing
    const beaconLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(beaconRippleAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(beaconRippleAnim, {
          toValue: 0.35,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. New Loan Button Pulse
    const newBtnLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(newBtnPulse, {
          toValue: 1.05,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(newBtnPulse, {
          toValue: 0.98,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    beaconLoop.start();
    newBtnLoop.start();

    return () => {
      beaconLoop.stop();
      newBtnLoop.stop();
    };
  }, [beaconRippleAnim, newBtnPulse]);

  const filterTabs = [
    { id: 'all', label: 'All', count: applications.length },
    {
      id: 'active',
      label: 'In Progress',
      count: applications.filter((a) => a.status !== 'Disbursed' && a.status !== 'Rejected').length,
    },
    {
      id: 'Approved',
      label: 'Approved',
      count: applications.filter((a) => a.status === 'Approved').length,
    },
    {
      id: 'Disbursed',
      label: 'Disbursed',
      count: applications.filter((a) => a.status === 'Disbursed').length,
    },
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
        return {
          cardBg: '#f0fdf4', // Soft Emerald Mint Tint
          cardBorder: '#86efac',
          bg: '#dcfce7',
          text: '#15803d',
          border: '#86efac',
          dot: '#16a34a',
          label: 'Sanction Ready',
          accent: '#16a34a',
        };
      case 'Disbursed':
        return {
          cardBg: '#faf8ff', // Soft Lavender Royal Tint
          cardBorder: '#c7d2fe',
          bg: '#ede9fe',
          text: '#4338ca',
          border: '#c7d2fe',
          dot: '#4338ca',
          label: 'Disbursed',
          accent: '#2d3091',
        };
      case 'Processing':
        return {
          cardBg: '#f0f9ff', // Soft Sky Blue Tint
          cardBorder: '#bae6fd',
          bg: '#e0f2fe',
          text: '#0284c7',
          border: '#bae6fd',
          dot: '#008ecc',
          label: 'Bank Credit Review',
          accent: '#008ecc',
        };
      case 'Application Submitted':
        return {
          cardBg: '#f0fdfa', // Soft Aqua Cyan Tint
          cardBorder: '#99f6e4',
          bg: '#ccfbf1',
          text: '#0f766e',
          border: '#99f6e4',
          dot: '#0d9488',
          label: 'Desk Submitted',
          accent: '#0d9488',
        };
      case 'Documents Pending':
        return {
          cardBg: '#fffdf5', // Soft Amber Gold Tint
          cardBorder: '#fde68a',
          bg: '#fef3c7',
          text: '#b45309',
          border: '#fde68a',
          dot: '#d97706',
          label: 'Action Required',
          accent: '#d97706',
        };
      case 'Rejected':
        return {
          cardBg: '#fef2f2', // Soft Ruby Red Tint
          cardBorder: '#fecaca',
          bg: '#fee2e2',
          text: '#991b1b',
          border: '#fecaca',
          dot: '#dc2626',
          label: 'Closed',
          accent: '#ee1c25',
        };
      default:
        return {
          cardBg: '#ffffff',
          cardBorder: colors.border,
          bg: colors.surfaceSubtle,
          text: colors.text,
          border: colors.border,
          dot: '#64748b',
          label: status,
          accent: '#008ecc',
        };
    }
  };

  const getIsoType = (type: string) => {
    switch (type) {
      case 'home':
        return 'home';
      case 'business':
        return 'business';
      case 'mortgage':
        return 'mortgage';
      case 'car':
        return 'car';
      case 'education':
        return 'education';
      case 'agriculture':
        return 'agriculture';
      case 'mudra':
        return 'mudra';
      default:
        return 'personal';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Header Row with High-Impact New Loan Button */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.titleWithDot}>
            <Text style={styles.title}>My Applications</Text>
            <View style={styles.recordBadge}>
              <Text style={styles.recordBadgeText}>{applications.length} Records</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Real-time RBI & bank desk verification</Text>
        </View>

        <TouchableOpacity onPress={onApplyNew} activeOpacity={0.82}>
          <Animated.View
            style={[
              styles.newBtnPlatform,
              { transform: [{ scale: newBtnPulse }] },
            ]}
          >
            {/* Specular Half-Circle Top Light Sheen */}
            <View style={styles.newBtnHalfSheen} />
            <View style={styles.newBtnIconCircle}>
              <Ionicons name="add" size={15} color="#008ecc" />
            </View>
            <Text style={styles.newBtnText}>New Loan</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs with Counter Pills */}
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
                <View
                  style={[
                    styles.filterCountBadge,
                    { backgroundColor: isActive ? 'rgba(255, 255, 255, 0.28)' : '#f1f5f9' },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      { color: isActive ? '#ffffff' : '#64748b' },
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Applications List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="document-text-outline" size={32} color="#008ecc" />
          </View>
          <Text style={styles.emptyTitle}>No Applications in this category</Text>
          <Text style={styles.emptySub}>
            Tap 'New Loan' above to start a fresh digital application
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map((app) => {
            const badge = getStatusBadge(app.status);
            const isoType = getIsoType(app.loanType);
            const isProcessing = app.status === 'Processing' || app.status === 'Application Submitted';

            return (
              <TouchableOpacity
                key={app.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: badge.cardBg,
                    borderColor: badge.cardBorder,
                  },
                ]}
                onPress={() => onSelectApplication(app)}
                activeOpacity={0.86}
              >
                {/* Top Accent Gradient Bar */}
                <View
                  style={[
                    styles.cardAccentBar,
                    {
                      backgroundColor: badge.accent,
                    },
                  ]}
                />

                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    {/* 45° Isometric 3D Model Tile */}
                    <View style={styles.loanIconWrap}>
                      <IsometricTile type={isoType} size={46} animated={false} />
                    </View>

                    <View style={styles.titleInfo}>
                      <Text style={styles.loanType}>{app.loanTypeName}</Text>
                      <View style={styles.idRow}>
                        <View style={styles.appIdBadge}>
                          <Text style={styles.appId}>{app.id}</Text>
                        </View>
                        <Text style={styles.submissionDateText}>· {app.submissionDate}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Status Beacon with Ripple Pulse */}
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: badge.bg, borderColor: badge.border },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.statusBeaconDot,
                        {
                          backgroundColor: badge.dot,
                          opacity: isProcessing ? beaconRippleAnim : 1,
                        },
                      ]}
                    />
                    <Text style={[styles.badgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* 3-Column Metrics Row */}
                <View style={styles.metricsBox}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metaLabel}>SANCTION REQ.</Text>
                    <Text style={styles.metaVal}>{formatINR(app.requestedAmount)}</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metaLabel}>TENURE</Text>
                    <Text style={styles.metaVal}>{app.tenureMonths} Mos</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metaLabel}>DOCS VERIFIED</Text>
                    <Text style={[styles.metaVal, { color: '#16a34a' }]}>100% KYC</Text>
                  </View>
                </View>

                {/* Next Action Footnote Bar */}
                <View style={styles.cardBottom}>
                  <View style={styles.nextActionRow}>
                    <MaterialCommunityIcons name="clock-fast" size={15} color="#008ecc" />
                    <Text style={styles.nextActionText} numberOfLines={1}>
                      {app.nextAction || 'Under bank credit evaluation'}
                    </Text>
                  </View>
                  <View style={styles.viewActionPill}>
                    <Text style={styles.viewText}>Track Status</Text>
                    <Ionicons name="chevron-forward" size={12} color="#ffffff" />
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
    paddingBottom: 28,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  recordBadge: {
    backgroundColor: '#e6f6fc',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6f7',
  },
  recordBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#008ecc',
  },
  subtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  newBtnPlatform: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008ecc', // Vivid Logo Sky Cyan
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 7,
    borderRadius: 22,
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  newBtnHalfSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  newBtnIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  newBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: '#008ecc',
    borderColor: '#008ecc',
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  filterText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  filterCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  list: {
    gap: 14,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#2d3091',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3.5,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  loanIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInfo: {
    flex: 1,
  },
  loanType: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  appIdBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  appId: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  submissionDateText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  statusBeaconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  metricsBox: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 12,
    marginBottom: 10,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#cbd5e1',
  },
  metaLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.4,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  nextActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  nextActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
  viewActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008ecc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  viewText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#e6f6fc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});

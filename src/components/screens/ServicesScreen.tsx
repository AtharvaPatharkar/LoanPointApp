import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LOAN_CATEGORIES } from '../../data/mockData';
import { LoanType } from '../../types';
import { LoanIcon } from '../common/LoanIcon';
import { colors } from '../../theme/colors';

interface ServicesScreenProps {
  onSelectCategory: (id: LoanType) => void;
  onNavigate: (screen: string, params?: Record<string, unknown>) => void;
}

export const ServicesScreen: React.FC<ServicesScreenProps> = ({
  onSelectCategory,
  onNavigate,
}) => {
  const tools = [
    {
      id: 'emi_calculator',
      title: 'EMI Calculator',
      desc: 'Plan monthly payments & interest rate',
      icon: 'calculator-outline' as const,
      color: '#2563eb',
      bg: '#eff6ff',
    },
    {
      id: 'eligibility_checker',
      title: 'Loan Eligibility',
      desc: 'Check borrowing power by salary',
      icon: 'speedometer-outline' as const,
      color: '#059669',
      bg: '#ecfdf5',
    },
    {
      id: 'balance_transfer',
      title: 'Balance Transfer',
      desc: 'Lower existing EMI & interest rate',
      icon: 'swap-horizontal' as const,
      color: '#d97706',
      bg: '#fffbeb',
    },
    {
      id: 'rate_comparison',
      title: 'Bank Rate Comparison',
      desc: 'Compare rates across major banks',
      icon: 'bar-chart-outline' as const,
      color: '#7c3aed',
      bg: '#f5f3ff',
    },
    {
      id: 'cibil_services',
      title: 'CIBIL Credit Advisory',
      desc: 'Score improvement & report help',
      icon: 'shield-checkmark-outline' as const,
      color: '#0284c7',
      bg: '#f0f9ff',
    },
    {
      id: 'documents',
      title: 'My Documents',
      desc: 'Saved PAN, Aadhaar, statements',
      icon: 'folder-outline' as const,
      color: '#475569',
      bg: '#f1f5f9',
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Calculators & Tools */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Tools & Calculators</Text>
        <View style={styles.toolsList}>
          {tools.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.toolRow}
              onPress={() => onNavigate(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.toolIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.toolText}>
                <Text style={styles.toolTitle}>{item.title}</Text>
                <Text style={styles.toolDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 2. Loan Categories List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loan Categories</Text>
        <View style={styles.categoriesList}>
          {LOAN_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.catRow}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.7}
            >
              <View style={styles.catIconWrap}>
                <LoanIcon name={cat.iconName} size={22} />
              </View>
              <View style={styles.catText}>
                <Text style={styles.catTitle}>{cat.title}</Text>
                <Text style={styles.catRate}>From {cat.indicativeInterestRate}</Text>
              </View>
              <View style={styles.applyBtnSmall}>
                <Text style={styles.applyBtnText}>Apply</Text>
                <Ionicons name="chevron-forward" size={12} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: colors.background,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  toolsList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  toolIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toolText: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  toolDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  categoriesList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  catIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  catText: {
    flex: 1,
  },
  catTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  catRate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  applyBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
  },
  applyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});

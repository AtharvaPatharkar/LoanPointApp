import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoanCategory } from '../../types';
import { LoanIcon } from '../common/LoanIcon';
import { formatINR } from '../../utils/calculator';
import { colors } from '../../theme/colors';

interface LoanDetailScreenProps {
  category: LoanCategory;
  onApplyNow: (category: LoanCategory) => void;
  onOpenCalculator: (category: LoanCategory) => void;
  onBack: () => void;
}

export const LoanDetailScreen: React.FC<LoanDetailScreenProps> = ({
  category,
  onApplyNow,
  onOpenCalculator,
}) => {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Summary */}
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.iconBox}>
              <LoanIcon name={category.iconName} size={24} />
            </View>
            <View style={styles.titleBox}>
              <Text style={styles.title}>{category.title}</Text>
              <Text style={styles.desc}>{category.shortDescription}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Interest Rate</Text>
              <Text style={styles.metricVal}>{category.indicativeInterestRate}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Max Amount</Text>
              <Text style={styles.metricVal}>{formatINR(category.maxAmount)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Max Tenure</Text>
              <Text style={styles.metricVal}>{category.tenureRange}</Text>
            </View>
          </View>
        </View>

        {/* Features Checklist */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Key Features</Text>
          {category.features.map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Required Documents */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Required Documents</Text>
          {category.requiredDocuments.map((doc, idx) => (
            <View key={idx} style={styles.docRow}>
              <Ionicons name="document-text-outline" size={15} color={colors.primary} />
              <Text style={styles.docText}>{doc}</Text>
            </View>
          ))}
        </View>

        {/* Quick Calculator Action */}
        <TouchableOpacity
          style={styles.calcBtn}
          onPress={() => onOpenCalculator(category)}
          activeOpacity={0.7}
        >
          <Ionicons name="calculator-outline" size={18} color={colors.primary} />
          <Text style={styles.calcBtnText}>Calculate EMI for {category.title}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Bottom Apply CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={() => onApplyNow(category)}
          activeOpacity={0.8}
        >
          <Text style={styles.applyBtnText}>Apply for {category.title}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 84,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleBox: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  desc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  docText: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
    marginTop: 4,
  },
  calcBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12,
    paddingHorizontal: 16,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});

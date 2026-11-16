import React from 'react';
import { StyleSheet, View, Image, ImageSourcePropType, ViewStyle } from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { LoanType } from '../../types';

export interface LoanIconProps {
  /** Loan type identifier ('home' | 'personal' | 'business' | 'car' | etc.) or legacy iconName */
  type?: LoanType | string;
  name?: string;
  size?: number; // Size of the icon or asset image (default 26)
  containerSize?: number; // Size of background container box (default auto based on size)
  color?: string; // Optional icon tint/color
  containerBg?: string; // Optional container background
  borderRadius?: number; // Optional container border radius
  useAssetImage?: boolean; // When true, uses attractive high-res 3D graphic asset from exploreAllLoanProducts
  style?: ViewStyle;
}

export interface LoanTypeVisualMeta {
  id: LoanType;
  title: string;
  shortName: string;
  gradientBg: string;
  softBg: string;
  borderColor: string;
  primaryColor: string;
  accentColor: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'FontAwesome5';
  iconName: string;
  imageSource: ImageSourcePropType;
  badgeTag: string;
  badgeColor: string;
}

export const LOAN_TYPE_VISUALS: Record<LoanType, LoanTypeVisualMeta> = {
  home: {
    id: 'home',
    title: 'Home Loan',
    shortName: 'Home',
    gradientBg: '#fee2e2',
    softBg: '#fff5f5',
    borderColor: '#fecdd3',
    primaryColor: '#e11d48', // Vivid Rose Crimson
    accentColor: '#be123c',
    iconFamily: 'FontAwesome5',
    iconName: 'home',
    imageSource: require('../../../assets/exploreAllLoanProducts/homeloan.png'),
    badgeTag: 'Lowest 8.40%',
    badgeColor: '#e11d48',
  },
  personal: {
    id: 'personal',
    title: 'Personal Loan',
    shortName: 'Personal',
    gradientBg: '#fef3c7',
    softBg: '#fffbeb',
    borderColor: '#fde68a',
    primaryColor: '#d97706', // Prosperity Warm Gold
    accentColor: '#b45309',
    iconFamily: 'FontAwesome5',
    iconName: 'hand-holding-usd',
    imageSource: require('../../../assets/exploreAllLoanProducts/personalloan.png'),
    badgeTag: 'Instant Approval',
    badgeColor: '#10b981',
  },
  business: {
    id: 'business',
    title: 'Business Loan',
    shortName: 'Business',
    gradientBg: '#fee2e2',
    softBg: '#fffaf5',
    borderColor: '#ffedd5',
    primaryColor: '#dc2626', // Vibrant Scarlet Red
    accentColor: '#991b1b',
    iconFamily: 'FontAwesome5',
    iconName: 'store',
    imageSource: require('../../../assets/exploreAllLoanProducts/businessloan.png'),
    badgeTag: 'Collateral Free',
    badgeColor: '#dc2626',
  },
  car: {
    id: 'car',
    title: 'Car Loan',
    shortName: 'Car',
    gradientBg: '#dbeafe',
    softBg: '#f0f7ff',
    borderColor: '#bfdbfe',
    primaryColor: '#2563eb', // Vivid Royal Cobalt Blue
    accentColor: '#1d4ed8',
    iconFamily: 'FontAwesome5',
    iconName: 'car',
    imageSource: require('../../../assets/exploreAllLoanProducts/carloan.png'),
    badgeTag: '90% On-Road',
    badgeColor: '#2563eb',
  },
  education: {
    id: 'education',
    title: 'Education Loan',
    shortName: 'Education',
    gradientBg: '#e0f2fe',
    softBg: '#f0f9ff',
    borderColor: '#bae6fd',
    primaryColor: '#0284c7', // Dynamic Cyan Sky Blue
    accentColor: '#0369a1',
    iconFamily: 'FontAwesome5',
    iconName: 'graduation-cap',
    imageSource: require('../../../assets/exploreAllLoanProducts/educationloan.png'),
    badgeTag: 'Zero Margin',
    badgeColor: '#0284c7',
  },
  agriculture: {
    id: 'agriculture',
    title: 'Agriculture Loan',
    shortName: 'Agri',
    gradientBg: '#dcfce7',
    softBg: '#f4fbf7',
    borderColor: '#bbf7d0',
    primaryColor: '#16a34a', // Verdant Emerald Green
    accentColor: '#15803d',
    iconFamily: 'FontAwesome5',
    iconName: 'seedling',
    imageSource: require('../../../assets/exploreAllLoanProducts/agriculatureloan.png'),
    badgeTag: 'Govt Subsidy',
    badgeColor: '#16a34a',
  },
  mortgage: {
    id: 'mortgage',
    title: 'Mortgage Loan (LAP)',
    shortName: 'Mortgage',
    gradientBg: '#ccfbf1',
    softBg: '#f0fdfa',
    borderColor: '#99f6e4',
    primaryColor: '#0d9488', // Petrol Teal Green
    accentColor: '#0f766e',
    iconFamily: 'MaterialCommunityIcons',
    iconName: 'bank',
    imageSource: require('../../../assets/exploreAllLoanProducts/mortgageloan.png'),
    badgeTag: 'Up to ₹10 Cr',
    badgeColor: '#0d9488',
  },
  mudra: {
    id: 'mudra',
    title: 'Mudra Loan (PMMY)',
    shortName: 'Mudra',
    gradientBg: '#fef9c3',
    softBg: '#fffdf5',
    borderColor: '#fef08a',
    primaryColor: '#ca8a04', // Golden Amber
    accentColor: '#a16207',
    iconFamily: 'FontAwesome5',
    iconName: 'coins',
    imageSource: require('../../../assets/exploreAllLoanProducts/mudraloan.png'),
    badgeTag: 'PMMY Govt',
    badgeColor: '#ca8a04',
  },
};

/** Normalize any incoming key/string to a standard LoanType */
export function normalizeLoanType(raw?: string | LoanType | null): LoanType {
  if (!raw) return 'home';
  const val = String(raw).toLowerCase().trim();
  if (val.includes('home') || val === 'hl') return 'home';
  if (val.includes('personal') || val.includes('wallet') || val.includes('user') || val === 'pl') return 'personal';
  if (val.includes('business') || val.includes('trade') || val.includes('msme') || val === 'bl') return 'business';
  if (val.includes('car') || val.includes('auto') || val.includes('vehicle') || val === 'cl') return 'car';
  if (val.includes('edu') || val.includes('study') || val.includes('school') || val.includes('grad') || val === 'el') return 'education';
  if (val.includes('agri') || val.includes('farm') || val.includes('kisan') || val.includes('crop') || val === 'al') return 'agriculture';
  if (val.includes('mort') || val.includes('lap') || val.includes('property') || val === 'ml') return 'mortgage';
  if (val.includes('mudra') || val.includes('pmmy') || val.includes('shishu')) return 'mudra';
  return 'home';
}

/**
 * Universal Attractive Colourful Loan Logo Component
 * Renders across all screens (My Loans, Home, Explore Services, Detail, Application, Top-Up, Referrals)
 */
export const LoanIcon: React.FC<LoanIconProps> = ({
  type,
  name,
  size = 24,
  containerSize,
  color,
  containerBg,
  borderRadius,
  useAssetImage = false,
  style,
}) => {
  const resolvedType = normalizeLoanType(type || name);
  const meta = LOAN_TYPE_VISUALS[resolvedType] || LOAN_TYPE_VISUALS.home;

  const boxSize = containerSize || Math.round(size * 1.85);
  const rounded = borderRadius !== undefined ? borderRadius : Math.round(boxSize * 0.28);
  const activeBg = containerBg || meta.softBg;
  const iconColor = color || meta.primaryColor;

  if (useAssetImage) {
    return (
      <View
        style={[
          styles.container,
          {
            width: boxSize,
            height: boxSize,
            borderRadius: rounded,
            backgroundColor: activeBg,
            borderColor: meta.borderColor,
            borderWidth: 1,
            shadowColor: meta.primaryColor,
          },
          style,
        ]}
      >
        <Image
          source={meta.imageSource}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
    );
  }

  const renderVector = () => {
    switch (meta.iconFamily) {
      case 'MaterialCommunityIcons':
        return (
          <MaterialCommunityIcons
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={meta.iconName as any}
            size={size}
            color={iconColor}
          />
        );
      case 'FontAwesome5':
        return (
          <FontAwesome5
            name={meta.iconName}
            size={size}
            color={iconColor}
          />
        );
      case 'Ionicons':
      default:
        return (
          <Ionicons
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={meta.iconName as any}
            size={size}
            color={iconColor}
          />
        );
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: boxSize,
          height: boxSize,
          borderRadius: rounded,
          backgroundColor: activeBg,
          borderColor: meta.borderColor,
          borderWidth: 1.2,
          shadowColor: meta.primaryColor,
        },
        style,
      ]}
    >
      {renderVector()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
});

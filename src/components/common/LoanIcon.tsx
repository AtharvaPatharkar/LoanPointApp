import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';

interface LoanIconProps {
  name: string;
  size?: number;
  color?: string;
  containerBg?: string;
}

interface IconConfig {
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'FontAwesome5';
  iconName: string;
  fillColor: string;
  shadowColor: string;
}

/**
 * Rich Color-Filled Real Icons for all Loan Types:
 * - Personal Loan: Vivid Cyan Sky (#008ECC) with solid account user
 * - Business Loan: Deep Royal Indigo (#2D3091) with office corporate building
 * - Home Loan: Crimson Scarlet Red (#EE1C25) with residential real home
 * - Mortgage Loan (LAP): Slate Petrol Teal (#075665) with secure bank landmark
 * - Car Loan: Vivid Dynamic Sky Blue (#0284C7) with passenger automobile
 * - Education Loan: Berry Magenta (#C5168D) with graduate mortarboard cap
 * - Agriculture Loan: Growth Farm Emerald Green (#16A34A) with agricultural plant sprout
 * - Mudra Loan (PMMY): Vibrant Prosperity Gold (#D97706) with currency coins
 */
const ICON_MAP: Record<string, IconConfig> = {
  // 1. Personal Loan: Solid user account with check / badge
  UserCheck: {
    iconFamily: 'MaterialCommunityIcons',
    iconName: 'account-check',
    fillColor: '#008ecc',
    shadowColor: '#008ecc',
  },
  // 2. Business Loan: Solid office skyscraper / corporate enterprise
  Building2: {
    iconFamily: 'MaterialCommunityIcons',
    iconName: 'office-building',
    fillColor: '#2d3091',
    shadowColor: '#2d3091',
  },
  // 3. Home Loan: Solid residential house with chimney
  Home: {
    iconFamily: 'Ionicons',
    iconName: 'home',
    fillColor: '#ee1c25',
    shadowColor: '#ee1c25',
  },
  // 4. Mortgage Loan (LAP): Solid bank / property asset pillar
  Landmark: {
    iconFamily: 'MaterialCommunityIcons',
    iconName: 'bank',
    fillColor: '#075665',
    shadowColor: '#075665',
  },
  // 5. Car Loan: Solid car automobile
  Car: {
    iconFamily: 'Ionicons',
    iconName: 'car-sport',
    fillColor: '#0284c7',
    shadowColor: '#0284c7',
  },
  // 6. Education Loan: Solid university mortarboard degree
  GraduationCap: {
    iconFamily: 'Ionicons',
    iconName: 'school',
    fillColor: '#c5168d',
    shadowColor: '#c5168d',
  },
  // 7. Agriculture Loan: Solid crop plant sprout / agriculture
  Sprout: {
    iconFamily: 'MaterialCommunityIcons',
    iconName: 'sprout',
    fillColor: '#16a34a',
    shadowColor: '#16a34a',
  },
  Wheat: {
    iconFamily: 'MaterialCommunityIcons',
    iconName: 'barley',
    fillColor: '#16a34a',
    shadowColor: '#16a34a',
  },
  // 8. Mudra Loan (PMMY): Solid golden wealth coins
  Coins: {
    iconFamily: 'FontAwesome5',
    iconName: 'coins',
    fillColor: '#d97706',
    shadowColor: '#d97706',
  },
  Briefcase: {
    iconFamily: 'MaterialCommunityIcons',
    iconName: 'briefcase',
    fillColor: '#2d3091',
    shadowColor: '#2d3091',
  },
};

export const LoanIcon: React.FC<LoanIconProps> = ({
  name,
  size = 22,
  color,
  containerBg,
}) => {
  const config = ICON_MAP[name] || {
    iconFamily: 'Ionicons',
    iconName: 'cash',
    fillColor: '#008ecc',
    shadowColor: '#008ecc',
  };

  const activeColor = color || '#ffffff';
  const activeBg = containerBg || config.fillColor;

  const renderIcon = () => {
    switch (config.iconFamily) {
      case 'MaterialCommunityIcons':
        return (
          <MaterialCommunityIcons
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={config.iconName as any}
            size={size}
            color={activeColor}
          />
        );
      case 'FontAwesome5':
        return (
          <FontAwesome5
            name={config.iconName}
            size={Math.max(14, size - 2)}
            color={activeColor}
          />
        );
      case 'Ionicons':
      default:
        return (
          <Ionicons
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={config.iconName as any}
            size={size}
            color={activeColor}
          />
        );
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: activeBg,
          shadowColor: config.shadowColor,
        },
      ]}
    >
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3,
  },
});

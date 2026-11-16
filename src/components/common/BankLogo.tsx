import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Text } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBankByNameOrId, BankConfig } from '../../constants/banks';
import { BANK_SVG_DEFINITIONS } from '../../constants/bankSvgData';

export interface BankLogoProps {
  /** Bank ID (e.g. 'hdfc', 'sbi') or Bank name (e.g. 'HDFC Bank', 'State Bank of India') */
  bank?: string | null;
  /** Width of the logo in dp/pixels (default: 48) */
  width?: number;
  /** Height of the logo in dp/pixels (default: 32) */
  height?: number;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Background color of the container (default: transparent) */
  backgroundColor?: string;
  /** If true, renders a subtle border & rounded container around logo */
  bordered?: boolean;
  /** Custom fallback icon size */
  fallbackIconSize?: number;
}

/**
 * Reusable BankLogo Component
 *
 * Renders authentic Indian Bank SVG logos with proper scaling, aspect ratio preservation,
 * and reliable fallback if a bank is unrecognized.
 *
 * Example:
 * `<BankLogo bank="hdfc" width={64} height={40} />`
 * `<BankLogo bank="State Bank of India" width={48} height={48} bordered />`
 */
export const BankLogo: React.FC<BankLogoProps> = ({
  bank,
  width = 48,
  height = 32,
  style,
  backgroundColor = 'transparent',
  bordered = false,
  fallbackIconSize,
}) => {
  const bankConfig: BankConfig | undefined = getBankByNameOrId(bank);
  const bankId = bankConfig?.id;
  const svgDef = bankId ? BANK_SVG_DEFINITIONS[bankId] : undefined;

  const containerStyle: ViewStyle = {
    width,
    height,
    backgroundColor,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...(bordered
      ? {
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#e2e8f0',
        }
      : {}),
  };

  if (!svgDef || !svgDef.svgXml) {
    // Graceful fallback: Bank icon with initial or short label
    const iconSize = fallbackIconSize || Math.min(width, height) * 0.55;
    const initial = bankConfig?.shortName?.slice(0, 3) || bank?.slice(0, 3)?.toUpperCase() || 'BNK';

    return (
      <View style={[styles.fallbackContainer, containerStyle, style]}>
        <MaterialCommunityIcons
          name="bank-outline"
          size={iconSize}
          color={bankConfig?.primaryColor || '#075665'}
        />
        {height >= 36 && width >= 44 && (
          <Text style={styles.fallbackText} numberOfLines={1}>
            {initial}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <SvgXml
        xml={svgDef.svgXml}
        width={width}
        height={height}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 2,
  },
  fallbackText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 1,
    letterSpacing: 0.5,
  },
});

export default BankLogo;

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface LoanIconProps {
  name: string;
  size?: number;
  color?: string;
  containerBg?: string;
}

export const LoanIcon: React.FC<LoanIconProps> = ({
  name,
  size = 22,
  color = colors.primary,
  containerBg = colors.primaryLight,
}) => {
  const renderIcon = () => {
    switch (name) {
      case 'UserCheck':
        return <Ionicons name="person-circle-outline" size={size} color={color} />;
      case 'Briefcase':
        return <MaterialCommunityIcons name="briefcase-outline" size={size} color={color} />;
      case 'Home':
        return <Ionicons name="home-outline" size={size} color={color} />;
      case 'Building2':
        return <MaterialCommunityIcons name="office-building" size={size} color={color} />;
      case 'Car':
        return <Ionicons name="car-outline" size={size} color={color} />;
      case 'GraduationCap':
        return <Ionicons name="school-outline" size={size} color={color} />;
      case 'Wheat':
        return <MaterialCommunityIcons name="barley" size={size} color={color} />;
      case 'Coins':
        return <FontAwesome5 name="coins" size={size - 2} color={color} />;
      default:
        return <Ionicons name="cash-outline" size={size} color={color} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
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
  },
});

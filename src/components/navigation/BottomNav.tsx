import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export type TabType = 'home' | 'applications' | 'services' | 'profile';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingDocsCount?: number;
}

interface TabItemConfig {
  id: TabType;
  label: string;
  family: 'MaterialCommunityIcons' | 'FontAwesome5';
  iconName: string;
  fillColor: string; // Vibrant Solid Fill Color for the Tile
  lightBg: string;   // Soft tint for inactive button background
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  pendingDocsCount = 0,
}) => {
  const tabs: TabItemConfig[] = [
    {
      id: 'home',
      label: 'Home',
      family: 'MaterialCommunityIcons',
      iconName: 'home-variant',
      fillColor: '#008ecc', // Vivid Logo Cyan Blue
      lightBg: '#e6f6fc',
    },
    {
      id: 'applications',
      label: 'Applications',
      family: 'MaterialCommunityIcons',
      iconName: 'file-document-check',
      fillColor: '#ee1c25', // Vivid Logo Crimson Red
      lightBg: '#fef2f2',
    },
    {
      id: 'services',
      label: 'Services',
      family: 'MaterialCommunityIcons',
      iconName: 'view-grid',
      fillColor: '#2d3091', // Rich Logo Indigo Navy
      lightBg: '#eef0fa',
    },
    {
      id: 'profile',
      label: 'Profile',
      family: 'FontAwesome5',
      iconName: 'user-alt',
      fillColor: '#075665', // Deep Slate Petrol Teal
      lightBg: '#e2f0f4',
    },
  ];

  const renderIcon = (tab: TabItemConfig, isActive: boolean) => {
    // When active: crisp solid white icon against vibrant solid color tile
    // When inactive: rich colored icon against soft tint tile
    const iconColor = isActive ? '#ffffff' : tab.fillColor;

    if (tab.family === 'FontAwesome5') {
      return (
        <FontAwesome5
          name={tab.iconName}
          size={16}
          color={iconColor}
        />
      );
    }

    return (
      <MaterialCommunityIcons
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name={tab.iconName as any}
        size={22}
        color={iconColor}
      />
    );
  };

  return (
    <View style={styles.navBar}>
      <View style={styles.innerContainer}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onSelectTab(tab.id)}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              {/* Distinctive Solid Color Fill Icon Tile for each button */}
              <View
                style={[
                  styles.iconTile,
                  {
                    backgroundColor: isActive ? tab.fillColor : tab.lightBg,
                    shadowColor: tab.fillColor,
                    elevation: isActive ? 4 : 0,
                    shadowOpacity: isActive ? 0.28 : 0,
                  },
                ]}
              >
                {renderIcon(tab, isActive)}
                {tab.id === 'applications' && pendingDocsCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingDocsCount}</Text>
                  </View>
                ) : null}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? tab.fillColor : '#64748b',
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 6,
    paddingTop: 4,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  innerContainer: {
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTile: {
    width: 44,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ee1c25',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.2,
  },
});

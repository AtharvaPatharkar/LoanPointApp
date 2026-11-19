import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cityLocationService, CityResultItem } from '../../services/cityLocationService';
import { colors } from '../../theme/colors';

interface GoogleCitySearchInputProps {
  value: string;
  onSelectCity: (cityName: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export const GoogleCitySearchInput: React.FC<GoogleCitySearchInputProps> = ({
  value,
  onSelectCity,
  placeholder = 'Type city name...',
  label,
  required = false,
}) => {
  const [inputText, setInputText] = useState<string>(value || '');
  const [suggestions, setSuggestions] = useState<CityResultItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const debounceTimer = useRef<any>(null);

  // Sync with prop when changed externally
  useEffect(() => {
    setInputText(value || '');
  }, [value]);

  const handleTextChange = (text: string) => {
    setInputText(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (text.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await cityLocationService.fetchGoogleCitySuggestions(text, 6);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch (err) {
        console.warn('City suggestion error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 280);
  };

  const handleSelect = (item: CityResultItem) => {
    setInputText(item.city);
    onSelectCity(item.city);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>
          {label} {required ? <Text style={styles.requiredStar}>*</Text> : null}
        </Text>
      ) : null}

      <View style={styles.inputBox}>
        <Ionicons name="location-outline" size={17} color={colors.primary} style={{ marginRight: 6 }} />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={inputText}
          onChangeText={handleTextChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : inputText.length > 0 ? (
          <TouchableOpacity
            onPress={() => {
              setInputText('');
              onSelectCity('');
              setSuggestions([]);
              setShowDropdown(false);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={16} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Suggestion Dropdown floating below */}
      {showDropdown && suggestions.length > 0 && (
        <View style={styles.dropdownFloating}>
          <View style={styles.dropdownHeader}>
            <Ionicons name="sparkles" size={12} color="#0284c7" />
            <Text style={styles.dropdownHeaderText}>Google Places & India Districts</Text>
          </View>
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={`${item.city}-${index}`}
              style={[styles.suggestionRow, index === suggestions.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.75}
            >
              <Ionicons name="navigate-outline" size={14} color={colors.primary} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cityNameText}>{item.city}</Text>
                {item.state ? <Text style={styles.stateNameText}>{item.state}</Text> : null}
              </View>
              <Ionicons name="arrow-forward" size={12} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 999,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  requiredStar: {
    color: '#ef4444',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    paddingVertical: 0,
  },
  dropdownFloating: {
    position: 'absolute',
    top: 66,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0284c7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
  },
  dropdownHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.3,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cityNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  stateNameText: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
  },
});

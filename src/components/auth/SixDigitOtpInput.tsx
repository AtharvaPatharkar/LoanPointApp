import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
} from 'react-native';

interface SixDigitOtpInputProps {
  value: string;
  onChangeOtp: (otp: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const SixDigitOtpInput: React.FC<SixDigitOtpInputProps> = ({
  value,
  onChangeOtp,
  disabled = false,
  autoFocus = true,
}) => {
  const inputRefs = useRef<Array<any>>([]);

  // Break input value into 6 separate character boxes
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleChangeText = (text: string, index: number) => {
    // If user pasted a full OTP or multi-digit text
    const cleanNumbers = text.replace(/\D/g, '');

    if (cleanNumbers.length > 1) {
      const newOtp = cleanNumbers.slice(0, 6);
      onChangeOtp(newOtp);

      const nextFocusIndex = Math.min(newOtp.length, 5);
      inputRefs.current[nextFocusIndex]?.focus();
      return;
    }

    // Single digit input
    const newDigits = [...digits];
    newDigits[index] = cleanNumbers;
    const combinedOtp = newDigits.join('').slice(0, 6);
    onChangeOtp(combinedOtp);

    // If a digit was entered, automatically focus next box
    if (cleanNumbers && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<any>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      // If current box is already empty, move back to previous box and clear it
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChangeOtp(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: 6 }).map((_, index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <View
            key={index}
            style={[
              styles.digitBox,
              isFilled && styles.digitBoxFilled,
              disabled && styles.digitBoxDisabled,
            ]}
          >
            <TextInput
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={styles.digitInput}
              keyboardType="number-pad"
              maxLength={index === 0 ? 6 : 1}
              value={digits[index]}
              onChangeText={(text) => handleChangeText(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              editable={!disabled}
              selectTextOnFocus
              textAlign="center"
              autoFocus={index === 0 && autoFocus}
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 18,
    width: '100%',
    paddingHorizontal: 4,
  },
  digitBox: {
    width: 48,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  digitBoxFilled: {
    borderColor: '#059669',
    backgroundColor: '#ffffff',
  },
  digitBoxDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    opacity: 0.6,
  },
  digitInput: {
    width: '100%',
    height: '100%',
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    padding: 0,
  },
});

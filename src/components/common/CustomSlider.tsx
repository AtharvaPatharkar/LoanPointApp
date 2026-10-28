import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  PanResponder,
  LayoutChangeEvent,
  GestureResponderEvent,
} from 'react-native';
import { colors } from '../../theme/colors';

interface CustomSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (val: number) => void;
  formatValue?: (val: number) => string;
  minLabel?: string;
  maxLabel?: string;
  accentColor?: string;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  minLabel,
  maxLabel,
  accentColor = 'colors.primary',
}) => {
  const [sliderWidth, setSliderWidth] = useState<number>(0);

  // Keep latest refs for PanResponder closures
  const sliderWidthRef = useRef(sliderWidth);
  sliderWidthRef.current = sliderWidth;
  const propsRef = useRef({ min, max, step, onValueChange });
  propsRef.current = { min, max, step, onValueChange };

  const calculateValueFromRatio = (ratio: number) => {
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const rawVal = propsRef.current.min + clampedRatio * (propsRef.current.max - propsRef.current.min);
    const steppedVal = Math.round(rawVal / propsRef.current.step) * propsRef.current.step;
    return Math.max(propsRef.current.min, Math.min(propsRef.current.max, steppedVal));
  };

  const handleTouch = (evt: GestureResponderEvent) => {
    if (sliderWidthRef.current <= 0) return;
    const locationX = evt.nativeEvent.locationX;
    const ratio = locationX / sliderWidthRef.current;
    const newVal = calculateValueFromRatio(ratio);
    propsRef.current.onValueChange(newVal);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleTouch(evt);
      },
      onPanResponderMove: (evt) => {
        handleTouch(evt);
      },
    })
  ).current;

  const onLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setSliderWidth(width);
  };

  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const percentage = `${(fraction * 100).toFixed(1)}%`;

  return (
    <View style={styles.container}>
      {/* Slider Interactive Track Area */}
      <View
        style={styles.touchArea}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        {/* Outer Pill Track Background */}
        <View style={styles.trackBackground}>
          {/* Active Gradient/Solid Fill */}
          <View
            style={[
              styles.trackActive,
              { width: percentage, backgroundColor: accentColor },
            ]}
          />
        </View>

        {/* Floating Glossy Thumb Knob with Drop Shadow and Halo */}
        <View
          style={[
            styles.thumb,
            {
              left: percentage,
              borderColor: accentColor,
            },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.thumbHalo, { backgroundColor: accentColor }]} />
          <View style={[styles.thumbCenter, { backgroundColor: accentColor }]} />
        </View>
      </View>

      {/* Range Min/Max Footnotes with Pill badges */}
      <View style={styles.labelsRow}>
        <View style={styles.limitPill}>
          <Text style={styles.minMaxText}>{minLabel ?? min.toString()}</Text>
        </View>
        <View style={styles.limitPill}>
          <Text style={styles.minMaxText}>{maxLabel ?? max.toString()}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 6,
  },
  touchArea: {
    height: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    height: 8,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
    width: '100%',
  },
  trackActive: {
    height: '100%',
    borderRadius: 6,
  },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 3.5,
    marginLeft: -14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 6,
  },
  thumbHalo: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    opacity: 0.15,
  },
  thumbCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  limitPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  minMaxText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
});

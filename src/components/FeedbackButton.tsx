/**
 * Floating feedback button for React Native
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import type { FeedbackButtonProps } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Floating feedback button component
 */
export function FeedbackButton({
  position = 'bottom-right',
  primaryColor = '#007AFF',
  text = 'Feedback',
  visible = true,
  style,
  onPress,
}: FeedbackButtonProps & { onPress?: () => void }) {
  const [scale] = React.useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  if (!visible) {
    return null;
  }

  const positionStyle = getPositionStyle(position);

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        { transform: [{ scale }] },
        style as ViewStyle,
      ]}
    >
      <TouchableOpacity
        style={[styles.button, { backgroundColor: primaryColor }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        accessibilityLabel="Submit feedback"
        accessibilityRole="button"
      >
        <Text style={styles.icon}>💬</Text>
        {text && <Text style={styles.text}>{text}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

function getPositionStyle(
  position: FeedbackButtonProps['position']
): ViewStyle {
  const margin = 16;

  switch (position) {
    case 'top-left':
      return { top: margin + 44, left: margin }; // 44 for status bar
    case 'top-right':
      return { top: margin + 44, right: margin };
    case 'bottom-left':
      return { bottom: margin + 34, left: margin }; // 34 for home indicator
    case 'bottom-right':
    default:
      return { bottom: margin + 34, right: margin };
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

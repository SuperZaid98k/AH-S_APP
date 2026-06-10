import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../styles/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'flat' | 'elevated' | 'premium';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
}) => {
  const cardStyle: ViewStyle[] = [styles.card];

  if (variant === 'elevated') {
    cardStyle.push(styles.elevated);
  } else if (variant === 'premium') {
    cardStyle.push(styles.premium);
  } else {
    cardStyle.push(styles.flat);
  }

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
  },
  flat: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  elevated: {
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  premium: {
    ...SHADOWS.premium,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.15)', // Subtle gold border
  },
});

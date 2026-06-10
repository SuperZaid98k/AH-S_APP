import React from 'react';
import { View, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { useTheme, BORDER_RADIUS, SPACING } from '../styles/theme';

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
  const { colors, isDarkMode } = useTheme();

  const cardStyle: ViewStyle[] = [
    {
      backgroundColor: colors.cardBg,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.lg,
    }
  ];

  if (variant === 'elevated') {
    cardStyle.push({
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.22,
      shadowRadius: 3.0,
      elevation: 3,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(226, 232, 240, 0.6)',
    });
  } else if (variant === 'premium') {
    cardStyle.push({
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 8.0,
      elevation: 8,
      borderWidth: 1,
      borderColor: 'rgba(217, 119, 6, 0.25)', // Subtle gold border
    });
  } else {
    cardStyle.push({
      borderWidth: 1,
      borderColor: colors.border,
    });
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

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { colors, isDarkMode } = useTheme();
  const isOutline = variant === 'outline';
  
  // Dynamic styling maps based on active colors
  const buttonVariantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.secondary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.secondary, // Amber outline for a gold-themed look
    },
    danger: {
      backgroundColor: colors.danger,
    },
  };

  const textVariantStyles: Record<string, TextStyle> = {
    primary: {
      color: isDarkMode ? colors.black : colors.white, // In dark mode, white background primary buttons have black text
    },
    secondary: {
      color: colors.white,
    },
    outline: {
      color: colors.secondary,
    },
    danger: {
      color: colors.white,
    },
  };

  const disabledButtonStyle: ViewStyle = {
    backgroundColor: isDarkMode ? '#2D3748' : colors.border,
    borderColor: isDarkMode ? '#2D3748' : colors.border,
    shadowOpacity: 0,
    elevation: 0,
  };

  let buttonStyle: StyleProp<ViewStyle> = [
    styles.button,
    buttonVariantStyles[variant],
  ];
  
  let fontStyle: StyleProp<TextStyle> = [
    styles.text,
    textVariantStyles[variant],
  ];

  if (disabled || loading) {
    buttonStyle.push(disabledButtonStyle);
  }

  // Determine active icon color
  let activeIconColor = colors.white;
  if (disabled) {
    activeIconColor = colors.textMuted;
  } else if (isOutline) {
    activeIconColor = colors.secondary;
  } else if (variant === 'primary' && isDarkMode) {
    activeIconColor = colors.black;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[buttonStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.secondary : activeIconColor} size="small" />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={activeIconColor}
              style={styles.icon}
            />
          )}
          <Text style={[fontStyle, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    // Dynamic shadow can be added if needed, kept basic here
  },
  text: {
    ...TYPOGRAPHY.h3,
    fontWeight: '600',
  },
  icon: {
    marginRight: SPACING.sm,
  },
});

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
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../styles/theme';

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
  const isOutline = variant === 'outline';
  
  let buttonStyle: ViewStyle[] = [styles.button];
  let fontStyle: TextStyle[] = [styles.text];

  // Apply Variant Styles
  switch (variant) {
    case 'primary':
      buttonStyle.push(styles.primaryButton);
      fontStyle.push(styles.primaryText);
      break;
    case 'secondary':
      buttonStyle.push(styles.secondaryButton);
      fontStyle.push(styles.secondaryText);
      break;
    case 'outline':
      buttonStyle.push(styles.outlineButton);
      fontStyle.push(styles.outlineText);
      break;
    case 'danger':
      buttonStyle.push(styles.dangerButton);
      fontStyle.push(styles.dangerText);
      break;
  }

  // Apply State Styles
  if (disabled || loading) {
    buttonStyle.push(styles.disabledButton);
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[buttonStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? COLORS.primary : COLORS.white} size="small" />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={
                disabled
                  ? COLORS.textMuted
                  : isOutline
                  ? COLORS.primary
                  : COLORS.white
              }
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
    ...SHADOWS.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  dangerButton: {
    backgroundColor: COLORS.danger,
  },
  disabledButton: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    ...TYPOGRAPHY.h3,
    fontWeight: '600',
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.white,
  },
  outlineText: {
    color: COLORS.primary,
  },
  dangerText: {
    color: COLORS.white,
  },
  disabledText: {
    color: COLORS.textMuted,
  },
  icon: {
    marginRight: SPACING.sm,
  },
});

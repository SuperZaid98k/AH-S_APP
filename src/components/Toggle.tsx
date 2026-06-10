import React from 'react';
import { View, Text, Switch, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../styles/theme';

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  description,
  value,
  onValueChange,
  style,
  disabled = false,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text style={[styles.label, disabled && styles.disabledText]}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: COLORS.border, true: COLORS.secondaryLight }}
        thumbColor={value ? COLORS.secondary : COLORS.textMuted}
        ios_backgroundColor={COLORS.border}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  textContainer: {
    flex: 1,
    marginRight: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  description: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
    color: COLORS.textMuted,
  },
  disabledText: {
    color: COLORS.textMuted,
  },
});

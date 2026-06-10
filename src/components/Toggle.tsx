import React from 'react';
import { View, Text, Switch, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme, SPACING, TYPOGRAPHY } from '../styles/theme';

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
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }, style]}>
      <View style={styles.textContainer}>
        <Text style={[
          styles.label, 
          { color: colors.text }, 
          disabled && { color: colors.textMuted }
        ]}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.description, { color: colors.textMuted }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.secondaryLight }}
        thumbColor={value ? colors.secondary : colors.textMuted}
        ios_backgroundColor={colors.border}
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
  },
  textContainer: {
    flex: 1,
    marginRight: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.h3,
  },
  description: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
  },
});

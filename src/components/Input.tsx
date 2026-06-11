import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardTypeOptions,
  ViewStyle,
  TextStyle,
  StyleProp,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const Input = React.forwardRef<TextInput, InputProps>(({
  label,
  value = '',
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  icon,
  onClear,
  editable = true,
  style,
  containerStyle,
  inputStyle,
  multiline = false,
  numberOfLines,
  ...restProps
}, ref) => {
  const { colors, isDarkMode } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  // Dynamic style values based on theme state
  const containerStyleDynamic: ViewStyle = {
    backgroundColor: editable ? colors.cardBg : colors.background,
    borderColor: error
      ? colors.danger
      : isFocused
      ? colors.secondary
      : colors.border,
    ...(multiline ? { height: 'auto', minHeight: 90, alignItems: 'flex-start', paddingVertical: SPACING.sm } : {}),
  };

  const labelStyleDynamic: TextStyle = {
    color: isDarkMode ? colors.text : colors.primaryLight,
  };

  const textInputStyleDynamic: TextStyle = {
    color: colors.text,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyleDynamic]}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          containerStyleDynamic,
          style,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? colors.danger : isFocused ? colors.secondary : colors.textMuted}
            style={[styles.leftIcon, multiline && { marginTop: 2 }]}
          />
        )}
        
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[styles.input, textInputStyleDynamic, !editable && { color: colors.textMuted }, inputStyle, multiline && { minHeight: 60 }]}
          {...restProps}
        />
        
        {value.length > 0 && onClear && editable && (
          <TouchableOpacity onPress={onClear} style={[styles.rightIcon, multiline && { marginTop: 2 }]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
});


const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  label: {
    ...TYPOGRAPHY.label,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  rightIcon: {
    marginLeft: SPACING.sm,
  },
  errorText: {
    fontSize: 12,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});

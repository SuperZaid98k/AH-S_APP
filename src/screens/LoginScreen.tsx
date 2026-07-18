import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../styles/theme';

export const LoginScreen = () => {
  const { login, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);

  // Shared States
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sign Up Specific States
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setPhoneOrEmail('');
  };

  const handleSubmit = async () => {
    if (isSignUp) {
      // Sign Up Logic
      if (!phoneOrEmail || !password || !name || !confirmPassword) {
        setError('Please fill in all registration fields.');
        return;
      }

      // Validate phone number format (must contain at least 10 digits)
      const digitsOnly = phoneOrEmail.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 10) {
        setError('Please enter a valid 10-digit phone number.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      setError('');
      setLoading(true);
      const result = await signUp(phoneOrEmail, password, name, role);
      setLoading(false);

      if (result.success) {
        Alert.alert(
          'Account Created',
          'Your account has been registered successfully. You can now sign in using your phone number.',
          [{ text: 'Sign In Now', onPress: handleToggleMode }]
        );
      } else {
        let msg = result.error || 'Registration failed. Please try again.';
        if (msg.includes('only request this after 2 seconds')) {
          msg = 'Signup request sent too quickly. Please wait a few seconds and try again.';
        } else if (msg.includes('Email address') && msg.includes('invalid')) {
          msg = 'The phone number format is invalid, or signups are restricted in Supabase.';
        }
        setError(msg);
      }
    } else {
      // Sign In Logic
      if (!phoneOrEmail || !password) {
        setError('Please fill in all credentials.');
        return;
      }

      setError('');
      setLoading(true);
      const result = await login(phoneOrEmail, password);
      setLoading(false);

      if (!result.success) {
        let msg = result.error || 'Login failed. Please check credentials.';
        if (msg.includes('Email not confirmed')) {
          msg = 'Account not confirmed. Please ensure verification is disabled in your Supabase Auth provider settings.';
        }
        setError(msg);
      }
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="receipt" size={42} color={COLORS.secondary} />
            </View>
            <Text style={styles.title}>AH&S Billing</Text>
            <Text style={styles.subtitle}>Ahmad Hasan & Sons</Text>
            <Text style={styles.tagline}>Towel, Lungi, Rumal,Gamcha & Shawl Wholesalers</Text>
          </View>

          <Card style={styles.loginCard}>
            <Text style={styles.cardTitle}>{isSignUp ? 'Create New Account' : 'Sign In'}</Text>

            {error ? (
              <View style={styles.errorAlert}>
                <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {isSignUp && (
              <Input
                label="Full Name / Representative"
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                icon="person-outline"
                onClear={() => setName('')}
              />
            )}

            <Input
              label={isSignUp ? "Phone Number" : "Phone Number or Email"}
              value={phoneOrEmail}
              onChangeText={setPhoneOrEmail}
              placeholder={isSignUp ? "Enter your phone number" : "Enter phone or email"}
              icon={isSignUp ? "call-outline" : "mail-outline"}
              keyboardType={isSignUp ? "phone-pad" : "default"}
              onClear={() => setPhoneOrEmail('')}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder={isSignUp ? "Create a password (min 6 chars)" : "Enter your password"}
              icon="lock-closed-outline"
              secureTextEntry
              onClear={() => setPassword('')}
            />

            {isSignUp && (
              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                icon="shield-checkmark-outline"
                secureTextEntry
                onClear={() => setConfirmPassword('')}
              />
            )}



            <Button
              title={isSignUp ? "Register Account" : "Authenticate Account"}
              onPress={handleSubmit}
              loading={loading}
              style={styles.loginButton}
            />

            <TouchableOpacity style={styles.modeSwitchBtn} onPress={handleToggleMode}>
              <Text style={styles.modeSwitchText}>
                {isSignUp ? "Already have an account? Sign In" : "Need a new account? Create Account"}
              </Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary, // Sleek slate navy background
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    marginTop: SPACING.md,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.secondary, // Amber
    fontSize: 20,
    marginTop: SPACING.xs - 2,
    fontWeight: '600',
  },
  tagline: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: SPACING.xs,
  },
  loginCard: {
    padding: SPACING.xl,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
  },
  cardTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  loginButton: {
    marginTop: SPACING.md,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.lg,
    borderColor: 'rgba(225, 29, 72, 0.2)',
    borderWidth: 1,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: SPACING.sm,
    flex: 1,
  },
  roleContainer: {
    marginBottom: SPACING.md,
  },
  roleLabel: {
    ...TYPOGRAPHY.label,
    marginBottom: SPACING.xs,
    color: COLORS.primaryLight,
  },
  rolePillsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rolePill: {
    flex: 1,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rolePillActive: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderColor: COLORS.secondary,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  rolePillTextActive: {
    color: COLORS.secondary,
  },
  modeSwitchBtn: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  modeSwitchText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '700',
  },
});

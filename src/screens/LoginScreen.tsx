import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../styles/theme';

export const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Login failed. Please try again.');
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
            <Text style={styles.tagline}>Towel, Lungi & Rumal Wholesalers</Text>
          </View>

          <Card style={styles.loginCard}>
            <Text style={styles.cardTitle}>Sign In</Text>
            
            {error ? (
              <View style={styles.errorAlert}>
                <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              icon="mail-outline"
              keyboardType="email-address"
              onClear={() => setEmail('')}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              icon="lock-closed-outline"
              secureTextEntry
              onClear={() => setPassword('')}
            />

            <Button
              title="Authenticate Account"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />
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
});

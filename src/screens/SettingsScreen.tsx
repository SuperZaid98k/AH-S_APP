import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Card } from '../components/Card';
import { Toggle } from '../components/Toggle';
import { Button } from '../components/Button';
import { useTheme, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../styles/theme';

export const SettingsScreen = () => {
  const { userProfile, logout } = useAuth();
  const { gstEnabled, toggleGst, isDarkMode, toggleTheme } = useSettings();
  const { colors } = useTheme();

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from AH&S Billing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        {/* User Profile Card */}
        <Card style={{ marginHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: isDarkMode ? '#333' : 'rgba(30, 41, 59, 0.08)' }]}>
              <Ionicons name="person" size={24} color={colors.secondary} />
            </View>
            <View style={styles.profileMeta}>
              <Text style={[styles.profileName, { color: colors.text }]}>{userProfile?.name}</Text>
              <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
                {userProfile?.email?.endsWith('@ahs-billing.com')
                  ? `Phone: ${userProfile.email.split('@')[0]}`
                  : userProfile?.email || 'Offline Representative'}
              </Text>
              <Text style={[styles.profileRole, { color: colors.secondary }]}>
                Role: {userProfile?.role === 'admin' ? 'Proprietor (Admin)' : 'Sales Agent'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Theme Preferences Card */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
        <Card style={{ marginHorizontal: SPACING.lg, paddingVertical: SPACING.xs }}>
          <Toggle
            label="Dark Mode Theme"
            description="Toggle between premium light and AMOLED dark visual interfaces."
            value={isDarkMode}
            onValueChange={toggleTheme}
            style={{ borderBottomWidth: 0 }}
          />
        </Card>

        {/* GST Billing Settings Card */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Billing Configurations</Text>
        <Card style={{ marginHorizontal: SPACING.lg, paddingVertical: SPACING.xs }}>
          <Toggle
            label="Enable Goods & Services Tax (GST)"
            description="Allows adding GST details dynamically to invoice forms."
            value={gstEnabled}
            onValueChange={toggleGst}
            style={{ borderBottomWidth: 0 }}
          />
        </Card>

        {/* Log Out Button */}
        <Button
          title="Sign Out of App"
          variant="danger"
          icon="log-out-outline"
          onPress={confirmLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollBody: {
    paddingBottom: SPACING.xxxl,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
  },
  profileEmail: {
    ...TYPOGRAPHY.bodyMuted,
    fontSize: 13,
    marginTop: 2,
  },
  profileRole: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: SPACING.xs - 2,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl * 1.5,
  },
});

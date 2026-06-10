import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Card } from '../components/Card';
import { Toggle } from '../components/Toggle';
import { Button } from '../components/Button';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../styles/theme';

export const SettingsScreen = () => {
  const { userProfile, logout } = useAuth();
  const { gstEnabled, toggleGst } = useSettings();

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from AH&S Billing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{userProfile?.name}</Text>
              <Text style={styles.profileEmail}>{userProfile?.email || 'Offline Representative'}</Text>
              <Text style={styles.profileRole}>
                Role: {userProfile?.role === 'admin' ? 'Proprietor (Admin)' : 'Sales Agent'}
              </Text>
            </View>
          </View>
        </Card>

        {/* GST Billing Settings Card */}
        <Text style={styles.sectionTitle}>Billing Configurations</Text>
        <Card style={styles.configCard}>
          <Toggle
            label="Enable Goods & Services Tax (GST)"
            description="Allows adding GST details dynamically to invoice forms."
            value={gstEnabled}
            onValueChange={toggleGst}
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
    backgroundColor: COLORS.background,
  },
  scrollBody: {
    paddingBottom: SPACING.xxxl,
  },
  profileCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(30, 41, 59, 0.08)',
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
    color: COLORS.primary,
  },
  profileEmail: {
    ...TYPOGRAPHY.bodyMuted,
    marginTop: 2,
  },
  profileRole: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    marginTop: SPACING.xs - 2,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    fontWeight: '700',
  },
  configCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.xs,
  },
  logoutBtn: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl * 1.5,
  },
});

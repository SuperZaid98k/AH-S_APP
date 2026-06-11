import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type RootStackParamList = {
  Dashboard: undefined;
  CreateInvoice: undefined;
  InvoiceHistory: undefined;
  CustomerManagement: undefined;
  Settings: undefined;
  Notepad: undefined;
  BalanceList: undefined;
};


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose }) => {
  const { colors, isDarkMode } = useTheme();
  const { userProfile, logout } = useAuth();
  const { toggleTheme } = useSettings();
  const navigation = useNavigation<NavigationProp>();
  
  const [shouldRender, setShouldRender] = useState(isOpen);
  
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const navigateTo = (screenName: keyof RootStackParamList) => {
    onClose();
    // Use setTimeout to allow drawer closing animation to finish before screen transition
    setTimeout(() => {
      navigation.navigate(screenName);
    }, 150);
  };

  const handleSignOut = () => {
    onClose();
    setTimeout(() => {
      logout();
    }, 150);
  };

  return (
    <View style={styles.container}>
      {/* Semi-transparent Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Drawer Menu Body */}
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: colors.cardBg,
            transform: [{ translateX: slideAnim }],
            borderRightColor: colors.border,
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.brandTitle, { color: colors.text }]}>AH&S BILLING</Text>
              <Text style={[styles.brandSub, { color: colors.secondary }]}>Ahmad Hasan & Sons</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* User Profile Block */}
          {userProfile && (
            <View style={[styles.profileBlock, { backgroundColor: isDarkMode ? '#222' : '#F1F5F9' }]}>
              <View style={[styles.profileAvatar, { backgroundColor: colors.secondary }]}>
                <Text style={styles.avatarText}>
                  {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View style={styles.profileMeta}>
                <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
                  {userProfile.name}
                </Text>
                <View style={[styles.roleTag, { backgroundColor: isDarkMode ? '#333' : 'rgba(30, 41, 59, 0.08)' }]}>
                  <Text style={[styles.roleText, { color: isDarkMode ? colors.secondary : colors.primary }]}>
                    {userProfile.role === 'admin' ? 'Proprietor' : 'Sales Agent'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Menu Items */}
          <View style={styles.menuList}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Dashboard')}>
              <Ionicons name="home-outline" size={22} color={colors.secondary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.text }]}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('CreateInvoice')}>
              <Ionicons name="add-circle-outline" size={22} color={colors.secondary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.text }]}>Create Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('InvoiceHistory')}>
              <Ionicons name="receipt-outline" size={22} color={colors.secondary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.text }]}>Invoice History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('CustomerManagement')}>
              <Ionicons name="people-outline" size={22} color={colors.secondary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.text }]}>Customer Database</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Settings')}>
              <Ionicons name="settings-outline" size={22} color={colors.secondary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.text }]}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Notepad')}>
              <Ionicons name="journal-outline" size={22} color={colors.secondary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.text }]}>Notepad</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('BalanceList')}>
              <Ionicons name="wallet-outline" size={22} color={colors.secondary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.text }]}>Balance Ledger</Text>
            </TouchableOpacity>

          </View>

          {/* Footer Area */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {/* Quick Theme Toggle */}
            <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme} activeOpacity={0.8}>
              <View style={styles.themeToggleLeft}>
                <Ionicons
                  name={isDarkMode ? 'moon' : 'sunny-outline'}
                  size={20}
                  color={isDarkMode ? colors.secondary : '#EAB308'}
                />
                <Text style={[styles.themeToggleText, { color: colors.text }]}>Dark Mode</Text>
              </View>
              <View style={[
                styles.switchTrack,
                { backgroundColor: isDarkMode ? colors.secondary : colors.border }
              ]}>
                <View style={[
                  styles.switchThumb,
                  {
                    backgroundColor: colors.white,
                    alignSelf: isDarkMode ? 'flex-end' : 'flex-start'
                  }
                ]} />
              </View>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={22} color={colors.danger} />
              <Text style={[styles.signOutText, { color: colors.danger }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
    zIndex: 9999,
    flexDirection: 'row',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 16,
  },
  safeArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '800',
  },
  profileMeta: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
  },
  roleTag: {
    borderRadius: BORDER_RADIUS.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  menuList: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xs,
  },
  menuIcon: {
    marginRight: SPACING.lg,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    padding: SPACING.lg,
  },
  themeToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  themeToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.md,
  },
  switchTrack: {
    width: 40,
    height: 22,
    borderRadius: 11,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: SPACING.lg,
  },
});

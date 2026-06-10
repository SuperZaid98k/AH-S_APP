import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Context Providers
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';

// Screens
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { CustomerManagementScreen } from './src/screens/CustomerManagementScreen';
import { CreateInvoiceScreen } from './src/screens/CreateInvoiceScreen';
import { InvoiceHistoryScreen } from './src/screens/InvoiceHistoryScreen';
import { InvoiceDetailsScreen } from './src/screens/InvoiceDetailsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { NotepadScreen } from './src/screens/NotepadScreen';


// Theme
import { COLORS, TYPOGRAPHY } from './src/styles/theme';

import { useTheme } from './src/styles/theme';
import { useSettings } from './src/context/SettingsContext';

type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  CustomerManagement: undefined;
  CreateInvoice: { editInvoiceId?: string };
  InvoiceHistory: undefined;
  InvoiceDetails: { invoiceId: string };
  Settings: undefined;
  Notepad: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return null; // The framework will display native splash screen during boot load
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.cardBg,
        },
        headerTitleStyle: {
          ...TYPOGRAPHY.h3,
          fontSize: 16,
          fontWeight: '700',
          color: colors.text,
        },
        headerTintColor: colors.secondary,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ title: 'AH&S Billing' }}
          />
          <Stack.Screen
            name="CreateInvoice"
            component={CreateInvoiceScreen}
            options={({ route }) => ({
              title: route.params?.editInvoiceId ? 'Edit Invoice' : 'Create Invoice',
            })}
          />
          <Stack.Screen
            name="InvoiceHistory"
            component={InvoiceHistoryScreen}
            options={{ title: 'Invoice Ledger' }}
          />
          <Stack.Screen
            name="CustomerManagement"
            component={CustomerManagementScreen}
            options={{ title: 'Customer Database' }}
          />
          <Stack.Screen
            name="InvoiceDetails"
            component={InvoiceDetailsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Application Settings' }}
          />
          <Stack.Screen
            name="Notepad"
            component={NotepadScreen}
            options={{ title: 'AH&S Notepad' }}
          />

        </>
      )}
    </Stack.Navigator>
  );
};

const AppContent = () => {
  const { isDarkMode } = useSettings();
  return (
    <NavigationContainer>
      <RootNavigator />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

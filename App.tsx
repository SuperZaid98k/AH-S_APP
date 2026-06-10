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

// Theme
import { COLORS, TYPOGRAPHY } from './src/styles/theme';

type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  CustomerManagement: undefined;
  CreateInvoice: { editInvoiceId?: string };
  InvoiceHistory: undefined;
  InvoiceDetails: { invoiceId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // The framework will display native splash screen during boot load
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTitleStyle: {
          ...TYPOGRAPHY.h3,
          fontSize: 16,
          fontWeight: '700',
        },
        headerTintColor: COLORS.primary,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: COLORS.background,
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
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SettingsProvider>
          <NavigationContainer>
            <RootNavigator />
            <StatusBar style="dark" />
          </NavigationContainer>
        </SettingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

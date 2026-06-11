import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { db } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useTheme, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../styles/theme';
import { formatCurrency, formatDate } from '../utils/helpers';

type RootStackParamList = {
  Dashboard: undefined;
  InvoiceDetails: { invoiceId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BalanceListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userProfile } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  const fetchBalanceInvoices = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const { data, error } = await db.getInvoices(userProfile.role, userProfile.id);
      if (!error && data) {
        // Filter for balance invoices only
        const balanceOnly = data.filter((inv: any) => inv.status === 'balance');
        setInvoices(balanceOnly);
        setFilteredInvoices(balanceOnly);

        // Sum outstanding total
        const total = balanceOnly.reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
        setTotalOutstanding(total);
      }
    } catch (e) {
      console.error('Failed to load balance ledger:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBalanceInvoices();
    }, [userProfile])
  );

  // Search filter
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredInvoices(invoices);
    } else {
      const query = search.toLowerCase();
      const filtered = invoices.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(query) ||
          inv.customer_name.toLowerCase().includes(query)
      );
      setFilteredInvoices(filtered);
    }
  }, [search, invoices]);

  // Configure back navigation
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Dashboard')}
          style={{ marginLeft: SPACING.md, padding: SPACING.xs }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  const handleMarkAsPaid = (invoiceId: string, invoiceNumber: string) => {
    Alert.alert(
      'Mark as Paid',
      `Are you sure you want to mark invoice ${invoiceNumber} as fully paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await db.updateInvoiceStatus(invoiceId, 'paid');
              if (error) {
                Alert.alert('Database Error', 'Failed to update payment status.');
              } else {
                Alert.alert('Success', 'Invoice status updated to Paid.');
                fetchBalanceInvoices();
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'An unexpected error occurred.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const styles = getStyles(colors, isDarkMode);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Outstanding Total Card */}
      <Card style={styles.outstandingCard} variant="premium">
        <Text style={styles.outstandingLabel}>TOTAL OUTSTANDING BALANCE</Text>
        <Text style={styles.outstandingVal}>{formatCurrency(totalOutstanding)}</Text>
        <Text style={styles.outstandingSub}>Outstanding dues across {invoices.length} billing statements</Text>
      </Card>

      {/* Search Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search by invoice number, customer..."
          icon="search-outline"
          onClear={() => setSearch('')}
          containerStyle={styles.searchBar}
        />
      </View>

      {/* Balance List */}
      {loading && invoices.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Compiling ledger data...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchBalanceInvoices}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Ionicons name="shield-checkmark-outline" size={48} color={colors.success} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {search ? 'No dues matching search.' : 'All clear! No outstanding balances found.'}
              </Text>
            </Card>
          }
          renderItem={({ item }) => (
            <Card
              style={styles.invoiceCard}
              onPress={() => navigation.navigate('InvoiceDetails', { invoiceId: item.id })}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.invoiceNum, { color: colors.text }]}>
                    {item.invoice_number}
                  </Text>
                  <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>
                    {item.customer_name}
                  </Text>
                  <Text style={[styles.invoiceDate, { color: colors.textMuted }]}>
                    Dues since: {formatDate(item.date)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.invoiceTotal, { color: colors.danger }]}>
                    {formatCurrency(item.total)}
                  </Text>
                  <TouchableOpacity
                    style={[styles.markPaidBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}
                    onPress={() => handleMarkAsPaid(item.id, item.invoice_number)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={13} color={colors.success} />
                    <Text style={[styles.markPaidText, { color: colors.success }]}>Mark Paid</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  outstandingCard: {
    margin: SPACING.lg,
    padding: SPACING.xl,
    backgroundColor: isDarkMode ? colors.cardBg : '#1E293B',
    alignItems: 'center',
  },
  outstandingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  outstandingVal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F59E0B', // Bright Gold/Yellow
    marginBottom: 6,
  },
  outstandingSub: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
  },
  searchBar: {
    marginBottom: SPACING.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.bodyMuted,
    marginTop: SPACING.md,
  },
  listContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyText: {
    ...TYPOGRAPHY.bodyMuted,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  invoiceCard: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceNum: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    fontWeight: '700',
  },
  customerName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginTop: 2,
  },
  invoiceDate: {
    ...TYPOGRAPHY.caption,
    marginTop: 4,
  },
  invoiceTotal: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  markPaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.xs,
    gap: 4,
  },
  markPaidText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

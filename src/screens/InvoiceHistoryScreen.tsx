import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { db } from '../api/supabase';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { DatePickerModal } from '../components/DatePickerModal';
import { useTheme, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../styles/theme';
import { formatCurrency, formatDate } from '../utils/helpers';

type RootStackParamList = {
  InvoiceDetails: { invoiceId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const InvoiceHistoryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userProfile } = useAuth();
  const { colors, isDarkMode } = useTheme();
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Date Filtering State
  const [activePreset, setActivePreset] = useState<string>('All');
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [showFromPicker, setShowFromPicker] = useState<boolean>(false);
  const [showToPicker, setShowToPicker] = useState<boolean>(false);

  const fetchInvoices = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const { data, error } = await db.getInvoices(userProfile.role, userProfile.id);
      if (!error && data) {
        setInvoices(data);
        setFilteredInvoices(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [userProfile]);

  // Compute start/end bounds for active preset
  const dateRange = useMemo(() => {
    if (activePreset === 'All') return null;

    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (activePreset) {
      case 'Today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'Yesterday':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'This Week': {
        const day = now.getDay();
        start.setDate(now.getDate() - day);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() + (6 - day));
        end.setHours(23, 59, 59, 999);
        break;
      }
      case 'This Month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'Last Month':
        start.setMonth(now.getMonth() - 1);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth());
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'This Year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      case 'Custom': {
        const customStart = new Date(fromDate);
        customStart.setHours(0, 0, 0, 0);
        const customEnd = new Date(toDate);
        customEnd.setHours(23, 59, 59, 999);
        return { start: customStart, end: customEnd };
      }
      default:
        return null;
    }
    return { start, end };
  }, [activePreset, fromDate, toDate]);

  // Integrated Search & Date range Filtering
  useEffect(() => {
    let result = invoices;

    // Apply Date Filter
    if (dateRange) {
      const { start, end } = dateRange;
      result = result.filter(inv => {
        const invoiceDate = new Date(inv.date);
        return invoiceDate >= start && invoiceDate <= end;
      });
    }

    // Apply Search Filter
    if (search.trim() !== '') {
      const query = search.toLowerCase();
      result = result.filter(
        inv =>
          inv.invoice_number.toLowerCase().includes(query) ||
          inv.customer_name.toLowerCase().includes(query)
      );
    }

    setFilteredInvoices(result);
  }, [search, invoices, dateRange]);

  // Derived Totals
  const totalCount = filteredInvoices.length;
  const totalAmount = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  }, [filteredInvoices]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search & Filter Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search invoice number, customer..."
          icon="search-outline"
          onClear={() => setSearch('')}
          containerStyle={styles.searchBar}
        />

        {/* Predefined Date Filters Scrollable Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetScroll}
        >
          {['All', 'Today', 'Yesterday', 'This Week', 'This Month', 'Last Month', 'This Year', 'Custom'].map((preset) => {
            const isActive = activePreset === preset;
            return (
              <TouchableOpacity
                key={preset}
                onPress={() => setActivePreset(preset)}
                style={[
                  styles.presetChip,
                  { borderColor: colors.border },
                  isActive && { backgroundColor: colors.secondary, borderColor: colors.secondary },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    { color: colors.textMuted },
                    isActive && { color: colors.white, fontWeight: '700' },
                  ]}
                >
                  {preset}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Custom Range Fields */}
        {activePreset === 'Custom' && (
          <View style={styles.customRangeContainer}>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowFromPicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={15} color={colors.secondary} />
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                From: {fromDate.toLocaleDateString('en-IN')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowToPicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={15} color={colors.secondary} />
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                To: {toDate.toLocaleDateString('en-IN')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filter Summary Stats Banner */}
        <View style={[styles.summaryBanner, { backgroundColor: isDarkMode ? '#222' : '#F1F5F9' }]}>
          <View style={styles.summaryStats}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
              Filtered: <Text style={[styles.summaryValue, { color: colors.text }]}>{totalCount} Bills</Text>
            </Text>
            <View style={[styles.dividerDot, { backgroundColor: colors.border }]} />
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
              Volume: <Text style={[styles.summaryValue, { color: colors.secondary }]}>{formatCurrency(totalAmount)}</Text>
            </Text>
          </View>
          {(activePreset !== 'All' || search !== '') && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                setActivePreset('All');
                setSearch('');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={14} color={colors.danger} />
              <Text style={[styles.clearBtnText, { color: colors.danger }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Invoice List */}
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={fetchInvoices}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No matching invoices found.</Text>
          </Card>
        }
        renderItem={({ item }) => {
          const sellerName = item.created_by === 'usr_admin' || item.created_by?.includes('admin')
            ? 'Admin'
            : 'Sales Desk';

          return (
            <Card
              style={styles.invoiceCard}
              onPress={() => navigation.navigate('InvoiceDetails', { invoiceId: item.id })}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.invoiceNum, { color: isDarkMode ? colors.white : colors.primary }]}>
                    {item.invoice_number}
                  </Text>
                  <Text style={[styles.customerName, { color: colors.text }]}>{item.customer_name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.invoiceTotal, { color: colors.secondary }]}>
                    {formatCurrency(item.total)}
                  </Text>
                  <View style={styles.badgeRow}>
                    <View style={[
                      styles.badge, 
                      { backgroundColor: item.status === 'balance' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' }
                    ]}>
                      <Text style={[styles.badgeText, { color: item.status === 'balance' ? colors.danger : colors.success }]}>
                        {item.status === 'balance' ? 'BAL' : 'PAID'}
                      </Text>
                    </View>
                    {item.gst_enabled && item.gst_amount > 0 ? (
                      <View style={[
                        styles.badge, 
                        { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.1)' }
                      ]}>
                        <Text style={[styles.badgeText, { color: colors.success }]}>GST</Text>
                      </View>
                    ) : null}
                    {item.discount > 0 ? (
                      <View style={[
                        styles.badge, 
                        { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(225, 29, 72, 0.1)' }
                      ]}>
                        <Text style={[styles.badgeText, { color: colors.danger }]}>DSC</Text>
                      </View>
                    ) : null}
                  </View>

                </View>
              </View>

              <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

              <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.footerText, { color: colors.textMuted }]}>
                    {new Date(item.date).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                
                {userProfile?.role === 'admin' ? (
                  <View style={styles.footerInfo}>
                    <Ionicons name="person-outline" size={13} color={colors.textMuted} />
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>Seller: {sellerName}</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          );
        }}
      />

      {/* Date Pickers */}
      <DatePickerModal
        visible={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        selectedDate={fromDate}
        onSelectDate={setFromDate}
        title="Select Start Date"
      />
      <DatePickerModal
        visible={showToPicker}
        onClose={() => setShowToPicker(false)}
        selectedDate={toDate}
        onSelectDate={setToDate}
        title="Select End Date"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderBottomWidth: 1,
  },
  searchBar: {
    marginBottom: SPACING.sm,
  },
  presetScroll: {
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  presetChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    marginRight: 6,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.xs,
    paddingVertical: SPACING.sm - 2,
    gap: 6,
  },
  dateButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginTop: 4,
    marginBottom: SPACING.sm,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryValue: {
    fontWeight: '700',
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
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
  },
  invoiceCard: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceNum: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
  },
  customerName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginTop: 2,
  },
  invoiceTotal: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: SPACING.xs,
  },
  badge: {
    borderRadius: BORDER_RADIUS.xs - 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  cardDivider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    marginLeft: 4,
    fontWeight: '500',
  },
});

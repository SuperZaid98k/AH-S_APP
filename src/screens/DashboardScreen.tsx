import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { db } from '../api/supabase';
import { Card } from '../components/Card';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { formatCurrency } from '../utils/helpers';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Dashboard: undefined;
  CreateInvoice: undefined;
  InvoiceHistory: undefined;
  CustomerManagement: undefined;
  Settings: undefined;
  InvoiceDetails: { invoiceId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DashboardScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  // Analytics State
  const [totalSales, setTotalSales] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [avgInvoice, setAvgInvoice] = useState(0);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [salesByUser, setSalesByUser] = useState<Record<string, { name: string; amount: number; count: number }>>({});

  const loadDashboardData = useCallback(async () => {
    if (!userProfile) return;
    
    setRefreshing(true);
    try {
      const { data: invoices } = await db.getInvoices(userProfile.role, userProfile.id);
      
      if (invoices && invoices.length > 0) {
        const total = invoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
        setTotalSales(total);
        setInvoiceCount(invoices.length);
        setAvgInvoice(total / invoices.length);
        setRecentInvoices(invoices.slice(0, 3)); // Pick 3 most recent

        // Calculate sales breakdown by user if admin
        if (userProfile.role === 'admin') {
          const breakdown: typeof salesByUser = {};
          
          for (const inv of invoices) {
            const userName = inv.customer_name || 'System'; // placeholder
            const userKey = inv.created_by || 'unknown';
            
            // In a real database, we would join profiles. For mock/sim we can parse or use default descriptors
            let sellerName = 'Sales Desk';
            if (userKey === 'usr_admin' || userKey.includes('admin')) {
              sellerName = 'Ahmad Hasan (Admin)';
            } else if (userKey === 'usr_sales_1' || userKey.includes('sales')) {
              sellerName = 'Zaid Hasan (Sales)';
            } else {
              sellerName = inv.customer_name || 'Agent User';
            }

            if (!breakdown[userKey]) {
              breakdown[userKey] = { name: sellerName, amount: 0, count: 0 };
            }
            breakdown[userKey].amount += Number(inv.total);
            breakdown[userKey].count += 1;
          }
          setSalesByUser(breakdown);
        }
      } else {
        setTotalSales(0);
        setInvoiceCount(0);
        setAvgInvoice(0);
        setRecentInvoices([]);
        setSalesByUser({});
      }
    } catch (e) {
      console.error('Failed to compile dashboard metrics:', e);
    } finally {
      setRefreshing(false);
    }
  }, [userProfile]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreet}>Assalamu Alaikum,</Text>
          <Text style={styles.headerUser}>{userProfile?.name}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>
              {userProfile?.role === 'admin' ? 'Proprietor / Admin' : 'Sales Representative'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} />}
      >
        {/* Analytics Section */}
        <Text style={styles.sectionTitle}>Sales Summary</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.analyticsScroll}
        >
          <Card style={[styles.kpiCard, { backgroundColor: COLORS.primary }]} variant="premium">
            <Ionicons name="cash-outline" size={24} color={COLORS.secondary} />
            <Text style={styles.kpiValue}>{formatCurrency(totalSales)}</Text>
            <Text style={styles.kpiLabel}>Total Revenue</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
            <Text style={[styles.kpiValue, { color: COLORS.primary }]}>{invoiceCount}</Text>
            <Text style={[styles.kpiLabel, { color: COLORS.textMuted }]}>Total Invoices</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <Ionicons name="calculator-outline" size={24} color={COLORS.primary} />
            <Text style={[styles.kpiValue, { color: COLORS.primary }]}>{formatCurrency(avgInvoice)}</Text>
            <Text style={[styles.kpiLabel, { color: COLORS.textMuted }]}>Average Ticket</Text>
          </Card>
        </ScrollView>

        {/* Quick Menu Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={[styles.gridItem, { width: width - SPACING.lg * 2 }]}
            onPress={() => navigation.navigate('CreateInvoice')}
          >
            <View style={[styles.gridIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
              <Ionicons name="add-circle" size={28} color={COLORS.secondary} />
            </View>
            <Text style={styles.gridLabel}>Create Invoice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('InvoiceHistory')}
          >
            <View style={[styles.gridIconBox, { backgroundColor: 'rgba(30, 41, 59, 0.1)' }]}>
              <Ionicons name="list" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.gridLabel}>History / Search</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('CustomerManagement')}
          >
            <View style={[styles.gridIconBox, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
              <Ionicons name="people-outline" size={28} color={COLORS.info} />
            </View>
            <Text style={styles.gridLabel}>Customers Database</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Sales Breakdown */}
        {userProfile?.role === 'admin' && Object.keys(salesByUser).length > 0 && (
          <View style={styles.breakdownSection}>
            <Text style={styles.sectionTitle}>Sales Desk Breakdown</Text>
            <Card style={styles.breakdownCard}>
              {Object.values(salesByUser).map((seller: any, idx) => (
                <View key={idx} style={styles.sellerRow}>
                  <View style={styles.sellerMeta}>
                    <Ionicons name="person-circle-outline" size={22} color={COLORS.textMuted} />
                    <Text style={styles.sellerName}>{seller.name}</Text>
                  </View>
                  <View style={styles.sellerData}>
                    <Text style={styles.sellerAmt}>{formatCurrency(seller.amount)}</Text>
                    <Text style={styles.sellerCount}>{seller.count} Bills</Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Recent Invoices list */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Invoices</Text>
            <TouchableOpacity onPress={() => navigation.navigate('InvoiceHistory')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentInvoices.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No invoices generated yet.</Text>
            </Card>
          ) : (
            recentInvoices.map((item, index) => (
              <Card
                key={index}
                style={styles.recentItem}
                onPress={() => navigation.navigate('InvoiceDetails', { invoiceId: item.id })}
              >
                <View style={styles.recentLeft}>
                  <Text style={styles.invoiceNum}>{item.invoice_number}</Text>
                  <Text style={styles.customerName}>{item.customer_name}</Text>
                  <Text style={styles.invoiceDate}>
                    {new Date(item.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
                <View style={styles.recentRight}>
                  <Text style={styles.invoiceTotal}>{formatCurrency(item.total)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerGreet: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  headerUser: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    color: COLORS.primary,
  },
  roleTag: {
    backgroundColor: 'rgba(30, 41, 59, 0.08)',
    borderRadius: BORDER_RADIUS.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginTop: SPACING.xs - 2,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scrollBody: {
    paddingBottom: SPACING.xxxl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    fontWeight: '700',
  },
  analyticsScroll: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  kpiCard: {
    width: width * 0.44,
    marginRight: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    justifyContent: 'center',
    minHeight: 120,
  },
  kpiValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '800',
    marginVertical: SPACING.xs,
  },
  kpiLabel: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg - 4,
    gap: SPACING.md,
  },
  gridItem: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  gridIconBox: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  gridLabel: {
    ...TYPOGRAPHY.h3,
    fontSize: 13,
    color: COLORS.primary,
    textAlign: 'center',
  },
  breakdownSection: {
    marginTop: SPACING.xs,
  },
  breakdownCard: {
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    color: COLORS.primary,
  },
  sellerData: {
    alignItems: 'flex-end',
  },
  sellerAmt: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  sellerCount: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  recentSection: {
    marginTop: SPACING.xs,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: SPACING.lg,
  },
  viewAllText: {
    color: COLORS.secondary,
    fontWeight: '700',
    marginTop: SPACING.lg,
    fontSize: 13,
  },
  emptyCard: {
    marginHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.white,
  },
  emptyText: {
    ...TYPOGRAPHY.bodyMuted,
    marginTop: SPACING.sm,
  },
  recentItem: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  recentLeft: {
    flex: 1,
  },
  invoiceNum: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  customerName: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 2,
  },
  invoiceDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  recentRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoiceTotal: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
    marginRight: SPACING.sm,
  },
});

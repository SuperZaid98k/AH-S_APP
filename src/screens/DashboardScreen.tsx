import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { db } from '../api/supabase';
import { Card } from '../components/Card';
import { Drawer } from '../components/Drawer';
import { useTheme, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';
import { formatCurrency } from '../utils/helpers';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Dashboard: undefined;
  CreateInvoice: undefined;
  InvoiceHistory: undefined;
  CustomerManagement: undefined;
  Settings: undefined;
  InvoiceDetails: { invoiceId: string };
  BalanceList: undefined;
};


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DashboardScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userProfile } = useAuth();
  const { colors, isDarkMode } = useTheme();
  
  const [refreshing, setRefreshing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Analytics State
  const [totalSales, setTotalSales] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [salesByUser, setSalesByUser] = useState<Record<string, { name: string; amount: number; count: number }>>({});


  // Configure Hamburger Menu icon in the Navigation Header
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => setIsDrawerOpen(true)}
          style={{ marginLeft: SPACING.md, padding: SPACING.xs }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu-outline" size={26} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  const loadDashboardData = useCallback(async () => {
    if (!userProfile) return;
    
    setRefreshing(true);
    try {
      const { data: invoices } = await db.getInvoices(userProfile.role, userProfile.id);
      
      if (invoices && invoices.length > 0) {
        const total = invoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
        setTotalSales(total);
        setInvoiceCount(invoices.length);
        setRecentInvoices(invoices.slice(0, 3)); // Pick 3 most recent

        // Calculate outstanding balance total
        const balanceTotal = invoices
          .filter((inv: any) => inv.status === 'balance')
          .reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
        setOutstandingBalance(balanceTotal);


        // Calculate sales breakdown by user if admin
        if (userProfile.role === 'admin') {
          const breakdown: typeof salesByUser = {};
          
          for (const inv of invoices) {
            const userKey = inv.created_by || 'unknown';
            
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
        setOutstandingBalance(0);
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={loadDashboardData} 
            tintColor={colors.secondary} 
            colors={[colors.secondary]} 
          />
        }
      >
        {/* PREMIUM HERO CARD: Mimicking the user's provided mockup image */}
        <View style={styles.heroCardContainer}>
          <View style={styles.heroCard}>
            {/* Gold Badge */}
            <View style={styles.sinceBadge}>
              <Text style={styles.sinceBadgeText}>SINCE 1980</Text>
            </View>

            {/* Branding Titles */}
            <Text style={styles.brandTitleText}>Ahmad Hasan &</Text>
            <Text style={styles.brandTitleText}>Sons</Text>
            <Text style={styles.brandAccentText}>Handloom</Text>

            {/* Description Slogan */}
            <Text style={styles.brandSlogan}>
              Excellence in Towels, Lungis, and Rumals. Woven with tradition, made with pride.
            </Text>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={styles.heroPrimaryBtn}
              onPress={() => navigation.navigate('CreateInvoice')}
              activeOpacity={0.9}
            >
              <Ionicons name="add" size={20} color="#000000" style={{ marginRight: 6 }} />
              <Text style={styles.heroPrimaryBtnText}>Create New Bill</Text>
            </TouchableOpacity>

            {/* Secondary Action Button */}
            <TouchableOpacity
              style={styles.heroSecondaryBtn}
              onPress={() => navigation.navigate('CustomerManagement')}
              activeOpacity={0.9}
            >
              <Text style={styles.heroSecondaryBtnText}>Customer Database</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* STATS STRIP */}
        <View style={styles.statsStrip}>
          <Card style={[styles.statBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]} variant="elevated">
            <Text style={[styles.statVal, { color: colors.secondary }]}>{invoiceCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Today's Bills</Text>
          </Card>
          <Card style={[styles.statBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]} variant="elevated">
            <Text style={[styles.statVal, { color: colors.secondary }]}>{formatCurrency(totalSales)}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Sales</Text>
          </Card>
        </View>

        {/* QUICK MENU: Terminal Rows */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
        
        {/* Billing Terminal Row: Matches Mockup cart row */}
        <TouchableOpacity
          style={[styles.terminalRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
          onPress={() => navigation.navigate('CreateInvoice')}
          activeOpacity={0.8}
        >
          <View style={styles.terminalRowLeft}>
            <View style={styles.terminalCartIconBox}>
              <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.terminalRowTitle, { color: colors.text }]}>Billing Terminal</Text>
              <Text style={styles.terminalRowSub}>NEW SALE ENTRY</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Ledger Book Row */}
        <TouchableOpacity
          style={[styles.terminalRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
          onPress={() => navigation.navigate('InvoiceHistory')}
          activeOpacity={0.8}
        >
          <View style={styles.terminalRowLeft}>
            <View style={[styles.terminalCartIconBox, { backgroundColor: '#2C3E50' }]}>
              <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.terminalRowTitle, { color: colors.text }]}>Ledger Book</Text>
              <Text style={styles.terminalRowSub}>INVOICE LEDGER & SEARCH</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Customer Database Row */}
        <TouchableOpacity
          style={[styles.terminalRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
          onPress={() => navigation.navigate('CustomerManagement')}
          activeOpacity={0.8}
        >
          <View style={styles.terminalRowLeft}>
            <View style={[styles.terminalCartIconBox, { backgroundColor: '#1E3A8A' }]}>
              <Ionicons name="people-outline" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.terminalRowTitle, { color: colors.text }]}>Customer Registry</Text>
              <Text style={styles.terminalRowSub}>MANAGE CLIENT LIST</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Balance Ledger Row */}
        <TouchableOpacity
          style={[styles.terminalRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
          onPress={() => navigation.navigate('BalanceList')}
          activeOpacity={0.8}
        >
          <View style={styles.terminalRowLeft}>
            <View style={[styles.terminalCartIconBox, { backgroundColor: '#B91C1C' }]}>
              <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.terminalRowTitle, { color: colors.text }]}>Balance Ledger</Text>
              <Text style={styles.terminalRowSub}>
                OUTSTANDING BALANCE: {formatCurrency(outstandingBalance)}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>




        {/* Recent Invoices list */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Invoices</Text>
            <TouchableOpacity onPress={() => navigation.navigate('InvoiceHistory')}>
              <Text style={[styles.viewAllText, { color: colors.secondary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentInvoices.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No invoices generated today.</Text>
            </Card>
          ) : (
            recentInvoices.map((item, index) => (
              <Card
                key={index}
                style={[styles.recentItem, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                onPress={() => navigation.navigate('InvoiceDetails', { invoiceId: item.id })}
              >
                <View style={styles.recentLeft}>
                  <Text style={[styles.invoiceNum, { color: colors.text }]}>{item.invoice_number}</Text>
                  <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>
                    {item.customer_name}
                  </Text>
                  <Text style={[styles.invoiceDate, { color: colors.textMuted }]}>
                    {new Date(item.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
                <View style={styles.recentRight}>
                  <Text style={[styles.invoiceTotal, { color: colors.secondary }]}>{formatCurrency(item.total)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Slide-out Hamburger Menu Drawer Overlay */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
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
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroCardContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  heroCard: {
    backgroundColor: '#0F0F0F', // Solid AMOLED Dark in the mockup image
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  sinceBadge: {
    borderWidth: 1,
    borderColor: '#D97706', // Gold border
    borderRadius: 20,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 4,
    marginBottom: SPACING.md,
  },
  sinceBadgeText: {
    color: '#D97706', // Gold text
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  brandTitleText: {
    fontSize: 27,
    fontWeight: '800',
    color: '#FFFFFF', // White text
    textAlign: 'center',
    lineHeight: 33,
    letterSpacing: 0.2,
  },
  brandAccentText: {
    fontSize: 24,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#F59E0B', // Amber Gold text
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  brandSlogan: {
    fontSize: 13.5,
    color: '#94A3B8', // Muted text
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  heroPrimaryBtn: {
    backgroundColor: '#FBBF24', // Warm Gold/Yellow background
    borderRadius: BORDER_RADIUS.md,
    height: 48,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heroPrimaryBtnText: {
    color: '#000000', // Black text
    fontSize: 15,
    fontWeight: '800',
  },
  heroSecondaryBtn: {
    backgroundColor: '#1E1E1E', // Dark grey background
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: BORDER_RADIUS.md,
    height: 48,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSecondaryBtnText: {
    color: '#FFFFFF', // White text
    fontSize: 15,
    fontWeight: '700',
  },
  statsStrip: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  statBox: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  terminalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  terminalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  terminalCartIconBox: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: '#3D2F1D', // Dark brown gold bg for shopping cart row
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  terminalRowTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  terminalRowSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  breakdownSection: {
    marginTop: SPACING.xs,
  },
  breakdownCard: {
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderWidth: 1,
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  sellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  sellerData: {
    alignItems: 'flex-end',
  },
  sellerAmt: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
  },
  sellerCount: {
    fontSize: 10,
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
    fontWeight: '700',
    marginTop: SPACING.lg,
    fontSize: 13,
  },
  emptyCard: {
    marginHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    borderWidth: 1,
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
    borderWidth: 1,
  },
  recentLeft: {
    flex: 1,
  },
  invoiceNum: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    fontWeight: '700',
  },
  customerName: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    marginTop: 2,
  },
  invoiceDate: {
    ...TYPOGRAPHY.caption,
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
    marginRight: SPACING.sm,
  },
});

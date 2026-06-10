import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { db } from '../api/supabase';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../styles/theme';
import { formatCurrency, formatDate } from '../utils/helpers';

type RootStackParamList = {
  InvoiceDetails: { invoiceId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const InvoiceHistoryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userProfile } = useAuth();
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredInvoices(invoices);
    } else {
      const query = search.toLowerCase();
      const filtered = invoices.filter(
        inv =>
          inv.invoice_number.toLowerCase().includes(query) ||
          inv.customer_name.toLowerCase().includes(query)
      );
      setFilteredInvoices(filtered);
    }
  }, [search, invoices]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search invoice number, customer..."
          icon="search-outline"
          onClear={() => setSearch('')}
          containerStyle={styles.searchBar}
        />
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
            <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No matching invoices found.</Text>
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
                  <Text style={styles.invoiceNum}>{item.invoice_number}</Text>
                  <Text style={styles.customerName}>{item.customer_name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.invoiceTotal}>{formatCurrency(item.total)}</Text>
                  <View style={styles.badgeRow}>
                    {item.gst_enabled && item.gst_amount > 0 ? (
                      <View style={[styles.badge, styles.gstBadge]}>
                        <Text style={styles.badgeText}>GST</Text>
                      </View>
                    ) : null}
                    {item.discount > 0 ? (
                      <View style={[styles.badge, styles.discountBadge]}>
                        <Text style={styles.badgeText}>DSC</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.footerText}>
                    {new Date(item.date).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                
                {userProfile?.role === 'admin' ? (
                  <View style={styles.footerInfo}>
                    <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.footerText}>Seller: {sellerName}</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    marginBottom: SPACING.md,
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
    backgroundColor: COLORS.white,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceNum: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: '800',
  },
  customerName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  invoiceTotal: {
    ...TYPOGRAPHY.h3,
    color: COLORS.secondary,
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
  gstBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  discountBadge: {
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
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
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});

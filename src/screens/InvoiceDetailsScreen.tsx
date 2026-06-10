import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { db } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../styles/theme';
import { formatCurrency, formatDate } from '../utils/helpers';
import { pdfGenerator } from '../utils/pdfGenerator';

type RootStackParamList = {
  InvoiceDetails: { invoiceId: string };
  CreateInvoice: { editInvoiceId?: string };
};

type RouteProps = RouteProp<RootStackParamList, 'InvoiceDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const InvoiceDetailsScreen = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { invoiceId } = route.params;
  const { userProfile } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);
  const [invoice, setInvoice] = useState<any | null>(null);

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await db.getInvoiceDetails(invoiceId);
      if (error) {
        Alert.alert('Error', error.message || 'Failed to load invoice details.');
      } else if (data) {
        setInvoice(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchInvoiceDetails();
    }, [invoiceId])
  );

  const handleSavePdf = async () => {
    if (!invoice) return;
    setSavingPdf(true);
    try {
      const { uri } = await pdfGenerator.generateInvoicePdf(invoice);
      const savedPath = await pdfGenerator.saveInvoicePdfToCustomLocation(uri, invoice.invoice_number);
      if (savedPath) {
        Alert.alert('PDF Saved', `Invoice PDF saved successfully!`);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save PDF.');
    } finally {
      setSavingPdf(false);
    }
  };


  const handleSharePdf = async () => {
    if (!invoice) return;
    setSharing(true);
    try {
      const { uri } = await pdfGenerator.generateInvoicePdf(invoice);
      await pdfGenerator.shareInvoicePdf(uri, invoice.invoice_number);
    } catch (e: any) {
      Alert.alert('Sharing Failed', e.message || 'Unable to open share menu.');
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Fetching Invoice Details...</Text>
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Invoice not found.</Text>
      </SafeAreaView>
    );
  }

  const hasBrand = invoice.invoice_items?.some(
    (item: any) => item.brand !== undefined && item.brand !== null && item.brand.trim() !== ''
  );
  
  const hasDiscount = invoice.discount > 0;
  const hasGst = invoice.gst_enabled && invoice.gst_amount > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Admin Edit */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Invoice Detail</Text>
        
        {userProfile?.role === 'admin' ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateInvoice', { editInvoiceId: invoice.id })}
            style={[styles.editBtn, { backgroundColor: colors.secondary }]}
          >
            <Ionicons name="pencil" size={16} color="#000000" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 56 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        {/* Invoice Meta Banner */}
        <Card 
          style={[styles.bannerCard, { backgroundColor: isDarkMode ? colors.cardBg : '#1E293B' }]} 
          variant="premium"
        >
          <View style={styles.bannerRow}>
            <View>
              <Text style={styles.bannerMetaLabel}>INVOICE NUMBER</Text>
              <Text style={styles.bannerInvoiceNum}>{invoice.invoice_number}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.bannerMetaLabel}>GRAND TOTAL</Text>
              <Text style={styles.bannerTotal}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
          <View style={[styles.bannerDivider, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)' }]} />
          <View style={styles.bannerFooter}>
            <Text style={[styles.bannerFooterText, { color: colors.textMuted }]}>Date: {formatDate(invoice.date)}</Text>
            <Text style={[styles.bannerFooterText, { color: colors.textMuted }]}>
              Billed By: {invoice.created_by === 'usr_admin' || invoice.created_by?.includes('admin') ? 'Admin Desk' : 'Sales Desk'}
            </Text>
          </View>
        </Card>

        {/* Customer Box */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Billed To</Text>
        <Card style={styles.infoCard}>
          <Text style={[styles.custName, { color: colors.text }]}>{invoice.customer_name}</Text>
          {invoice.customer_phone ? (
            <View style={styles.infoDetailRow}>
              <Ionicons name="call-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.infoDetailText, { color: colors.textMuted }]}>{invoice.customer_phone}</Text>
            </View>
          ) : null}
          {invoice.customer_address ? (
            <View style={styles.infoDetailRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.infoDetailText, { color: colors.textMuted }]}>{invoice.customer_address}</Text>
            </View>
          ) : null}
        </Card>

        {/* Invoice items table */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Billed Products</Text>
        <Card style={styles.itemsCard}>
          {/* Table Headers */}
          <View style={[styles.tableHeader, { backgroundColor: isDarkMode ? '#222' : '#1E293B' }]}>
            <Text style={[styles.thText, { flex: 2 }]}>Product Description</Text>
            {hasBrand ? <Text style={[styles.thText, { flex: 1 }]}>Brand</Text> : null}
            <Text style={[styles.thText, { flex: 0.5, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.thText, { flex: 1, textAlign: 'right' }]}>Rate</Text>
            <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>Total</Text>
          </View>
          
          {/* Table Rows */}
          {invoice.invoice_items?.map((item: any, idx: number) => (
            <View key={idx} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.tdText, styles.tdName, { flex: 2, color: isDarkMode ? colors.white : '#1E293B' }]} numberOfLines={2}>
                {item.product_name}
              </Text>
              {hasBrand ? (
                <Text style={[styles.tdText, { flex: 1, color: colors.text }]} numberOfLines={1}>
                  {item.brand || '-'}
                </Text>
              ) : null}
              <Text style={[styles.tdText, { flex: 0.5, textAlign: 'center', color: colors.text }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tdText, { flex: 1, textAlign: 'right', color: colors.text }]}>
                {formatCurrency(item.price)}
              </Text>
              <Text style={[styles.tdText, styles.tdTotal, { flex: 1.2, textAlign: 'right', color: colors.text }]}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
        </Card>

        {/* Invoice Summary Block */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(invoice.subtotal)}</Text>
          </View>

          {hasDiscount ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>
                -{formatCurrency(invoice.discount)}
              </Text>
            </View>
          ) : null}

          {hasGst ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST ({invoice.gst_rate}%)</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>+{formatCurrency(invoice.gst_amount)}</Text>
            </View>
          ) : null}

          <View style={[styles.summaryRow, styles.grandRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.grandLabel, { color: colors.text }]}>Net Payable Amount</Text>
            <Text style={styles.grandValue}>{formatCurrency(invoice.total)}</Text>
          </View>
        </Card>

        {/* Export / Share Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="WhatsApp Invoice"
            variant="secondary"
            icon="logo-whatsapp"
            onPress={handleSharePdf}
            loading={sharing}
            style={[styles.actionBtn, { backgroundColor: '#25D366' }]} // WhatsApp Green override
            textStyle={{ color: '#FFFFFF' }}
          />
          <Button
            title="Save PDF / Print"
            variant="primary"
            icon="document-text-outline"
            onPress={handleSavePdf}
            loading={savingPdf}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.bodyMuted,
    marginTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  editBtnText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '800',
    marginLeft: 4,
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
  bannerCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.5,
  },
  bannerInvoiceNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F59E0B',
    marginTop: 2,
  },
  bannerTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  bannerDivider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  bannerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bannerFooterText: {
    fontSize: 11,
  },
  infoCard: {
    marginHorizontal: SPACING.lg,
  },
  custName: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  infoDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoDetailText: {
    ...TYPOGRAPHY.caption,
    marginLeft: SPACING.sm,
  },
  itemsCard: {
    marginHorizontal: SPACING.lg,
    padding: 0,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  thText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  tdText: {
    fontSize: 12,
  },
  tdName: {
    fontWeight: '600',
  },
  tdTotal: {
    fontWeight: '700',
  },
  summaryCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  grandRow: {
    borderTopWidth: 1.5,
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
  },
  grandLabel: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
  },
  grandValue: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  actionBtn: {
    flex: 1,
    height: 50,
  },
});

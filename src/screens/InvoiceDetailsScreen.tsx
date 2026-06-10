import React, { useState, useEffect } from 'react';
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
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../styles/theme';
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
      Alert.alert('PDF Saved', `Invoice PDF generated successfully!\nPath: ${uri}`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to compile PDF.');
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
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Fetching Invoice Details...</Text>
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={styles.loadingText}>Invoice not found.</Text>
      </SafeAreaView>
    );
  }

  const hasBrand = invoice.invoice_items?.some(
    (item: any) => item.brand !== undefined && item.brand !== null && item.brand.trim() !== ''
  );
  
  const hasDiscount = invoice.discount > 0;
  const hasGst = invoice.gst_enabled && invoice.gst_amount > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Admin Edit */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice Detail</Text>
        
        {userProfile?.role === 'admin' ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateInvoice', { editInvoiceId: invoice.id })}
            style={styles.editBtn}
          >
            <Ionicons name="pencil" size={20} color={COLORS.white} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        {/* Invoice Meta Banner */}
        <Card style={styles.bannerCard} variant="premium">
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
          <View style={styles.bannerDivider} />
          <View style={styles.bannerFooter}>
            <Text style={styles.bannerFooterText}>Date: {formatDate(invoice.date)}</Text>
            <Text style={styles.bannerFooterText}>
              Billed By: {invoice.created_by === 'usr_admin' || invoice.created_by?.includes('admin') ? 'Admin Desk' : 'Sales Desk'}
            </Text>
          </View>
        </Card>

        {/* Customer Box */}
        <Text style={styles.sectionTitle}>Billed To</Text>
        <Card style={styles.infoCard}>
          <Text style={styles.custName}>{invoice.customer_name}</Text>
          {invoice.customer_phone ? (
            <View style={styles.infoDetailRow}>
              <Ionicons name="call-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.infoDetailText}>{invoice.customer_phone}</Text>
            </View>
          ) : null}
          {invoice.customer_address ? (
            <View style={styles.infoDetailRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.infoDetailText}>{invoice.customer_address}</Text>
            </View>
          ) : null}
        </Card>

        {/* Invoice items table */}
        <Text style={styles.sectionTitle}>Billed Products</Text>
        <Card style={styles.itemsCard}>
          {/* Table Headers */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, { flex: 2 }]}>Product Description</Text>
            {hasBrand ? <Text style={[styles.thText, { flex: 1 }]}>Brand</Text> : null}
            <Text style={[styles.thText, { flex: 0.5, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.thText, { flex: 1, textAlign: 'right' }]}>Rate</Text>
            <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>Total</Text>
          </View>
          
          {/* Table Rows */}
          {invoice.invoice_items?.map((item: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tdText, styles.tdName, { flex: 2 }]} numberOfLines={2}>
                {item.product_name}
              </Text>
              {hasBrand ? (
                <Text style={[styles.tdText, { flex: 1 }]} numberOfLines={1}>
                  {item.brand || '-'}
                </Text>
              ) : null}
              <Text style={[styles.tdText, { flex: 0.5, textAlign: 'center' }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tdText, { flex: 1, textAlign: 'right' }]}>
                {formatCurrency(item.price)}
              </Text>
              <Text style={[styles.tdText, styles.tdTotal, { flex: 1.2, textAlign: 'right' }]}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
        </Card>

        {/* Invoice Summary Block */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>

          {hasDiscount ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
                -{formatCurrency(invoice.discount)}
              </Text>
            </View>
          ) : null}

          {hasGst ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST (${invoice.gst_rate}%)</Text>
              <Text style={styles.summaryValue}>+{formatCurrency(invoice.gst_amount)}</Text>
            </View>
          ) : null}

          <View style={[styles.summaryRow, styles.grandRow]}>
            <Text style={styles.grandLabel}>Net Payable Amount</Text>
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
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    color: COLORS.primary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.sm,
    ...SHADOWS.sm,
  },
  editBtnText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '700',
    marginLeft: 4,
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
  bannerCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
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
    color: COLORS.secondary,
    marginTop: 2,
  },
  bannerTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  bannerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: SPACING.md,
  },
  bannerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bannerFooterText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  infoCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  custName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
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
    color: COLORS.textMuted,
  },
  itemsCard: {
    marginHorizontal: SPACING.lg,
    padding: 0,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  thText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tdText: {
    fontSize: 12,
    color: COLORS.text,
  },
  tdName: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  tdTotal: {
    fontWeight: '700',
  },
  summaryCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
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
    color: COLORS.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  grandRow: {
    borderTopWidth: 1.5,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
  },
  grandLabel: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: '800',
  },
  grandValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.secondary,
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

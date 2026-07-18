import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { db } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Toggle } from '../components/Toggle';
import { InvoiceItemRow } from '../components/InvoiceItemRow';
import { useTheme, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { calculateInvoiceTotals, formatCurrency } from '../utils/helpers';

type RootStackParamList = {
  Dashboard: undefined;
  InvoiceDetails: { invoiceId: string };
  CreateInvoice: { editInvoiceId?: string };
};

type CreateInvoiceRouteProp = RouteProp<RootStackParamList, 'CreateInvoice'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface InvoiceItem {
  product_id: string; // Will always be empty string since there is no catalog search
  product_name: string;
  brand?: string;
  quantity: number;
  price: number;
  total: number;
}

export const CreateInvoiceScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CreateInvoiceRouteProp>();
  const editInvoiceId = route.params?.editInvoiceId;
  const { userProfile } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const styles = getStyles(colors, isDarkMode);

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('[Auto-Generated]');


  // Customer Selection State
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  
  // Invoice Customer Form (Optional)
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Invoice Items State
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Manual Product Form States
  const [manualProdName, setManualProdName] = useState('');
  const [manualProdBrand, setManualProdBrand] = useState('');
  const [manualProdQty, setManualProdQty] = useState('1');
  const [manualProdRate, setManualProdRate] = useState('');

  // Input references for keyboard focus navigation
  const brandInputRef = useRef<any>(null);
  const qtyInputRef = useRef<any>(null);
  const priceInputRef = useRef<any>(null);

  // Inline Toggles & Financials State
  const [gstToggled, setGstToggled] = useState(false);
  const [selectedGstRate, setSelectedGstRate] = useState<5 | 6 | 12 | 18>(5);
  
  const [discountToggled, setDiscountToggled] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [isPaid, setIsPaid] = useState(true);


  // Dynamic calculations
  const totals = calculateInvoiceTotals(
    items.map(item => ({ quantity: item.quantity, price: item.price })),
    discountToggled ? discountAmount : '',
    gstToggled,
    gstToggled ? selectedGstRate : 0
  );

  const liveQty = parseInt(manualProdQty || '0', 10);
  const liveRate = parseFloat(manualProdRate || '0');
  const liveRowTotal = !isNaN(liveQty) && !isNaN(liveRate) && liveQty > 0 && liveRate > 0 ? liveQty * liveRate : 0;


  // Initialize Invoice details (support loading existing details for editing)
  useEffect(() => {
    const initInvoice = async () => {
      if (editInvoiceId) {
        setInitLoading(true);
        try {
          const { data, error } = await db.getInvoiceDetails(editInvoiceId);
          if (error) {
            Alert.alert('Error', 'Failed to load invoice details for editing.');
            navigation.goBack();
            return;
          }
          if (data) {
            setInvoiceNumber(data.invoice_number);
            setCustName(data.customer_name === 'Cash Customer' ? '' : data.customer_name);
            setCustPhone(data.customer_phone || '');
            setCustAddress(data.customer_address || '');
            
            // Re-populate discount states
            if (data.discount > 0) {
              setDiscountToggled(true);
              setDiscountAmount(data.discount.toString());
            } else {
              setDiscountToggled(false);
              setDiscountAmount('');
            }

            // Re-populate GST states
            if (data.gst_enabled && data.gst_rate > 0) {
              setGstToggled(true);
              // Safely set selection rate or default to 5
              if ([5, 6, 12, 18].includes(Number(data.gst_rate))) {
                setSelectedGstRate(Number(data.gst_rate) as any);
              } else {
                setSelectedGstRate(5);
              }
            } else {
              setGstToggled(false);
            }
            
            const loadedItems = (data.invoice_items || []).map((it: any) => ({
              product_id: '',
              product_name: it.product_name,
              brand: it.brand || undefined,
              quantity: it.quantity,
              price: it.price,
              total: it.total,
            }));
            setItems(loadedItems);
            
            if (data.customer_id) {
              setSelectedCustomer({
                id: data.customer_id,
                name: data.customer_name,
                phone: data.customer_phone,
                address: data.customer_address,
              });
            }

            if (data.status) {
              setIsPaid(data.status === 'paid');
            }
          }

        } catch (err) {
          console.error(err);
        } finally {
          setInitLoading(false);
        }
      } else {
        setInvoiceNumber('[Auto-Generated]');
      }
    };

    initInvoice();
  }, [editInvoiceId]);

  // Fetch Customers on mount (for optional list picking)
  useEffect(() => {
    const loadSelectionData = async () => {
      const { data: custs } = await db.getCustomers();
      if (custs) setCustomersList(custs);
    };
    loadSelectionData();
  }, []);

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustName(customer.name);
    setCustPhone(customer.phone || '');
    setCustAddress(customer.address || '');
    setCustomerModalVisible(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustName('');
    setCustPhone('');
    setCustAddress('');
  };

  const handleAddItem = () => {
    const qty = parseInt(manualProdQty, 10);
    const rate = parseFloat(manualProdRate);

    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Validation Error', 'Quantity must be a positive number.');
      return;
    }

    if (isNaN(rate) || rate < 0) {
      Alert.alert('Validation Error', 'Price (per unit) must be greater than or equal to zero.');
      return;
    }

    // Optional name: default to 'General Item' if empty
    const name = manualProdName.trim() || 'General Item';

    const newItem: InvoiceItem = {
      product_id: '',
      product_name: name,
      brand: manualProdBrand.trim() || undefined,
      quantity: qty,
      price: rate,
      total: qty * rate,
    };

    if (editingIndex !== null) {
      const updated = [...items];
      updated[editingIndex] = newItem;
      setItems(updated);
      setEditingIndex(null);
    } else {
      setItems([...items, newItem]);
    }
    
    // Clear item inputs for next addition
    setManualProdName('');
    setManualProdBrand('');
    setManualProdQty('1');
    setManualProdRate('');
  };

  const handleEditItem = (index: number) => {
    const item = items[index];
    setEditingIndex(index);
    setManualProdName(item.product_name);
    setManualProdBrand(item.brand || '');
    setManualProdQty(item.quantity.toString());
    setManualProdRate(item.price.toString());
  };

  const handleQtySubmit = () => {
    if (manualProdRate.trim() === '') {
      priceInputRef.current?.focus();
    } else {
      handleAddItem();
    }
  };

  const handlePriceSubmit = () => {
    if (manualProdQty.trim() === '') {
      qtyInputRef.current?.focus();
    } else {
      handleAddItem();
    }
  };

  const handleDeleteItem = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setManualProdName('');
      setManualProdBrand('');
      setManualProdQty('1');
      setManualProdRate('');
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleSaveInvoice = async () => {
    setLoading(true);
    try {
      // 1. Gather all items, including any unsaved item in the inputs
      let finalItems = [...items];
      const qty = parseInt(manualProdQty, 10);
      const rate = parseFloat(manualProdRate);
      const hasUnsavedItem = !isNaN(qty) && qty > 0 && !isNaN(rate) && rate >= 0 && manualProdRate.trim() !== '';
      
      if (hasUnsavedItem) {
        const name = manualProdName.trim() || 'General Item';
        const unsavedItem: InvoiceItem = {
          product_id: '',
          product_name: name,
          brand: manualProdBrand.trim() || undefined,
          quantity: qty,
          price: rate,
          total: qty * rate,
        };
        finalItems.push(unsavedItem);
      }

      // 2. Disallow empty invoices
      if (finalItems.length === 0) {
        Alert.alert('Validation Error', 'Please add at least one product item to the invoice.');
        setLoading(false);
        return;
      }

      // 3. Recalculate totals based on finalItems (including unsaved)
      const finalTotals = calculateInvoiceTotals(
        finalItems.map(item => ({ quantity: item.quantity, price: item.price })),
        discountToggled ? discountAmount : '',
        gstToggled,
        gstToggled ? selectedGstRate : 0
      );

      const invoiceData = {
        invoice_number: invoiceNumber,
        customer_id: selectedCustomer?.id || null,
        // Optional name: falls back to Cash Customer if blank
        customer_name: custName.trim() || 'Cash Customer',
        customer_phone: custPhone.trim() || null,
        customer_address: custAddress.trim() || null,
        date: new Date().toISOString(),
        gst_enabled: gstToggled,
        gst_rate: finalTotals.gstRate,
        gst_amount: finalTotals.gstAmount,
        discount: finalTotals.discount,
        subtotal: finalTotals.subtotal,
        total: finalTotals.total,
        status: isPaid ? 'paid' : 'balance',
      };

      if (editInvoiceId) {
        const result = await db.updateInvoice(editInvoiceId, invoiceData, finalItems);
        setLoading(false);
        if (result.error) {
          Alert.alert('Database Error', result.error.message || 'Failed to update invoice.');
        } else {
          Alert.alert('Success', 'Invoice updated successfully!', [
            {
              text: 'OK',
              onPress: () => navigation.replace('InvoiceDetails', { invoiceId: editInvoiceId }),
            },
          ]);
        }
      } else {
        const result = await db.createInvoice(invoiceData, finalItems, userProfile?.id || '');
        setLoading(false);
        if (result.error) {
          Alert.alert('Database Error', result.error.message || 'Failed to save invoice.');
        } else if (result.data) {
          Alert.alert('Success', 'Invoice generated successfully!', [
            {
              text: 'OK',
              onPress: () => navigation.replace('InvoiceDetails', { invoiceId: result.data.id }),
            },
          ]);
        }
      }
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e.message || 'Unexpected failure while compiling invoice.');
    }
  };

  const filteredCustomers = customersList.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone && c.phone.includes(customerSearch))
  );

  if (initLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={{ ...TYPOGRAPHY.bodyMuted, marginTop: SPACING.md, color: colors.textMuted }}>Loading Invoice Data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
        {/* Form Meta Block */}
        <Card style={styles.metaCard}>
          <View style={styles.invoiceHeaderRow}>
            <View>
              <Text style={styles.invoiceMetaLabel}>INVOICE NUMBER</Text>
              <Text style={styles.invoiceNumText}>{invoiceNumber}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.invoiceMetaLabel}>INVOICE DATE</Text>
              <Text style={styles.invoiceDateText}>{new Date().toLocaleDateString('en-IN')}</Text>
            </View>
          </View>
        </Card>

        {/* Customer Block (Optional) */}
        <Text style={styles.sectionTitle}>Customer Details (Optional)</Text>
        <Card style={styles.customerCard}>
          {selectedCustomer ? (
            <View style={styles.selectedCustContainer}>
              <View style={styles.selectedCustDetails}>
                <Ionicons name="business-outline" size={20} color={colors.secondary} />
                <View style={{ marginLeft: SPACING.sm, flex: 1 }}>
                  <Text style={styles.selectedCustName}>{custName}</Text>
                  {custPhone ? <Text style={styles.selectedCustSub}>{custPhone}</Text> : null}
                  {custAddress ? <Text style={styles.selectedCustSub}>{custAddress}</Text> : null}
                </View>
              </View>
              <TouchableOpacity onPress={handleClearCustomer} style={styles.clearCustBtn}>
                <Ionicons name="close-circle" size={22} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Button
                title="Select Existing Customer"
                variant="outline"
                icon="people-outline"
                onPress={() => setCustomerModalVisible(true)}
                style={{ marginBottom: SPACING.md }}
              />
              <View style={styles.dividerRow}>
                <View style={styles.line} />
                <Text style={styles.orText}>OR WRITE DIRECTLY</Text>
                <View style={styles.line} />
              </View>
              <Input
                label="Customer / Business Name"
                value={custName}
                onChangeText={setCustName}
                placeholder="Leave blank for Cash Customer"
                icon="person-outline"
              />
              <View style={styles.formRow}>
                <Input
                  label="Contact Phone"
                  value={custPhone}
                  onChangeText={setCustPhone}
                  placeholder="Mobile"
                  icon="call-outline"
                  keyboardType="phone-pad"
                  containerStyle={{ flex: 1, marginRight: SPACING.md }}
                />
                <Input
                  label="Address"
                  value={custAddress}
                  onChangeText={setCustAddress}
                  placeholder="City/Market"
                  icon="location-outline"
                  containerStyle={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </Card>

        {/* Invoice Items Block */}
        <Text style={styles.sectionTitle}>Selected Products</Text>
        <Card style={styles.itemsCard}>
          {items.length === 0 ? (
            <View style={styles.emptyItemsBox}>
              <Ionicons name="basket-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyItemsText}>No products added to the invoice yet.</Text>
            </View>
          ) : (
            <View>
              {items.map((item, index) => (
                <InvoiceItemRow
                  key={index}
                  item={item}
                  onDelete={() => handleDeleteItem(index)}
                  onEdit={() => handleEditItem(index)}
                />
              ))}
            </View>
          )}
        </Card>

        {/* Direct Product Entry Form */}
        <Text style={styles.sectionTitle}>
          {editingIndex !== null ? 'Edit Product Item' : 'Add Product Item'}
        </Text>
        <Card style={styles.customerCard}>
          <Input
            label="Product Name / Description (Optional)"
            value={manualProdName}
            onChangeText={setManualProdName}
            placeholder="e.g. Cotton Lungi (blank defaults to General Item)"
            icon="cube-outline"
            returnKeyType="next"
            onSubmitEditing={() => brandInputRef.current?.focus()}
          />

          <Input
            ref={brandInputRef}
            label="Brand (Optional)"
            value={manualProdBrand}
            onChangeText={setManualProdBrand}
            placeholder="e.g. AH&S Special"
            icon="ribbon-outline"
            returnKeyType="next"
            onSubmitEditing={() => qtyInputRef.current?.focus()}
          />

          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <Input
              ref={qtyInputRef}
              label="Quantity"
              value={manualProdQty}
              onChangeText={setManualProdQty}
              placeholder="1"
              keyboardType="numeric"
              icon="calculator-outline"
              containerStyle={{ flex: 1 }}
              returnKeyType="next"
              onSubmitEditing={handleQtySubmit}
            />
            <Input
              ref={priceInputRef}
              label="Price (per unit) (₹)"
              value={manualProdRate}
              onChangeText={setManualProdRate}
              placeholder="250"
              keyboardType="numeric"
              icon="cash-outline"
              containerStyle={{ flex: 1 }}
              returnKeyType="done"
              onSubmitEditing={handlePriceSubmit}
            />
          </View>

          {liveRowTotal > 0 ? (
            <View style={styles.liveTotalContainer}>
              <Text style={styles.liveTotalLabel}>Item Total Preview:</Text>
              <Text style={styles.liveTotalValue}>{formatCurrency(liveRowTotal)}</Text>
            </View>
          ) : null}


          {editingIndex !== null ? (
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
              <Button
                title="Cancel Edit"
                variant="outline"
                icon="close-outline"
                onPress={() => {
                  setEditingIndex(null);
                  setManualProdName('');
                  setManualProdBrand('');
                  setManualProdQty('1');
                  setManualProdRate('');
                }}
                style={{ flex: 1 }}
              />
              <Button
                title="Update Product"
                variant="secondary"
                icon="checkmark-circle-outline"
                onPress={handleAddItem}
                style={{ flex: 1.5 }}
              />
            </View>
          ) : (
            <Button
              title="Add Product to Bill"
              variant="outline"
              icon="add-circle-outline"
              onPress={handleAddItem}
              style={{ marginTop: SPACING.sm }}
            />
          )}
        </Card>

        {/* Financials & Toggles Block */}
        <Text style={styles.sectionTitle}>Invoice Summary & Settings</Text>
        <Card style={styles.summaryCard}>
          {/* Payment Status Toggle */}
          <View style={styles.toggleRow}>
            <Toggle
              label="Payment Collected (Paid)"
              description="Uncheck to save this invoice as an Outstanding Balance."
              value={isPaid}
              onValueChange={setIsPaid}
              style={{ borderBottomWidth: 0, paddingVertical: SPACING.sm }}
            />
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>{formatCurrency(totals.subtotal)}</Text>
          </View>


          {/* Inline switches for GST and Discount */}
          <View style={styles.toggleRow}>
            <Toggle
              label="Invoice Discount"
              description="Toggle flat rate discount deduction."
              value={discountToggled}
              onValueChange={setDiscountToggled}
              style={{ borderBottomWidth: 0, paddingVertical: SPACING.sm }}
            />
          </View>

          {discountToggled ? (
            <View style={styles.inlineInputRow}>
              <View style={{ flex: 1, marginRight: SPACING.lg }}>
                <Text style={styles.summaryLabel}>Discount Amount (₹)</Text>
                <Text style={styles.summaryLabelMuted}>Deducted from subtotal</Text>
              </View>
              <Input
                value={discountAmount}
                onChangeText={setDiscountAmount}
                placeholder="0.00"
                keyboardType="numeric"
                containerStyle={{ width: 120, marginBottom: 0 }}
                style={{ height: 40 }}
                inputStyle={{ textAlign: 'right' }}
              />
            </View>
          ) : null}

          {discountToggled && totals.discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount Deduction</Text>
              <Text style={[styles.summaryVal, { color: colors.danger }]}>
                -{formatCurrency(totals.discount)}
              </Text>
            </View>
          ) : null}

          <View style={styles.toggleRow}>
            <Toggle
              label="Goods & Services Tax (GST)"
              description="Apply taxation calculations to this bill."
              value={gstToggled}
              onValueChange={setGstToggled}
              style={{ borderBottomWidth: 0, paddingVertical: SPACING.sm }}
            />
          </View>

          {gstToggled ? (
            <View style={styles.gstSelectionBlock}>
              <Text style={styles.rateSelectionLabel}>Choose GST Rate (%):</Text>
              <View style={styles.ratePillsRow}>
                {[5, 6, 12, 18].map(rate => {
                  const isActive = selectedGstRate === rate;
                  return (
                    <TouchableOpacity
                      key={rate}
                      onPress={() => setSelectedGstRate(rate as any)}
                      style={[
                        styles.ratePill,
                        isActive && styles.ratePillActive
                      ]}
                    >
                      <Text style={[
                        styles.ratePillText,
                        isActive && styles.ratePillTextActive
                      ]}>
                        {rate}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {gstToggled && totals.gstAmount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST Amount ({totals.gstRate}%)</Text>
              <Text style={styles.summaryVal}>+{formatCurrency(totals.gstAmount)}</Text>
            </View>
          ) : null}

          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalVal}>{formatCurrency(totals.total)}</Text>
          </View>
        </Card>

        {/* Save/Action buttons */}
        <Button
          title="Save & Finalize Invoice"
          onPress={handleSaveInvoice}
          loading={loading}
          icon="save-outline"
          style={styles.saveBtn}
        />
      </ScrollView>

      {/* Customer Selection Modal (Optional lookup) */}
      <Modal
        visible={customerModalVisible}
        animationType="slide"
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalSearchHeader}>
            <Text style={styles.modalTitle}>Choose Customer</Text>
            <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Input
            value={customerSearch}
            onChangeText={setCustomerSearch}
            placeholder="Search by customer name or phone..."
            icon="search-outline"
            onClear={() => setCustomerSearch('')}
            containerStyle={{ paddingHorizontal: SPACING.lg }}
          />
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: SPACING.lg }}
            renderItem={({ item }) => (
              <Card
                style={styles.modalItemCard}
                onPress={() => handleSelectCustomer(item)}
              >
                <Text style={styles.modalItemName}>{item.name}</Text>
                {item.phone ? <Text style={styles.modalItemSub}>{item.phone}</Text> : null}
                {item.address ? <Text style={styles.modalItemSub} numberOfLines={1}>{item.address}</Text> : null}
              </Card>
            )}
          />
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
};

const getStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollBody: {
    paddingBottom: SPACING.xxxl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: colors.text,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    fontWeight: '700',
  },
  metaCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: isDarkMode ? colors.cardBg : colors.primary,
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.5,
  },
  invoiceNumText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 2,
  },
  invoiceDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginTop: 2,
  },
  customerCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: colors.cardBg,
  },
  selectedCustContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  selectedCustDetails: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  selectedCustName: {
    ...TYPOGRAPHY.h3,
    color: colors.text,
    fontWeight: '700',
  },
  selectedCustSub: {
    ...TYPOGRAPHY.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  clearCustBtn: {
    padding: SPACING.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    marginHorizontal: SPACING.md,
  },
  formRow: {
    flexDirection: 'row',
  },
  itemsCard: {
    marginHorizontal: SPACING.lg,
    padding: 0,
    backgroundColor: colors.cardBg,
    overflow: 'hidden',
  },
  emptyItemsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emptyItemsText: {
    ...TYPOGRAPHY.bodyMuted,
    color: colors.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  summaryCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: colors.cardBg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  summaryLabelMuted: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  toggleRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.2)',
  },
  inlineInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.2)',
  },
  gstSelectionBlock: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.2)',
  },
  rateSelectionLabel: {
    ...TYPOGRAPHY.bodyMuted,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  ratePillsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  ratePill: {
    flex: 1,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratePillActive: {
    backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.1)',
    borderColor: colors.secondary,
  },
  ratePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  ratePillTextActive: {
    color: colors.secondary,
  },
  grandTotalRow: {
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
  },
  grandTotalLabel: {
    ...TYPOGRAPHY.h2,
    color: colors.text,
    fontWeight: '800',
  },
  grandTotalVal: {
    ...TYPOGRAPHY.h2,
    color: colors.secondary,
    fontWeight: '800',
  },
  saveBtn: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalSearchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: SPACING.md,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    color: colors.text,
  },
  modalItemCard: {
    marginBottom: SPACING.sm,
    backgroundColor: colors.cardBg,
    padding: SPACING.md,
  },
  modalItemName: {
    ...TYPOGRAPHY.h3,
    color: colors.text,
  },
  modalItemSub: {
    ...TYPOGRAPHY.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  selectedProdForm: {
    padding: SPACING.lg,
  },
  prodFormActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  liveTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: isDarkMode ? '#222' : '#F1F5F9',
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    borderColor: colors.border,
    borderWidth: 1,
  },
  liveTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  liveTotalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
  },
});


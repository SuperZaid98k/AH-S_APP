import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../api/supabase';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useTheme, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../styles/theme';

interface Customer {
  id?: string;
  name: string;
  phone?: string;
  address?: string;
}

export const CustomerManagementScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formError, setFormError] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await db.getCustomers();
      if (!error && data) {
        setCustomers(data);
        setFilteredCustomers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const query = search.toLowerCase();
      const filtered = customers.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          (c.phone && c.phone.toLowerCase().includes(query)) ||
          (c.address && c.address.toLowerCase().includes(query))
      );
      setFilteredCustomers(filtered);
    }
  }, [search, customers]);

  const openForm = (customer: Customer | null = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormName(customer.name);
      setFormPhone(customer.phone || '');
      setFormAddress(customer.address || '');
    } else {
      setEditingCustomer(null);
      setFormName('');
      setFormPhone('');
      setFormAddress('');
    }
    setFormError('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError('Customer Name is required.');
      return;
    }

    const customerData: Customer = {
      name: formName.trim(),
      phone: formPhone.trim(),
      address: formAddress.trim(),
    };

    if (editingCustomer?.id) {
      customerData.id = editingCustomer.id;
    }

    setLoading(true);
    const { error } = await db.saveCustomer(customerData);
    setLoading(false);

    if (error) {
      setFormError(error.message || 'Error saving customer.');
    } else {
      setModalVisible(false);
      fetchCustomers();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search customer by name, phone..."
          icon="search-outline"
          onClear={() => setSearch('')}
          containerStyle={styles.searchBar}
        />
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.secondary }]}
          onPress={() => openForm(null)}
        >
          <Ionicons name="person-add" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Customer List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={fetchCustomers}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No customers found.</Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card
            style={styles.customerCard}
            onPress={() => openForm(item)}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.avatar, { backgroundColor: isDarkMode ? '#333' : 'rgba(30, 41, 59, 0.08)' }]}>
                <Text style={[styles.avatarText, { color: colors.secondary }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.meta}>
                <Text style={[styles.customerName, { color: colors.text }]}>{item.name}</Text>
                {item.phone ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={13} color={colors.textMuted} />
                    <Text style={[styles.infoText, { color: colors.textMuted }]}>{item.phone}</Text>
                  </View>
                ) : null}
                {item.address ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                    <Text style={[styles.infoText, { color: colors.textMuted }]} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Ionicons name="create-outline" size={20} color={colors.secondary} style={styles.editIcon} />
            </View>
          </Card>
        )}
      />

      {/* Create / Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCustomer ? 'Update Customer' : 'Add New Customer'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {formError ? <Text style={[styles.modalError, { color: colors.danger }]}>{formError}</Text> : null}

            <Input
              label="Customer / Business Name"
              value={formName}
              onChangeText={setFormName}
              placeholder="e.g. Ahmad Traders"
              icon="business-outline"
            />

            <Input
              label="Mobile Number (Optional)"
              value={formPhone}
              onChangeText={setFormPhone}
              placeholder="e.g. +91 98765 43210"
              icon="call-outline"
              keyboardType="phone-pad"
            />

            <Input
              label="Billing Address (Optional)"
              value={formAddress}
              onChangeText={setFormAddress}
              placeholder="e.g. Bara Bazar, Kolkata"
              icon="location-outline"
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title={editingCustomer ? 'Update' : 'Save'}
                onPress={handleSave}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  searchBar: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
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
  customerCard: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    flex: 1,
  },
  customerName: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    marginLeft: SPACING.xs,
  },
  editIcon: {
    padding: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)', // Dim background
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xxxl : SPACING.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
  },
  modalError: {
    fontSize: 13,
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  modalBtn: {
    flex: 1,
  },
});

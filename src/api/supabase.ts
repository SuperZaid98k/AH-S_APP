import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Load environmental variables. Expo automatically picks up EXPO_PUBLIC_ prefix.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.'
  );
}

export const supabase = createClient(supabaseUrl || 'https://placeholder-url.supabase.co', supabaseAnonKey || 'placeholder-key', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Simple interface wrappers for app queries to keep screens lightweight
export const db = {
  // Profiles
  async getProfile(userId: string) {
    if (!supabaseUrl) return { data: { id: userId, name: 'Demo Admin', role: 'admin' }, error: null };
    return supabase.from('profiles').select('*').eq('id', userId).single();
  },

  // Customers
  async getCustomers() {
    if (!supabaseUrl) {
      const mock = await AsyncStorage.getItem('@mock_customers');
      if (mock) return { data: JSON.parse(mock), error: null };
      const defaultCustomers = [
        { id: 'c1', name: 'Ahmad Traders', phone: '9876543210', address: 'Bara Bazar, Kolkata' },
        { id: 'c2', name: 'Saleem Textile Shop', phone: '8765432109', address: 'Chandni Chowk, Delhi' },
        { id: 'c3', name: 'Hasan Retail Store', phone: '7654321098', address: 'Commercial Street, Bangalore' },
      ];
      await AsyncStorage.setItem('@mock_customers', JSON.stringify(defaultCustomers));
      return { data: defaultCustomers, error: null };
    }
    return supabase.from('customers').select('*').order('name', { ascending: true });
  },

  async saveCustomer(customer: { id?: string; name: string; phone?: string; address?: string }) {
    if (!supabaseUrl) {
      const { data } = await this.getCustomers();
      let updated = [];
      if (customer.id) {
        updated = (data || []).map((c: any) => (c.id === customer.id ? { ...c, ...customer } : c));
      } else {
        const newCustomer = { ...customer, id: 'c_' + Date.now(), created_at: new Date().toISOString() };
        updated = [...(data || []), newCustomer];
      }
      await AsyncStorage.setItem('@mock_customers', JSON.stringify(updated));
      return { data: customer, error: null };
    }

    if (customer.id) {
      return supabase.from('customers').update(customer).eq('id', customer.id).select().single();
    } else {
      return supabase.from('customers').insert([customer]).select().single();
    }
  },

  // Invoices & Invoice Items
  async getInvoices(role: string, userId: string) {
    if (!supabaseUrl) {
      const mockInvoices = await AsyncStorage.getItem('@mock_invoices');
      const data = mockInvoices ? JSON.parse(mockInvoices) : [];
      // Filter sales by user if not admin
      if (role !== 'admin') {
        return { data: data.filter((inv: any) => inv.created_by === userId), error: null };
      }
      return { data, error: null };
    }

    let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (role !== 'admin') {
      query = query.eq('created_by', userId);
    }
    return query;
  },

  async getInvoiceDetails(invoiceId: string) {
    if (!supabaseUrl) {
      const mockInvoices = await AsyncStorage.getItem('@mock_invoices');
      const invoices = mockInvoices ? JSON.parse(mockInvoices) : [];
      const invoice = invoices.find((i: any) => i.id === invoiceId);
      if (!invoice) return { data: null, error: { message: 'Invoice not found' } };

      const mockItems = await AsyncStorage.getItem('@mock_invoice_items');
      const items = mockItems ? JSON.parse(mockItems) : [];
      const invoiceItems = items.filter((item: any) => item.invoice_id === invoiceId);

      return { data: { ...invoice, invoice_items: invoiceItems }, error: null };
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError) return { data: null, error: invoiceError };

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId);

    if (itemsError) return { data: null, error: itemsError };

    return { data: { ...invoice, invoice_items: items }, error: null };
  },

  async createInvoice(invoice: any, items: any[], userId: string) {
    const finalCustName = invoice.customer_name?.trim() || 'Cash Customer';
    const finalInvoiceData = {
      ...invoice,
      customer_name: finalCustName,
    };

    if (!supabaseUrl) {
      const mockInvoices = await AsyncStorage.getItem('@mock_invoices');
      const invoices = mockInvoices ? JSON.parse(mockInvoices) : [];
      const newInvoice = {
        ...finalInvoiceData,
        id: 'inv_' + Date.now(),
        created_by: userId,
        created_at: new Date().toISOString(),
      };
      
      const updatedInvoices = [newInvoice, ...invoices];
      await AsyncStorage.setItem('@mock_invoices', JSON.stringify(updatedInvoices));

      const mockItems = await AsyncStorage.getItem('@mock_invoice_items');
      const currentItems = mockItems ? JSON.parse(mockItems) : [];
      const newItems = items.map((item, idx) => ({
        ...item,
        product_id: null, // Always null for manual entry
        id: 'item_' + Date.now() + '_' + idx,
        invoice_id: newInvoice.id,
        created_at: new Date().toISOString(),
      }));

      await AsyncStorage.setItem('@mock_invoice_items', JSON.stringify([...currentItems, ...newItems]));
      return { data: newInvoice, error: null };
    }

    // Insert invoice
    const { data: insertedInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{ ...finalInvoiceData, created_by: userId }])
      .select()
      .single();

    if (invoiceError) return { data: null, error: invoiceError };

    // Insert invoice items
    const itemsWithInvoiceId = items.map(item => ({
      ...item,
      invoice_id: insertedInvoice.id,
      product_id: null, // Always null for manual entry
    }));

    const { error: itemsError } = await supabase.from('invoice_items').insert(itemsWithInvoiceId);

    if (itemsError) {
      // Rollback invoice if items insert fail (rough transaction fallback)
      await supabase.from('invoices').delete().eq('id', insertedInvoice.id);
      return { data: null, error: itemsError };
    }

    return { data: insertedInvoice, error: null };
  },

  async updateInvoice(invoiceId: string, invoiceData: any, items: any[]) {
    const finalCustName = invoiceData.customer_name?.trim() || 'Cash Customer';
    const finalInvoiceData = {
      ...invoiceData,
      customer_name: finalCustName,
    };

    if (!supabaseUrl) {
      const mockInvoices = await AsyncStorage.getItem('@mock_invoices');
      const invoices = mockInvoices ? JSON.parse(mockInvoices) : [];
      const updatedInvoices = invoices.map((inv: any) =>
        inv.id === invoiceId ? { ...inv, ...finalInvoiceData } : inv
      );
      await AsyncStorage.setItem('@mock_invoices', JSON.stringify(updatedInvoices));

      // Replace items
      const mockItems = await AsyncStorage.getItem('@mock_invoice_items');
      const allItems = mockItems ? JSON.parse(mockItems) : [];
      const remainingItems = allItems.filter((it: any) => it.invoice_id !== invoiceId);
      const newItems = items.map((item, idx) => ({
        ...item,
        product_id: null, // Always null for manual entry
        id: item.id || 'item_' + Date.now() + '_' + idx,
        invoice_id: invoiceId,
        created_at: item.created_at || new Date().toISOString(),
      }));
      await AsyncStorage.setItem('@mock_invoice_items', JSON.stringify([...remainingItems, ...newItems]));
      return { data: { id: invoiceId, ...finalInvoiceData }, error: null };
    }

    // Update invoice
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update(finalInvoiceData)
      .eq('id', invoiceId);

    if (invoiceError) return { data: null, error: invoiceError };

    // Delete existing invoice items and insert new ones
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId);

    if (deleteError) return { data: null, error: deleteError };

    const itemsWithInvoiceId = items.map(item => ({
      ...item,
      invoice_id: invoiceId,
      product_id: null, // Always null for manual entry
      id: undefined, 
    }));

    const { error: insertError } = await supabase.from('invoice_items').insert(itemsWithInvoiceId);
    if (insertError) return { data: null, error: insertError };

    return { data: { id: invoiceId, ...finalInvoiceData }, error: null };
  },

  async getNextInvoiceNumber() {
    if (!supabaseUrl) {
      const mockInvoices = await AsyncStorage.getItem('@mock_invoices');
      const invoices = mockInvoices ? JSON.parse(mockInvoices) : [];
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `AHS-${today}-`;
      
      const todayInvoices = invoices.filter((i: any) => i.invoice_number.startsWith(prefix));
      if (todayInvoices.length === 0) {
        return `${prefix}0001`;
      }
      
      // Parse last index
      const nums = todayInvoices.map((i: any) => parseInt(i.invoice_number.split('-')[2] || '0', 10));
      const nextNum = Math.max(...nums) + 1;
      return `${prefix}${String(nextNum).padStart(4, '0')}`;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    // Find the count of invoices generated today
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .gte('date', `${todayStr}T00:00:00Z`)
      .lte('date', `${todayStr}T23:59:59Z`);

    const todaySlug = todayStr.replace(/-/g, '');
    const prefix = `AHS-${todaySlug}-`;

    if (error || !data || data.length === 0) {
      return `${prefix}0001`;
    }

    const nums = data.map(i => parseInt(i.invoice_number.split('-')[2] || '0', 10));
    const nextNum = Math.max(...nums) + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  },
};

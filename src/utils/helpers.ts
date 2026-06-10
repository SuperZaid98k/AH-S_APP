export const formatCurrency = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

export const formatDate = (dateInput: string | Date | null): string => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  discountAmount: number; // Flat amount
  gstEnabled: boolean;
  gstRate: number;
  gstAmount: number;
  total: number;
}

export const calculateInvoiceTotals = (
  items: { quantity: number; price: number }[],
  discountInput: string | number,
  gstEnabled: boolean,
  gstRateInput: string | number
): InvoiceTotals => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  
  // Clean discount input: if empty/null/undefined, treat it as zero
  let discount = 0;
  if (discountInput !== undefined && discountInput !== null && discountInput !== '') {
    discount = typeof discountInput === 'string' ? parseFloat(discountInput) : discountInput;
    if (isNaN(discount) || discount < 0) {
      discount = 0;
    }
  }

  const subtotalAfterDiscount = Math.max(0, subtotal - discount);

  let gstRate = 0;
  let gstAmount = 0;
  
  if (gstEnabled && gstRateInput !== undefined && gstRateInput !== null && gstRateInput !== '') {
    gstRate = typeof gstRateInput === 'string' ? parseFloat(gstRateInput) : gstRateInput;
    if (isNaN(gstRate) || gstRate < 0) {
      gstRate = 0;
    }
    gstAmount = subtotalAfterDiscount * (gstRate / 100);
  }

  const total = subtotalAfterDiscount + gstAmount;

  return {
    subtotal,
    discount,
    discountAmount: discount,
    gstEnabled,
    gstRate,
    gstAmount,
    total,
  };
};

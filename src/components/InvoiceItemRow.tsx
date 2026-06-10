import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';
import { formatCurrency } from '../utils/helpers';

interface InvoiceItem {
  product_id?: string;
  product_name: string;
  brand?: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceItemRowProps {
  item: InvoiceItem;
  onDelete: () => void;
  showDelete?: boolean;
}

export const InvoiceItemRow: React.FC<InvoiceItemRowProps> = ({
  item,
  onDelete,
  showDelete = true,
}) => {
  const hasBrand = item.brand !== undefined && item.brand !== null && item.brand.trim() !== '';

  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <Text style={styles.name} numberOfLines={1}>
          {item.product_name}
        </Text>
        <View style={styles.metaRow}>
          {hasBrand && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.brand}</Text>
            </View>
          )}
          <Text style={styles.priceCalc}>
            {item.quantity} x {formatCurrency(item.price)}
          </Text>
        </View>
      </View>
      
      <View style={styles.rightContent}>
        <Text style={styles.total}>{formatCurrency(item.total)}</Text>
        {showDelete && (
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  leftContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  name: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.xs - 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderRadius: BORDER_RADIUS.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginRight: SPACING.sm,
  },
  badgeText: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  priceCalc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  total: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    color: COLORS.text,
    marginRight: SPACING.md,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
});

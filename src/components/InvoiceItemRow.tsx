import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';
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
  onEdit?: () => void;
  showDelete?: boolean;
}

export const InvoiceItemRow: React.FC<InvoiceItemRowProps> = ({
  item,
  onDelete,
  onEdit,
  showDelete = true,
}) => {
  const { colors, isDarkMode } = useTheme();
  const hasBrand = item.brand !== undefined && item.brand !== null && item.brand.trim() !== '';

  return (
    <View style={[styles.container, { borderBottomColor: colors.border, backgroundColor: colors.cardBg }]}>
      <View style={styles.leftContent}>
        <Text style={[styles.name, { color: isDarkMode ? colors.white : colors.primary }]} numberOfLines={1}>
          {item.product_name}
        </Text>
        <View style={styles.metaRow}>
          {hasBrand && (
            <View style={[styles.badge, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.1)' }]}>
              <Text style={[styles.badgeText, { color: colors.secondary }]}>{item.brand}</Text>
            </View>
          )}
          <Text style={[styles.priceCalc, { color: colors.textMuted }]}>
            {item.quantity} x {formatCurrency(item.price)}
          </Text>
        </View>
      </View>
      
      <View style={styles.rightContent}>
        <Text style={[styles.total, { color: colors.text }]}>{formatCurrency(item.total)}</Text>
        <View style={styles.actionsContainer}>
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={styles.editButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.secondary} />
            </TouchableOpacity>
          )}
          {showDelete && (
            <TouchableOpacity
              onPress={onDelete}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
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
  },
  leftContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  name: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: SPACING.xs - 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    borderRadius: BORDER_RADIUS.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginRight: SPACING.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priceCalc: {
    ...TYPOGRAPHY.caption,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  total: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    marginRight: SPACING.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: SPACING.xs,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
});

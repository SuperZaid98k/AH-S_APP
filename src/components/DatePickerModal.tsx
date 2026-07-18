import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  title?: string;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  title = 'Select Date',
}) => {
  const { colors, isDarkMode } = useTheme();
  
  // Set default view to currently selected date
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());

  // Keep state sync'd when modal becomes visible
  useEffect(() => {
    if (visible && selectedDate) {
      setCurrentYear(selectedDate.getFullYear());
      setCurrentMonth(selectedDate.getMonth());
    }
  }, [visible, selectedDate]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handlePrevYear = () => {
    setCurrentYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setCurrentYear(prev => prev + 1);
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    onSelectDate(newDate);
    onClose();
  };

  // Generate calendar grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const gridItems: (number | null)[] = [];
  // Leading empty cells
  for (let i = 0; i < firstDayIndex; i++) {
    gridItems.push(null);
  }
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    gridItems.push(i);
  }

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const isSelected = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.cardBg,
                  shadowColor: colors.shadowColor,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Header Title */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Month/Year Navigation */}
              <View style={styles.navRow}>
                {/* Year Controls */}
                <View style={styles.navGroup}>
                  <TouchableOpacity onPress={handlePrevYear} style={[styles.arrowButton, { borderColor: colors.border }]}>
                    <Ionicons name="play-back" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                  <Text style={[styles.yearText, { color: colors.text }]}>{currentYear}</Text>
                  <TouchableOpacity onPress={handleNextYear} style={[styles.arrowButton, { borderColor: colors.border }]}>
                    <Ionicons name="play-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Month Controls */}
                <View style={styles.navGroup}>
                  <TouchableOpacity onPress={handlePrevMonth} style={[styles.arrowButton, { borderColor: colors.border }]}>
                    <Ionicons name="chevron-back" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.monthText, { color: colors.text }]} numberOfLines={1}>
                    {MONTHS[currentMonth]}
                  </Text>
                  <TouchableOpacity onPress={handleNextMonth} style={[styles.arrowButton, { borderColor: colors.border }]}>
                    <Ionicons name="chevron-forward" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Days of Week Headers */}
              <View style={styles.weekHeadersRow}>
                {DAYS_OF_WEEK.map((day, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.weekHeaderCell,
                      { color: index === 0 || index === 6 ? colors.secondary : colors.textMuted },
                    ]}
                  >
                    {day}
                  </Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.gridContainer}>
                {gridItems.map((day, index) => {
                  if (day === null) {
                    return <View key={`empty-${index}`} style={styles.gridCell} />;
                  }

                  const selected = isSelected(day);
                  const today = isToday(day);

                  return (
                    <TouchableOpacity
                      key={`day-${day}`}
                      onPress={() => handleSelectDay(day)}
                      style={[
                        styles.gridCell,
                        selected && { backgroundColor: colors.secondary },
                        !selected && today && { borderWidth: 1.5, borderColor: colors.secondary },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { color: colors.text },
                          selected && { color: colors.white, fontWeight: '700' },
                          !selected && today && { color: colors.secondary, fontWeight: '700' },
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Footer shortcuts */}
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.shortcutButton, { backgroundColor: isDarkMode ? '#222' : '#F1F5F9' }]}
                  onPress={() => {
                    const today = new Date();
                    onSelectDate(today);
                    onClose();
                  }}
                >
                  <Text style={[styles.shortcutText, { color: colors.text }]}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={onClose}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: Math.min(SCREEN_WIDTH - SPACING.lg * 2, 340),
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowButton: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.xs,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'center',
  },
  monthText: {
    fontSize: 13,
    fontWeight: '700',
    width: 68,
    textAlign: 'center',
  },
  weekHeadersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.sm,
  },
  weekHeaderCell: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: SPACING.md,
  },
  gridCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xs,
    marginVertical: 1,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    gap: SPACING.sm,
  },
  shortcutButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xs,
    justifyContent: 'center',
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xs,
    borderWidth: 1,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

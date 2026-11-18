import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface CalendarPickerModalProps {
  visible: boolean;
  currentDateStr?: string; // Format: "DD/MM/YYYY"
  onSelectDate: (formattedDate: string) => void;
  onClose: () => void;
  title?: string;
  maxYear?: number;
  minYear?: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_HEADER = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CalendarPickerModal: React.FC<CalendarPickerModalProps> = ({
  visible,
  currentDateStr,
  onSelectDate,
  onClose,
  title = 'Select Date of Birth',
  maxYear = new Date().getFullYear() - 18, // Applicant must be at least 18
  minYear = new Date().getFullYear() - 75,
}) => {
  // Parse initial selected date
  const parseInitialDate = () => {
    if (currentDateStr && currentDateStr.includes('/')) {
      const parts = currentDateStr.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
          return { day: d, month: m, year: y };
        }
      }
    }
    // Default to applicant age ~ 28
    const defaultY = Math.min(maxYear, new Date().getFullYear() - 28);
    return { day: 15, month: 5, year: defaultY };
  };

  const initial = parseInitialDate();
  const [selectedDay, setSelectedDay] = useState<number>(initial.day);
  const [activeMonth, setActiveMonth] = useState<number>(initial.month);
  const [activeYear, setActiveYear] = useState<number>(initial.year);
  const [showYearPicker, setShowYearPicker] = useState<boolean>(false);

  // Calculate days in active month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get starting day index (0 = Sunday, 1 = Monday, ...)
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInCurrentMonth = getDaysInMonth(activeMonth, activeYear);
  const firstDayIndex = getFirstDayOfMonth(activeMonth, activeYear);

  // Navigate months
  const handlePrevMonth = () => {
    if (activeMonth === 0) {
      if (activeYear > minYear) {
        setActiveMonth(11);
        setActiveYear(activeYear - 1);
      }
    } else {
      setActiveMonth(activeMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (activeMonth === 11) {
      if (activeYear < maxYear) {
        setActiveMonth(0);
        setActiveYear(activeYear + 1);
      }
    } else {
      setActiveMonth(activeMonth + 1);
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    const dd = String(selectedDay).padStart(2, '0');
    const mm = String(activeMonth + 1).padStart(2, '0');
    const yyyy = String(activeYear);
    onSelectDate(`${dd}/${mm}/${yyyy}`);
    onClose();
  };

  // Build grid of day cells
  const renderCalendarCells = () => {
    const cells = [];
    // Blank padding cells for days before the 1st
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCellEmpty} />);
    }

    // Actual day cells
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const isSelected = d === selectedDay;
      cells.push(
        <TouchableOpacity
          key={`day-${d}`}
          style={[styles.dayCell, isSelected && styles.dayCellSelected]}
          onPress={() => setSelectedDay(d)}
          activeOpacity={0.7}
        >
          <Text style={[styles.dayCellText, isSelected && styles.dayCellTextSelected]}>
            {d}
          </Text>
        </TouchableOpacity>
      );
    }

    return cells;
  };

  // Generate list of available years
  const yearsList = [];
  for (let y = maxYear; y >= minYear; y--) {
    yearsList.push(y);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.calendarCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerSub}>{title}</Text>
              <Text style={styles.headerDateDisplay}>
                {String(selectedDay).padStart(2, '0')} {MONTH_NAMES[activeMonth].slice(0, 3)} {activeYear}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {showYearPicker ? (
            /* Year Picker View */
            <View style={styles.yearPickerContainer}>
              <View style={styles.yearPickerHeader}>
                <Text style={styles.yearPickerTitle}>Select Birth Year</Text>
                <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                  <Text style={styles.yearPickerDoneText}>Back to Calendar</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={true}>
                <View style={styles.yearsGrid}>
                  {yearsList.map((y) => {
                    const isYearActive = y === activeYear;
                    return (
                      <TouchableOpacity
                        key={y}
                        style={[styles.yearChip, isYearActive && styles.yearChipActive]}
                        onPress={() => {
                          setActiveYear(y);
                          setShowYearPicker(false);
                        }}
                      >
                        <Text style={[styles.yearChipText, isYearActive && styles.yearChipTextActive]}>
                          {y}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          ) : (
            /* Standard Month / Day Grid */
            <>
              {/* Month Navigation Row */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity
                  style={styles.monthNavBtn}
                  onPress={handlePrevMonth}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={18} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.monthYearSelector}
                  onPress={() => setShowYearPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.monthYearText}>
                    {MONTH_NAMES[activeMonth]} {activeYear}
                  </Text>
                  <Ionicons name="caret-down" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.monthNavBtn}
                  onPress={handleNextMonth}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Days of Week Header */}
              <View style={styles.daysHeaderRow}>
                {DAYS_HEADER.map((dh, idx) => (
                  <Text key={idx} style={[styles.dayHeaderCell, idx === 0 && { color: '#ef4444' }]}>
                    {dh}
                  </Text>
                ))}
              </View>

              {/* Calendar Days Matrix */}
              <View style={styles.calendarGrid}>{renderCalendarCells()}</View>
            </>
          )}

          {/* Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.8}>
              <Ionicons name="checkmark" size={16} color="#ffffff" />
              <Text style={styles.confirmBtnText}>Set Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerDateDisplay: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 2,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  monthYearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  monthYearText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dayHeaderCell: {
    width: 36,
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 8,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 36,
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  dayCellTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  yearPickerContainer: {
    paddingVertical: 10,
  },
  yearPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  yearPickerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  yearPickerDoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  yearChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 58,
    alignItems: 'center',
  },
  yearChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  yearChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
    gap: 4,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});

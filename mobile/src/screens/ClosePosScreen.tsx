import { useCallback, useEffect, useState } from 'react';
import { printShiftReading } from '../services/shiftReadingPrintService';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  closePosShift,
  getCurrentShift,
  type CurrentShiftResponse,
} from '../services/posService';

interface ClosePosScreenProps {
  onBack: () => void;
  onClosed: () => void;
}

const formatMoney = (value: string | number): string =>
  `₱${Number(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function ClosePosScreen({
  onBack,
  onClosed,
}: ClosePosScreenProps) {
  const [currentShift, setCurrentShift] =
    useState<CurrentShiftResponse | null>(null);
  const [actualCash, setActualCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadShift = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await getCurrentShift();
      setCurrentShift(result);
    } catch (error) {
      Alert.alert(
        'Unable to Load Shift',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadShift();
  }, [loadShift]);

  const shift = currentShift?.shift;
  const summary = currentShift?.summary;

  const expectedCash = Number(shift?.expected_cash ?? 0);
  const actualCashNumber = Number(actualCash);
  const hasValidCash =
    actualCash.trim() !== '' &&
    Number.isFinite(actualCashNumber) &&
    actualCashNumber >= 0;

  const variance = hasValidCash
    ? actualCashNumber - expectedCash
    : 0;

  const handleCloseShift = () => {
    if (!shift) {
      return;
    }

    if (!hasValidCash) {
      Alert.alert(
        'Invalid Cash Count',
        'Enter the actual cash counted. It must be zero or greater.',
      );
      return;
    }

    Alert.alert(
      'Confirm Close POS',
      `Expected cash: ${formatMoney(expectedCash)}\n` +
        `Actual cash: ${formatMoney(actualCashNumber)}\n` +
        `Variance: ${formatMoney(variance)}\n\n` +
        'Are you sure you want to close this shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Shift',
          style: 'destructive',
          onPress: () => {
            void submitCloseShift();
          },
        },
      ],
    );
  };

  const submitCloseShift = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const closedShift = await closePosShift({
        actual_cash: actualCashNumber,
        closing_notes: closingNotes.trim() || undefined,
      });

      const reading = closedShift.reading;

      if (!reading) {
        Alert.alert(
          'POS Closed Successfully',
          'The shift was closed, but the server did not return the X-reading. You can retrieve the saved reading from the web admin.',
          [{ text: 'OK', onPress: onClosed }],
        );
        return;
      }

      // The shift is already closed. Printing must never close it again.
      const printResult = await printShiftReading(reading);

      const readingDetails =
        `Reading No.: ${reading.reading_number}\n` +
        `Generated: ${new Date(reading.generated_at).toLocaleString()}\n\n` +
        `Cash Sales (${reading.cash_transaction_count}): ` +
        `${formatMoney(reading.cash_sales_total)}\n` +
        `GCash Sales (${reading.gcash_transaction_count}): ` +
        `${formatMoney(reading.gcash_sales_total)}\n` +
        `Voided (${reading.void_transaction_count}): ` +
        `${formatMoney(reading.void_sales_total)}\n\n` +
        `Opening Cash: ${formatMoney(reading.opening_cash)}\n` +
        `Expected Cash: ${formatMoney(reading.expected_cash)}\n` +
        `Actual Cash: ${formatMoney(reading.actual_cash)}\n` +
        `Variance: ${formatMoney(reading.cash_variance)}`;

      if (printResult.success) {
        Alert.alert(
          'Shift Closed — X-Reading Printed',
          `${readingDetails}\n\n${printResult.message}`,
          [{ text: 'OK', onPress: onClosed }],
        );
      } else {
        Alert.alert(
          'Shift Closed — Printing Failed',
          `${readingDetails}\n\n${printResult.message}`,
          [
            {
              text: 'Retry Print',
              onPress: () => {
                void retryPrintShiftReading(reading);
              },
            },
            {
              text: 'Continue',
              onPress: onClosed,
            },
          ],
        );
      }
    } catch (error) {
      Alert.alert(
        'Unable to Close POS',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryPrintShiftReading = async (
    reading: NonNullable<Awaited<ReturnType<typeof closePosShift>>['reading']>,
  ) => {
    const result = await printShiftReading(reading);

    Alert.alert(
      result.success ? 'X-Reading Printed' : 'Printing Failed',
      result.message,
      [{ text: 'OK' }],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.mutedText}>Loading current shift...</Text>
      </View>
    );
  }

  if (!shift || shift.status !== 'open') {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>No Open Shift</Text>
        <Text style={styles.mutedText}>
          There is no active POS shift to close.
        </Text>
        <Pressable style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Close POS</Text>
      <Text style={styles.subtitle}>
        Review this shift and reconcile the cash drawer.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Shift Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Shift ID</Text>
          <Text style={styles.value}>#{shift.id}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Branch</Text>
          <Text style={styles.value}>
            {shift.branch?.name ?? 'Not available'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Warehouse</Text>
          <Text style={styles.value}>
            {shift.warehouse?.name ?? 'Not available'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Opening Cash</Text>
          <Text style={styles.value}>
            {formatMoney(shift.opening_cash)}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sales Summary</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Cash Sales ({summary?.cash.transaction_count ?? 0})
          </Text>
          <Text style={styles.value}>
            {formatMoney(summary?.cash.total_amount ?? 0)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            GCash Sales ({summary?.gcash.transaction_count ?? 0})
          </Text>
          <Text style={styles.value}>
            {formatMoney(summary?.gcash.total_amount ?? 0)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Voided Sales ({summary?.voids.transaction_count ?? 0})
          </Text>
          <Text style={styles.value}>
            {formatMoney(summary?.voids.total_amount ?? 0)}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Cash Reconciliation</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Expected Cash</Text>
          <Text style={styles.expectedValue}>
            {formatMoney(expectedCash)}
          </Text>
        </View>

        <Text style={styles.inputLabel}>Actual Cash Counted (PHP)</Text>
        <TextInput
          style={styles.input}
          value={actualCash}
          onChangeText={(value) => {
            if (/^\d*\.?\d{0,2}$/.test(value)) {
              setActualCash(value);
            }
          }}
          placeholder="Enter cash counted"
          keyboardType="decimal-pad"
          editable={!isSubmitting}
        />

        <View style={styles.varianceBox}>
          <Text style={styles.label}>Estimated Variance</Text>
          <Text
            style={[
              styles.varianceValue,
              !hasValidCash
                ? styles.neutral
                : variance < 0
                  ? styles.shortage
                  : variance > 0
                    ? styles.overage
                    : styles.balanced,
            ]}
          >
            {hasValidCash
              ? `${variance > 0 ? '+' : ''}${formatMoney(variance)}`
              : 'Enter actual cash'}
          </Text>
          {hasValidCash ? (
            <Text style={styles.varianceHint}>
              {variance < 0
                ? 'Cash shortage'
                : variance > 0
                  ? 'Cash overage'
                  : 'Cash drawer balanced'}
            </Text>
          ) : null}
        </View>

        <Text style={styles.inputLabel}>Closing Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={closingNotes}
          onChangeText={setClosingNotes}
          placeholder="Enter closing notes"
          multiline
          editable={!isSubmitting}
        />
      </View>

      <Pressable
        style={[
          styles.closeButton,
          isSubmitting && styles.disabledButton,
        ]}
        onPress={handleCloseShift}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.closeButtonText}>Confirm Close POS</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={onBack}
        disabled={isSubmitting}
      >
        <Text style={styles.secondaryButtonText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F7FC',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F3F7FC',
  },
  mutedText: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: -8,
    fontSize: 13,
    color: '#6B7280',
  },
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  value: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    color: '#111827',
  },
  expectedValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  inputLabel: {
    marginBottom: -7,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#111827',
  },
  notesInput: {
    minHeight: 84,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  varianceBox: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F3F7FC',
    gap: 6,
  },
  varianceValue: {
    fontSize: 21,
    fontWeight: '800',
  },
  varianceHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  neutral: {
    color: '#6B7280',
  },
  shortage: {
    color: '#DC2626',
  },
  overage: {
    color: '#D97706',
  },
  balanced: {
    color: '#15803D',
  },
  closeButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#DC2626',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.65,
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
});
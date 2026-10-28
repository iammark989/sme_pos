import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  closeBusinessDay,
  getCurrentBusinessDay,
  openBusinessDay,
  type BusinessDay,
  type CurrentBusinessDayResponse,
  type ZReading,
} from '../services/businessDayService';

interface BusinessDayScreenProps {
  onBack: () => void;
}

export default function BusinessDayScreen({
  onBack,
}: BusinessDayScreenProps) {
  const [currentData, setCurrentData] =
    useState<CurrentBusinessDayResponse | null>(null);
  const [lastClosedReading, setLastClosedReading] =
    useState<ZReading | null>(null);
  const [recoveryReason, setRecoveryReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const refreshData = useCallback(async () => {
    try {
      setErrorMessage('');
      const result = await getCurrentBusinessDay();
      setCurrentData(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load business-day information.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const businessDay: BusinessDay | null =
    currentData?.business_day ?? null;

  const latestReading =
    lastClosedReading ?? currentData?.latest_z_reading ?? null;

  const businessDate = businessDay?.business_date;
  const today = new Date().toLocaleDateString('en-CA');
  const isOverdue = Boolean(
    businessDate && businessDate.slice(0, 10) < today,
  );

  const handleOpen = () => {
    Alert.alert(
      'Open Business Day',
      'Are you sure you want to open a new business day?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Business Day',
          onPress: () => {
            void (async () => {
              try {
                setIsSubmitting(true);
                setErrorMessage('');
                await openBusinessDay();
                await refreshData();
                Alert.alert('Success', 'Business day opened successfully.');
              } catch (error) {
                setErrorMessage(
                  error instanceof Error
                    ? error.message
                    : 'Unable to open the business day.',
                );
              } finally {
                setIsSubmitting(false);
              }
            })();
          },
        },
      ],
    );
  };

  const handleClose = () => {
    if (isOverdue && !recoveryReason.trim()) {
      setErrorMessage(
        'Please enter a recovery reason before closing this overdue business day.',
      );
      return;
    }

    Alert.alert(
      'Confirm Z-Reading',
      'This will generate the final Z-Reading and close the business day. All shifts at the branch must already be closed. Normal sales and voids will be blocked after closure.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Business Day',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setIsSubmitting(true);
                setErrorMessage('');

                const reading = await closeBusinessDay(
                  isOverdue ? recoveryReason.trim() : undefined,
                );

                setLastClosedReading(reading);
                setRecoveryReason('');
                await refreshData();

                Alert.alert(
                  'Business Day Closed',
                  `Z-Reading ${reading.reading_number ?? reading.snapshot?.reading_number ?? ''} was generated successfully.`,
                );
              } catch (error) {
                setErrorMessage(
                  error instanceof Error
                    ? error.message
                    : 'Unable to close the business day.',
                );
              } finally {
                setIsSubmitting(false);
              }
            })();
          },
        },
      ],
    );
  };

  const formatAmount = (value: number | string | undefined) => {
    const amount = Number(value ?? 0);
    return `₱${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.mutedText}>Loading business-day status...</Text>
      </View>
    );
  }

    function formatBusinessDate(value?: string | null): string {
    if (!value) {
        return '—';
    }

    // Laravel may serialize a date-only value as midnight UTC.
    // Convert that timestamp to the Philippines' local calendar date.
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value.slice(0, 10);
    }

    return date.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setIsLoading(true);
            void refreshData();
          }}
          disabled={isSubmitting}
        >
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Business Day</Text>
      <Text style={styles.subtitle}>Manage daily operations and Z-Readings.</Text>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Status</Text>
        <Text style={styles.statusText}>
          {businessDay
            ? `Business day ${businessDay.status}`
            : 'No open business day'}
        </Text>
        <Text style={styles.detailText}>
        Business date: {formatBusinessDate(businessDay?.business_date)}
        </Text>

        {businessDay?.opened_at ? (
          <Text style={styles.detailText}>
            Opened: {new Date(businessDay.opened_at).toLocaleString()}
          </Text>
        ) : null}

        {businessDay?.status === 'open' ? (
          <>
            {isOverdue ? (
              <>
                <Text style={styles.warningText}>
                  This business day is overdue and requires a recovery reason.
                </Text>
                <TextInput
                  style={styles.input}
                  value={recoveryReason}
                  onChangeText={setRecoveryReason}
                  placeholder="Enter recovery reason"
                  multiline
                  maxLength={2000}
                  textAlignVertical="top"
                />
              </>
            ) : null}

            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Please wait...' : 'Close Day & Generate Z-Reading'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={handleOpen}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Please wait...' : 'Open Business Day'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Latest Z-Reading</Text>

        {latestReading ? (
          <>
            <Text style={styles.readingNumber}>
              {latestReading.reading_number ??
                latestReading.snapshot?.reading_number ??
                'Saved Z-Reading'}
            </Text>
            <Text style={styles.detailText}>
              Business date: {(
                latestReading.snapshot?.business_date ??
                latestReading.businessDay?.business_date ??
                '—'
                ).slice(0, 10)}
            </Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Gross sales</Text>
              <Text style={styles.totalValue}>
                {formatAmount(
                  latestReading.snapshot?.gross_sales_amount ??
                    latestReading.gross_sales_amount,
                )}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Voided sales</Text>
              <Text style={styles.totalValue}>
                {formatAmount(
                  latestReading.snapshot?.voided_sales_amount ??
                    latestReading.voided_sales_amount,
                )}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Net sales</Text>
              <Text style={styles.totalValue}>
                {formatAmount(
                  latestReading.snapshot?.net_sales_amount ??
                    latestReading.net_sales_amount,
                )}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Cash sales</Text>
              <Text style={styles.totalValue}>
                {formatAmount(
                  latestReading.snapshot?.cash_sales_amount ??
                    latestReading.cash_sales_amount,
                )}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GCash sales</Text>
              <Text style={styles.totalValue}>
                {formatAmount(
                  latestReading.snapshot?.gcash_sales_amount ??
                    latestReading.gcash_sales_amount,
                )}
              </Text>
            </View>
            <Text style={styles.detailText}>
              Transactions: {latestReading.snapshot?.sales_count ??
                latestReading.sales_count ?? 0}
            </Text>
          </>
        ) : (
          <Text style={styles.mutedText}>No Z-Reading is available yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F7FC' },
  content: { padding: 20, paddingBottom: 36 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F3F7FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backButtonText: { color: '#2563EB', fontSize: 15, fontWeight: '700' },
  refreshText: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', color: '#102A43' },
  subtitle: { color: '#6B7280', marginTop: 6, marginBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#102A43',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  detailText: { color: '#6B7280', fontSize: 13, marginTop: 6 },
  warningText: {
    color: '#B45309',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    marginTop: 10,
    marginBottom: 12,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  dangerButton: { backgroundColor: '#B91C1C' },
  buttonText: { color: '#FFFFFF', fontWeight: '800', textAlign: 'center' },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#991B1B', fontSize: 13, lineHeight: 19 },
  readingNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  totalLabel: { color: '#6B7280', fontSize: 13 },
  totalValue: { color: '#111827', fontSize: 13, fontWeight: '700' },
  mutedText: { color: '#6B7280', marginTop: 8, fontSize: 14 },
});
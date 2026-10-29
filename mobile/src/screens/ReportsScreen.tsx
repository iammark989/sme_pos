import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { AuthUser } from '../services/authService';
import { getBranches } from '../services/branchService';
import type { Branch } from '../services/branchService';

import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform, Modal } from 'react-native';

import {
  getDailyProductSalesReport,
  getDailyXReadingReport,
  getDailyZReadingReport,
} from '../services/reportService';

import type {
  ProductSalesReport,
  XReadingReport,
  ZReadingReport,
} from '../services/reportService';

type ReportTab = 'x' | 'z' | 'products';

interface ReportsScreenProps {
  user: AuthUser;
  onBack: () => void;
}

function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function money(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);

  return `₱${(Number.isFinite(amount) ? amount : 0).toLocaleString(
    'en-PH',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`;
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

export default function ReportsScreen({
  user,
  onBack,
}: ReportsScreenProps) {
  const isOwner = user.role?.name === 'Owner';

  const isGlobalAdmin =
    user.role?.name === 'Admin' &&
    user.is_global_admin === true;

  const canSelectAnyBranch = isOwner || isGlobalAdmin;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(
    user.branch?.id ?? null,
  );

  const [date, setDate] = useState(getToday());
  const [activeTab, setActiveTab] = useState<ReportTab>('x');

  const [xReport, setXReport] = useState<XReadingReport | null>(null);
  const [zReport, setZReport] = useState<ZReadingReport | null>(null);
  const [productReport, setProductReport] =
    useState<ProductSalesReport | null>(null);

  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [error, setError] = useState('');

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(new Date(`${date}T12:00:00`));

  useEffect(() => {
    if (!canSelectAnyBranch) {
      setSelectedBranchId(user.branch?.id ?? null);
      return;
    }

    let isMounted = true;

    async function loadBranches() {
      setIsLoadingBranches(true);
      setError('');

      try {
        const result = await getBranches();

        if (!isMounted) {
          return;
        }

        setBranches(result);

        setSelectedBranchId((current) => {
          if (current !== null && result.some((b) => b.id === current)) {
            return current;
          }

          return result[0]?.id ?? null;
        });
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load branches.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingBranches(false);
        }
      }
    }

    void loadBranches();

    return () => {
      isMounted = false;
    };
  }, [canSelectAnyBranch, user.branch?.id]);

  async function generateReport() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Enter the date in YYYY-MM-DD format.');
      return;
    }

    const parsedDate = new Date(`${date}T00:00:00`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.getFullYear() !== Number(date.slice(0, 4)) ||
      parsedDate.getMonth() + 1 !== Number(date.slice(5, 7)) ||
      parsedDate.getDate() !== Number(date.slice(8, 10))
    ) {
      setError('Enter a valid date in YYYY-MM-DD format.');
      return;
    }

    if (selectedBranchId === null) {
      setError('Select a branch before generating the report.');
      return;
    }

    setIsLoadingReport(true);
    setError('');

    try {
      const params = {
        date,
        branch_id: selectedBranchId,
      };

      if (activeTab === 'x') {
        const result = await getDailyXReadingReport(params);
        setXReport(result);
      } else if (activeTab === 'z') {
        const result = await getDailyZReadingReport(params);
        setZReport(result);
      } else {
        const result = await getDailyProductSalesReport(params);
        setProductReport(result);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load the report.',
      );
    } finally {
      setIsLoadingReport(false);
    }
  }

  const selectedBranch = branches.find(
    (branch) => branch.id === selectedBranchId,
  );

  const branchName = canSelectAnyBranch
    ? selectedBranch?.name ?? 'Select a branch'
    : user.branch?.name ?? 'Not assigned';

  const businessDayExists =
    activeTab === 'x'
      ? xReport?.business_day_exists
      : activeTab === 'z'
        ? zReport?.business_day_exists
        : productReport?.business_day_exists;

  const currentReportMatchesSelection =
    activeTab === 'x'
      ? xReport?.date === date &&
        xReport?.branch_id === selectedBranchId
      : activeTab === 'z'
        ? zReport?.date === date &&
          zReport?.branch_id === selectedBranchId
        : productReport?.date === date &&
          productReport?.branch_id === selectedBranchId;

  const hasCurrentReport =
    currentReportMatchesSelection &&
    businessDayExists !== undefined;

  function changeTab(tab: ReportTab) {
    setActiveTab(tab);
    setError('');
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>
          Review business-day sales and readings.
        </Text>
      </View>

      <View style={styles.filterCard}>
        <Text style={styles.sectionTitle}>Report Filters</Text>

        <Text style={styles.label}>Business Date</Text>
        <TouchableOpacity
            style={styles.dateInput}
            onPress={() => {
                setDraftDate(parseDate(date));
                setIsDatePickerOpen(true);
            }}
            activeOpacity={0.8}
            >
            <Text style={styles.dateInputText}>
                {date}
            </Text>
            <Text style={styles.calendarIcon}>📅</Text>
            </TouchableOpacity>

        <Text style={styles.label}>Branch</Text>

        {canSelectAnyBranch ? (
          isLoadingBranches ? (
            <ActivityIndicator color="#2563EB" />
          ) : (
            <View style={styles.branchList}>
              {branches.map((branch) => {
                const selected = branch.id === selectedBranchId;

                return (
                  <TouchableOpacity
                    key={branch.id}
                    style={[
                      styles.branchOption,
                      selected && styles.branchOptionSelected,
                    ]}
                    onPress={() => setSelectedBranchId(branch.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.branchOptionText,
                        selected && styles.branchOptionTextSelected,
                      ]}
                    >
                      {branch.name}
                      {branch.code ? ` (${branch.code})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )
        ) : (
          <View style={styles.assignedBranch}>
            <Text style={styles.assignedBranchText}>
              {branchName}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.generateButton,
            (isLoadingReport || isLoadingBranches) &&
              styles.disabledButton,
          ]}
          onPress={() => void generateReport()}
          disabled={isLoadingReport || isLoadingBranches}
          activeOpacity={0.8}
        >
          <Text style={styles.generateButtonText}>
            Generate Report
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {[
          { key: 'x' as const, label: 'X-Reading' },
          { key: 'z' as const, label: 'Z-Reading' },
          { key: 'products' as const, label: 'Product Sales' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => changeTab(tab.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {isLoadingReport ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      ) : hasCurrentReport && businessDayExists === false ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Business Day</Text>
          <Text style={styles.emptyText}>
            No business occure on selected date
          </Text>
        </View>
      ) : hasCurrentReport && businessDayExists === true ? (
        <View style={styles.results}>
          <Text style={styles.resultsHeading}>
            {activeTab === 'x'
              ? 'X-Reading Summary'
              : activeTab === 'z'
                ? 'Z-Reading Summary'
                : 'Product Sales Summary'}
          </Text>

          <Text style={styles.resultsSubtitle}>
            {date} · {branchName}
          </Text>

          {activeTab === 'x' && xReport && (
            <>
              {xReport.summary && (
                <View style={styles.summaryGrid}>
                  <SummaryCard
                    label="Shifts"
                    value={String(xReport.summary.shift_count)}
                  />
                  <SummaryCard
                    label="Cash Sales"
                    value={money(xReport.summary.cash_sales_total)}
                  />
                  <SummaryCard
                    label="GCash Sales"
                    value={money(xReport.summary.gcash_sales_total)}
                  />
                  <SummaryCard
                    label="Cash Variance"
                    value={money(xReport.summary.cash_variance)}
                  />
                </View>
              )}

              {xReport.x_readings.map((reading) => (
                <View key={reading.id} style={styles.detailCard}>
                  <Text style={styles.detailTitle}>
                    {reading.reading_number}
                  </Text>
                  <Text style={styles.detailSubtitle}>
                    Cashier: {reading.cashier ?? 'Unknown'}
                  </Text>
                  <Text style={styles.detailSubtitle}>
                    Warehouse: {reading.warehouse ?? 'Not assigned'}
                  </Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cash sales</Text>
                    <Text style={styles.detailValue}>
                      {money(reading.cash_sales_total)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>GCash sales</Text>
                    <Text style={styles.detailValue}>
                      {money(reading.gcash_sales_total)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expected cash</Text>
                    <Text style={styles.detailValue}>
                      {money(reading.expected_cash)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Actual cash</Text>
                    <Text style={styles.detailValue}>
                      {money(reading.actual_cash)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cash variance</Text>
                    <Text style={styles.detailValue}>
                      {money(reading.cash_variance)}
                    </Text>
                  </View>
                </View>
              ))}

              {xReport.x_readings.length === 0 && (
                <Text style={styles.emptyText}>
                  No X-Readings are available for this business day.
                </Text>
              )}
            </>
          )}

          {activeTab === 'z' && zReport && (
            <>
              {zReport.z_reading ? (
                <View style={styles.detailCard}>
                  <Text style={styles.detailTitle}>
                    {zReport.z_reading.reading_number}
                  </Text>
                  <Text style={styles.detailSubtitle}>
                    Z-Counter: {zReport.z_reading.z_counter}
                  </Text>
                  <Text style={styles.detailSubtitle}>
                    Generated: {zReport.z_reading.generated_at}
                  </Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Sales count</Text>
                    <Text style={styles.detailValue}>
                      {zReport.z_reading.sales_count}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Voided sales</Text>
                    <Text style={styles.detailValue}>
                      {zReport.z_reading.voided_sales_count}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Gross sales</Text>
                    <Text style={styles.detailValue}>
                      {money(zReport.z_reading.gross_sales_amount)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Voided amount</Text>
                    <Text style={styles.detailValue}>
                      {money(zReport.z_reading.voided_sales_amount)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Net sales</Text>
                    <Text style={styles.detailValue}>
                      {money(zReport.z_reading.net_sales_amount)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cash sales</Text>
                    <Text style={styles.detailValue}>
                      {money(zReport.z_reading.cash_sales_amount)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>GCash sales</Text>
                    <Text style={styles.detailValue}>
                      {money(zReport.z_reading.gcash_sales_amount)}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>
                    Z-Reading Not Generated
                  </Text>
                  <Text style={styles.emptyText}>
                    The business day exists, but no saved Z-Reading was returned.
                  </Text>
                </View>
              )}
            </>
          )}

          {activeTab === 'products' && productReport && (
            <>
              {productReport.products.length > 0 ? (
                productReport.products.map((product, index) => (
                  <View
                    key={`${product.product_id}-${index}`}
                    style={styles.detailCard}
                  >
                    <Text style={styles.detailTitle}>
                      {product.product_name}
                    </Text>
                    <Text style={styles.detailSubtitle}>
                      SKU: {product.sku ?? 'No SKU'}
                    </Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Quantity sold</Text>
                      <Text style={styles.detailValue}>
                        {product.quantity_sold}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Gross sales</Text>
                      <Text style={styles.detailValue}>
                        {money(product.gross_sales)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    No product sales were found for this business day.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Select a date and branch, then generate a report.
          </Text>
        </View>
      )}

      {Platform.OS === 'android' ? (
  isDatePickerOpen && (
    <DateTimePicker
      value={draftDate}
      mode="date"
      display="calendar"
      onValueChange={(_, selectedDate) => {
        setIsDatePickerOpen(false);

        if (selectedDate) {
          setDate(formatDate(selectedDate));
        }
      }}
      onDismiss={() => setIsDatePickerOpen(false)}
    />
  )
) : (
  <Modal
    visible={isDatePickerOpen}
    transparent
    animationType="fade"
    onRequestClose={() => setIsDatePickerOpen(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.datePickerModal}>
        <Text style={styles.datePickerTitle}>Select Business Date</Text>

        <DateTimePicker
          value={draftDate}
          mode="date"
          display="spinner"
          onChange={(_, selectedDate) => {
            if (selectedDate) {
              setDraftDate(selectedDate);
            }
          }}
        />

        <View style={styles.modalActions}>
          <TouchableOpacity
            onPress={() => setIsDatePickerOpen(false)}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setDate(formatDate(draftDate));
              setIsDatePickerOpen(false);
            }}
            style={styles.confirmButton}
          >
            <Text style={styles.confirmButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 22,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#102A43',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    marginTop: 5,
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#102A43',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 7,
  },
  dateInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    },
    dateInputText: {
    color: '#111827',
    fontSize: 14,
    },
    calendarIcon: {
    fontSize: 18,
    },
    modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    },
    datePickerModal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    },
    datePickerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#102A43',
    textAlign: 'center',
    marginBottom: 12,
    },
    modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
    },
    cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    },
    cancelButtonText: {
    color: '#374151',
    fontWeight: '700',
    },
    confirmButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    },
    confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    },
  branchList: {
    gap: 8,
    marginBottom: 16,
  },
  branchOption: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
  },
  branchOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  branchOptionText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  branchOptionTextSelected: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  assignedBranch: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  assignedBranchText: {
    color: '#374151',
    fontWeight: '700',
  },
  generateButton: {
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  activeTab: {
    backgroundColor: '#102A43',
  },
  tabText: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 19,
  },
  loading: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 13,
  },
  results: {
    gap: 12,
  },
  resultsHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#102A43',
  },
  resultsSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -7,
    marginBottom: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '44%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 13,
  },
  summaryLabel: {
    color: '#6B7280',
    fontSize: 12,
  },
  summaryValue: {
    color: '#102A43',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 7,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 15,
    gap: 10,
  },
  detailTitle: {
    color: '#102A43',
    fontSize: 15,
    fontWeight: '800',
  },
  detailSubtitle: {
    color: '#6B7280',
    fontSize: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: 12,
    flex: 1,
  },
  detailValue: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: '#102A43',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
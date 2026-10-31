import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useCallback, useEffect, useState } from 'react';

import type { AuthUser } from '../services/authService';

import {
  getInventoryTransactions,
  type InventoryTransaction,
  type InventoryTransactionSummary,
} from '../services/inventoryTransactionService';

interface InventoryTransactionsScreenProps {
  user: AuthUser;
  onBack: () => void;
}

const emptySummary: InventoryTransactionSummary = {
  total_transactions: 0,
  stock_in_count: 0,
  stock_in_quantity: 0,
  sale_count: 0,
  sale_quantity: 0,
  sale_reversal_count: 0,
  sale_reversal_quantity: 0,
  adjustment_count: 0,
  adjustment_quantity: 0,
  transfer_in_count: 0,
  transfer_in_quantity: 0,
  transfer_out_count: 0,
  transfer_out_quantity: 0,
};

export default function InventoryTransactionsScreen({
  user,
  onBack,
}: InventoryTransactionsScreenProps) {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [summary, setSummary] =
    useState<InventoryTransactionSummary>(emptySummary);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const result = await getInventoryTransactions({
        page: 1,
        per_page: 20,
      });

      setTransactions(result.data.data);
      setSummary(result.summary);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load inventory transactions.';

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const formatNumber = (value: number | string | null | undefined) => {
    return Number(value ?? 0).toLocaleString('en-PH');
  };

  const formatQuantity = (value: number | string) => {
    return Number(value).toLocaleString('en-PH', {
      maximumFractionDigits: 3,
    });
  };

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'stock_in':
        return '#059669';
      case 'sale':
        return '#2563EB';
      case 'sale_reversal':
        return '#D97706';
      case 'adjustment':
        return '#7C3AED';
      case 'transfer_in':
        return '#0891B2';
      case 'transfer_out':
        return '#EA580C';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Inventory Transactions</Text>
          <Text style={styles.headerSubtitle}>
            {user.branch?.name ?? 'All Branches'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => void loadTransactions()}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>
            Loading inventory transactions...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Unable to load transactions</Text>
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => void loadTransactions()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary */}
          <Text style={styles.sectionTitle}>Transaction Summary</Text>

          <View style={styles.summaryGrid}>
            <SummaryCard
              title="Total Transactions"
              value={formatNumber(summary.total_transactions)}
              color="#2563EB"
            />

            <SummaryCard
              title="Stock In"
              value={formatNumber(summary.stock_in_count)}
              subtitle={`${formatQuantity(summary.stock_in_quantity)} units`}
              color="#059669"
            />

            <SummaryCard
              title="Sales"
              value={formatNumber(summary.sale_count)}
              subtitle={`${formatQuantity(summary.sale_quantity)} units`}
              color="#2563EB"
            />

            <SummaryCard
              title="Transfers In"
              value={formatNumber(summary.transfer_in_count)}
              subtitle={`${formatQuantity(summary.transfer_in_quantity)} units`}
              color="#0891B2"
            />

            <SummaryCard
              title="Transfers Out"
              value={formatNumber(summary.transfer_out_count)}
              subtitle={`${formatQuantity(summary.transfer_out_quantity)} units`}
              color="#EA580C"
            />

            <SummaryCard
              title="Adjustments"
              value={formatNumber(summary.adjustment_count)}
              subtitle={`${formatQuantity(summary.adjustment_quantity)} units`}
              color="#7C3AED"
            />

            <SummaryCard
              title="Sale Reversals"
              value={formatNumber(summary.sale_reversal_count)}
              subtitle={`${formatQuantity(summary.sale_reversal_quantity)} units`}
              color="#D97706"
            />
          </View>

          {/* Transaction List */}
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>

            <Text style={styles.resultCount}>
              {formatNumber(transactions.length)} records
            </Text>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Transactions Found</Text>
              <Text style={styles.emptyText}>
                Inventory transaction records will appear here.
              </Text>
            </View>
          ) : (
            transactions.map((transaction) => {
              const color = getTransactionColor(transaction.type);

              return (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionTopRow}>
                    <View style={styles.transactionItemContainer}>
                      <Text style={styles.itemName}>
                        {transaction.inventory_item?.name ?? 'Unknown Item'}
                      </Text>

                      <Text style={styles.itemSku}>
                        SKU: {transaction.inventory_item?.sku ?? 'N/A'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: `${color}15` },
                      ]}
                    >
                      <Text style={[styles.typeBadgeText, { color }]}>
                        {transaction.transaction_category}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.transactionDivider} />

                  <View style={styles.transactionDetails}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Quantity</Text>
                      <Text style={[styles.quantityValue, { color }]}>
                        {formatQuantity(transaction.quantity)}
                        {transaction.inventory_item?.uom?.abbreviation
                          ? ` ${transaction.inventory_item.uom.abbreviation}`
                          : ''}
                      </Text>
                    </View>

                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Warehouse</Text>
                      <Text style={styles.detailValue}>
                        {transaction.warehouse?.name ?? 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {transaction.related_warehouse && (
                    <View style={styles.relatedWarehouseContainer}>
                      <Text style={styles.detailLabel}>Related Warehouse</Text>
                      <Text style={styles.detailValue}>
                        {transaction.related_warehouse.name}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.created_at)}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color: string;
}

function SummaryCard({
  title,
  value,
  subtitle,
  color,
}: SummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIndicator, { backgroundColor: color }]} />

      <Text style={styles.summaryLabel}>{title}</Text>

      <Text style={styles.summaryValue}>{value}</Text>

      {subtitle && (
        <Text style={styles.summarySubtitle}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 4,
  },
  backButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#102A43',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
  },
  refreshButtonText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#102A43',
    marginBottom: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  summaryCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '44%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 13,
    padding: 13,
  },
  summaryIndicator: {
    width: 28,
    height: 4,
    borderRadius: 4,
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 22,
    color: '#102A43',
    fontWeight: '800',
    marginTop: 5,
  },
  summarySubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultCount: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 14,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 15,
    marginBottom: 11,
  },
  transactionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  transactionItemContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#102A43',
  },
  itemSku: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  typeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  transactionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailColumn: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  relatedWarehouseContainer: {
    marginTop: 12,
  },
  transactionDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B91C1C',
  },
  errorText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 9,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#374151',
  },
  emptyText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
  },
});
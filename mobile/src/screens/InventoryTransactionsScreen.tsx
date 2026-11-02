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

  const [activeTab, setActiveTab] = useState<
    'all' | 'stock_in' | 'transfer' | 'adjustment'
  >('all');

  const [expandedTransactionId, setExpandedTransactionId] =
    useState<number | null>(null);

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

  const getTransactionColor = (category: string) => {
    switch (category) {
      case 'Stock In':
        return '#059669';
      case 'Stock Transfer':
        return '#0891B2';
      case 'Adjustment':
        return '#7C3AED';
      case 'Sale':
        return '#2563EB';
      case 'Sale Reversal':
        return '#D97706';
      default:
        return '#6B7280';
    }
  };

    const filteredTransactions = transactions.filter((transaction) => {
    switch (activeTab) {
      case 'stock_in':
        return transaction.transaction_category === 'Stock In';

      case 'transfer':
        return transaction.transaction_category === 'Stock Transfer';

      case 'adjustment':
        return transaction.transaction_category === 'Adjustment';

      default:
        return true;
    }
  });

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
              {formatNumber(filteredTransactions.length)} records
            </Text>
          </View>

          {/* Transaction Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabScroll}
            contentContainerStyle={styles.tabContainer}
          >
            {[
              { key: 'all', label: 'All' },
              { key: 'stock_in', label: 'Stock In' },
              { key: 'transfer', label: 'Stock Transfer' },
              { key: 'adjustment', label: 'Adjustment' },
            ].map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tabButton,
                    isActive && styles.activeTabButton,
                  ]}
                  onPress={() => {
                    setActiveTab(tab.key as typeof activeTab);
                    setExpandedTransactionId(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      isActive && styles.activeTabButtonText,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Transactions Found</Text>
              <Text style={styles.emptyText}>
                No transaction records found for this category.
              </Text>
            </View>
          ) : (
            filteredTransactions.map((transaction) => {
              const color = getTransactionColor(
                transaction.transaction_category,
              );

              const isExpanded =
                expandedTransactionId === transaction.id;

              return (
                <TouchableOpacity
                  key={transaction.id}
                  style={styles.transactionCard}
                  activeOpacity={0.9}
                  onPress={() =>
                    setExpandedTransactionId(
                      isExpanded ? null : transaction.id,
                    )
                  }
                >
                  {/* Document Header */}
                  <View style={styles.transactionTopRow}>
                    <View style={styles.transactionItemContainer}>
                      <Text style={styles.itemName}>
                        {transaction.reference ?? `Transaction #${transaction.id}`}
                      </Text>

                      <Text style={styles.itemSku}>
                        {transaction.item_count}{' '}
                        {transaction.item_count === 1 ? 'item' : 'items'}
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

                  {/* Document Details */}
                  <View style={styles.transactionDetails}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Reference</Text>
                      <Text style={styles.detailValue}>
                        {transaction.reference ?? `#${transaction.id}`}
                      </Text>
                    </View>

                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Items</Text>
                      <Text style={styles.detailValue}>
                        {transaction.item_count}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.date)}
                  </Text>

                  {/* Expand Indicator */}
                  <View style={styles.expandIndicator}>
                    <Text style={styles.expandIndicatorText}>
                      {isExpanded ? 'Hide Items ▲' : 'View Items ▼'}
                    </Text>
                  </View>

                  {/* Associated Inventory Items */}
                  {isExpanded && (
                    <View style={styles.expandedItemsContainer}>
                      <Text style={styles.expandedItemsTitle}>
                        Transaction Items
                      </Text>

                      {transaction.items.map((item) => {
                        const itemColor = getTransactionColor(
                          item.transaction_category,
                        );

                        return (
                          <View key={item.id} style={styles.expandedItemCard}>
                            <View style={styles.expandedItemHeader}>
                              <View style={styles.transactionItemContainer}>
                                <Text style={styles.itemName}>
                                  {item.inventory_item?.name ?? 'Unknown Item'}
                                </Text>

                                <Text style={styles.itemSku}>
                                  SKU: {item.inventory_item?.sku ?? 'N/A'}
                                </Text>
                              </View>

                              <Text
                                style={[
                                  styles.quantityValue,
                                  { color: itemColor },
                                ]}
                              >
                                {formatQuantity(item.quantity)}
                                {item.inventory_item?.uom?.abbreviation
                                  ? ` ${item.inventory_item.uom.abbreviation}`
                                  : ''}
                              </Text>
                            </View>

                            <Text style={styles.expandedItemDetail}>
                              Movement: {item.type.replace(/_/g, ' ')}
                            </Text>

                            <Text style={styles.expandedItemDetail}>
                              Warehouse: {item.warehouse?.name ?? 'N/A'}
                            </Text>

                            {item.related_warehouse && (
                              <Text style={styles.expandedItemDetail}>
                                Related Warehouse: {item.related_warehouse.name}
                              </Text>
                            )}

                            {item.notes && (
                              <Text style={styles.expandedItemDetail}>
                                Notes: {item.notes}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </TouchableOpacity>
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
  tabScroll: {
    marginBottom: 14,
  },

  tabContainer: {
    gap: 8,
    paddingBottom: 4,
  },

  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  activeTabButton: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },

  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },

  activeTabButtonText: {
    color: '#FFFFFF',
  },

  expandIndicator: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  expandIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },

  expandedItemsContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  expandedItemsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#102A43',
    marginBottom: 10,
  },

  expandedItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },

  expandedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  expandedItemDetail: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 7,
    textTransform: 'capitalize',
  },
});
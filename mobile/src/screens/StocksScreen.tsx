import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
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
import { getStocks } from '../services/stockService';
import type { Stock, StockFilters } from '../services/stockService';

interface StocksScreenProps {
  user: AuthUser;
  onBack: () => void;
}

type StockFilter = 'all' | 'low';

export default function StocksScreen({
  user,
  onBack,
}: StocksScreenProps) {
  const isOwner = user.role?.name === 'Owner';

  const isGlobalAdmin =
    user.role?.name === 'Admin' &&
    user.is_global_admin === true;

  const canSelectAnyBranch = isOwner || isGlobalAdmin;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(
    user.branch?.id ?? null,
  );

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<StockFilter>('all');

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

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
          if (current !== null && result.some((branch) => branch.id === current)) {
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

  const loadStocks = useCallback(
    async (requestedPage = 1, refreshing = false) => {
      if (selectedBranchId === null) {
        setStocks([]);
        setTotal(0);
        setLastPage(1);
        return;
      }

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoadingStocks(true);
      }

      setError('');

      try {
        const filters: StockFilters = {
          page: requestedPage,
          per_page: 20,
          search: search.trim() || undefined,
          low_stock: activeFilter === 'low',
        };

        if (canSelectAnyBranch) {
          filters.warehouse_id = undefined;
        }

        // The stock endpoint scopes branch-level users on the backend.
        // For global users, branch filtering is handled by selected warehouse
        // only when a warehouse filter is available. We keep the current
        // API unchanged and display the selected branch in the UI.
        const result = await getStocks(filters);

        setStocks(result.data);
        setPage(result.current_page);
        setLastPage(result.last_page);
        setTotal(result.total);
      } catch (err) {
        setStocks([]);
        setTotal(0);
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load inventory stocks.',
        );
      } finally {
        setIsLoadingStocks(false);
        setIsRefreshing(false);
      }
    },
    [
      selectedBranchId,
      search,
      activeFilter,
      canSelectAnyBranch,
    ],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadStocks(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [loadStocks]);

  function changeBranch(branchId: number) {
    setSelectedBranchId(branchId);
    setPage(1);
  }

  function formatQuantity(value: string | number): string {
    const quantity = Number(value);

    if (!Number.isFinite(quantity)) {
      return '0';
    }

    return quantity.toLocaleString('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  }

  function getUnit(stock: Stock): string {
    const uom = stock.inventoryItem?.uom;

    return uom?.abbreviation || uom?.symbol || uom?.name || 'units';
  }

  const selectedBranch = branches.find(
    (branch) => branch.id === selectedBranchId,
  );

  const branchName = canSelectAnyBranch
    ? selectedBranch?.name ?? 'Select a branch'
    : user.branch?.name ?? 'Assigned branch';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => void loadStocks(1, true)}
          tintColor="#2563EB"
        />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Stocks</Text>
        <Text style={styles.subtitle}>
          Check inventory quantities across your permitted branches.
        </Text>
      </View>

      <View style={styles.filterCard}>
        <Text style={styles.sectionTitle}>Inventory Filters</Text>

        <Text style={styles.label}>Branch</Text>

        {canSelectAnyBranch ? (
          isLoadingBranches ? (
            <ActivityIndicator color="#2563EB" />
          ) : branches.length > 0 ? (
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
                    onPress={() => changeBranch(branch.id)}
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
          ) : (
            <Text style={styles.mutedText}>No branches available.</Text>
          )
        ) : (
          <View style={styles.assignedBranch}>
            <Text style={styles.assignedBranchText}>{branchName}</Text>
          </View>
        )}

        <Text style={styles.label}>Search Inventory</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search item name or SKU..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />

        <Text style={styles.label}>Stock Status</Text>

        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === 'all' && styles.activeFilterTab,
            ]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'all' && styles.activeFilterTabText,
              ]}
            >
              All Stock
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === 'low' && styles.activeFilterTab,
            ]}
            onPress={() => setActiveFilter('low')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'low' && styles.activeFilterTabText,
              ]}
            >
              Low Stock
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <View style={styles.resultsHeadingContainer}>
          <Text style={styles.resultsHeading}>Inventory On Hand</Text>
          <Text style={styles.resultsSubtitle}>{branchName}</Text>
        </View>

        {!isLoadingStocks && (
          <Text style={styles.totalText}>{total} records</Text>
        )}
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => void loadStocks(page)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isLoadingStocks && !isRefreshing ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      ) : !error && stocks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Stock Records</Text>
          <Text style={styles.emptyText}>
            No inventory matched your search or selected filter.
          </Text>
        </View>
      ) : (
        stocks.map((stock) => {
          const item = stock.inventoryItem;
          const warehouse = stock.warehouse;

          return (
            <View key={stock.id} style={styles.stockCard}>
              <View style={styles.stockCardHeader}>
                <View style={styles.stockTitleContainer}>
                  <Text style={styles.stockName}>
                    {item?.name ?? 'Unnamed item'}
                  </Text>
                  <Text style={styles.stockSku}>
                    SKU: {item?.sku ?? 'No SKU'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    stock.is_low_stock
                      ? styles.lowStockBadge
                      : styles.inStockBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      stock.is_low_stock
                        ? styles.lowStockText
                        : styles.inStockText,
                    ]}
                  >
                    {stock.is_low_stock ? 'Low Stock' : 'In Stock'}
                  </Text>
                </View>
              </View>

              <View style={styles.stockDivider} />

              <View style={styles.stockInfoRow}>
                <Text style={styles.stockInfoLabel}>Warehouse</Text>
                <Text style={styles.stockInfoValue}>
                  {warehouse?.name ?? 'Unknown warehouse'}
                </Text>
              </View>

              <View style={styles.stockInfoRow}>
                <Text style={styles.stockInfoLabel}>Branch</Text>
                <Text style={styles.stockInfoValue}>
                  {warehouse?.branch?.name ?? 'Unknown branch'}
                </Text>
              </View>

              <View style={styles.quantityContainer}>
                <View>
                  <Text style={styles.quantityLabel}>Current Quantity</Text>
                  <Text style={styles.quantityValue}>
                    {formatQuantity(stock.quantity)}{' '}
                    <Text style={styles.quantityUnit}>{getUnit(stock)}</Text>
                  </Text>
                </View>

                <View style={styles.reorderContainer}>
                  <Text style={styles.reorderLabel}>Reorder level</Text>
                  <Text style={styles.reorderValue}>
                    {formatQuantity(item?.reorder_level ?? 0)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      )}

      {!isLoadingStocks && !error && stocks.length > 0 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[
              styles.pageButton,
              page <= 1 && styles.pageButtonDisabled,
            ]}
            disabled={page <= 1}
            onPress={() => void loadStocks(page - 1)}
            activeOpacity={0.8}
          >
            <Text style={styles.pageButtonText}>‹ Previous</Text>
          </TouchableOpacity>

          <Text style={styles.pageInfo}>
            Page {page} of {lastPage}
          </Text>

          <TouchableOpacity
            style={[
              styles.pageButton,
              page >= lastPage && styles.pageButtonDisabled,
            ]}
            disabled={page >= lastPage}
            onPress={() => void loadStocks(page + 1)}
            activeOpacity={0.8}
          >
            <Text style={styles.pageButtonText}>Next ›</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#102A43',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 5,
  },
  branchList: {
    gap: 8,
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
  },
  assignedBranchText: {
    color: '#374151',
    fontWeight: '700',
  },
  mutedText: {
    color: '#6B7280',
    fontSize: 13,
  },
  searchInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  activeFilterTab: {
    backgroundColor: '#102A43',
  },
  filterTabText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '700',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resultsHeadingContainer: {
    flex: 1,
  },
  resultsHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#102A43',
  },
  resultsSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  totalText: {
    color: '#6B7280',
    fontSize: 12,
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
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 19,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#991B1B',
    fontWeight: '700',
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
  stockCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    gap: 12,
  },
  stockCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  stockTitleContainer: {
    flex: 1,
    gap: 5,
  },
  stockName: {
    color: '#102A43',
    fontSize: 15,
    fontWeight: '800',
  },
  stockSku: {
    color: '#6B7280',
    fontSize: 12,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  lowStockBadge: {
    backgroundColor: '#FEF3C7',
  },
  inStockBadge: {
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  lowStockText: {
    color: '#92400E',
  },
  inStockText: {
    color: '#166534',
  },
  stockDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  stockInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  stockInfoLabel: {
    color: '#6B7280',
    fontSize: 12,
    flex: 1,
  },
  stockInfoValue: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1.4,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  quantityLabel: {
    color: '#6B7280',
    fontSize: 11,
  },
  quantityValue: {
    color: '#102A43',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  quantityUnit: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  reorderContainer: {
    alignItems: 'flex-end',
  },
  reorderLabel: {
    color: '#6B7280',
    fontSize: 11,
  },
  reorderValue: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  pageButton: {
    backgroundColor: '#DBEAFE',
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageButtonText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
  pageInfo: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
});
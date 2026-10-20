import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getSaleTransactions,
  type SaleTransaction,
} from '../services/saleService';

interface SalesTransactionsScreenProps {
  onBack: () => void;
  onSelectTransaction: (transaction: SaleTransaction) => void;
}

const formatMoney = (amount: string | number): string =>
  `₱${Number(amount).toFixed(2)}`;

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

export default function SalesTransactionsScreen({
  onBack,
  onSelectTransaction,
}: SalesTransactionsScreenProps) {
  const [transactions, setTransactions] = useState<SaleTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTransactions = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const result = await getSaleTransactions();
      setTransactions(result);
    } catch (error) {
      Alert.alert(
        'Unable to Load Transactions',
        error instanceof Error
          ? error.message
          : 'Please try again.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>Sales Transactions</Text>
          <Text style={styles.subtitle}>
            Your latest completed sales
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>
            Loading transactions...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void loadTransactions(true)}
            />
          }
        >
          {transactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                No transactions found
              </Text>
              <Text style={styles.emptyText}>
                Completed sales will appear here.
              </Text>
            </View>
          ) : (
            transactions.map((transaction) => {
              const paymentMethod =
                transaction.payments?.[0]?.method?.toUpperCase() ??
                'UNKNOWN';

              return (
                <Pressable
                  key={transaction.id}
                  style={styles.transactionCard}
                  onPress={() => onSelectTransaction(transaction)}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.saleNumber}>
                        {transaction.sale_number}
                      </Text>
                      <Text style={styles.dateText}>
                        {formatDate(transaction.created_at)}
                      </Text>
                    </View>

                    <Text style={styles.total}>
                      {formatMoney(transaction.total_amount)}
                    </Text>
                  </View>

                  <View style={styles.cardBottomRow}>
                    <Text style={styles.paymentMethod}>
                      Payment: {paymentMethod}
                    </Text>
                    <Text style={styles.status}>
                      {transaction.status.toUpperCase()}
                    </Text>
                  </View>

                  <Text style={styles.viewDetails}>
                    Tap to view receipt details ›
                  </Text>
                </Pressable>
              );
            })
          )}

          <Pressable
            style={styles.refreshButton}
            onPress={() => void loadTransactions(true)}
          >
            <Text style={styles.refreshButtonText}>
              Refresh Transactions
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F7FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  transactionCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  saleNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  dateText: {
    marginTop: 5,
    fontSize: 12,
    color: '#6B7280',
  },
  total: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#374151',
  },
  status: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  viewDetails: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 4,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
});
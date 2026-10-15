import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getPosProducts,
  type PosProduct,
  type PosShift,
} from '../services/posService';

interface PosScreenProps {
  onBack: () => void;
}

export default function PosScreen({ onBack }: PosScreenProps) {
  const [shift, setShift] = useState<PosShift | null>(null);
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProducts = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage('');

    try {
      const result = await getPosProducts();

      setShift(result.shift);
      setProducts(result.products);
    } catch (error) {
      setShift(null);
      setProducts([]);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load POS products. Please try again.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const renderProduct = ({ item }: { item: PosProduct }) => {
    const price = Number(item.price);

    return (
      <View style={styles.productCard}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>

          {item.category?.name ? (
            <Text style={styles.categoryName}>
              {item.category.name}
            </Text>
          ) : null}

          {item.sku ? (
            <Text style={styles.sku}>SKU: {item.sku}</Text>
          ) : null}

          <Text style={styles.stockText}>
            Available: {item.max_quantity}
          </Text>
        </View>

        <View style={styles.productActions}>
          <Text style={styles.price}>
            ₱{Number.isFinite(price) ? price.toFixed(2) : '0.00'}
          </Text>

          <View
            style={[
              styles.statusBadge,
              item.can_sell ? styles.availableBadge : styles.unavailableBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                item.can_sell
                  ? styles.availableText
                  : styles.unavailableText,
              ]}
            >
              {item.can_sell ? 'Available' : 'Out of stock'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Point of Sale</Text>

        <Pressable
          onPress={() => loadProducts(true)}
          style={styles.refreshButton}
          disabled={isLoading || isRefreshing}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </Pressable>
      </View>

      {shift ? (
        <View style={styles.shiftCard}>
          <Text style={styles.shiftTitle}>Current Shift</Text>
          <Text style={styles.shiftDetail}>
            Branch: {shift.branch?.name ?? 'Not assigned'}
          </Text>
          <Text style={styles.shiftDetail}>
            Warehouse: {shift.warehouse?.name ?? 'Not assigned'}
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.helperText}>Loading POS products...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>Unable to load products</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => loadProducts()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProduct}
          contentContainerStyle={
            products.length === 0
              ? styles.emptyList
              : styles.productList
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadProducts(true)}
            />
          }
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              Products ({products.length})
            </Text>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No active products were found.
            </Text>
          }
        />
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
    minHeight: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: 10,
    paddingRight: 8,
  },
  backButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  refreshButton: {
    paddingVertical: 10,
    paddingLeft: 8,
  },
  refreshButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  shiftCard: {
    margin: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#E8F1FF',
    borderWidth: 1,
    borderColor: '#C7DBFF',
  },
  shiftTitle: {
    marginBottom: 6,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
  },
  shiftDetail: {
    marginTop: 3,
    color: '#374151',
    fontSize: 14,
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  productList: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productInfo: {
    flex: 1,
    paddingRight: 12,
  },
  productName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  categoryName: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 13,
  },
  sku: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 12,
  },
  stockText: {
    marginTop: 8,
    color: '#374151',
    fontSize: 13,
  },
  productActions: {
    alignItems: 'flex-end',
  },
  price: {
    marginBottom: 8,
    color: '#1D4ED8',
    fontSize: 17,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  availableBadge: {
    backgroundColor: '#DCFCE7',
  },
  unavailableBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  availableText: {
    color: '#166534',
  },
  unavailableText: {
    color: '#991B1B',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  helperText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  errorTitle: {
    marginBottom: 8,
    color: '#991B1B',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorMessage: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyList: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
});
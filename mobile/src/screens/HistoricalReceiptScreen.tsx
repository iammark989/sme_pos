import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ReceiptScreen from './ReceiptScreen';
import {
  getSaleTransaction,
  type SaleTransactionDetail,
} from '../services/saleService';
import type { CartItem } from './PosScreen';

interface HistoricalReceiptScreenProps {
  saleId: number;
  onBack: () => void;
}

export default function HistoricalReceiptScreen({
  saleId,
  onBack,
}: HistoricalReceiptScreenProps) {
  const [transaction, setTransaction] =
    useState<SaleTransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadTransaction = async () => {
      try {
        const result = await getSaleTransaction(saleId);

        if (isActive) {
          setTransaction(result);
        }
      } catch (error) {
        if (isActive) {
          Alert.alert(
            'Unable to Load Transaction',
            error instanceof Error
              ? error.message
              : 'Please try again.',
            [{ text: 'Back', onPress: onBack }],
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadTransaction();

    return () => {
      isActive = false;
    };
  }, [saleId, onBack]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>
          Loading transaction details...
        </Text>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Transaction details could not be loaded.
        </Text>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back to Transactions</Text>
        </Pressable>
      </View>
    );
  }

  const savedPayment = transaction.payments[0];

  if (!savedPayment) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          No payment record was found for this transaction.
        </Text>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back to Transactions</Text>
        </Pressable>
      </View>
    );
  }

  const paymentMethod = savedPayment.method;
  const total = Number(transaction.total_amount);
  const amountPaid = Number(savedPayment.amount);

  const items: CartItem[] = transaction.items.map((item) => ({
    product: {
      id: item.product_id,
      name: item.product?.name ?? 'Unavailable Product',
      selling_price: Number(item.unit_price),
      max_quantity: Number(item.quantity),
      can_sell: true,
    },
    quantity: Number(item.quantity),
  }));

  return (
    <ReceiptScreen
      saleData={{
        sale: {
          id: transaction.id,
          sale_number: transaction.sale_number,
          status: transaction.status,
          subtotal: transaction.subtotal,
          discount_amount: transaction.discount_amount,
          total_amount: transaction.total_amount,
        },
        change_amount:
          paymentMethod === 'cash'
            ? Math.max(0, amountPaid - total)
            : 0,
      }}
      items={items}
      payment={{
        method: paymentMethod,
        amountPaid,
        paymentReference: savedPayment.reference_number ?? undefined,
      }}
      onNewSale={onBack}
      onBack={onBack}
      autoPrintOnMount={false}
      isHistoricalReceipt={true}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F3F7FC',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
    color: '#B91C1C',
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
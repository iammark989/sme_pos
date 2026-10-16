import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { PaymentMethod, SaleResponse } from '../services/saleService';
import type { CartItem } from './PosScreen';

interface ReceiptScreenProps {
  saleData: SaleResponse['data'];
  items: CartItem[];
  payment: {
    method: PaymentMethod;
    amountPaid: number;
    paymentReference?: string;
  };
  onNewSale: () => void;
  onBack: () => void;
}

export default function ReceiptScreen({
  saleData,
  items,
  payment,
  onNewSale,
  onBack,
}: ReceiptScreenProps) {
  const sale = saleData.sale;
  const total = Number(sale.total_amount);
  const change = Number(saleData.change_amount);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.receipt}>
        <View style={styles.successIcon}>
          <Text style={styles.successIconText}>✓</Text>
        </View>

        <Text style={styles.successTitle}>Sale Completed</Text>
        <Text style={styles.successSubtitle}>
          Payment recorded successfully
        </Text>

        <View style={styles.separator} />

        <Text style={styles.receiptLabel}>RECEIPT NUMBER</Text>
        <Text style={styles.receiptNumber}>
          {sale.sale_number}
        </Text>

        <Text style={styles.receiptLabel}>STATUS</Text>
        <Text style={styles.statusText}>
          {sale.status.toUpperCase()}
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>Items Purchased</Text>

        {items.map((item) => {
          const unitPrice = Number(item.product.selling_price);
          const subtotal = unitPrice * item.quantity;

          return (
            <View key={item.product.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>
                  {item.product.name}
                </Text>
                <Text style={styles.itemDetail}>
                  {item.quantity} × ₱{unitPrice.toFixed(2)}
                </Text>
              </View>

              <Text style={styles.itemSubtotal}>
                ₱{subtotal.toFixed(2)}
              </Text>
            </View>
          );
        })}

        <View style={styles.separator} />

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Subtotal</Text>
          <Text style={styles.amountValue}>
            ₱{Number(sale.subtotal).toFixed(2)}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Discount</Text>
          <Text style={styles.amountValue}>
            ₱{Number(sale.discount_amount).toFixed(2)}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>
            ₱{total.toFixed(2)}
          </Text>
        </View>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>Payment Details</Text>

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Method</Text>
          <Text style={styles.amountValue}>
            {payment.method.toUpperCase()}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount Paid</Text>
          <Text style={styles.amountValue}>
            ₱{payment.amountPaid.toFixed(2)}
          </Text>
        </View>

        {payment.method === 'gcash' &&
        payment.paymentReference ? (
          <View style={styles.referenceContainer}>
            <Text style={styles.amountLabel}>GCash Reference</Text>
            <Text style={styles.referenceValue}>
              {payment.paymentReference}
            </Text>
          </View>
        ) : null}

        {payment.method === 'cash' ? (
          <View style={styles.changeRow}>
            <Text style={styles.changeLabel}>CHANGE</Text>
            <Text style={styles.changeValue}>
              ₱{change.toFixed(2)}
            </Text>
          </View>
        ) : null}

        <View style={styles.separator} />

        <Text style={styles.footerText}>
          Thank you for your purchase!
        </Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={onNewSale}>
        <Text style={styles.primaryButtonText}>Start New Sale</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
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
  },
  receipt: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  successIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
  },
  successIconText: {
    color: '#15803D',
    fontSize: 30,
    fontWeight: '800',
  },
  successTitle: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 23,
    fontWeight: '800',
    color: '#111827',
  },
  successSubtitle: {
    marginTop: 5,
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 13,
    color: '#6B7280',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  receiptLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
  },
  receiptNumber: {
    marginTop: 5,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  statusText: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  itemDetail: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  amountLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  amountValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  referenceContainer: {
    marginTop: 4,
    marginBottom: 10,
  },
  referenceValue: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
  },
  changeLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  changeValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#166534',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  primaryButton: {
    marginTop: 16,
    minHeight: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    marginTop: 10,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },
});
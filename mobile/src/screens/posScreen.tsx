import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  getPosProducts,
  type PosProduct,
  type PosShift,
} from '../services/posService';

import {
  createSale,
  type PaymentMethod,
  type SaleResponse,
} from '../services/saleService';

import ReceiptScreen from './ReceiptScreen';


interface PosScreenProps {
  onBack: () => void;
  onOpenPos: () => void;
}

export interface CartItem {
  product: PosProduct;
  quantity: number;
}

export default function PosScreen({
  onBack,
  onOpenPos,
}: PosScreenProps) {
  const [shift, setShift] = useState<PosShift | null>(null);
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [requiresOpenShift, setRequiresOpenShift] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('cash');

  const [amountPaid, setAmountPaid] = useState('');

  const [paymentReference, setPaymentReference] = useState('');

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const [completedItems, setCompletedItems] = useState<CartItem[]>([]);

  const [completedSale, setCompletedSale] =
    useState<SaleResponse['data'] | null>(null);
    

  const [completedPayment, setCompletedPayment] = useState<{
    method: PaymentMethod;
    amountPaid: number;
    paymentReference?: string;
  } | null>(null);

  const addToCart = (product: PosProduct) => {
    if (!product.can_sell || product.max_quantity < 1) {
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.product.id === product.id,
      );

      if (existingItem) {
        if (existingItem.quantity >= product.max_quantity) {
          return currentCart;
        }

        return currentCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...currentCart, { product, quantity: 1 }];
    });
  };

  
  const updateCartQuantity = (
    productId: number,
    change: number,
  ) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.product.id !== productId) {
            return item;
          }

          const newQuantity = item.quantity + change;

          if (newQuantity <= 0) {
            return null;
          }

          if (newQuantity > item.product.max_quantity) {
            return item;
          }

          return {
            ...item,
            quantity: newQuantity,
          };
        })
        .filter((item): item is CartItem => item !== null),
    );
  };

  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.product.selling_price) * item.quantity,
    0,
  );

  const cartItemCount = cart.reduce(
    (count, item) => count + item.quantity,
    0,
  );

  const handleCheckout = async () => {
    if (!shift?.warehouse?.id) {
      Alert.alert(
        'Warehouse unavailable',
        'The active shift does not have a warehouse assigned.',
      );
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Empty cart', 'Add at least one product before checkout.');
      return;
    }

    const paid = Number(amountPaid);

    if (!Number.isFinite(paid) || paid <= 0) {
      Alert.alert('Invalid payment', 'Enter a valid amount paid.');
      return;
    }

    if (paymentMethod === 'cash' && paid < cartTotal) {
      Alert.alert(
        'Insufficient payment',
        'The cash received must cover the sale total.',
      );
      return;
    }

    if (paymentMethod === 'gcash' && Math.round(paid * 100) !== Math.round(cartTotal * 100)) {
      Alert.alert(
        'Payment mismatch',
        'The GCash amount must match the sale total.',
      );
      return;
    }

    if (paymentMethod === 'gcash' && !paymentReference.trim()) {
      Alert.alert(
        'Reference required',
        'Enter the GCash reference number.',
      );
      return;
    }

    try {
      setIsCheckingOut(true);

      const result = await createSale({
        warehouse_id: shift.warehouse.id,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
        amount_paid: paid,
        ...(paymentMethod === 'gcash'
          ? { payment_reference: paymentReference.trim() }
          : {}),
      });

      setCompletedSale(result.data);

      const purchasedItems = cart.map((item) => ({ ...item }));
      setCompletedItems(purchasedItems);

      setCompletedPayment({
        method: paymentMethod,
        amountPaid: paid,
        ...(paymentMethod === 'gcash'
          ? { paymentReference: paymentReference.trim() }
          : {}),
      });

      setCart([]);
      setAmountPaid('');
      setPaymentReference('');

      // The sale is already completed.
      // Refresh product data without treating a refresh failure as a checkout failure.
      void loadProducts(true);
    } catch (error) {
      Alert.alert(
        'Checkout failed',
        error instanceof Error
          ? error.message
          : 'Unable to complete the sale. Please try again.',
      );
    } finally {
      setIsCheckingOut(false);
    }
  };


  const loadProducts = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage('');
    setRequiresOpenShift(false);

    try {
      const result = await getPosProducts();

      setShift(result.shift);
      setProducts(result.products);
      } catch (error) {
        setShift(null);
        setProducts([]);

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load POS products. Please try again.';

        const isMissingShift = message
          .toLowerCase()
          .includes('must have an open shift');

        setRequiresOpenShift(isMissingShift);

        setErrorMessage(
          isMissingShift
            ? 'You need to open a POS shift before you can load products or process sales.'
            : message,
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
    const price = Number(item.selling_price);

    return (
      <Pressable
        style={[
          styles.productCard,
          !item.can_sell && styles.disabledProductCard,
        ]}
        onPress={() => addToCart(item)}
        disabled={!item.can_sell}
      >
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
              item.can_sell
                ? styles.availableBadge
                : styles.unavailableBadge,
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
              {item.can_sell ? 'Tap to add +' : 'Out of stock'}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  if (completedSale && completedPayment) {
    return (
      <ReceiptScreen
        saleData={completedSale}
        items={completedItems}
        payment={completedPayment}
        onNewSale={() => {
          setCompletedSale(null);
          setCompletedPayment(null);
          setCompletedItems([]);
        }}
        onBack={() => {
          setCompletedSale(null);
          setCompletedPayment(null);
          setCompletedItems([]);
          onBack();
        }}
      />
    );
  }


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
          <Text style={styles.errorTitle}>
            {requiresOpenShift ? 'No Active POS Shift' : 'Unable to load products'}
          </Text>

          <Text style={styles.errorMessage}>{errorMessage}</Text>

          {requiresOpenShift ? (
            <Pressable
              style={styles.retryButton}
              onPress={onOpenPos}
            >
              <Text style={styles.retryButtonText}>Open POS</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.retryButton}
              onPress={() => loadProducts()}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          )}
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
          ListFooterComponent={
            <View style={styles.cartContainer}>
              <View style={styles.cartHeader}>
                <Text style={styles.cartTitle}>Current Cart</Text>
                <Text style={styles.cartCount}>
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                </Text>
              </View>

              {cart.length === 0 ? (
                <Text style={styles.emptyCartText}>
                  Tap an available product above to add it to your cart.
                </Text>
              ) : (
                cart.map((item) => {
                  const price = Number(item.product.selling_price);
                  const subtotal = price * item.quantity;

                  return (
                    <View
                      key={item.product.id}
                      style={styles.cartItem}
                    >
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName}>
                          {item.product.name}
                        </Text>

                        <Text style={styles.cartItemPrice}>
                          ₱{price.toFixed(2)} each
                        </Text>

                        <Text style={styles.cartSubtotal}>
                          ₱{subtotal.toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.quantityControls}>
                        <Pressable
                          style={styles.quantityButton}
                          onPress={() =>
                            updateCartQuantity(item.product.id, -1)
                          }
                        >
                          <Text style={styles.quantityButtonText}>−</Text>
                        </Pressable>

                        <Text style={styles.quantityValue}>
                          {item.quantity}
                        </Text>

                        <Pressable
                          style={[
                            styles.quantityButton,
                            item.quantity >= item.product.max_quantity &&
                              styles.disabledQuantityButton,
                          ]}
                          disabled={
                            item.quantity >= item.product.max_quantity
                          }
                          onPress={() =>
                            updateCartQuantity(item.product.id, 1)
                          }
                        >
                          <Text style={styles.quantityButtonText}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}

              <View style={styles.cartDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>
                  ₱{cartTotal.toFixed(2)}
                </Text>
              </View>

              
              {cart.length > 0 && (
                <View style={styles.checkoutSection}>
                  <Text style={styles.checkoutTitle}>Checkout</Text>

                  <Text style={styles.inputLabel}>Payment Method</Text>

                  <View style={styles.paymentMethods}>
                    <Pressable
                      style={[
                        styles.paymentMethodButton,
                        paymentMethod === 'cash' && styles.selectedPaymentMethod,
                      ]}
                      onPress={() => {
                        setPaymentMethod('cash');
                        setPaymentReference('');
                      }}
                    >
                      <Text
                        style={[
                          styles.paymentMethodText,
                          paymentMethod === 'cash' && styles.selectedPaymentMethodText,
                        ]}
                      >
                        Cash
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.paymentMethodButton,
                        paymentMethod === 'gcash' && styles.selectedPaymentMethod,
                      ]}
                      onPress={() => {
                        setPaymentMethod('gcash');
                        setAmountPaid(cartTotal.toFixed(2));
                      }}
                    >
                      <Text
                        style={[
                          styles.paymentMethodText,
                          paymentMethod === 'gcash' && styles.selectedPaymentMethodText,
                        ]}
                      >
                        GCash
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={styles.inputLabel}>
                    {paymentMethod === 'cash' ? 'Cash Received (₱)' : 'GCash Amount (₱)'}
                  </Text>

                  <TextInput
                    style={styles.paymentInput}
                    value={amountPaid}
                    onChangeText={setAmountPaid}
                    keyboardType="decimal-pad"
                    placeholder="Enter amount"
                    editable={!isCheckingOut}
                  />

                  {paymentMethod === 'cash' && amountPaid.trim() !== '' &&
                  Number.isFinite(Number(amountPaid)) &&
                  Number(amountPaid) >= cartTotal ? (
                    <View style={styles.changeRow}>
                      <Text style={styles.changeLabel}>Change</Text>
                      <Text style={styles.changeAmount}>
                        ₱{(Number(amountPaid) - cartTotal).toFixed(2)}
                      </Text>
                    </View>
                  ) : null}

                  {paymentMethod === 'gcash' && (
                    <>
                      <Text style={styles.inputLabel}>GCash Reference Number</Text>

                      <TextInput
                        style={styles.paymentInput}
                        value={paymentReference}
                        onChangeText={setPaymentReference}
                        placeholder="Enter reference number"
                        autoCapitalize="none"
                        editable={!isCheckingOut}
                      />
                    </>
                  )}

                  <Pressable
                    style={[
                      styles.checkoutButton,
                      isCheckingOut && styles.checkoutButtonDisabled,
                    ]}
                    onPress={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.checkoutButtonText}>
                        Complete Sale · ₱{cartTotal.toFixed(2)}
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}


            </View>
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
  disabledProductCard: {
    opacity: 0.55,
  },

  cartContainer: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  cartCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyCartText: {
    paddingVertical: 12,
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 20,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cartItemInfo: {
    flex: 1,
    paddingRight: 8,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  cartItemPrice: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  cartSubtotal: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledQuantityButton: {
    opacity: 0.4,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  quantityValue: {
    minWidth: 18,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cartDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1D4ED8',
  },

  checkoutSection: {
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  checkoutTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  inputLabel: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentMethodButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectedPaymentMethod: {
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  selectedPaymentMethodText: {
    color: '#1D4ED8',
  },
  paymentInput: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    color: '#111827',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  changeLabel: {
    fontSize: 14,
    color: '#374151',
  },
  changeAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  checkoutButton: {
    marginTop: 20,
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

});
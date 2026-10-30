import { Text, View } from 'react-native';

import type { AuthUser } from '../services/authService';

interface InventoryTransactionsScreenProps {
  user: AuthUser;
  onBack: () => void;
}

export default function InventoryTransactionsScreen({
  user,
  onBack,
}: InventoryTransactionsScreenProps) {
  return (
    <View>
      <Text>Inventory Transactions</Text>
      <Text>{user.username}</Text>
      <Text onPress={onBack}>Back</Text>
    </View>
  );
}
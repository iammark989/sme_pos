import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { AuthUser } from '../services/authService';
import {
  getUsers,
  type ManagedUser,
} from '../services/userService';

interface UserManagementScreenProps {
  user: AuthUser;
  onBack: () => void;
}

export default function UserManagementScreen({
  user,
  onBack,
}: UserManagementScreenProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await getUsers();
      setUsers(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load users.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
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

        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>
          Manage system users and their access.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Users</Text>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => void loadUsers()}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void loadUsers()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : users.length > 0 ? (
        <View style={styles.userList}>
          {users.map((managedUser) => {
            const fullName = [
              managedUser.first_name,
              managedUser.middle_name,
              managedUser.last_name,
              managedUser.suffix,
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <View key={managedUser.id} style={styles.userCard}>
                <View style={styles.userCardHeader}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {fullName || managedUser.username}
                    </Text>

                    <Text style={styles.username}>
                      @{managedUser.username}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      managedUser.is_active
                        ? styles.activeBadge
                        : styles.inactiveBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        managedUser.is_active
                          ? styles.activeText
                          : styles.inactiveText,
                      ]}
                    >
                      {managedUser.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.userDetails}>
                  <Text style={styles.detailText}>
                    Role: {managedUser.role?.name ?? 'No role'}
                  </Text>

                  <Text style={styles.detailText}>
                    Branch: {managedUser.branch?.name ?? 'No branch'}
                  </Text>

                  <Text style={styles.detailText}>
                    Email: {managedUser.email}
                  </Text>

                  {managedUser.is_global_admin && (
                    <Text style={styles.globalAdminText}>
                      Global Admin
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Users Found</Text>
          <Text style={styles.emptyText}>
            There are no users available to display.
          </Text>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#102A43',
  },
  refreshButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
  },
  refreshButtonText: {
    color: '#1D4ED8',
    fontWeight: '700',
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
    gap: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 19,
  },
  retryText: {
    color: '#1D4ED8',
    fontWeight: '800',
    fontSize: 13,
  },
  userList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 15,
    gap: 12,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    color: '#102A43',
    fontSize: 15,
    fontWeight: '800',
  },
  username: {
    color: '#6B7280',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  activeText: {
    color: '#15803D',
  },
  inactiveText: {
    color: '#B91C1C',
  },
  userDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    gap: 6,
  },
  detailText: {
    color: '#4B5563',
    fontSize: 12,
  },
  globalAdminText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
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
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
  },
});
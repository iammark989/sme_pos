import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useState } from 'react';

import PosScreen from './posScreen';

import type { AuthUser } from '../services/authService';

interface DashboardScreenProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function DashboardScreen({
  user,
  onLogout,
}: DashboardScreenProps) {
  const userRole = user.role?.name ?? 'User';
  const userBranch = user.branch?.name ?? 'Not assigned';

  const [isPosOpen, setIsPosOpen] = useState(false);
  

  const openFeature = (feature: string) => {

    if (isPosOpen) {
    return (
      <PosScreen onBack={() => setIsPosOpen(false)} />
    );
  }
    Alert.alert(
      feature,
      'This feature will be connected in a later step.',
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.dashboardScroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.dashboardContainer}>
        {/* Dashboard header */}
        <View style={styles.dashboardHeader}>
          <View>
            <Text style={styles.brandText}>SME POS</Text>
            <Text style={styles.headerSubtitle}>
              Store Management
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerLogout}
            onPress={onLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.headerLogoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeLabel}>WELCOME BACK</Text>

          <Text style={styles.welcomeHeading}>
            {user.username}
          </Text>

          <Text style={styles.welcomeDescription}>
            Manage your store operations from one place.
          </Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{userRole}</Text>
          </View>
        </View>

        {/* Account information */}
        <Text style={styles.sectionHeading}>Your Account</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{user.username}</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{userRole}</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Branch</Text>
            <Text style={styles.infoValue}>{userBranch}</Text>
          </View>
        </View>

        {/* Quick access cards */}
        <Text style={styles.sectionHeading}>Quick Access</Text>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setIsPosOpen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconBlue}>
              <Text style={styles.actionIconText}>POS</Text>
            </View>
            <Text style={styles.actionTitle}>Point of Sale</Text>
            <Text style={styles.actionDescription}>
              Create a new sale
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => openFeature('Sales Transactions')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconGreen}>
              <Text style={styles.actionIconText}>SALE</Text>
            </View>
            <Text style={styles.actionTitle}>Transactions</Text>
            <Text style={styles.actionDescription}>
              View sales history
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => openFeature('Inventory')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconPurple}>
              <Text style={styles.actionIconText}>STOCK</Text>
            </View>
            <Text style={styles.actionTitle}>Inventory</Text>
            <Text style={styles.actionDescription}>
              Check stock levels
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => openFeature('Account')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconOrange}>
              <Text style={styles.actionIconText}>USER</Text>
            </View>
            <Text style={styles.actionTitle}>My Account</Text>
            <Text style={styles.actionDescription}>
              View account details
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard footer */}
        <Text style={styles.dashboardFooter}>
          SME POS · Store Management System
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dashboardScroll: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  dashboardContainer: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#102A43',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },
  headerLogout: {
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  headerLogoutText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  welcomeCard: {
    backgroundColor: '#102A43',
    borderRadius: 20,
    padding: 22,
    marginBottom: 28,
  },
  welcomeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#93C5FD',
  },
  welcomeHeading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 10,
  },
  welcomeDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#D5E4F2',
    marginTop: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#244A6A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 18,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  infoRow: {
    minHeight: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoValue: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '44%',
    minHeight: 148,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 15,
  },
  actionIconBlue: {
    width: 46,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconGreen: {
    width: 46,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconPurple: {
    width: 46,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconOrange: {
    width: 46,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#102A43',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginTop: 14,
  },
  actionDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
    marginTop: 5,
  },
  dashboardFooter: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 28,
  },
});
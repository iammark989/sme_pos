import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useCallback, useEffect, useState } from 'react';

import PosScreen from './PosScreen';

import type { AuthUser } from '../services/authService';

import PrinterSetupScreen from './PrinterSetupScreen';

import SalesTransactionsScreen from './SalesTransactionsScreen';

import type { SaleTransaction } from '../services/saleService';

import HistoricalReceiptScreen from './HistoricalReceiptScreen';

import ClosePosScreen from './ClosePosScreen';

import OpenPosScreen from './OpenPosScreen';

import { getCurrentShift } from '../services/posService';

import BusinessDayScreen from './BusinessDayScreen';

import ReportsScreen from './ReportsScreen';

import StocksScreen from './StocksScreen';

import InventoryTransactionsScreen from './InventoryTransactionsScreen';

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

  const isStaff = userRole === 'Staff';
  const isAdminOrOwner = ['Admin', 'Owner'].includes(userRole);

  const [isPrinterSetupOpen, setIsPrinterSetupOpen] = useState(false);

  const [isPosOpen, setIsPosOpen] = useState(false);

  const [isClosePosOpen, setIsClosePosOpen] = useState(false);  
  
  const [isOpenPosScreenOpen, setIsOpenPosScreenOpen] = useState(false);

  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<SaleTransaction | null>(null);

  const [hasActiveShift, setHasActiveShift] = useState<boolean | null>(null);
  const [isShiftStatusLoading, setIsShiftStatusLoading] = useState(true);

  const [isBusinessDayOpen, setIsBusinessDayOpen] = useState(false);

  const [isReportsOpen, setIsReportsOpen] = useState(false);

  const [isStocksOpen, setIsStocksOpen] = useState(false);

  const canViewInventoryTransactions = [
    'Owner',
    'Admin',
    'Accounting',
  ].includes(userRole);

  const [isInventoryTransactionsOpen, setIsInventoryTransactionsOpen] =
  useState(false);

  const refreshShiftStatus = useCallback(async () => {
    try {
      const result = await getCurrentShift();
      setHasActiveShift(result.shift?.status === 'open');
    } catch (error) {
      console.error('Unable to refresh POS shift status:', error);
      setHasActiveShift(null);
    } finally {
      setIsShiftStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshShiftStatus();
  }, [refreshShiftStatus]);


  if (isClosePosOpen) {
    return (
      <ClosePosScreen
        onBack={() => {
          setIsClosePosOpen(false);
          void refreshShiftStatus();
        }}
        onClosed={() => {
          setIsClosePosOpen(false);
          void refreshShiftStatus();
        }}
      />
    );
  }

  if (isOpenPosScreenOpen) {
    return (
      <OpenPosScreen
        onBack={() => {
          setIsOpenPosScreenOpen(false);
          void refreshShiftStatus();
        }}
        onOpened={() => {
          setIsOpenPosScreenOpen(false);
          void refreshShiftStatus();
        }}
      />
    );
  }

  if (isPrinterSetupOpen) {
    return (
      <PrinterSetupScreen
        onBack={() => setIsPrinterSetupOpen(false)}
      />
    );
  }

  if (selectedTransaction) {
    return (
      <HistoricalReceiptScreen
        saleId={selectedTransaction.id}
        onBack={() => setSelectedTransaction(null)}
      />
    );
  }

  if (isTransactionsOpen) {
    return (
      <SalesTransactionsScreen
        onBack={() => setIsTransactionsOpen(false)}
        onSelectTransaction={(transaction) => {
          setSelectedTransaction(transaction);
        }}
      />
    );
  }
  

  const openFeature = (feature: string) => {
    Alert.alert(
      feature,
      'This feature will be connected in a later step.',
    );
  };

  if (isPosOpen) {
    return (
      <PosScreen
        onBack={() => setIsPosOpen(false)}
        onOpenPos={() => {
          setIsPosOpen(false);
          setIsOpenPosScreenOpen(true);
        }}
      />
    );
  }

    if (isBusinessDayOpen) {
    return (
      <BusinessDayScreen
        onBack={() => setIsBusinessDayOpen(false)}
      />
    );
  }

    if (isReportsOpen) {
    return (
      <ReportsScreen
        user={user}
        onBack={() => setIsReportsOpen(false)}
      />
    );
  }

   if (isStocksOpen) {
    return (
      <StocksScreen
        user={user}
        onBack={() => setIsStocksOpen(false)}
      />
    );
  }

  if (isInventoryTransactionsOpen) {
    return (
      <InventoryTransactionsScreen
        user={user}
        onBack={() => setIsInventoryTransactionsOpen(false)}
      />
    );
  }

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
          {isStaff && (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
            setIsPosOpen(true);
          }}
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
          )}

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setIsTransactionsOpen(true)}
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

          {isStaff && !isShiftStatusLoading && hasActiveShift === true && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => setIsClosePosOpen(true)}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconOrange}>
                  <Text style={styles.actionIconText}>CLOSE</Text>
                </View>

                <Text style={styles.actionTitle}>Close POS</Text>

                <Text style={styles.actionDescription}>
                  Reconcile cash and close your shift
                </Text>
              </TouchableOpacity>
            )}
            

            {isStaff && !isShiftStatusLoading && hasActiveShift === false && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => setIsOpenPosScreenOpen(true)}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconGreen}>
                  <Text style={styles.actionIconText}>OPEN</Text>
                </View>

                <Text style={styles.actionTitle}>Open POS</Text>

                <Text style={styles.actionDescription}>
                  Start a shift and enter opening cash
                </Text>
              </TouchableOpacity>
            )}

            {isStaff && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setIsBusinessDayOpen(true)}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconPurple}>
                <Text style={styles.actionIconText}>Z-READ</Text>
              </View>

              <Text style={styles.actionTitle}>Business Day</Text>

              <Text style={styles.actionDescription}>
                Open or close the business day and view Z-Readings
              </Text>
            </TouchableOpacity>
            )}

            {isAdminOrOwner && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => setIsReportsOpen(true)}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconBlue}>
                  <Text style={styles.actionIconText}>REPORT</Text>
                </View>

                <Text style={styles.actionTitle}>Reports</Text>

                <Text style={styles.actionDescription}>
                  Review store performance and business summaries
                </Text>
              </TouchableOpacity>
            )}

          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setIsStocksOpen(true)}
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

          {canViewInventoryTransactions && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setIsInventoryTransactionsOpen(true)}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconBlue}>
                <Text style={styles.actionIconText}>MOVEMENT</Text>
              </View>

              <Text style={styles.actionTitle}>Inventory Transactions</Text>

              <Text style={styles.actionDescription}>
                View inventory movement history
              </Text>
            </TouchableOpacity>
          )}
          

          {isAdminOrOwner && (
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
          )}

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setIsPrinterSetupOpen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconBlue}>
              <Text style={styles.actionIconText}>PRINT</Text>
            </View>

            <Text style={styles.actionTitle}>Printer Setup</Text>

            <Text style={styles.actionDescription}>
              Connect a Bluetooth receipt printer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard footer */}
              <Text style={styles.dashboardFooter}>
                SME POS · Store Management System
              </Text>
            </View>

            <View style={styles.webManagementCard}>
        <View style={styles.webManagementHeader}>
          <View style={styles.webManagementIcon}>
            <Text style={styles.actionIconText}>WEB</Text>
          </View>

          <View style={styles.webManagementHeadingContainer}>
            <Text style={styles.webManagementTitle}>
              More Store Management Tools
            </Text>

            <Text style={styles.webManagementSubtitle}>
              Complete management experience on the web
            </Text>
          </View>
        </View>

        <Text style={styles.webManagementDescription}>
          For product management, stock transfers, stock receiving,
          inventory movements, and store settings, use the SME POS
          web application in your browser.
        </Text>

        <Text style={styles.webManagementNote}>
          The mobile app is designed for convenient daily operations.
          The web app provides access to more store management functions.
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

  webManagementCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E3EF',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  webManagementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  webManagementIcon: {
    width: 46,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webManagementHeadingContainer: {
    flex: 1,
  },
  webManagementTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#102A43',
  },
  webManagementSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },
  webManagementDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: '#374151',
    marginTop: 14,
  },
  webManagementNote: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    marginTop: 10,
  },
});
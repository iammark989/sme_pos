import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  connectToPrinter,
  connectedAddress,
  disconnectPrinter,
  ensureBluetoothPermission,
  findPrinters,
  isBluetoothEnabled,
  isConnected,
  isPrintingSupported,
  onConnectionChanged,
  printBytes,
  EscPosBuilder,
  CODEPAGE,
  type PrinterDevice,
} from '@ricka7x/expo-thermal-printer';

interface PrinterSetupScreenProps {
  onBack: () => void;
}

export default function PrinterSetupScreen({
  onBack,
}: PrinterSetupScreenProps) {
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(
    null,
  );
  const [connectedPrinterAddress, setConnectedPrinterAddress] =
    useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectingAddress, setConnectingAddress] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState(
    'Discover paired Bluetooth printers to get started.',
  );

  useEffect(() => {
    const subscription = onConnectionChanged((event) => {
      setConnectedPrinterAddress(
        event.connected ? event.address : null,
      );

      if (event.connected) {
        setStatusMessage('Printer connected successfully.');
      } else {
        setStatusMessage('Printer disconnected.');
      }
    });

    setConnectedPrinterAddress(
      isConnected() ? connectedAddress() : null,
    );

    
    return () => {
      subscription.remove();
    };
  }, []);

  const discoverPrinters = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      setStatusMessage('Checking Bluetooth and paired devices...');

      if (!isPrintingSupported()) {
        throw new Error(
          'Bluetooth printing is not supported on this platform.',
        );
      }

      const permissionGranted = await ensureBluetoothPermission();

      if (!permissionGranted) {
        throw new Error(
          'Bluetooth permission was not granted. Please allow it in Android settings.',
        );
      }

      if (!isBluetoothEnabled()) {
        throw new Error(
          'Bluetooth is turned off. Please enable Bluetooth and try again.',
        );
      }

      const devices = await findPrinters();

      setPrinters(devices);

      const currentAddress = isConnected()
        ? connectedAddress()
        : null;

      setConnectedPrinterAddress(currentAddress);

      if (devices.length === 0) {
        setStatusMessage(
          'No paired printers found. Pair your printer in Android Bluetooth settings first.',
        );
      } else {
        setStatusMessage(
          `${devices.length} paired Bluetooth device(s) found.`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to discover Bluetooth printers.';

      setErrorMessage(message);
      setStatusMessage('Printer discovery failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (printer: PrinterDevice) => {
    try {
      setConnectingAddress(printer.address);
      setSelectedAddress(printer.address);
      setErrorMessage('');
      setStatusMessage(`Connecting to ${printer.name}...`);

      await connectToPrinter(printer.address);

      setConnectedPrinterAddress(printer.address);
      setStatusMessage(`Connected to ${printer.name}.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to connect to this printer.';

      setErrorMessage(message);
      setStatusMessage('Printer connection failed.');
    } finally {
      setConnectingAddress(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      setErrorMessage('');
      await disconnectPrinter();
      setConnectedPrinterAddress(null);
      setStatusMessage('Printer disconnected.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to disconnect the printer.';

      setErrorMessage(message);
    }
  };

    const handleTestPrint = async () => {
        try {
            setErrorMessage('');

            if (!isConnected()) {
            setErrorMessage('Please connect the printer before printing.');
            return;
            }

            setStatusMessage('Sending test receipt to printer...');

            const receipt = new EscPosBuilder()
            .init()
            .codepage(CODEPAGE.CP850)
            .align('center')
            .bold(true)
            .line('SME POS')
            .bold(false)
            .line('PRINTER TEST')
            .line('------------------------------')
            .align('left')
            .line('Bluetooth connection: OK')
            .line('Printer: RPM21UB-Y')
            .line(`Date: ${new Date().toLocaleDateString()}`)
            .line(`Time: ${new Date().toLocaleTimeString()}`)
            .line('------------------------------')
            .align('center')
            .line('Test print successful!')
            .feed(3)
            .build();

            await printBytes(receipt);

            setStatusMessage(
            'Test receipt sent. Please check the printer output.',
            );
        } catch (error) {
            const message =
            error instanceof Error
                ? error.message
                : 'Unable to print the test receipt.';

            setErrorMessage(message);
            setStatusMessage('Test printing failed.');
        }
        };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Printer Setup</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.sectionTitle}>Connection Status</Text>

        <Text style={styles.statusText}>
          {connectedPrinterAddress
            ? `Connected: ${connectedPrinterAddress}`
            : 'No printer connected'}
        </Text>

        <Text style={styles.description}>{statusMessage}</Text>

        {connectedPrinterAddress ? (
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnect}
            activeOpacity={0.8}
          >
            <Text style={styles.disconnectButtonText}>
              Disconnect Printer
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity
        style={[
            styles.primaryButton,
                !connectedPrinterAddress && styles.disabledButton,
            ]}
            onPress={handleTestPrint}
            disabled={!connectedPrinterAddress}
            activeOpacity={0.8}
            >
            <Text style={styles.primaryButtonText}>
                Print Test Receipt
            </Text>
        </TouchableOpacity>


      <TouchableOpacity
        style={[
          styles.primaryButton,
          isLoading && styles.disabledButton,
        ]}
        onPress={discoverPrinters}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>
            Find Paired Printers
          </Text>
        )}
      </TouchableOpacity>

      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Available Devices</Text>

      {printers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No devices to display</Text>
          <Text style={styles.description}>
            Pair a Bluetooth printer in your phone settings, then tap
            Find Paired Printers.
          </Text>
        </View>
      ) : (
        printers.map((printer) => {
          const isPrinterConnected =
            connectedPrinterAddress === printer.address;

          const isConnecting =
            connectingAddress === printer.address;

          return (
            <View key={printer.address} style={styles.printerCard}>
              <View style={styles.printerDetails}>
                <Text style={styles.printerName}>{printer.name}</Text>

                <Text style={styles.printerAddress}>
                  {printer.address}
                </Text>

                <Text style={styles.description}>
                  {printer.bonded ? 'Paired device' : 'Discovered device'}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.connectButton,
                  isPrinterConnected && styles.connectedButton,
                ]}
                onPress={() => handleConnect(printer)}
                disabled={isConnecting || isPrinterConnected}
                activeOpacity={0.8}
              >
                {isConnecting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.connectButtonText}>
                    {isPrinterConnected ? 'Connected' : 'Connect'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F7FC',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
  },
  backButtonText: {
    color: '#111827',
    fontWeight: '700',
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#102A43',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#102A43',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 11,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    lineHeight: 19,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  printerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  printerDetails: {
    flex: 1,
  },
  printerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  printerAddress: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  connectButton: {
    backgroundColor: '#2563EB',
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  connectedButton: {
    backgroundColor: '#059669',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  disconnectButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 9,
  },
  disconnectButtonText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
  },
});
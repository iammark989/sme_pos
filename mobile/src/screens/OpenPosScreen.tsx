import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { openPosShift } from '../services/posService';

interface OpenPosScreenProps {
  onBack: () => void;
  onOpened: () => void;
}

export default function OpenPosScreen({
  onBack,
  onOpened,
}: OpenPosScreenProps) {
  const [openingCash, setOpeningCash] = useState('');
  const [openingNotes, setOpeningNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatMoney = (value: string | number) =>
    Number(value).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleOpenShift = () => {
    const trimmedCash = openingCash.trim();

    if (!trimmedCash || !/^\d+(\.\d{1,2})?$/.test(trimmedCash)) {
      Alert.alert(
        'Invalid Opening Cash',
        'Enter a valid amount, such as 0, 500, or 500.00.',
      );
      return;
    }

    const amount = Number(trimmedCash);

    if (!Number.isFinite(amount) || amount < 0) {
      Alert.alert(
        'Invalid Opening Cash',
        'Opening cash must be zero or greater.',
      );
      return;
    }

    Alert.alert(
      'Open POS Shift',
      `Opening cash: ₱${formatMoney(amount)}\n\nDo you want to open this shift?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Shift',
          onPress: () => {
            void submitOpenShift(amount);
          },
        },
      ],
    );
  };

  const submitOpenShift = async (amount: number) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const shift = await openPosShift({
        opening_cash: amount,
        opening_notes: openingNotes.trim() || undefined,
      });

      Alert.alert(
        'Shift Opened',
        `Shift #${shift.id} is now open.\n\nOpening cash: ₱${formatMoney(
          shift.opening_cash,
        )}`,
        [
          {
            text: 'OK',
            onPress: onOpened,
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Unable to Open Shift',
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while opening the shift.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={isSubmitting}
        >
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Open POS</Text>
        <Text style={styles.subtitle}>
          Start a new shift before processing sales.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Opening Shift</Text>
          <Text style={styles.infoDescription}>
            Count the cash available in the register before beginning
            transactions. Enter the actual starting amount below.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Opening Cash (₱)</Text>
          <TextInput
            style={styles.input}
            value={openingCash}
            onChangeText={(value) => {
              if (/^\d*\.?\d{0,2}$/.test(value)) {
                setOpeningCash(value);
              }
            }}
            placeholder="Enter opening cash"
            keyboardType="decimal-pad"
            editable={!isSubmitting}
          />

          <Text style={styles.helperText}>
            Enter 0 if no starting cash is available.
          </Text>

          <Text style={styles.label}>Opening Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={openingNotes}
            onChangeText={setOpeningNotes}
            placeholder="Add notes about the starting cash..."
            multiline
            textAlignVertical="top"
            editable={!isSubmitting}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.disabledButton,
            ]}
            onPress={handleOpenShift}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Open Shift</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoTitle: {
    color: '#1D4ED8',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoDescription: {
    color: '#1E40AF',
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  helperText: {
    marginTop: 6,
    marginBottom: 14,
    color: '#6B7280',
    fontSize: 12,
  },
  notesInput: {
    minHeight: 96,
  },
  submitButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
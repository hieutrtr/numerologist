/**
 * Microphone Selector Component
 * Story 1.2c: Allows users to select microphone device before recording
 *
 * Displays available microphone devices and allows switching between them.
 * Integrates with the voice input service to manage device selection.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../utils/colors';

/**
 * Props for MicrophoneSelector component
 */
interface MicrophoneSelectorProps {
  availableMics: Array<{ id: string; label: string }>;
  selectedMicId: string | null;
  onMicrophoneChange: (deviceId: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * MicrophoneSelector Component
 *
 * Features:
 * - Display all available microphone devices
 * - Show currently selected microphone with visual indicator
 * - Allow user to switch microphone devices
 * - Loading state during device switching
 * - Responsive layout that adapts to number of devices
 *
 * @param props - Component props with microphone configuration
 * @returns React component for microphone selection
 */
export const MicrophoneSelector: React.FC<MicrophoneSelectorProps> = ({
  availableMics,
  selectedMicId,
  onMicrophoneChange,
  isLoading = false,
}) => {
  const [pendingMicId, setPendingMicId] = React.useState<string | null>(null);

  const handleMicrophonePress = async (micId: string) => {
    if (isLoading || micId === selectedMicId) {
      return;
    }

    try {
      setPendingMicId(micId);
      await onMicrophoneChange(micId);
      setPendingMicId(null);
    } catch (error) {
      console.error('Failed to change microphone:', error);
      setPendingMicId(null);
    }
  };

  // Hide selector if no microphones available or only one device
  if (!availableMics || availableMics.length === 0) {
    return null;
  }

  // For single microphone, show minimal indicator
  if (availableMics.length === 1) {
    return (
      <View style={styles.singleMicContainer}>
        <View style={styles.singleMicContent}>
          <MaterialIcons name="mic" size={16} color={Colors.primaryPurple} />
          <Text style={styles.singleMicLabel}>
            {availableMics[0].label}
          </Text>
        </View>
      </View>
    );
  }

  // For multiple microphones, show selector buttons
  return (
    <View style={styles.container}>
      <Text style={styles.label}>🎤 Chọn Microphone</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {availableMics.map((mic) => {
          const isSelected = mic.id === selectedMicId;
          const isPending = mic.id === pendingMicId;
          const isDisabled = isLoading && !isPending;

          return (
            <TouchableOpacity
              key={mic.id}
              style={[
                styles.micButton,
                isSelected && styles.micButtonActive,
                isDisabled && styles.micButtonDisabled,
              ]}
              onPress={() => handleMicrophonePress(mic.id)}
              disabled={isDisabled || isPending}
              activeOpacity={0.7}
              accessibilityLabel={`Select ${mic.label}`}
              accessibilityState={{
                selected: isSelected,
                disabled: isDisabled || isPending,
              }}
            >
              {isPending ? (
                <ActivityIndicator
                  size="small"
                  color={isSelected ? Colors.white : Colors.primaryPurple}
                  style={styles.spinner}
                />
              ) : (
                <MaterialIcons
                  name="mic"
                  size={18}
                  color={isSelected ? Colors.white : Colors.primaryPurple}
                  style={styles.icon}
                />
              )}
              <Text
                style={[
                  styles.micButtonText,
                  isSelected && styles.micButtonTextActive,
                  isDisabled && styles.micButtonTextDisabled,
                ]}
                numberOfLines={1}
              >
                {mic.label}
              </Text>
              {isSelected && (
                <MaterialIcons
                  name="check-circle"
                  size={16}
                  color={Colors.white}
                  style={styles.checkmark}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Container and layout
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },

  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.darkGrey,
    marginBottom: Spacing.md,
  },

  scrollContainer: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },

  scrollContent: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },

  // Microphone button styles
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundGrey,
    borderWidth: 1.5,
    borderColor: Colors.lightGrey,
    minWidth: 140,
  },

  micButtonActive: {
    backgroundColor: Colors.primaryPurple,
    borderColor: Colors.primaryPurple,
  },

  micButtonDisabled: {
    opacity: 0.5,
  },

  icon: {
    marginRight: Spacing.xs,
  },

  spinner: {
    marginRight: Spacing.xs,
  },

  checkmark: {
    marginLeft: Spacing.xs,
  },

  micButtonText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.darkGrey,
  },

  micButtonTextActive: {
    color: Colors.white,
  },

  micButtonTextDisabled: {
    color: Colors.grey,
  },

  // Single microphone indicator
  singleMicContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundGrey,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },

  singleMicContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  singleMicLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.grey,
  },
});

export default MicrophoneSelector;

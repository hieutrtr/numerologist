/**
 * Transcription Display Component
 * 
 * Shows transcribed text with editing capability and alternatives.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

export interface TranscriptionDisplayProps {
  text: string;
  confidence?: number;
  alternatives?: Array<{ text: string; confidence: number }>;
  isLoading?: boolean;
  error?: string;
  onTextChange?: (text: string) => void;
  onSelectAlternative?: (text: string) => void;
  onClear?: () => void;
}

/**
 * TranscriptionDisplay Component
 * 
 * Shows transcribed text with editing, alternatives selection, and error display.
 */
export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  text,
  confidence = 0,
  alternatives = [],
  isLoading = false,
  error,
  onTextChange,
  onSelectAlternative,
  onClear,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);

  const handleSaveEdit = () => {
    onTextChange?.(editedText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(text);
    setIsEditing(false);
  };

  const handleAlternative = (alternative: string) => {
    setEditedText(alternative);
    onSelectAlternative?.(alternative);
    setIsEditing(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Đang xử lý giọng nói...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        {onClear && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClear}
            accessibilityRole="button"
            accessibilityLabel="Clear error"
          >
            <Text style={styles.clearButtonText}>Thử lại</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // No transcription yet
  if (!text && !isEditing) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>Không có nội dung. Bắt đầu bằng cách bấm nút 🎤</Text>
      </View>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Chỉnh sửa nội dung:</Text>
        <TextInput
          style={styles.textInput}
          value={editedText}
          onChangeText={setEditedText}
          multiline
          placeholder="Nhập hoặc chỉnh sửa nội dung..."
          accessibilityLabel="Transcription text input"
        />

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSaveEdit}
            accessibilityRole="button"
            accessibilityLabel="Save changes"
          >
            <Text style={styles.buttonText}>Lưu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel editing"
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
        </View>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <View style={styles.alternativesSection}>
            <Text style={styles.alternativesLabel}>Gợi ý:</Text>
            <ScrollView style={styles.alternativesList}>
              {alternatives.map((alt, index) => (
                <TouchableOpacity
                  key={`alternative-${index}`}
                  style={styles.alternativeItem}
                  onPress={() => handleAlternative(alt.text)}
                  accessibilityRole="button"
                  accessibilityLabel={`Alternative: ${alt.text}`}
                >
                  <Text style={styles.alternativeText}>{alt.text}</Text>
                  <Text style={styles.alternativeConfidence}>
                    {(alt.confidence * 100).toFixed(0)}%
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  // Display mode
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Nội dung đã ghi:</Text>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            {confidence > 0 ? `${(confidence * 100).toFixed(0)}%` : '—'}
          </Text>
        </View>
      </View>

      {/* Transcription text */}
      <View style={styles.textBox}>
        <Text style={styles.transcriptionText}>{text}</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => setIsEditing(true)}
          accessibilityRole="button"
          accessibilityLabel="Edit transcription"
        >
          <Text style={styles.buttonText}>✏️ Chỉnh sửa</Text>
        </TouchableOpacity>
        {onClear && (
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={onClear}
            accessibilityRole="button"
            accessibilityLabel="Clear transcription"
          >
            <Text style={styles.clearButtonText}>🗑️ Xóa</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <View style={styles.alternativesSection}>
          <Text style={styles.alternativesLabel}>Các lựa chọn khác:</Text>
          <ScrollView style={styles.alternativesList} horizontal>
            {alternatives.map((alt, index) => (
              <TouchableOpacity
                key={`alternative-${index}`}
                style={styles.alternativeChip}
                onPress={() => handleAlternative(alt.text)}
                accessibilityRole="button"
                accessibilityLabel={`Alternative: ${alt.text}`}
              >
                <Text style={styles.alternativeChipText}>{alt.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  confidenceBadge: {
    backgroundColor: '#E0E7FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  textBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
  },
  transcriptionText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#6366F1',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  clearButton: {
    backgroundColor: '#F87171',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  alternativesSection: {
    gap: 8,
  },
  alternativesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },
  alternativesList: {
    gap: 8,
  },
  alternativeItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alternativeText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  alternativeConfidence: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  alternativeChip: {
    backgroundColor: '#E0E7FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  alternativeChipText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorIcon: {
    fontSize: 32,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
});

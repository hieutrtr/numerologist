import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface InsightCardProps {
  insight: string;
  userName: string;
  lifePathNumber: number;
  satisfaction?: 'yes' | 'no' | null;
}

/**
 * InsightCard Component
 * Displays the generated numerology insight in a polished, readable format
 */
export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  userName,
  lifePathNumber,
  satisfaction,
}) => {
  // Parse insight into sections (by looking for ** markers)
  const sections = insight.split('**').filter((s) => s.trim());

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.greeting}>Chào {userName},</Text>
        <Text style={styles.headerText}>Thông Điệp Số Học Của Bạn</Text>
      </View>

      <View style={styles.contentBox}>
        {sections.map((section, index) => {
          const lines = section.split('\n').filter((l) => l.trim());
          if (lines.length === 0) return null;

          // Check if this is a heading (all caps or contains only one short line)
          const isHeading = lines[0].length < 50 && !section.includes(':');

          return (
            <View key={index} style={styles.section}>
              {isHeading ? (
                <Text style={styles.sectionHeading}>{lines[0].trim()}</Text>
              ) : (
                <Text style={styles.sectionTitle}>{lines[0].trim()}</Text>
              )}

              {lines.slice(1).map((line, lineIndex) => (
                <Text key={lineIndex} style={styles.sectionText}>
                  {line.trim()}
                </Text>
              ))}
            </View>
          );
        })}
      </View>

      {satisfaction && (
        <View style={[styles.feedbackBox, satisfaction === 'yes' ? styles.feedbackPositive : styles.feedbackNegative]}>
          <Text style={styles.feedbackText}>
            {satisfaction === 'yes'
              ? '✓ Cảm ơn phản hồi của bạn!'
              : 'Chúng tôi sẽ tiếp tục cải thiện'}
          </Text>
        </View>
      )}

      <View style={styles.numberBox}>
        <View style={styles.numberCircle}>
          <Text style={styles.numberLabel}>Số Đường Sống</Text>
          <Text style={styles.numberValue}>{lifePathNumber}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 16,
  },
  headerBox: {
    marginBottom: 24,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: '600',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  contentBox: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 22,
    marginBottom: 6,
  },
  feedbackBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  feedbackPositive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  feedbackNegative: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  feedbackText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  numberBox: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  numberCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 3,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberLabel: {
    fontSize: 12,
    color: '#FFD700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  numberValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
  },
});

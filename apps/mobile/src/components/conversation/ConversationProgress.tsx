import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ConversationStep } from './ConversationFlowController';

interface ConversationProgressProps {
  currentStep: ConversationStep;
  totalSteps?: number;
}

const STEP_LABELS: Record<ConversationStep, string> = {
  [ConversationStep.GREETING]: 'Lời chào',
  [ConversationStep.NAME_INPUT]: 'Tên của bạn',
  [ConversationStep.NAME_CONFIRMATION]: 'Xác nhận tên',
  [ConversationStep.DATE_INPUT]: 'Ngày sinh',
  [ConversationStep.DATE_CONFIRMATION]: 'Xác nhận ngày',
  [ConversationStep.CONCERN_INPUT]: 'Câu hỏi của bạn',
  [ConversationStep.CALCULATION]: 'Tính toán',
  [ConversationStep.INSIGHT_DELIVERY]: 'Insight',
  [ConversationStep.FEEDBACK_COLLECTION]: 'Phản hồi',
  [ConversationStep.SAVING]: 'Lưu dữ liệu',
  [ConversationStep.COMPLETE]: 'Hoàn thành',
};

const STEP_ORDER = [
  ConversationStep.GREETING,
  ConversationStep.NAME_INPUT,
  ConversationStep.NAME_CONFIRMATION,
  ConversationStep.DATE_INPUT,
  ConversationStep.DATE_CONFIRMATION,
  ConversationStep.CONCERN_INPUT,
  ConversationStep.CALCULATION,
  ConversationStep.INSIGHT_DELIVERY,
  ConversationStep.FEEDBACK_COLLECTION,
  ConversationStep.SAVING,
  ConversationStep.COMPLETE,
];

/**
 * ConversationProgress Component
 * Displays progress indicator showing current step in conversation flow
 */
export const ConversationProgress: React.FC<ConversationProgressProps> = ({
  currentStep,
  totalSteps = STEP_ORDER.length,
}) => {
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${progressPercentage}%`,
            },
          ]}
        />
      </View>

      {/* Step Label and Counter */}
      <View style={styles.infoContainer}>
        <Text style={styles.stepLabel}>{STEP_LABELS[currentStep]}</Text>
        <Text style={styles.stepCounter}>
          {currentStepIndex + 1} / {totalSteps}
        </Text>
      </View>

      {/* Step Dots */}
      <View style={styles.dotsContainer}>
        {STEP_ORDER.map((step, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < currentStepIndex + 1 ? styles.dotCompleted : {},
              index === currentStepIndex ? styles.dotCurrent : {},
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#16213e',
    borderRadius: 8,
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#0f1424',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepLabel: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  stepCounter: {
    fontSize: 12,
    color: '#888888',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#444444',
  },
  dotCompleted: {
    backgroundColor: '#FFD700',
  },
  dotCurrent: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'transparent',
  },
});

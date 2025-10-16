/**
 * Conversation Flow Integration Tests
 * Tests the complete end-to-end flow from greeting to completion
 * Validates integration between ConversationFlowController, services, and UI
 */

import { ConversationFlowController, ConversationStep } from '../../components/conversation/ConversationFlowController';
import { generatePersonalInsight, generateBriefInsight } from '../../services/insight-generator';
import type { NumerologyProfile } from '../../types';

describe('Conversation Flow Integration', () => {
  let flowController: ConversationFlowController;

  beforeEach(() => {
    flowController = new ConversationFlowController();
  });

  afterEach(() => {
    flowController.destroy();
  });

  describe('Complete Conversation Flow', () => {
    it('should complete full conversation from greeting to completion', async () => {
      // Step 1: Start conversation
      flowController.start();
      expect(flowController.getCurrentStep()).toBe(ConversationStep.GREETING);

      // Step 2: Enter name
      flowController.processNameInput('Nguyễn Văn A');
      expect(flowController.getCurrentStep()).toBe(ConversationStep.NAME_CONFIRMATION);
      expect(flowController.getCollectedData().fullName).toBe('Nguyễn Văn A');

      // Step 3: Enter birth date
      flowController.processDateInput('15/3/1990');
      expect(flowController.getCurrentStep()).toBe(ConversationStep.DATE_CONFIRMATION);
      expect(flowController.getCollectedData().birthDate).toBe('1990-03-15');

      // Step 4: Enter concern
      flowController.processConcernInput('Tôi muốn biết về sự nghiệp');
      expect(flowController.getCurrentStep()).toBe(ConversationStep.CALCULATION);
      expect(flowController.getCollectedData().userConcern).toBe(
        'Tôi muốn biết về sự nghiệp',
      );

      // Step 5: Set numerology profile
      const mockProfile: NumerologyProfile = {
        id: 'test-id',
        userId: 'user-id',
        lifePathNumber: 3,
        destinyNumber: 7,
        soulUrgeNumber: 5,
        personalityNumber: 2,
        currentPersonalYear: 8,
        currentPersonalMonth: 4,
        calculatedAt: new Date().toISOString(),
        interpretations: {
          lifePathNumber_3: 'Bạn là một người sáng tạo',
        },
      };
      flowController.setNumerologyProfile(mockProfile);
      expect(flowController.getCurrentStep()).toBe(ConversationStep.INSIGHT_DELIVERY);
      expect(flowController.getCollectedData().numerologyProfile).toBe(mockProfile);

      // Step 6: Set insight
      const insight = generatePersonalInsight(mockProfile, 'Tôi muốn biết về sự nghiệp', 'Nguyễn Văn A');
      flowController.setGeneratedInsight(insight);
      expect(flowController.getCurrentStep()).toBe(ConversationStep.FEEDBACK_COLLECTION);
      expect(flowController.getCollectedData().generatedInsight).toBe(insight);

      // Step 7: Provide feedback
      flowController.processFeedback('có');
      expect(flowController.getCurrentStep()).toBe(ConversationStep.SAVING);
      expect(flowController.getCollectedData().userFeedback).toBe('yes');

      // Step 8: Mark as saved
      flowController.markSaved();
      expect(flowController.getCurrentStep()).toBe(ConversationStep.COMPLETE);
    });
  });

  describe('Insight Generation Integration', () => {
    it('should generate personalized insight for career concern', () => {
      const profile: NumerologyProfile = {
        id: 'test-id',
        userId: 'user-id',
        lifePathNumber: 1,
        destinyNumber: 8,
        soulUrgeNumber: 3,
        personalityNumber: 5,
        currentPersonalYear: 1,
        currentPersonalMonth: 6,
        calculatedAt: new Date().toISOString(),
        interpretations: {},
      };

      const insight = generatePersonalInsight(profile, 'Tôi muốn biết về sự nghiệp', 'Nguyễn Văn A');
      
      expect(insight).toContain('Nguyễn Văn A');
      expect(insight).toContain('1');
      expect(insight).toContain('sự nghiệp');
      expect(insight).toContain('8');
      expect(insight).toContain('năm 1');
    });

    it('should generate brief insight for quick display', () => {
      const profile: NumerologyProfile = {
        id: 'test-id',
        userId: 'user-id',
        lifePathNumber: 7,
        destinyNumber: 4,
        soulUrgeNumber: 2,
        personalityNumber: 9,
        currentPersonalYear: 5,
        currentPersonalMonth: 10,
        calculatedAt: new Date().toISOString(),
        interpretations: {},
      };

      const briefInsight = generateBriefInsight(profile, 'Trần Thị B');
      
      expect(briefInsight).toContain('Trần Thị B');
      expect(briefInsight).toContain('7');
    });
  });

  describe('Vietnamese Text Processing', () => {
    it('should handle Vietnamese input correctly', () => {
      flowController.start();

      // Vietnamese name with special characters
      const nameResult = flowController.processNameInput('Nguyễn Thị Mỹ Hương');
      expect(nameResult.valid).toBe(true);

      flowController.processDateInput('15 tháng 3 năm 1990');
      const dateData = flowController.getCollectedData();
      expect(dateData.birthDate).toBe('1990-03-15');
    });

    it('should handle Vietnamese feedback responses', () => {
      flowController.start();
      flowController.processNameInput('Test');
      flowController.processDateInput('1990-03-15');
      flowController.processConcernInput('Test concern');

      const mockProfile: NumerologyProfile = {
        id: 'test-id',
        userId: 'user-id',
        lifePathNumber: 3,
        destinyNumber: 7,
        soulUrgeNumber: 5,
        personalityNumber: 2,
        currentPersonalYear: 8,
        currentPersonalMonth: 4,
        calculatedAt: new Date().toISOString(),
        interpretations: {},
      };
      flowController.setNumerologyProfile(mockProfile);
      flowController.setGeneratedInsight('Test insight');

      const yesFeedback = flowController.processFeedback('có');
      expect(yesFeedback.valid).toBe(true);
      expect(yesFeedback.feedback).toBe('yes');

      // Reset for next test
      flowController.reset();
      flowController.start();
      flowController.processNameInput('Test');
      flowController.processDateInput('1990-03-15');
      flowController.processConcernInput('Test concern');
      flowController.setNumerologyProfile(mockProfile);
      flowController.setGeneratedInsight('Test insight');

      const noFeedback = flowController.processFeedback('không');
      expect(noFeedback.valid).toBe(true);
      expect(noFeedback.feedback).toBe('no');
    });
  });

  describe('Error Recovery & Resilience', () => {
    it('should recover from invalid input with retry', () => {
      flowController.start();

      // First invalid attempt
      const result1 = flowController.processNameInput('');
      expect(result1.valid).toBe(false);

      const errorResult1 = flowController.handleError(result1.error!);
      expect(errorResult1.canRetry).toBe(true);
      expect(flowController.getCollectedData().retryCount).toBe(1);

      // Second invalid attempt
      const result2 = flowController.processNameInput('');
      expect(result2.valid).toBe(false);

      const errorResult2 = flowController.handleError(result2.error!);
      expect(errorResult2.canRetry).toBe(true);
      expect(flowController.getCollectedData().retryCount).toBe(2);

      // Third invalid attempt - should fail after max retries
      const result3 = flowController.processNameInput('');
      expect(result3.valid).toBe(false);

      const errorResult3 = flowController.handleError(result3.error!);
      expect(errorResult3.canRetry).toBe(false);
      expect(flowController.getCollectedData().retryCount).toBe(3);
    });

    it('should reset retry count on successful input', () => {
      flowController.start();

      // Simulate failures
      flowController.handleError('Error 1');
      flowController.handleError('Error 2');
      expect(flowController.getCollectedData().retryCount).toBe(2);

      // Valid input should reset retry count
      flowController.processNameInput('Valid Name');
      expect(flowController.getCollectedData().retryCount).toBe(0);
    });
  });

  describe('Date Parsing Robustness', () => {
    it('should parse all supported date formats correctly', () => {
      const testCases = [
        { input: '15 tháng 3 năm 1990', expected: '1990-03-15', name: 'Vietnamese format' },
        { input: '15/3/1990', expected: '1990-03-15', name: 'Slash format (single digit month)' },
        { input: '15/03/1990', expected: '1990-03-15', name: 'Slash format (double digit month)' },
        { input: '15-03-1990', expected: '1990-03-15', name: 'Dash format' },
        { input: '1990-03-15', expected: '1990-03-15', name: 'ISO format' },
      ];

      testCases.forEach(({ input, expected, name }) => {
        flowController.reset();
        flowController.start();
        const result = flowController.processDateInput(input);
        expect(result.valid).toBe(true);
        expect(result.parsedDate).toBe(expected);
      });
    });

    it('should handle leap year dates correctly', () => {
      flowController.start();

      // Valid leap year
      const leapYearResult = flowController.processDateInput('29/02/2020');
      expect(leapYearResult.valid).toBe(true);
      expect(leapYearResult.parsedDate).toBe('2020-02-29');

      // Invalid leap year
      flowController.reset();
      flowController.start();
      const invalidLeapYearResult = flowController.processDateInput('29/02/1900');
      expect(invalidLeapYearResult.valid).toBe(false);
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state throughout conversation', () => {
      flowController.start();

      const initialState = flowController.getState();
      expect(initialState.currentStep).toBe(ConversationStep.GREETING);
      expect(initialState.isProcessing).toBe(false);
      expect(initialState.error).toBeNull();

      // After name input
      flowController.processNameInput('Nguyễn Văn A');
      const nameState = flowController.getState();
      expect(nameState.data.fullName).toBe('Nguyễn Văn A');
      expect(nameState.currentStep).toBe(ConversationStep.NAME_CONFIRMATION);

      // After date input
      flowController.processDateInput('1990-03-15');
      const dateState = flowController.getState();
      expect(dateState.data.birthDate).toBe('1990-03-15');
      expect(dateState.data.fullName).toBe('Nguyễn Văn A'); // Should persist
      expect(dateState.currentStep).toBe(ConversationStep.DATE_CONFIRMATION);
    });
  });

  describe('Data Collection Accuracy', () => {
    it('should collect all required data accurately', () => {
      flowController.start();

      const testData = {
        name: 'Nguyễn Văn A',
        date: '1990-03-15',
        concern: 'Tôi muốn biết về tương lai của tôi',
        feedback: 'yes',
      };

      flowController.processNameInput(testData.name);
      flowController.processDateInput(testData.date);
      flowController.processConcernInput(testData.concern);

      const collectedData = flowController.getCollectedData();
      expect(collectedData.fullName).toBe(testData.name);
      expect(collectedData.birthDate).toBe(testData.date);
      expect(collectedData.userConcern).toBe(testData.concern);
    });
  });

  describe('Edge Cases', () => {
    it('should handle maximum length inputs', () => {
      flowController.start();

      // Max length name (100 characters)
      const maxName = 'A'.repeat(100);
      const nameResult = flowController.processNameInput(maxName);
      expect(nameResult.valid).toBe(true);

      // Over-length name should fail
      const overMaxName = 'A'.repeat(101);
      const overMaxResult = flowController.processNameInput(overMaxName);
      expect(overMaxResult.valid).toBe(false);
    });

    it('should handle whitespace trimming', () => {
      flowController.start();

      flowController.processNameInput('   Nguyễn Văn A   ');
      const data = flowController.getCollectedData();
      expect(data.fullName).toBe('Nguyễn Văn A');
      expect(data.fullName).not.toContain('   ');
    });

    it('should handle today date as valid birth date', () => {
      flowController.start();

      // Note: This is a valid date but practically unusual
      // Test just validates the logic accepts dates that are not tomorrow+
      const today = new Date();
      const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
      
      const result = flowController.processDateInput(todayStr);
      expect(result.valid).toBe(true);
    });
  });
});

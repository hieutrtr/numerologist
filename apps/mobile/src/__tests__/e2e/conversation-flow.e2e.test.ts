/**
 * End-to-End Tests for Conversation Flow
 * Tests complete user journey from app start to conversation completion
 * Validates integration of all services and components
 */

import { ConversationFlowController, ConversationStep } from '../../components/conversation/ConversationFlowController';
import { generatePersonalInsight, generateBriefInsight } from '../../services/insight-generator';
import type { NumerologyProfile } from '../../types';

describe('Conversation Flow - End-to-End', () => {
  /**
   * E2E Scenario 1: Complete Conversation with Career Focus
   */
  describe('E2E-1: Complete Career-Focused Conversation', () => {
    it('should complete full conversation with career focus', async () => {
      const controller = new ConversationFlowController();
      controller.start();

      // User Input: Name
      const nameResult = controller.processNameInput('Nguyễn Văn A');
      expect(nameResult.valid).toBe(true);

      // User Input: Birth Date (Vietnamese format)
      const dateResult = controller.processDateInput('15 tháng 3 năm 1990');
      expect(dateResult.valid).toBe(true);
      expect(dateResult.parsedDate).toBe('1990-03-15');

      // User Input: Career Concern
      const concernResult = controller.processConcernInput(
        'Tôi muốn biết liệu tôi có thành công trong sự nghiệp không?'
      );
      expect(concernResult.valid).toBe(true);

      // Mock Numerology Profile
      const profile: NumerologyProfile = {
        userId: 'user-1',
        lifePathNumber: 1,
        destinyNumber: 8,
        soulUrgeNumber: 3,
        personalityNumber: 5,
        currentPersonalYear: 1,
        currentPersonalMonth: 6,
        calculatedAt: new Date(),
        interpretations: {
          lifePathNumber_1: 'Bạn là một người lãnh đạo độc lập',
          destinyNumber_8: 'Số mệnh của bạn tập trung vào thành công vật chất',
          soulUrgeNumber_3: 'Linh hồn của bạn khao khát sáng tạo',
          personalityNumber_5: 'Bạn là một người linh hoạt',
          personalYearGuidance: 'Năm bắt đầu mới',
          personalMonthGuidance: 'Tháng xây dựng nền tảng',
        },
      };

      controller.setNumerologyProfile(profile);
      expect(controller.getCurrentStep()).toBe(ConversationStep.INSIGHT_DELIVERY);

      // Generate Insight
      const insight = generatePersonalInsight(
        profile,
        'Tôi muốn biết liệu tôi có thành công trong sự nghiệp không?',
        'Nguyễn Văn A'
      );
      
      controller.setGeneratedInsight(insight);
      expect(controller.getCurrentStep()).toBe(ConversationStep.FEEDBACK_COLLECTION);
      expect(insight).toContain('Nguyễn Văn A');
      expect(insight).toContain('1'); // Life path number
      expect(insight).toContain('sự nghiệp'); // Career keyword

      // User Feedback
      const feedbackResult = controller.processFeedback('có');
      expect(feedbackResult.valid).toBe(true);
      expect(feedbackResult.feedback).toBe('yes');

      // Save and Complete
      controller.markSaved();
      expect(controller.getCurrentStep()).toBe(ConversationStep.COMPLETE);

      // Validate collected data
      const data = controller.getCollectedData();
      expect(data.fullName).toBe('Nguyễn Văn A');
      expect(data.birthDate).toBe('1990-03-15');
      expect(data.userConcern).toContain('sự nghiệp');
      expect(data.userFeedback).toBe('yes');
      expect(data.numerologyProfile?.lifePathNumber).toBe(1);
      expect(data.generatedInsight).toContain('Nguyễn Văn A');

      controller.destroy();
    });
  });

  /**
   * E2E Scenario 2: Relationship-Focused Conversation
   */
  describe('E2E-2: Complete Relationship-Focused Conversation', () => {
    it('should complete conversation with relationship concern', async () => {
      const controller = new ConversationFlowController();
      controller.start();

      // Vietnamese name with diacritics
      const nameResult = controller.processNameInput('Trần Thị Mỹ Hương');
      expect(nameResult.valid).toBe(true);

      // Slash format date
      const dateResult = controller.processDateInput('22/7/1995');
      expect(dateResult.valid).toBe(true);

      // Relationship concern
      const concern = 'Tôi muốn biết liệu có ai quan tâm tôi không?';
      const concernResult = controller.processConcernInput(concern);
      expect(concernResult.valid).toBe(true);

      // Profile with different numbers
      const profile: NumerologyProfile = {
        userId: 'user-2',
        lifePathNumber: 6,
        destinyNumber: 2,
        soulUrgeNumber: 9,
        personalityNumber: 7,
        currentPersonalYear: 9,
        currentPersonalMonth: 8,
        calculatedAt: new Date(),
        interpretations: {
          lifePathNumber_6: 'Bạn có bản chất chăm sóc',
          destinyNumber_2: 'Số mệnh của bạn dẫn bạn đến hợp tác',
          soulUrgeNumber_9: 'Linh hồn của bạn khao khát bác ái',
          personalityNumber_7: 'Bạn là một người tư tưởng',
          personalYearGuidance: 'Năm kết thúc và khởi đầu mới',
          personalMonthGuidance: 'Tháng hoàn thành chu kỳ',
        },
      };

      controller.setNumerologyProfile(profile);

      const insight = generatePersonalInsight(profile, concern, 'Trần Thị Mỹ Hương');
      controller.setGeneratedInsight(insight);

      // Negative feedback
      const feedbackResult = controller.processFeedback('không');
      expect(feedbackResult.valid).toBe(true);
      expect(feedbackResult.feedback).toBe('no');

      controller.markSaved();

      const data = controller.getCollectedData();
      expect(data.userFeedback).toBe('no');
      expect(data.numerologyProfile?.lifePathNumber).toBe(6);

      controller.destroy();
    });
  });

  /**
   * E2E Scenario 3: Recovery from Errors
   */
  describe('E2E-3: Error Recovery and Retry', () => {
    it('should handle errors and recover with valid retry', () => {
      const controller = new ConversationFlowController();
      controller.start();

      // First attempt - invalid name
      let result = controller.processNameInput('');
      expect(result.valid).toBe(false);

      // Try again with empty
      const errorResult = controller.handleError(result.error!);
      expect(errorResult.canRetry).toBe(true);

      // Second attempt - still invalid
      result = controller.processNameInput('  ');
      expect(result.valid).toBe(false);

      controller.handleError(result.error!);

      // Third attempt - invalid (exceeds max length)
      result = controller.processNameInput('A'.repeat(101));
      expect(result.valid).toBe(false);

      controller.handleError(result.error!);

      // Fourth attempt - all retries exhausted
      const finalError = controller.handleError(result.error!);
      expect(finalError.canRetry).toBe(false);
      expect(finalError.message).toContain('Quá nhiều lỗi');

      controller.destroy();
    });
  });

  /**
   * E2E Scenario 4: Different Date Formats
   */
  describe('E2E-4: Date Format Flexibility', () => {
    const dateFormats = [
      { input: '1/1/2000', expected: '2000-01-01', label: 'Slash format' },
      { input: '01-01-2000', expected: '2000-01-01', label: 'Dash format' },
      { input: '2000-01-01', expected: '2000-01-01', label: 'ISO format' },
      { input: '1 tháng 1 năm 2000', expected: '2000-01-01', label: 'Vietnamese format' },
    ];

    dateFormats.forEach(({ input, expected, label }) => {
      it(`should parse ${label}`, () => {
        const controller = new ConversationFlowController();
        controller.start();
        controller.processNameInput('Test User');

        const result = controller.processDateInput(input);
        expect(result.valid).toBe(true);
        expect(result.parsedDate).toBe(expected);

        controller.destroy();
      });
    });
  });

  /**
   * E2E Scenario 5: Insight Quality Validation
   */
  describe('E2E-5: Insight Quality and Personalization', () => {
    it('should generate contextual insights based on concern', () => {
      const profile: NumerologyProfile = {
        userId: 'user-test',
        lifePathNumber: 3,
        destinyNumber: 5,
        soulUrgeNumber: 4,
        personalityNumber: 8,
        currentPersonalYear: 5,
        currentPersonalMonth: 3,
        calculatedAt: new Date(),
        interpretations: {},
      };

      const careerInsight = generatePersonalInsight(
        profile,
        'Tôi muốn biết về sự nghiệp',
        'Test'
      );
      expect(careerInsight).toContain('sự nghiệp');

      const relationshipInsight = generatePersonalInsight(
        profile,
        'Tôi muốn biết về tình yêu',
        'Test'
      );
      expect(relationshipInsight).toContain('mối quan hệ');

      const healthInsight = generatePersonalInsight(
        profile,
        'Tôi muốn biết về sức khỏe',
        'Test'
      );
      expect(healthInsight).toContain('phát triển cá nhân');

      // Same profile, different concerns = different context
      expect(careerInsight).not.toBe(relationshipInsight);
      expect(relationshipInsight).not.toBe(healthInsight);
    });
  });

  /**
   * E2E Scenario 6: Vietnamese Feedback Processing
   */
  describe('E2E-6: Vietnamese Feedback Variations', () => {
    const yesResponses = ['có', 'Có', 'yes', 'Yes', 'YES', 'đúng', 'tốt', 'hữu ích'];
    const noResponses = ['không', 'Không', 'no', 'No', 'NO', 'sai'];

    yesResponses.forEach((response) => {
      it(`should recognize "${response}" as yes`, () => {
        const controller = new ConversationFlowController();
        controller.start();
        controller.processNameInput('Test');
        controller.processDateInput('2000-01-01');
        controller.processConcernInput('Test concern');

        const profile: NumerologyProfile = {
          userId: 'test',
          lifePathNumber: 1,
          destinyNumber: 1,
          soulUrgeNumber: 1,
          personalityNumber: 1,
          currentPersonalYear: 1,
          currentPersonalMonth: 1,
          calculatedAt: new Date(),
          interpretations: {},
        };

        controller.setNumerologyProfile(profile);
        controller.setGeneratedInsight('Test insight');

        const result = controller.processFeedback(response);
        expect(result.valid).toBe(true);
        expect(result.feedback).toBe('yes');

        controller.destroy();
      });
    });

    noResponses.forEach((response) => {
      it(`should recognize "${response}" as no`, () => {
        const controller = new ConversationFlowController();
        controller.start();
        controller.processNameInput('Test');
        controller.processDateInput('2000-01-01');
        controller.processConcernInput('Test concern');

        const profile: NumerologyProfile = {
          userId: 'test',
          lifePathNumber: 1,
          destinyNumber: 1,
          soulUrgeNumber: 1,
          personalityNumber: 1,
          currentPersonalYear: 1,
          currentPersonalMonth: 1,
          calculatedAt: new Date(),
          interpretations: {},
        };

        controller.setNumerologyProfile(profile);
        controller.setGeneratedInsight('Test insight');

        const result = controller.processFeedback(response);
        expect(result.valid).toBe(true);
        expect(result.feedback).toBe('no');

        controller.destroy();
      });
    });
  });

  /**
   * E2E Scenario 7: State Persistence Through Flow
   */
  describe('E2E-7: State Persistence and Recovery', () => {
    it('should maintain state consistency through entire flow', () => {
      const controller = new ConversationFlowController();
      controller.start();

      const testData = {
        name: 'Nguyễn Văn A',
        date: '1990-03-15',
        concern: 'Tôi muốn biết về tương lai',
      };

      // Collect data
      controller.processNameInput(testData.name);
      controller.processDateInput(testData.date);
      controller.processConcernInput(testData.concern);

      // Check state at each step
      let state = controller.getState();
      expect(state.data.fullName).toBe(testData.name);
      expect(state.data.birthDate).toBe(testData.date);
      expect(state.data.userConcern).toBe(testData.concern);

      // Add numerology profile
      const profile: NumerologyProfile = {
        userId: 'test',
        lifePathNumber: 7,
        destinyNumber: 11,
        soulUrgeNumber: 2,
        personalityNumber: 9,
        currentPersonalYear: 3,
        currentPersonalMonth: 7,
        calculatedAt: new Date(),
        interpretations: {},
      };

      controller.setNumerologyProfile(profile);
      const insight = 'Test insight';
      controller.setGeneratedInsight(insight);

      // Verify all data still present
      state = controller.getState();
      expect(state.data.fullName).toBe(testData.name);
      expect(state.data.birthDate).toBe(testData.date);
      expect(state.data.userConcern).toBe(testData.concern);
      expect(state.data.numerologyProfile?.lifePathNumber).toBe(7);
      expect(state.data.generatedInsight).toBe(insight);

      // Add feedback
      controller.processFeedback('có');
      state = controller.getState();
      expect(state.data.userFeedback).toBe('yes');

      // All data still intact
      expect(state.data.fullName).toBe(testData.name);
      expect(state.data.birthDate).toBe(testData.date);
      expect(state.data.userConcern).toBe(testData.concern);
      expect(state.data.numerologyProfile?.lifePathNumber).toBe(7);
      expect(state.data.generatedInsight).toBe(insight);

      controller.destroy();
    });
  });
});

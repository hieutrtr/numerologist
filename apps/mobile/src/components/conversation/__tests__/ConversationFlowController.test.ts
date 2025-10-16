import { ConversationFlowController, ConversationStep, ConversationData } from '../ConversationFlowController';
import type { NumerologyProfile } from '../../../types';

describe('ConversationFlowController', () => {
  let controller: ConversationFlowController;

  beforeEach(() => {
    controller = new ConversationFlowController();
  });

  afterEach(() => {
    controller.destroy();
  });

  describe('Initialization', () => {
    it('should start in GREETING step', () => {
      controller.start();
      expect(controller.getCurrentStep()).toBe(ConversationStep.GREETING);
    });

    it('should initialize with empty data', () => {
      controller.start();
      const data = controller.getCollectedData();
      expect(data.fullName).toBeNull();
      expect(data.birthDate).toBeNull();
      expect(data.userConcern).toBeNull();
      expect(data.numerologyProfile).toBeNull();
    });
  });

  describe('Name Input Processing', () => {
    beforeEach(() => {
      controller.start();
      controller.processNameInput('Nguyễn Văn A');
    });

    it('should accept valid Vietnamese name', () => {
      const result = controller.processNameInput('Trần Thị B');
      expect(result.valid).toBe(true);
    });

    it('should reject empty name', () => {
      const result = controller.processNameInput('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Tên không được để trống');
    });

    it('should reject name exceeding 100 characters', () => {
      const longName = 'A'.repeat(101);
      const result = controller.processNameInput(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Tên quá dài');
    });

    it('should trim whitespace from name', () => {
      controller.processNameInput('  Nguyễn Văn A  ');
      const data = controller.getCollectedData();
      expect(data.fullName).toBe('Nguyễn Văn A');
    });

    it('should transition to NAME_CONFIRMATION after valid input', () => {
      controller.start();
      controller.processNameInput('Nguyễn Văn A');
      expect(controller.getCurrentStep()).toBe(ConversationStep.NAME_CONFIRMATION);
    });
  });

  describe('Date Input Processing', () => {
    beforeEach(() => {
      controller.start();
      controller.processNameInput('Nguyễn Văn A');
      // Skip confirmation step by manually transitioning
      const state = controller.getState();
      expect(state.currentStep).toBe(ConversationStep.NAME_CONFIRMATION);
    });

    it('should parse Vietnamese date format "15 tháng 3 năm 1990"', () => {
      const result = controller.processDateInput('15 tháng 3 năm 1990');
      expect(result.valid).toBe(true);
      expect(result.parsedDate).toBe('1990-03-15');
    });

    it('should parse slash format "15/3/1990"', () => {
      const result = controller.processDateInput('15/3/1990');
      expect(result.valid).toBe(true);
      expect(result.parsedDate).toBe('1990-03-15');
    });

    it('should parse dash format "15-03-1990"', () => {
      const result = controller.processDateInput('15-03-1990');
      expect(result.valid).toBe(true);
      expect(result.parsedDate).toBe('1990-03-15');
    });

    it('should parse ISO format "1990-03-15"', () => {
      const result = controller.processDateInput('1990-03-15');
      expect(result.valid).toBe(true);
      expect(result.parsedDate).toBe('1990-03-15');
    });

    it('should reject invalid date format', () => {
      const result = controller.processDateInput('invalid');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('không hợp lệ');
    });

    it('should reject future date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const dateStr = `${futureDate.getDate()}/${futureDate.getMonth() + 1}/${futureDate.getFullYear()}`;
      
      const result = controller.processDateInput(dateStr);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('tương lai');
    });

    it('should reject date before 1900', () => {
      const result = controller.processDateInput('01/01/1850');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('sau năm 1900');
    });

    it('should reject invalid day for month', () => {
      const result = controller.processDateInput('31/02/1990'); // February doesn't have 31 days
      expect(result.valid).toBe(false);
    });

    it('should accept leap year date', () => {
      const result = controller.processDateInput('29/02/2020'); // 2020 is a leap year
      expect(result.valid).toBe(true);
      expect(result.parsedDate).toBe('2020-02-29');
    });

    it('should reject invalid leap year date', () => {
      const result = controller.processDateInput('29/02/1900'); // 1900 is not a leap year
      expect(result.valid).toBe(false);
    });
  });

  describe('Concern Input Processing', () => {
    beforeEach(() => {
      controller.start();
      controller.processNameInput('Nguyễn Văn A');
      controller.processDateInput('15/3/1990');
    });

    it('should accept valid concern', () => {
      const result = controller.processConcernInput('Tôi muốn biết về sự nghiệp');
      expect(result.valid).toBe(true);
    });

    it('should reject empty concern', () => {
      const result = controller.processConcernInput('');
      expect(result.valid).toBe(false);
    });

    it('should trim whitespace from concern', () => {
      controller.processConcernInput('  Tôi muốn biết về sự nghiệp  ');
      const data = controller.getCollectedData();
      expect(data.userConcern).toBe('Tôi muốn biết về sự nghiệp');
    });
  });

  describe('State Transitions', () => {
    it('should transition through all steps correctly', () => {
      const steps: ConversationStep[] = [];

      controller.start();
      steps.push(controller.getCurrentStep());
      expect(controller.getCurrentStep()).toBe(ConversationStep.GREETING);

      controller.processNameInput('Nguyễn Văn A');
      steps.push(controller.getCurrentStep());
      expect(controller.getCurrentStep()).toBe(ConversationStep.NAME_CONFIRMATION);

      controller.processDateInput('15/3/1990');
      steps.push(controller.getCurrentStep());
      expect(controller.getCurrentStep()).toBe(ConversationStep.DATE_CONFIRMATION);

      controller.processConcernInput('Tôi muốn biết về sự nghiệp');
      steps.push(controller.getCurrentStep());
      expect(controller.getCurrentStep()).toBe(ConversationStep.CALCULATION);

      // Simulate numerology calculation
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
        interpretations: { lifePathNumber_3: 'Test interpretation' },
      };
      controller.setNumerologyProfile(mockProfile);
      steps.push(controller.getCurrentStep());
      expect(controller.getCurrentStep()).toBe(ConversationStep.INSIGHT_DELIVERY);

      controller.setGeneratedInsight('Test insight');
      steps.push(controller.getCurrentStep());
      expect(controller.getCurrentStep()).toBe(ConversationStep.FEEDBACK_COLLECTION);

      controller.processFeedback('Có');
      steps.push(controller.getCurrentStep());
      expect(controller.getCurrentStep()).toBe(ConversationStep.SAVING);

      controller.markSaved();
      steps.push(controller.getCurrentStep());
      expect(controller.getCurrentStep()).toBe(ConversationStep.COMPLETE);
    });
  });

  describe('Feedback Processing', () => {
    beforeEach(() => {
      controller.start();
      controller.processNameInput('Nguyễn Văn A');
      controller.processDateInput('15/3/1990');
      controller.processConcernInput('Tôi muốn biết');
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
      controller.setNumerologyProfile(mockProfile);
      controller.setGeneratedInsight('Test insight');
    });

    it('should accept "có" (yes in Vietnamese)', () => {
      const result = controller.processFeedback('có');
      expect(result.valid).toBe(true);
      expect(result.feedback).toBe('yes');
    });

    it('should accept "yes"', () => {
      const result = controller.processFeedback('yes');
      expect(result.valid).toBe(true);
      expect(result.feedback).toBe('yes');
    });

    it('should accept "không" (no in Vietnamese)', () => {
      const result = controller.processFeedback('không');
      expect(result.valid).toBe(true);
      expect(result.feedback).toBe('no');
    });

    it('should accept "no"', () => {
      const result = controller.processFeedback('no');
      expect(result.valid).toBe(true);
      expect(result.feedback).toBe('no');
    });

    it('should reject invalid feedback', () => {
      const result = controller.processFeedback('maybe');
      expect(result.valid).toBe(false);
    });
  });

  describe('Error Handling & Retry Logic', () => {
    it('should track retry count', () => {
      controller.start();

      // First attempt fails
      controller.handleError('Test error 1');
      let data = controller.getCollectedData();
      expect(data.retryCount).toBe(1);

      // Second attempt fails
      controller.handleError('Test error 2');
      data = controller.getCollectedData();
      expect(data.retryCount).toBe(2);
    });

    it('should allow retries up to limit', () => {
      controller.start();

      for (let i = 0; i < 3; i++) {
        const result = controller.handleError('Test error');
        if (i < 2) {
          expect(result.canRetry).toBe(true);
        } else {
          expect(result.canRetry).toBe(false);
        }
      }
    });

    it('should reset retry count on successful input', () => {
      controller.start();

      controller.handleError('Error 1');
      controller.handleError('Error 2');
      let data = controller.getCollectedData();
      expect(data.retryCount).toBe(2);

      // Successful input should reset retries
      controller.processNameInput('Nguyễn Văn A');
      data = controller.getCollectedData();
      expect(data.retryCount).toBe(0);
    });
  });

  describe('Data Collection', () => {
    it('should collect all conversation data', () => {
      controller.start();
      controller.processNameInput('Nguyễn Văn A');
      controller.processDateInput('15/3/1990');
      controller.processConcernInput('Tôi muốn biết về sự nghiệp');

      const data = controller.getCollectedData();
      expect(data.fullName).toBe('Nguyễn Văn A');
      expect(data.birthDate).toBe('1990-03-15');
      expect(data.userConcern).toBe('Tôi muốn biết về sự nghiệp');
    });
  });

  describe('Reset & Cleanup', () => {
    it('should reset conversation state', () => {
      controller.start();
      controller.processNameInput('Nguyễn Văn A');
      expect(controller.getCurrentStep()).not.toBe(ConversationStep.GREETING);

      controller.reset();
      expect(controller.getCurrentStep()).toBe(ConversationStep.GREETING);
      expect(controller.getCollectedData().fullName).toBeNull();
    });

    it('should cleanup timeouts on destroy', () => {
      controller.start();
      // Just verify no errors on destroy
      expect(() => controller.destroy()).not.toThrow();
    });
  });
});

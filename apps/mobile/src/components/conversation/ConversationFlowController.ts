/**
 * Conversation Flow Controller
 * Manages the state machine for the complete voice-numerology conversation flow.
 * Orchestrates transitions between: greeting → name → date → concern → calculation → insight → feedback → save
 */

import type { NumerologyProfile } from '../../types';

// Conversation flow states
export enum ConversationStep {
  GREETING = 'greeting',
  NAME_INPUT = 'nameInput',
  NAME_CONFIRMATION = 'nameConfirmation',
  DATE_INPUT = 'dateInput',
  DATE_CONFIRMATION = 'dateConfirmation',
  CONCERN_INPUT = 'concernInput',
  CALCULATION = 'calculation',
  INSIGHT_DELIVERY = 'insightDelivery',
  FEEDBACK_COLLECTION = 'feedbackCollection',
  SAVING = 'saving',
  COMPLETE = 'complete',
}

// Conversation data collected during flow
export interface ConversationData {
  fullName: string | null;
  birthDate: string | null; // ISO format: YYYY-MM-DD
  userConcern: string | null;
  numerologyProfile: NumerologyProfile | null;
  generatedInsight: string | null;
  userFeedback: 'yes' | 'no' | null;
  timestamp: Date;
  retryCount: number;
}

// Conversation state
export interface ConversationState {
  currentStep: ConversationStep;
  data: ConversationData;
  isProcessing: boolean;
  error: string | null;
  lastPrompt: string | null;
}

// Initial state factory
function createInitialState(): ConversationState {
  return {
    currentStep: ConversationStep.GREETING,
    data: {
      fullName: null,
      birthDate: null,
      userConcern: null,
      numerologyProfile: null,
      generatedInsight: null,
      userFeedback: null,
      timestamp: new Date(),
      retryCount: 0,
    },
    isProcessing: false,
    error: null,
    lastPrompt: null,
  };
}

/**
 * Conversation Flow Controller - Manages conversation state machine
 * Handles state transitions with validation and error recovery
 */
export class ConversationFlowController {
  private state: ConversationState;
  private timeoutIds: Map<string, NodeJS.Timeout> = new Map();
  private readonly INTERACTION_TIMEOUT_MS = 30000; // 30 seconds per step

  constructor() {
    this.state = createInitialState();
  }

  /**
   * Get current state
   */
  getState(): Readonly<ConversationState> {
    return { ...this.state };
  }

  /**
   * Get current step
   */
  getCurrentStep(): ConversationStep {
    return this.state.currentStep;
  }

  /**
   * Get collected data
   */
  getCollectedData(): Readonly<ConversationData> {
    return { ...this.state.data };
  }

  /**
   * Start the conversation flow
   */
  start(): void {
    this.state = createInitialState();
    this.clearAllTimeouts();
    this.setStepTimeout(ConversationStep.GREETING);
  }

  /**
   * Process name input and transition
   */
  processNameInput(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: 'Tên không được để trống. Vui lòng nói tên của bạn.' };
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return { valid: false, error: 'Tên quá dài. Vui lòng nói tên ngắn hơn.' };
    }

    this.state.data.fullName = trimmedName;
    this.state.error = null;
    this.state.data.retryCount = 0;
    this.transitionToStep(ConversationStep.NAME_CONFIRMATION);

    return { valid: true };
  }

  /**
   * Process date input and parse Vietnamese/numeric formats
   */
  processDateInput(dateInput: string): { valid: boolean; parsedDate?: string; error?: string } {
    const parsed = this.parseDateInput(dateInput);
    
    if (!parsed.valid) {
      return { valid: false, error: parsed.error };
    }

    // Validate date range
    const date = new Date(parsed.date!);
    const today = new Date();
    const minDate = new Date('1900-01-01');

    if (date > today) {
      return { valid: false, error: 'Ngày sinh không thể là ngày trong tương lai. Vui lòng kiểm tra lại.' };
    }

    if (date < minDate) {
      return { valid: false, error: 'Ngày sinh phải sau năm 1900. Vui lòng kiểm tra lại.' };
    }

    this.state.data.birthDate = parsed.date;
    this.state.error = null;
    this.state.data.retryCount = 0;
    this.transitionToStep(ConversationStep.DATE_CONFIRMATION);

    return { valid: true, parsedDate: parsed.date };
  }

  /**
   * Parse date from various Vietnamese and numeric formats
   * Supports: "15 tháng 3 năm 1990", "15/3/1990", "15-03-1990", "1990-03-15"
   */
  private parseDateInput(input: string): { valid: boolean; date?: string; error?: string } {
    const trimmed = input.trim();

    // Format 1: "15 tháng 3 năm 1990" (Vietnamese text)
    const vietnameseMatch = trimmed.match(/(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/);
    if (vietnameseMatch) {
      const [, day, month, year] = vietnameseMatch;
      const date = this.validateAndFormatDate(parseInt(day), parseInt(month), parseInt(year));
      if (date) return { valid: true, date };
    }

    // Format 2: "15/3/1990" or "15/03/1990"
    const slashMatch = trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      const date = this.validateAndFormatDate(parseInt(day), parseInt(month), parseInt(year));
      if (date) return { valid: true, date };
    }

    // Format 3: "15-03-1990" or "15-3-1990"
    const dashMatch = trimmed.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (dashMatch) {
      const [, day, month, year] = dashMatch;
      const date = this.validateAndFormatDate(parseInt(day), parseInt(month), parseInt(year));
      if (date) return { valid: true, date };
    }

    // Format 4: "1990-03-15" (ISO)
    const isoMatch = trimmed.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const date = this.validateAndFormatDate(parseInt(day), parseInt(month), parseInt(year));
      if (date) return { valid: true, date };
    }

    return { valid: false, error: 'Ngày sinh không hợp lệ. Vui lòng thử lại với định dạng đúng.' };
  }

  /**
   * Validate date components and return ISO format string
   */
  private validateAndFormatDate(day: number, month: number, year: number): string | null {
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    // Simple leap year check
    const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (day > daysInMonth[month - 1]) return null;

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  /**
   * Process concern input
   */
  processConcernInput(concern: string): { valid: boolean; error?: string } {
    if (!concern || concern.trim().length === 0) {
      return { valid: false, error: 'Vui lòng nói điều bạn muốn biết.' };
    }

    this.state.data.userConcern = concern.trim();
    this.state.error = null;
    this.state.data.retryCount = 0;
    this.transitionToStep(ConversationStep.CALCULATION);

    return { valid: true };
  }

  /**
   * Set numerology profile after calculation
   */
  setNumerologyProfile(profile: NumerologyProfile): void {
    this.state.data.numerologyProfile = profile;
    this.transitionToStep(ConversationStep.INSIGHT_DELIVERY);
  }

  /**
   * Set generated insight
   */
  setGeneratedInsight(insight: string): void {
    this.state.data.generatedInsight = insight;
    this.transitionToStep(ConversationStep.FEEDBACK_COLLECTION);
  }

  /**
   * Process feedback response
   */
  processFeedback(response: string): { valid: boolean; feedback?: 'yes' | 'no'; error?: string } {
    const normalized = response.toLowerCase().trim();

    // Vietnamese yes responses
    if (['có', 'yes', 'đúng', 'tốt', 'hữu ích'].includes(normalized)) {
      this.state.data.userFeedback = 'yes';
      this.transitionToStep(ConversationStep.SAVING);
      return { valid: true, feedback: 'yes' };
    }

    // Vietnamese no responses
    if (['không', 'no', 'không', 'sai'].includes(normalized)) {
      this.state.data.userFeedback = 'no';
      this.transitionToStep(ConversationStep.SAVING);
      return { valid: true, feedback: 'no' };
    }

    return { valid: false, error: 'Vui lòng trả lời "có" hoặc "không".' };
  }

  /**
   * Mark conversation as saved and complete
   */
  markSaved(): void {
    this.transitionToStep(ConversationStep.COMPLETE);
    this.clearAllTimeouts();
  }

  /**
   * Handle error in current step with retry logic
   */
  handleError(error: string): { canRetry: boolean; message: string } {
    this.state.error = error;
    this.state.data.retryCount++;

    const MAX_RETRIES = 3;
    if (this.state.data.retryCount >= MAX_RETRIES) {
      return {
        canRetry: false,
        message: 'Quá nhiều lỗi. Vui lòng bắt đầu lại từ đầu.',
      };
    }

    // Reset to previous step for retry
    this.resetToPreviousStep();

    return {
      canRetry: true,
      message: `Lỗi: ${error}. Vui lòng thử lại (${this.state.data.retryCount}/${MAX_RETRIES}).`,
    };
  }

  /**
   * Transition to next step with validation
   */
  private transitionToStep(nextStep: ConversationStep): void {
    const isValidTransition = this.isValidTransition(this.state.currentStep, nextStep);

    if (!isValidTransition) {
      throw new Error(`Invalid transition from ${this.state.currentStep} to ${nextStep}`);
    }

    this.clearStepTimeout(this.state.currentStep);
    this.state.currentStep = nextStep;
    this.setStepTimeout(nextStep);
  }

  /**
   * Validate state transitions
   */
  private isValidTransition(from: ConversationStep, to: ConversationStep): boolean {
    const transitions: Record<ConversationStep, ConversationStep[]> = {
      [ConversationStep.GREETING]: [ConversationStep.NAME_INPUT],
      [ConversationStep.NAME_INPUT]: [ConversationStep.NAME_CONFIRMATION],
      [ConversationStep.NAME_CONFIRMATION]: [ConversationStep.DATE_INPUT],
      [ConversationStep.DATE_INPUT]: [ConversationStep.DATE_CONFIRMATION],
      [ConversationStep.DATE_CONFIRMATION]: [ConversationStep.CONCERN_INPUT],
      [ConversationStep.CONCERN_INPUT]: [ConversationStep.CALCULATION],
      [ConversationStep.CALCULATION]: [ConversationStep.INSIGHT_DELIVERY],
      [ConversationStep.INSIGHT_DELIVERY]: [ConversationStep.FEEDBACK_COLLECTION],
      [ConversationStep.FEEDBACK_COLLECTION]: [ConversationStep.SAVING],
      [ConversationStep.SAVING]: [ConversationStep.COMPLETE],
      [ConversationStep.COMPLETE]: [],
    };

    return transitions[from]?.includes(to) ?? false;
  }

  /**
   * Reset to previous step for retry
   */
  private resetToPreviousStep(): void {
    const stepOrder = [
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
    ];

    const currentIndex = stepOrder.indexOf(this.state.currentStep);
    if (currentIndex > 0) {
      this.state.currentStep = stepOrder[currentIndex - 1];
      this.setStepTimeout(this.state.currentStep);
    }
  }

  /**
   * Set timeout for step
   */
  private setStepTimeout(step: ConversationStep): void {
    const timeout = setTimeout(() => {
      this.state.error = 'Vượt quá thời gian chờ. Vui lòng thử lại.';
      this.resetToPreviousStep();
    }, this.INTERACTION_TIMEOUT_MS);

    this.timeoutIds.set(step, timeout);
  }

  /**
   * Clear timeout for step
   */
  private clearStepTimeout(step: ConversationStep): void {
    const timeout = this.timeoutIds.get(step);
    if (timeout) {
      clearTimeout(timeout);
      this.timeoutIds.delete(step);
    }
  }

  /**
   * Clear all timeouts
   */
  private clearAllTimeouts(): void {
    this.timeoutIds.forEach((timeout) => clearTimeout(timeout));
    this.timeoutIds.clear();
  }

  /**
   * Reset conversation
   */
  reset(): void {
    this.start();
  }

  /**
   * Cleanup (call before unmounting)
   */
  destroy(): void {
    this.clearAllTimeouts();
  }
}

/**
 * Numerology domain types
 */

export interface NumerologyProfile {
  userId: string;
  lifePathNumber: number;
  destinyNumber: number;
  soulUrgeNumber: number;
  personalityNumber: number;
  currentPersonalYear: number;
  currentPersonalMonth: number;
  calculatedAt: Date;
  interpretations: NumerologyInterpretations;
}

export interface NumerologyProfileResponse {
  userId: string;
  lifePathNumber: number;
  destinyNumber: number;
  soulUrgeNumber: number;
  personalityNumber: number;
  currentPersonalYear: number;
  currentPersonalMonth: number;
  calculatedAt: string;
  interpretations: NumerologyInterpretations;
}

export interface NumerologyInterpretations {
  lifePathInterpretation: string;
  destinyInterpretation: string;
  soulUrgeInterpretation: string;
  personalityInterpretation: string;
  personalYearGuidance: string;
  personalMonthGuidance: string;
}

export interface NumerologyInsight {
  insight: string;
  relevantNumbers: number[];
}

export interface NumerologyInsightRequest {
  question: string;
  context?: string;
}

export type NumerologyNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 22 | 33;

export interface NumberInterpretation {
  number: NumerologyNumber;
  meaning: string;
  keywords: string[];
  guidance: string;
}

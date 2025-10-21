/**
 * Daily.co Provider Wrapper
 * Story 1.2c: Wraps conversation UI with Daily.co room setup
 *
 * Provides Daily instance context and initialization for voice conversations
 * Uses the @daily-co/daily-react DailyProvider component with correct props
 */

import React from 'react';
import { DailyProvider as DailyProviderBase } from '@daily-co/daily-react';

/**
 * Props for DailyProvider wrapper
 */
interface DailyProviderProps {
  roomUrl?: string;
  children: React.ReactNode;
}

/**
 * Daily.co Provider component that wraps the application with Daily context
 *
 * Acceptance Criteria (Story 1.2c):
 * - DailyProvider component wraps conversation UI with proper initialization
 * - Provides Daily context to all child components
 * - Voice services can use Daily hooks for audio/video functionality
 *
 * @param props - Provider configuration with optional room URL
 * @returns React component that provides Daily context to children
 */
export const DailyProvider: React.FC<DailyProviderProps> = ({
  roomUrl = '',
  children,
}) => {
  return (
    <DailyProviderBase url={roomUrl}>
      {children}
    </DailyProviderBase>
  );
};

/**
 * Legacy export for backward compatibility
 */
export const DailyProviderWrapper = DailyProvider;

export default DailyProvider;

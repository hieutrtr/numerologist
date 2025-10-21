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
  token?: string;
  children: React.ReactNode;
}

/**
 * Daily.co Provider component that wraps the application with Daily context
 *
 * Acceptance Criteria (Story 1.2c):
 * - DailyProvider component wraps conversation UI with proper initialization
 * - Provides Daily context to all child components
 * - Voice services can use Daily hooks for audio/video functionality
 * - Joins Daily.co room with authentication token
 *
 * @param props - Provider configuration with room URL and optional token
 * @returns React component that provides Daily context to children
 */
export const DailyProvider: React.FC<DailyProviderProps> = ({
  roomUrl = '',
  token = '',
  children,
}) => {
  // Only pass token if it's a non-empty string
  // Daily.co requires token to be a valid string or undefined, not empty string
  const validToken = token && token.length > 0 ? token : undefined;

  return (
    <DailyProviderBase url={roomUrl} token={validToken}>
      {children}
    </DailyProviderBase>
  );
};

/**
 * Legacy export for backward compatibility
 */
export const DailyProviderWrapper = DailyProvider;

export default DailyProvider;

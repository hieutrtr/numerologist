/**
 * Daily.co Provider Wrapper
 * Story 1.2c: Wraps conversation UI with Daily.co room setup
 *
 * Provides Daily instance context and initialization for voice conversations
 */

import React, { useCallback } from 'react';
import {
  DailyProvider as DailyProviderBase,
  Daily,
} from '@daily-co/daily-react';

/**
 * Props for DailyProvider wrapper
 */
interface DailyProviderWrapperProps {
  roomUrl: string;
  token: string;
  children: React.ReactNode;
  onError?: (error: Error) => void;
  userName?: string;
}

/**
 * Wrapper component that initializes Daily.co room with proper configuration
 *
 * Acceptance Criteria (Story 1.2c):
 * - DailyProviderWrapper component wraps conversation UI with proper room setup
 *
 * @param props - Provider configuration
 * @returns React component that provides Daily context to children
 */
export const DailyProviderWrapper: React.FC<
  DailyProviderWrapperProps
> = ({ roomUrl, token, children, onError, userName = 'User' }) => {
  /**
   * Initialize and return Daily instance
   */
  const dailyFactory = useCallback(async () => {
    try {
      // Create Daily instance
      const daily = new Daily();

      // Configure room settings
      const roomSettings = {
        showLeaveButton: true,
        showFullscreen: false,
        // Video disabled to save costs (voice-only app)
        showVideoPreview: false,
        videoSource: false,
        // Audio enabled by default
        audioSource: true,
        // Appearance settings
        layoutMode: 'spotlight' as const,
      };

      // Join room with token
      await daily.join({
        url: roomUrl,
        token,
        userName,
      });

      // Enable network quality monitoring
      daily.setNetworkTopology({
        topology: 'sfu', // SFU (Selective Forwarding Unit) for 1-on-1 + bot
      });

      return daily;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to initialize Daily instance';
      onError?.(new Error(errorMessage));
      throw error;
    }
  }, [roomUrl, token, userName, onError]);

  return (
    <DailyProviderBase
      dailyFactory={dailyFactory}
      options={{
        showLeaveButton: false,
      }}
    >
      {children}
    </DailyProviderBase>
  );
};

export default DailyProviderWrapper;

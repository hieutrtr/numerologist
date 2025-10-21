/**
 * Daily.co Provider Wrapper
 * Story 1.2c: Wraps conversation UI with Daily.co room setup
 *
 * Provides Daily instance context and initialization for voice conversations
 * Supports both pre-configured mode and dynamic room setup
 */

import React, { useCallback, useMemo } from 'react';
import {
  DailyProvider as DailyProviderBase,
  Daily,
} from '@daily-co/daily-react';

/**
 * Props for DailyProvider wrapper
 */
interface DailyProviderWrapperProps {
  roomUrl?: string;
  token?: string;
  children: React.ReactNode;
  onError?: (error: Error) => void;
  userName?: string;
}

/**
 * Simple wrapper component that provides Daily.co context without requiring room setup upfront
 * Allows dynamic room joining from child components
 *
 * Acceptance Criteria (Story 1.2c):
 * - DailyProvider component wraps conversation UI with proper initialization
 * - Supports dynamic room setup through useVoiceInputService and useVoiceOutputService hooks
 *
 * @param props - Provider configuration (optional room details)
 * @returns React component that provides Daily context to children
 */
export const DailyProvider: React.FC<DailyProviderWrapperProps> = ({
  roomUrl,
  token,
  children,
  onError,
  userName = 'User',
}) => {
  /**
   * Initialize and return Daily instance
   * If roomUrl and token provided, join immediately
   * Otherwise return empty Daily instance for dynamic joining
   */
  const dailyFactory = useCallback(async () => {
    try {
      // Create Daily instance
      const daily = new Daily();

      // If room details provided, join immediately
      if (roomUrl && token) {
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
      }

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

/**
 * Legacy export for backward compatibility
 */
export const DailyProviderWrapper = DailyProvider;

export default DailyProvider;

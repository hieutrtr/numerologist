/**
 * Daily.co Provider Wrapper
 * Story 1.2c: Wraps conversation UI with Daily.co room setup
 *
 * Provides Daily instance context and initialization for voice conversations
 * Uses the @daily-co/daily-react DailyProvider component with correct props
 * Handles device enumeration via preAuth() and startCamera()
 */

import React, { useEffect, useRef } from 'react';
import { DailyProvider as DailyProviderBase, useDaily } from '@daily-co/daily-react';

/**
 * Props for DailyProvider wrapper
 */
interface DailyProviderProps {
  roomUrl: string;
  token?: string;
  children: React.ReactNode;
}

/**
 * Daily.co Device Initializer
 * Handles preAuth and startCamera to enable device enumeration
 * Story 1.2c: Ensures microphones are available for voice input service
 */
const DailyDeviceInitializer: React.FC<{ roomUrl: string; token?: string }> = ({
  roomUrl,
  token,
}) => {
  const daily = useDaily();
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!daily || !roomUrl || roomUrl === 'about:blank') return;

    joinedRef.current = false;

    const initializeDevices = async () => {
      try {
        console.log('[Daily.co] Initializing devices with preAuth');
        // preAuth authenticates without joining the room
        await daily.preAuth({ url: roomUrl, token });

        console.log('[Daily.co] Calling startCamera for device enumeration');
        // startCamera triggers browser permission prompts and device enumeration
        await daily.startCamera();

        if (!joinedRef.current) {
          console.log('[Daily.co] Joining Daily room after device init');
          await daily.join({ url: roomUrl, token });
          joinedRef.current = true;
        }

        console.log('[Daily.co] Devices initialized successfully');
      } catch (error) {
        console.error('[Daily.co] Device initialization error:', error);
      }
    };

    initializeDevices();
  }, [daily, roomUrl, token]);

  return null;
};

/**
 * Daily.co Provider component that wraps the application with Daily context
 *
 * Acceptance Criteria (Story 1.2c):
 * - DailyProvider component wraps conversation UI with proper initialization
 * - Provides Daily context to all child components
 * - Voice services can use Daily hooks for audio/video functionality
 * - Joins Daily.co room with authentication token
 * - Enumerates devices via preAuth and startCamera
 *
 * @param props - Provider configuration with required room URL and optional token
 * @returns React component that provides Daily context to children
 */
export const DailyProvider: React.FC<DailyProviderProps> = ({
  roomUrl,
  token,
  children,
}) => {
  // Daily.co requires a valid URL string to initialize
  // Use placeholder if roomUrl is not yet available, but keep the provider active
  // This ensures all child hooks (Recoil, Daily.co) work properly
  // Device enumeration will happen when real roomUrl becomes available
  const validRoomUrl = roomUrl && roomUrl !== '' ? roomUrl : 'about:blank';

  // Daily.co token must be a string (not undefined or null)
  // Use empty string if token is not available
  const validToken = token || '';

  return (
    <DailyProviderBase url={validRoomUrl} token={validToken}>
      {/* Initialize devices when room URL becomes available */}
      {roomUrl && roomUrl !== '' && <DailyDeviceInitializer roomUrl={roomUrl} token={validToken} />}
      {children}
    </DailyProviderBase>
  );
};

/**
 * Legacy export for backward compatibility
 */
export const DailyProviderWrapper = DailyProvider;

export default DailyProvider;

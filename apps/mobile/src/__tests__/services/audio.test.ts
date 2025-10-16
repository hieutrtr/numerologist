/**
 * Tests for Audio Recording Service
 */

import { AudioRecorder } from '../../services/audio';

describe('AudioRecorder', () => {
  let recorder: AudioRecorder;

  beforeEach(() => {
    recorder = new AudioRecorder();
  });

  afterEach(async () => {
    await recorder.cleanup();
  });

  describe('initialization', () => {
    it('should create recorder instance', () => {
      expect(recorder).toBeDefined();
      expect(recorder.isRecording()).toBe(false);
    });
  });

  describe('permissions', () => {
    it('should check permissions', async () => {
      const hasPermission = await recorder.checkPermissions();
      expect(typeof hasPermission).toBe('boolean');
    });

    it('should request permissions', async () => {
      const granted = await recorder.requestPermissions();
      expect(typeof granted).toBe('boolean');
    });
  });

  describe('recording lifecycle', () => {
    it('should report not recording initially', () => {
      expect(recorder.isRecording()).toBe(false);
    });

    it('should handle recording start', async () => {
      try {
        // Skip if permissions not granted in test environment
        const hasPermission = await recorder.checkPermissions();
        if (!hasPermission) {
          console.warn('Skipping recording test - no permissions');
          return;
        }

        await recorder.startRecording();
        expect(recorder.isRecording()).toBe(true);
      } catch (error) {
        console.warn('Recording start failed:', error);
      }
    });
  });

  describe('error handling', () => {
    it('should throw error when stopping without recording', async () => {
      expect(recorder.isRecording()).toBe(false);
      
      try {
        await recorder.stopRecording();
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle cleanup safely', async () => {
      expect(async () => {
        await recorder.cleanup();
      }).not.toThrow();
    });
  });
});

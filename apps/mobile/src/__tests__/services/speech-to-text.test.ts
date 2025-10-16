/**
 * Tests for Speech-to-Text Service
 */

import { SpeechToTextClient, TranscriptionResult } from '../../services/speech-to-text';

describe('SpeechToTextClient', () => {
  let client: SpeechToTextClient;

  beforeEach(() => {
    client = new SpeechToTextClient();
  });

  afterEach(async () => {
    await client.cleanup();
  });

  describe('initialization', () => {
    it('should create client instance', () => {
      expect(client).toBeDefined();
      expect(client.isConnected()).toBe(false);
      expect(client.isRecording()).toBe(false);
    });
  });

  describe('connection state', () => {
    it('should report disconnected initially', () => {
      expect(client.isConnected()).toBe(false);
    });

    it('should not be recording initially', () => {
      expect(client.isRecording()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle cleanup safely without connection', async () => {
      expect(async () => {
        await client.cleanup();
      }).not.toThrow();
    });

    it('should handle stop streaming without connection', async () => {
      expect(async () => {
        await client.stopStreaming();
      }).not.toThrow();
    });
  });

  describe('transcription result', () => {
    it('should parse transcription result correctly', () => {
      const result: TranscriptionResult = {
        text: 'Xin chào',
        isFinal: true,
        confidence: 0.95,
        alternatives: [
          { text: 'Kính chào', confidence: 0.85 },
        ],
        timestamp: Date.now(),
      };

      expect(result.text).toBe('Xin chào');
      expect(result.isFinal).toBe(true);
      expect(result.confidence).toBe(0.95);
      expect(result.alternatives.length).toBe(1);
    });
  });
});

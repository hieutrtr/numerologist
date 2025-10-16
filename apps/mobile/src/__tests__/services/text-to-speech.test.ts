/**
 * Text-to-Speech Client Tests
 */

import { TextToSpeechClient } from '../../services/text-to-speech';

describe('TextToSpeechClient', () => {
  let client: TextToSpeechClient;

  beforeEach(() => {
    client = new TextToSpeechClient();
  });

  describe('mapErrorToVietnamese', () => {
    it('should map timeout error to Vietnamese', () => {
      // @ts-ignore - accessing private method for testing
      const msg = client['mapErrorToVietnamese']('Request timeout');
      expect(msg).toContain('hết thời gian');
    });

    it('should map network error to Vietnamese', () => {
      // @ts-ignore
      const msg = client['mapErrorToVietnamese']('Network connection failed');
      expect(msg).toContain('kết nối');
    });

    it('should map authentication error to Vietnamese', () => {
      // @ts-ignore
      const msg = client['mapErrorToVietnamese']('Invalid API key');
      expect(msg).toContain('xác thực');
    });

    it('should map rate limit error to Vietnamese', () => {
      // @ts-ignore
      const msg = client['mapErrorToVietnamese']('Rate limit exceeded');
      expect(msg).toContain('quá nhiều');
    });

    it('should map voice error to Vietnamese', () => {
      // @ts-ignore
      const msg = client['mapErrorToVietnamese']('Voice not found');
      expect(msg).toContain('Giọng nói');
    });

    it('should have fallback message for unknown errors', () => {
      // @ts-ignore
      const msg = client['mapErrorToVietnamese']('Unknown error xyz');
      expect(msg.length > 0).toBe(true);
    });
  });
});

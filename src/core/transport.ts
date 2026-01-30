/**
 * Transport layer for React Native
 * Handles API communication with HMAC authentication
 */

import type { FeedbackSubmission, SubmissionResponse } from '../types';

const DEFAULT_API_URL = 'https://feedback.sjforge.dev/api/widget';

export interface TransportConfig {
  apiKey: string;
  apiUrl?: string;
}

/**
 * Create HMAC-SHA256 signature for request authentication
 * Uses SubtleCrypto which is available in React Native via react-native-get-random-values
 */
async function createSignature(
  apiKey: string,
  timestamp: string,
  body: string
): Promise<string> {
  const message = `${timestamp}:${body}`;

  // Convert strings to Uint8Array
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiKey);
  const messageData = encoder.encode(message);

  // Import key for HMAC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the message
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Transport client for React Native feedback submissions
 */
export class FeedbackTransport {
  private apiKey: string;
  private apiUrl: string;

  constructor(config: TransportConfig) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || DEFAULT_API_URL;
  }

  /**
   * Submit feedback to the API
   */
  async submitFeedback(submission: FeedbackSubmission): Promise<SubmissionResponse> {
    const body = JSON.stringify(submission);
    const timestamp = Date.now().toString();
    const signature = await createSignature(this.apiKey, timestamp, body);

    const response = await fetch(`${this.apiUrl}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      feedback_id: data.feedback_id,
    };
  }

  /**
   * Upload a screenshot
   * In React Native, we read the file and send as base64
   */
  async uploadScreenshot(
    feedbackId: string,
    imageUri: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Read file as base64
      // This requires the file to be accessible - react-native-view-shot provides file:// URIs
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Upload to API
      const body = JSON.stringify({
        feedbackId,
        imageData: base64,
      });
      const timestamp = Date.now().toString();
      const signature = await createSignature(this.apiKey, timestamp, body);

      const uploadResponse = await fetch(`${this.apiUrl}/upload/screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'X-Timestamp': timestamp,
          'X-Signature': signature,
        },
        body,
      });

      const data = await uploadResponse.json();

      if (!uploadResponse.ok) {
        return { success: false, error: data.error || 'Upload failed' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Screenshot upload failed',
      };
    }
  }
}

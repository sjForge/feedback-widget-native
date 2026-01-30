/**
 * Main FeedbackWidget class for React Native
 */

import { FeedbackTransport } from './transport';
import { ContextCollector } from './context';
import { OfflineQueue } from './offline-queue';
import type {
  WidgetConfig,
  FeedbackSubmission,
  FeedbackType,
  FeedbackPriority,
  SubmissionResponse,
  QueuedSubmission,
} from '../types';

const SDK_VERSION = '0.1.0';

/**
 * FeedbackWidget for React Native
 *
 * @example
 * ```typescript
 * import { FeedbackWidget } from '@sjforge/feedback-widget-native';
 *
 * // Initialize
 * FeedbackWidget.init({
 *   projectId: 'my-app',
 *   apiKey: 'fpk_xxx',
 * });
 *
 * // Submit feedback
 * await FeedbackWidget.submit({
 *   type: 'bug',
 *   priority: 'high',
 *   title: 'App crashes on launch',
 *   description: 'The app crashes when I open it',
 * });
 * ```
 */
export class FeedbackWidget {
  private static instance: FeedbackWidget | null = null;

  private config: WidgetConfig;
  private transport: FeedbackTransport;
  private contextCollector: ContextCollector;
  private offlineQueue: OfflineQueue;
  private isSubmitting = false;

  private constructor(config: WidgetConfig) {
    this.config = config;

    this.transport = new FeedbackTransport({
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
    });

    this.contextCollector = new ContextCollector(config);

    this.offlineQueue = new OfflineQueue({
      maxRetries: 3,
      onSyncComplete: (succeeded, failed) => {
        if (succeeded > 0) {
          console.log(`FeedbackWidget: Synced ${succeeded} offline submissions`);
        }
        if (failed > 0) {
          console.warn(`FeedbackWidget: ${failed} submissions failed to sync`);
        }
      },
    });

    this.offlineQueue.setSyncCallback(async (queued) => {
      return this.syncQueuedSubmission(queued);
    });

    // Initialize offline queue
    this.offlineQueue.init();
  }

  /**
   * Initialize the widget
   */
  static init(config: WidgetConfig): FeedbackWidget {
    if (FeedbackWidget.instance) {
      console.warn('FeedbackWidget already initialized');
      return FeedbackWidget.instance;
    }

    if (!config.projectId) {
      throw new Error('FeedbackWidget: projectId is required');
    }
    if (!config.apiKey) {
      throw new Error('FeedbackWidget: apiKey is required');
    }

    FeedbackWidget.instance = new FeedbackWidget(config);
    return FeedbackWidget.instance;
  }

  /**
   * Get the current instance
   */
  static getInstance(): FeedbackWidget | null {
    return FeedbackWidget.instance;
  }

  /**
   * Destroy the widget
   */
  static destroy(): void {
    if (FeedbackWidget.instance) {
      FeedbackWidget.instance.offlineQueue.destroy();
      FeedbackWidget.instance = null;
    }
  }

  /**
   * Check if initialized
   */
  static isInitialized(): boolean {
    return FeedbackWidget.instance !== null;
  }

  /**
   * Get SDK version
   */
  static getVersion(): string {
    return SDK_VERSION;
  }

  /**
   * Set custom context
   */
  static setContext(context: Record<string, unknown>): void {
    FeedbackWidget.instance?.contextCollector.setCustomContext(context);
  }

  /**
   * Submit feedback
   */
  static async submit(feedback: {
    type: FeedbackType;
    priority: FeedbackPriority;
    title: string;
    description: string;
    screenshotUri?: string;
  }): Promise<SubmissionResponse> {
    const instance = FeedbackWidget.instance;
    if (!instance) {
      return {
        success: false,
        error: 'FeedbackWidget not initialized',
      };
    }

    return instance.submitFeedback(feedback);
  }

  /**
   * Get pending offline submission count
   */
  static async getPendingCount(): Promise<number> {
    return FeedbackWidget.instance?.offlineQueue.getPendingCount() ?? 0;
  }

  /**
   * Force sync offline submissions
   */
  static async syncOffline(): Promise<{ succeeded: number; failed: number }> {
    return FeedbackWidget.instance?.offlineQueue.sync() ?? { succeeded: 0, failed: 0 };
  }

  /**
   * Check if online
   */
  static isOnline(): boolean {
    return FeedbackWidget.instance?.offlineQueue.getOnlineStatus() ?? true;
  }

  /**
   * Get context (for debugging)
   */
  static async getContext(): Promise<Record<string, unknown> | null> {
    return FeedbackWidget.instance?.contextCollector.getContext() ?? null;
  }

  // Instance methods

  private async submitFeedback(feedback: {
    type: FeedbackType;
    priority: FeedbackPriority;
    title: string;
    description: string;
    screenshotUri?: string;
  }): Promise<SubmissionResponse> {
    if (this.isSubmitting) {
      return {
        success: false,
        error: 'Submission already in progress',
      };
    }

    this.isSubmitting = true;
    this.config.onSubmitStart?.();

    try {
      const context = await this.contextCollector.getContext();

      const submission: FeedbackSubmission = {
        type: feedback.type,
        priority: feedback.priority,
        title: feedback.title,
        description: feedback.description,
        widget_version: SDK_VERSION,
        context,
      };

      if (this.config.user?.name) {
        submission.submitter_name = this.config.user.name;
      }
      if (this.config.user?.email) {
        submission.submitter_email = this.config.user.email;
      }

      // Check if online
      if (!this.offlineQueue.getOnlineStatus()) {
        return this.queueSubmission(submission, feedback.screenshotUri);
      }

      // Try to submit
      const response = await this.transport.submitFeedback(submission);

      if (!response.success) {
        // If network error, queue for later
        if (this.isNetworkError(response.error)) {
          return this.queueSubmission(submission, feedback.screenshotUri);
        }

        this.config.onSubmitError?.(new Error(response.error || 'Submission failed'));
        return response;
      }

      // Upload screenshot if provided
      if (feedback.screenshotUri && response.feedback_id) {
        const uploadResult = await this.transport.uploadScreenshot(
          response.feedback_id,
          feedback.screenshotUri
        );

        if (!uploadResult.success) {
          console.warn('FeedbackWidget: Screenshot upload failed:', uploadResult.error);
        }
      }

      this.config.onSubmitSuccess?.(response.feedback_id!);
      return response;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));

      // Queue if network error
      if (this.isNetworkError(errorObj.message)) {
        const context = await this.contextCollector.getContext();
        return this.queueSubmission(
          {
            type: feedback.type,
            priority: feedback.priority,
            title: feedback.title,
            description: feedback.description,
            widget_version: SDK_VERSION,
            context,
          },
          feedback.screenshotUri
        );
      }

      this.config.onSubmitError?.(errorObj);
      return {
        success: false,
        error: errorObj.message,
      };
    } finally {
      this.isSubmitting = false;
    }
  }

  private async queueSubmission(
    submission: FeedbackSubmission,
    screenshotUri?: string
  ): Promise<SubmissionResponse> {
    try {
      const id = await this.offlineQueue.enqueue({
        submission,
        screenshotUri,
      });

      return {
        success: true,
        feedback_id: `offline-${id}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to queue submission',
      };
    }
  }

  private async syncQueuedSubmission(queued: QueuedSubmission): Promise<boolean> {
    try {
      const response = await this.transport.submitFeedback(queued.submission);

      if (!response.success || !response.feedback_id) {
        return false;
      }

      // Upload screenshot if present
      if (queued.screenshotUri) {
        await this.transport.uploadScreenshot(response.feedback_id, queued.screenshotUri);
      }

      return true;
    } catch {
      return false;
    }
  }

  private isNetworkError(error?: string): boolean {
    if (!error) return false;
    const networkErrors = ['network', 'fetch', 'timeout', 'offline', 'ECONNREFUSED'];
    const lower = error.toLowerCase();
    return networkErrors.some(e => lower.includes(e));
  }
}

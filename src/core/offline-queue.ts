/**
 * Offline Queue for React Native
 * Uses AsyncStorage for persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import type { FeedbackSubmission, QueuedSubmission } from '../types';

const STORAGE_KEY = '@feedback_widget_queue';

export interface OfflineQueueConfig {
  maxRetries?: number;
  onSyncStart?: () => void;
  onSyncComplete?: (succeeded: number, failed: number) => void;
  onSubmissionSynced?: (id: string) => void;
  onSubmissionFailed?: (id: string, error: string) => void;
}

/**
 * Offline queue manager for React Native
 */
export class OfflineQueue {
  private config: OfflineQueueConfig;
  private syncCallback: ((submission: QueuedSubmission) => Promise<boolean>) | null = null;
  private syncInProgress = false;
  private isConnected = true;
  private unsubscribeNetInfo: (() => void) | null = null;
  private appStateSubscription: { remove: () => void } | null = null;

  constructor(config: OfflineQueueConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      ...config,
    };
  }

  /**
   * Initialize the queue and set up listeners
   */
  async init(): Promise<void> {
    // Check initial network state
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected ?? true;

    // Subscribe to network changes
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleNetworkChange);

    // Subscribe to app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    // Try to sync any pending items
    if (this.isConnected) {
      this.sync();
    }
  }

  /**
   * Set the sync callback
   */
  setSyncCallback(callback: (submission: QueuedSubmission) => Promise<boolean>): void {
    this.syncCallback = callback;
  }

  /**
   * Get online status
   */
  getOnlineStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Add a submission to the queue
   */
  async enqueue(item: Omit<QueuedSubmission, 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const queuedItem: QueuedSubmission = {
      ...item,
      id,
      createdAt: Date.now(),
      retryCount: 0,
    };

    const queue = await this.getQueue();
    queue.push(queuedItem);
    await this.saveQueue(queue);

    return id;
  }

  /**
   * Get all pending submissions
   */
  async getPending(): Promise<QueuedSubmission[]> {
    return this.getQueue();
  }

  /**
   * Get count of pending submissions
   */
  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Remove a submission from the queue
   */
  async remove(id: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter(item => item.id !== id);
    await this.saveQueue(filtered);
  }

  /**
   * Update a submission in the queue
   */
  async update(item: QueuedSubmission): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(q => q.id === item.id);
    if (index !== -1) {
      queue[index] = item;
      await this.saveQueue(queue);
    }
  }

  /**
   * Sync all pending submissions
   */
  async sync(): Promise<{ succeeded: number; failed: number }> {
    if (!this.isConnected || this.syncInProgress || !this.syncCallback) {
      return { succeeded: 0, failed: 0 };
    }

    this.syncInProgress = true;
    this.config.onSyncStart?.();

    let succeeded = 0;
    let failed = 0;

    try {
      const pending = await this.getPending();

      for (const item of pending) {
        // Skip items that exceeded max retries
        if (item.retryCount >= (this.config.maxRetries || 3)) {
          this.config.onSubmissionFailed?.(item.id, 'Max retries exceeded');
          await this.remove(item.id);
          failed++;
          continue;
        }

        try {
          const success = await this.syncCallback(item);

          if (success) {
            await this.remove(item.id);
            this.config.onSubmissionSynced?.(item.id);
            succeeded++;
          } else {
            item.retryCount++;
            await this.update(item);
            failed++;
          }
        } catch (error) {
          item.retryCount++;
          await this.update(item);
          this.config.onSubmissionFailed?.(
            item.id,
            error instanceof Error ? error.message : 'Unknown error'
          );
          failed++;
        }

        // Small delay between submissions
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.syncInProgress = false;
      this.config.onSyncComplete?.(succeeded, failed);
    }

    return { succeeded, failed };
  }

  /**
   * Clear all pending submissions
   */
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Clean up listeners
   */
  destroy(): void {
    this.unsubscribeNetInfo?.();
    this.appStateSubscription?.remove();
  }

  // Private methods

  private async getQueue(): Promise<QueuedSubmission[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async saveQueue(queue: QueuedSubmission[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }

  private handleNetworkChange = (state: NetInfoState): void => {
    const wasOffline = !this.isConnected;
    this.isConnected = state.isConnected ?? false;

    // If we just came back online, try to sync
    if (wasOffline && this.isConnected) {
      setTimeout(() => this.sync(), 2000);
    }
  };

  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    // When app comes to foreground, try to sync
    if (nextAppState === 'active' && this.isConnected) {
      this.sync();
    }
  };
}

/**
 * Check if offline storage is available
 */
export function isOfflineStorageSupported(): boolean {
  return true; // AsyncStorage is always available in React Native
}

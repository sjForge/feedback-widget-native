/**
 * Context collector for React Native
 * Captures device and app information
 */

import { Platform, Dimensions } from 'react-native';
import type { FeedbackContext, WidgetConfig } from '../types';

/**
 * Try to import optional dependencies
 */
let ExpoDevice: typeof import('expo-device') | null = null;
try {
  ExpoDevice = require('expo-device');
} catch {
  // expo-device not available
}

/**
 * Context collector for React Native apps
 */
export class ContextCollector {
  private customContext: Record<string, unknown> = {};
  private config: WidgetConfig;

  constructor(config: WidgetConfig) {
    this.config = config;
    this.customContext = config.customContext || {};
  }

  /**
   * Set custom context
   */
  setCustomContext(context: Record<string, unknown>): void {
    this.customContext = { ...this.customContext, ...context };
  }

  /**
   * Get current context snapshot
   */
  async getContext(): Promise<FeedbackContext> {
    const { width, height, scale } = Dimensions.get('window');

    const context: FeedbackContext = {
      // OS info
      os_name: Platform.OS,
      os_version: Platform.Version?.toString(),

      // Screen info
      screen_width: width,
      screen_height: height,
      screen_scale: scale,

      // Locale and timezone
      locale: this.getLocale(),
      timezone: this.getTimezone(),

      // Custom context
      custom: { ...this.customContext },
    };

    // Add device info if expo-device is available
    if (ExpoDevice) {
      context.device_brand = ExpoDevice.brand || undefined;
      context.device_model = ExpoDevice.modelName || undefined;
      context.device_type = this.getDeviceType(ExpoDevice.deviceType);
      context.is_device = ExpoDevice.isDevice;
      context.is_tablet = this.isTablet();
    }

    // Add platform-specific info
    if (Platform.OS === 'ios') {
      context.os_version = Platform.Version?.toString();
    } else if (Platform.OS === 'android') {
      // Android API level
      context.os_version = `API ${Platform.Version}`;
    }

    return context;
  }

  private getLocale(): string {
    try {
      // Try to get locale from Intl
      return Intl.DateTimeFormat().resolvedOptions().locale;
    } catch {
      return 'en-US';
    }
  }

  private getTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  }

  private getDeviceType(type: number | null | undefined): string | undefined {
    if (type === null || type === undefined) return undefined;

    // expo-device DeviceType enum
    switch (type) {
      case 0: return 'unknown';
      case 1: return 'phone';
      case 2: return 'tablet';
      case 3: return 'desktop';
      case 4: return 'tv';
      default: return 'unknown';
    }
  }

  private isTablet(): boolean {
    const { width, height } = Dimensions.get('window');
    const aspectRatio = width / height;
    const isLargeScreen = Math.max(width, height) >= 768;

    // Tablets typically have aspect ratio closer to 4:3
    // Phones typically have aspect ratio closer to 16:9
    return isLargeScreen && aspectRatio < 1.6 && aspectRatio > 0.625;
  }
}

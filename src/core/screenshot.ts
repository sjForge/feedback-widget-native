/**
 * Screenshot capture utility for React Native
 * Uses react-native-view-shot
 */

import type { ScreenshotResult } from '../types';

/**
 * Try to import react-native-view-shot
 */
let ViewShot: typeof import('react-native-view-shot') | null = null;
try {
  ViewShot = require('react-native-view-shot');
} catch {
  // react-native-view-shot not available
}

/**
 * Check if screenshot capture is available
 */
export function isScreenshotSupported(): boolean {
  return ViewShot !== null;
}

/**
 * Capture a screenshot of the current screen
 * Requires a ref to be passed from a ViewShot wrapper component
 */
export async function captureScreenshot(
  viewRef: React.RefObject<unknown>
): Promise<ScreenshotResult | null> {
  if (!ViewShot || !viewRef.current) {
    return null;
  }

  try {
    // Cast to the ViewShot ref type
    const viewShotRef = viewRef.current as {
      capture?: () => Promise<string>;
    };

    if (!viewShotRef.capture) {
      console.warn('FeedbackWidget: ViewShot ref does not have capture method');
      return null;
    }

    const uri = await viewShotRef.capture();

    // We can't easily get dimensions from the URI alone
    // The component using this should track its own dimensions
    return {
      uri,
      width: 0, // Will be set by the wrapper component
      height: 0,
    };
  } catch (error) {
    console.warn('FeedbackWidget: Screenshot capture failed:', error);
    return null;
  }
}

/**
 * Get the ViewShot component for wrapping the app
 * Returns null if react-native-view-shot is not installed
 */
export function getViewShotComponent(): React.ComponentType<{
  ref?: React.Ref<unknown>;
  options?: {
    format?: 'jpg' | 'png' | 'webm';
    quality?: number;
  };
  children?: React.ReactNode;
}> | null {
  if (!ViewShot) {
    return null;
  }
  return ViewShot.default;
}

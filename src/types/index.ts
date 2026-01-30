/**
 * React Native Feedback Widget Types
 */

export type FeedbackType = 'bug' | 'feature' | 'design';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Widget configuration for React Native
 */
export interface WidgetConfig {
  /** Project ID from feedback portal */
  projectId: string;

  /** API key for authentication */
  apiKey: string;

  /** API endpoint URL (defaults to https://feedback.sjforge.dev/api/widget) */
  apiUrl?: string;

  /** User information */
  user?: {
    name?: string;
    email?: string;
  };

  /** Custom context to include with submissions */
  customContext?: Record<string, unknown>;

  /** Feature flags */
  features?: {
    /** Enable screenshot capture (requires react-native-view-shot) */
    screenshots?: boolean;
  };

  /** Callbacks */
  onSubmitStart?: () => void;
  onSubmitSuccess?: (feedbackId: string) => void;
  onSubmitError?: (error: Error) => void;
}

/**
 * Feedback submission payload
 */
export interface FeedbackSubmission {
  type: FeedbackType;
  priority: FeedbackPriority;
  title: string;
  description: string;
  submitter_name?: string;
  submitter_email?: string;
  widget_version?: string;
  context?: FeedbackContext;
}

/**
 * Auto-captured context for React Native
 */
export interface FeedbackContext {
  // Device info
  device_brand?: string;
  device_model?: string;
  device_type?: string;
  is_device?: boolean;

  // OS info
  os_name?: string;
  os_version?: string;

  // App info
  app_version?: string;
  app_build?: string;
  bundle_id?: string;

  // Screen info
  screen_width?: number;
  screen_height?: number;
  screen_scale?: number;

  // Other
  locale?: string;
  timezone?: string;
  is_tablet?: boolean;

  // Custom context
  custom?: Record<string, unknown>;
}

/**
 * API response for feedback submission
 */
export interface SubmissionResponse {
  success: boolean;
  feedback_id?: string;
  error?: string;
}

/**
 * Screenshot capture result
 */
export interface ScreenshotResult {
  uri: string;
  width: number;
  height: number;
}

/**
 * Props for the FeedbackForm component
 */
export interface FeedbackFormProps {
  /** Whether the form is visible */
  visible: boolean;

  /** Called when form is closed */
  onClose: () => void;

  /** Pre-captured screenshot URI */
  screenshotUri?: string;

  /** Primary color for UI elements */
  primaryColor?: string;

  /** Title for the form modal */
  title?: string;

  /** Placeholder text for description field */
  descriptionPlaceholder?: string;
}

/**
 * Props for the FeedbackButton component
 */
export interface FeedbackButtonProps {
  /** Button position */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  /** Primary color */
  primaryColor?: string;

  /** Button text */
  text?: string;

  /** Whether to show the button */
  visible?: boolean;

  /** Custom style overrides */
  style?: object;
}

/**
 * Queued submission for offline storage
 */
export interface QueuedSubmission {
  id: string;
  submission: FeedbackSubmission;
  screenshotUri?: string;
  createdAt: number;
  retryCount: number;
}

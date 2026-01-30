/**
 * @sjforge/feedback-widget-native
 *
 * React Native SDK for the SJForge Feedback Portal
 *
 * @example
 * ```typescript
 * import { FeedbackWidget, FeedbackButton, FeedbackForm } from '@sjforge/feedback-widget-native';
 *
 * // Initialize in your App.tsx
 * FeedbackWidget.init({
 *   projectId: 'my-app',
 *   apiKey: 'fpk_xxx',
 * });
 *
 * // Add the button and form to your app
 * function App() {
 *   const [showForm, setShowForm] = useState(false);
 *
 *   return (
 *     <View style={{ flex: 1 }}>
 *       <YourAppContent />
 *       <FeedbackButton onPress={() => setShowForm(true)} />
 *       <FeedbackForm
 *         visible={showForm}
 *         onClose={() => setShowForm(false)}
 *       />
 *     </View>
 *   );
 * }
 * ```
 */

// Core
export { FeedbackWidget } from './core/widget';
export { FeedbackTransport } from './core/transport';
export { ContextCollector } from './core/context';
export { OfflineQueue, isOfflineStorageSupported } from './core/offline-queue';
export {
  captureScreenshot,
  isScreenshotSupported,
  getViewShotComponent,
} from './core/screenshot';

// Components
export { FeedbackButton } from './components/FeedbackButton';
export { FeedbackForm } from './components/FeedbackForm';

// Types
export type {
  FeedbackType,
  FeedbackPriority,
  WidgetConfig,
  FeedbackSubmission,
  FeedbackContext,
  SubmissionResponse,
  ScreenshotResult,
  FeedbackFormProps,
  FeedbackButtonProps,
  QueuedSubmission,
} from './types';

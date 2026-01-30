# @sjforge/feedback-widget-native

React Native SDK for the SJForge Feedback Portal. Enables in-app feedback collection with screenshots, automatic context capture, and offline support.

## Installation

```bash
npm install @sjforge/feedback-widget-native

# Required peer dependencies
npx expo install @react-native-async-storage/async-storage @react-native-community/netinfo

# Optional - for screenshot support
npx expo install react-native-view-shot

# Optional - for enhanced device info
npx expo install expo-device
```

## Quick Start

```tsx
import { FeedbackWidget, FeedbackButton, FeedbackForm } from '@sjforge/feedback-widget-native';
import { useState } from 'react';
import { View } from 'react-native';

// Initialize once (e.g., in App.tsx before rendering)
FeedbackWidget.init({
  projectId: 'my-app',
  apiKey: 'fpk_xxx', // Get from feedback portal admin
});

function App() {
  const [showForm, setShowForm] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {/* Your app content */}
      <YourAppContent />

      {/* Floating feedback button */}
      <FeedbackButton onPress={() => setShowForm(true)} />

      {/* Feedback form modal */}
      <FeedbackForm
        visible={showForm}
        onClose={() => setShowForm(false)}
      />
    </View>
  );
}
```

## Configuration

```tsx
FeedbackWidget.init({
  // Required
  projectId: 'my-app',
  apiKey: 'fpk_xxx',

  // Optional
  apiUrl: 'https://feedback.sjforge.dev/api/widget', // Custom API URL
  user: {
    name: 'John Doe',
    email: 'john@example.com',
  },
  customContext: {
    appVersion: '1.2.3',
    userId: 'user-123',
  },

  // Callbacks
  onSubmitStart: () => console.log('Submitting...'),
  onSubmitSuccess: (feedbackId) => console.log('Submitted:', feedbackId),
  onSubmitError: (error) => console.error('Failed:', error),
});
```

## Components

### FeedbackButton

Floating button to trigger the feedback form.

```tsx
<FeedbackButton
  position="bottom-right" // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  primaryColor="#007AFF"
  text="Feedback"
  visible={true}
  onPress={() => setShowForm(true)}
/>
```

### FeedbackForm

Modal form for submitting feedback.

```tsx
<FeedbackForm
  visible={showForm}
  onClose={() => setShowForm(false)}
  screenshotUri={screenshotUri} // Optional pre-captured screenshot
  primaryColor="#007AFF"
  title="Submit Feedback"
  descriptionPlaceholder="Describe your feedback..."
/>
```

## Programmatic Submission

```tsx
const response = await FeedbackWidget.submit({
  type: 'bug', // 'bug' | 'feature' | 'design'
  priority: 'high', // 'low' | 'medium' | 'high' | 'critical'
  title: 'App crashes on launch',
  description: 'The app crashes when I open it',
  screenshotUri: 'file://...', // Optional
});

if (response.success) {
  console.log('Feedback ID:', response.feedback_id);
} else {
  console.error('Error:', response.error);
}
```

## Offline Support

Feedback is automatically queued when offline and synced when connectivity returns.

```tsx
// Check online status
const isOnline = FeedbackWidget.isOnline();

// Get pending count
const pending = await FeedbackWidget.getPendingCount();

// Force sync
const { succeeded, failed } = await FeedbackWidget.syncOffline();
```

## Context

The widget automatically captures:
- Device info (brand, model, type)
- OS info (name, version)
- Screen info (width, height, scale)
- Locale and timezone
- Custom context you provide

```tsx
// Add custom context at any time
FeedbackWidget.setContext({
  currentScreen: 'HomeScreen',
  userId: 'user-123',
});

// Get current context (for debugging)
const context = await FeedbackWidget.getContext();
```

## Screenshots

If `react-native-view-shot` is installed, you can capture screenshots:

```tsx
import { captureScreenshot, isScreenshotSupported } from '@sjforge/feedback-widget-native';

if (isScreenshotSupported()) {
  const result = await captureScreenshot(viewRef);
  if (result) {
    setScreenshotUri(result.uri);
  }
}
```

## Cleanup

```tsx
// When your app unmounts
FeedbackWidget.destroy();
```

## Compatibility

- React Native >= 0.70.0
- Expo SDK >= 47
- iOS 13+
- Android API 21+

## License

MIT

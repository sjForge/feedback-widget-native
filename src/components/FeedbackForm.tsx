/**
 * Feedback form modal for React Native
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from 'react-native';
import { FeedbackWidget } from '../core/widget';
import type {
  FeedbackFormProps,
  FeedbackType,
  FeedbackPriority,
} from '../types';

const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: string }[] = [
  { value: 'bug', label: 'Bug', icon: '🐛' },
  { value: 'feature', label: 'Feature', icon: '💡' },
  { value: 'design', label: 'Design', icon: '🎨' },
];

const PRIORITIES: { value: FeedbackPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#8E8E93' },
  { value: 'medium', label: 'Medium', color: '#FF9500' },
  { value: 'high', label: 'High', color: '#FF3B30' },
  { value: 'critical', label: 'Critical', color: '#AF52DE' },
];

/**
 * Feedback form modal component
 */
export function FeedbackForm({
  visible,
  onClose,
  screenshotUri,
  primaryColor = '#007AFF',
  title = 'Submit Feedback',
  descriptionPlaceholder = 'Describe your feedback in detail...',
}: FeedbackFormProps) {
  const [type, setType] = useState<FeedbackType>('bug');
  const [priority, setPriority] = useState<FeedbackPriority>('medium');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setType('bug');
    setPriority('medium');
    setFeedbackTitle('');
    setDescription('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!feedbackTitle.trim()) {
      setError('Please enter a title');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await FeedbackWidget.submit({
        type,
        priority,
        title: feedbackTitle.trim(),
        description: description.trim(),
        screenshotUri,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(response.error || 'Failed to submit feedback');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitButton, { backgroundColor: primaryColor }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Success Message */}
            {success && (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successText}>Feedback submitted!</Text>
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Screenshot Preview */}
            {screenshotUri && (
              <View style={styles.screenshotContainer}>
                <Text style={styles.label}>Screenshot</Text>
                <Image
                  source={{ uri: screenshotUri }}
                  style={styles.screenshot}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Feedback Type */}
            <View style={styles.section}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeContainer}>
                {FEEDBACK_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.typeButton,
                      type === t.value && {
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                      },
                    ]}
                    onPress={() => setType(t.value)}
                  >
                    <Text style={styles.typeIcon}>{t.icon}</Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        type === t.value && styles.typeLabelSelected,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority */}
            <View style={styles.section}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityContainer}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.priorityButton,
                      priority === p.value && {
                        backgroundColor: p.color,
                        borderColor: p.color,
                      },
                    ]}
                    onPress={() => setPriority(p.value)}
                  >
                    <Text
                      style={[
                        styles.priorityLabel,
                        priority === p.value && styles.priorityLabelSelected,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Title */}
            <View style={styles.section}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={feedbackTitle}
                onChangeText={setFeedbackTitle}
                placeholder="Brief summary of your feedback"
                placeholderTextColor="#8E8E93"
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder={descriptionPlaceholder}
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Offline indicator */}
            {!FeedbackWidget.isOnline() && (
              <View style={styles.offlineContainer}>
                <Text style={styles.offlineText}>
                  📴 You're offline. Feedback will be submitted when you're back
                  online.
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 17,
    color: '#007AFF',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 70,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  successIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  screenshotContainer: {
    gap: 8,
  },
  screenshot: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    gap: 6,
  },
  typeIcon: {
    fontSize: 18,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  typeLabelSelected: {
    color: '#FFFFFF',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  priorityLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
  },
  priorityLabelSelected: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  offlineContainer: {
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
});

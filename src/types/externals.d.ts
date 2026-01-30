/**
 * Type declarations for external peer dependencies
 * These allow DTS generation without requiring the packages installed
 */

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
  export default AsyncStorage;
}

declare module '@react-native-community/netinfo' {
  export interface NetInfoState {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
  }

  const NetInfo: {
    fetch(): Promise<NetInfoState>;
    addEventListener(callback: (state: NetInfoState) => void): () => void;
  };
  export default NetInfo;
}

declare module 'react-native-view-shot' {
  import { Component, RefObject } from 'react';
  import { View } from 'react-native';

  export interface CaptureOptions {
    format?: 'jpg' | 'png' | 'webm';
    quality?: number;
    result?: 'tmpfile' | 'base64' | 'data-uri' | 'zip-base64';
    snapshotContentContainer?: boolean;
  }

  export function captureRef(
    ref: RefObject<View> | View | number,
    options?: CaptureOptions
  ): Promise<string>;

  export function captureScreen(options?: CaptureOptions): Promise<string>;

  export default class ViewShot extends Component<{
    children?: React.ReactNode;
    options?: CaptureOptions;
    captureMode?: 'mount' | 'continuous' | 'update' | 'none';
    onCapture?: (uri: string) => void;
    onCaptureFailure?: (error: Error) => void;
  }> {}
}

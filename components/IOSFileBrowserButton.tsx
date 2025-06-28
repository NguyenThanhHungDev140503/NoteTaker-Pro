import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  FolderOpen,
  FileText,
  TriangleAlert as AlertTriangle,
  MapPin,
  Info,
  FolderTree,
} from 'lucide-react-native';
import { iosFileBrowserService } from '@/services/iOSFileBrowserService';

interface IOSFileBrowserButtonProps {
  onFilesSelected?: (files: { uri: string; name: string }[]) => void;
  onImportComplete?: (result: { imported: number; errors: string[] }) => void;
  style?: any;
}

export function IOSFileBrowserButton({
  onFilesSelected,
  onImportComplete,
  style,
}: IOSFileBrowserButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);

  const isIOS = Platform.OS === 'ios';
  const isIOS16Plus = isIOS && parseInt(Platform.Version as string, 10) >= 16;

  const handleShowCurrentLocation = async () => {
    if (!isIOS) {
      Alert.alert(
        'iOS Required',
        'This feature is specifically designed for iOS devices.',
        [{ text: 'OK' }],
      );
      return;
    }

    try {
      setIsLoading(true);
      await iosFileBrowserService.showCurrentStorageInfo();
    } catch (error) {
      console.error('Error showing storage info:', error);
      Alert.alert('Error', 'Failed to get storage information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowDirectoryListing = async () => {
    if (!isIOS) return;

    try {
      setIsLoading(true);
      const listing =
        await iosFileBrowserService.createCurrentDirectoryListing();

      Alert.alert('Current Notes Directory', listing, [
        { text: 'Close' },
        {
          text: 'Browse Files',
          onPress: () => handleBrowseFiles(),
        },
      ]);
    } catch (error) {
      console.error('Error creating directory listing:', error);
      Alert.alert('Error', 'Failed to create directory listing.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowseFiles = async () => {
    if (!isIOS) {
      Alert.alert(
        'iOS Required',
        'This file browser feature is specifically designed for iOS devices.',
        [{ text: 'OK' }],
      );
      return;
    }

    try {
      setIsLoading(true);

      // Use enhanced browse method with better UX
      const result = await iosFileBrowserService.browseNotesDirectoryEnhanced();

      if (!result.success) {
        if (result.error && !result.error.includes('cancelled')) {
          Alert.alert('Error', result.error);
        }
        return;
      }

      if (result.files.length === 0) {
        Alert.alert(
          'No Files Selected',
          'No supported note files were selected. Please select .json, .txt, or .md files.',
          [
            { text: 'OK' },
            {
              text: 'Show Location Info',
              onPress: () => handleShowCurrentLocation(),
            },
          ],
        );
        return;
      }

      // Notify parent component of selected files
      onFilesSelected?.(result.files);

      // Ask user if they want to import the files
      Alert.alert(
        'Import Notes',
        `Found ${result.files.length} note file(s). Would you like to import them into your current notes collection?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: () => handleImportFiles(result.files),
          },
        ],
      );
    } catch (error) {
      console.error('File browser error:', error);
      Alert.alert('Error', 'Failed to open file browser. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFiles = async (files: { uri: string; name: string }[]) => {
    try {
      setIsLoading(true);

      const importResult =
        await iosFileBrowserService.importNotesFromFiles(files);
      setLastResult(importResult);

      // Show detailed import results
      const message =
        importResult.imported > 0
          ? `Successfully imported ${importResult.imported} note(s)!${
              importResult.errors.length > 0
                ? `\n\n⚠️ ${importResult.errors.length} error(s) occurred:\n${importResult.errors.slice(0, 3).join('\n')}${
                    importResult.errors.length > 3 ? '\n...' : ''
                  }`
                : ''
            }`
          : importResult.errors.length > 0
            ? `No notes were imported due to errors:\n${importResult.errors.slice(0, 5).join('\n')}`
            : 'No notes were imported.';

      Alert.alert('Import Complete', message);

      // Notify parent component
      onImportComplete?.(importResult);
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Error', 'Failed to import notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonTitle = () => {
    if (isIOS16Plus) {
      return 'Browse Notes Directory';
    } else if (isIOS) {
      return 'Browse Files';
    } else {
      return 'Browse Files (iOS Only)';
    }
  };

  const getButtonSubtitle = () => {
    if (isIOS16Plus) {
      return 'Enhanced iOS 16+ file browser with location guidance';
    } else if (isIOS) {
      return 'Select note files from your device storage';
    } else {
      return 'Feature available on iOS devices only';
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Main Browse Button */}
      <TouchableOpacity
        style={[styles.mainButton, !isIOS && styles.disabledButton]}
        onPress={handleBrowseFiles}
        disabled={!isIOS || isLoading}
        activeOpacity={0.7}
      >
        <View style={styles.buttonContent}>
          <View style={styles.iconContainer}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : !isIOS ? (
              <AlertTriangle size={24} color="#9CA3AF" />
            ) : (
              <FolderOpen size={24} color="#007AFF" />
            )}
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, !isIOS && styles.disabledText]}>
              {getButtonTitle()}
            </Text>
            <Text style={[styles.subtitle, !isIOS && styles.disabledText]}>
              {getButtonSubtitle()}
            </Text>

            {/* iOS 16+ Features Badge */}
            {isIOS16Plus && (
              <View style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>iOS 16+ Enhanced</Text>
              </View>
            )}

            {/* Last import result */}
            {lastResult && (
              <View style={styles.resultContainer}>
                <FileText size={14} color="#34C759" />
                <Text style={styles.resultText}>
                  Last import: {lastResult.imported} notes
                  {lastResult.errors.length > 0 &&
                    ` (${lastResult.errors.length} errors)`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Secondary Action Buttons */}
      {isIOS && (
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleShowCurrentLocation}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <MapPin size={16} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>
              Show Current Location
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleShowDirectoryListing}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <FolderTree size={16} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>List Directory</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Information Panel */}
      <View style={styles.infoPanel}>
        <Info size={16} color="#6B7280" />
        <Text style={styles.infoText}>
          {isIOS
            ? 'This will guide you to your current notes storage location and help you select files to import.'
            : 'This feature requires an iOS device to access the Files app.'}
        </Text>
      </View>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            {isLoading ? 'Accessing file system...' : 'Processing...'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mainButton: {
    backgroundColor: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  featureBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#B3E5FC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
  featureBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  resultText: {
    fontSize: 12,
    color: '#15803D',
    marginLeft: 4,
  },
  secondaryActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 6,
    fontWeight: '500',
  },
  infoPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});

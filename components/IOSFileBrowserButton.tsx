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
import { FolderOpen, FileText, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { iOSFileBrowserService } from '@/services/iOSFileBrowserService';

interface IOSFileBrowserButtonProps {
  onFilesSelected?: (files: Array<{ uri: string; name: string }>) => void;
  onImportComplete?: (result: { imported: number; errors: string[] }) => void;
  style?: any;
}

export function IOSFileBrowserButton({ 
  onFilesSelected, 
  onImportComplete,
  style 
}: IOSFileBrowserButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const isIOS = Platform.OS === 'ios';
  const isIOS16Plus = isIOS && parseInt(Platform.Version as string, 10) >= 16;

  const handleBrowseFiles = async () => {
    if (!isIOS) {
      Alert.alert(
        'iOS Required',
        'This file browser feature is specifically designed for iOS devices.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsLoading(true);

      // Open iOS file browser
      const result = await iOSFileBrowserService.browseNotesDirectory();

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to browse files');
        return;
      }

      if (result.files.length === 0) {
        Alert.alert('No Files', 'No supported note files were selected.');
        return;
      }

      // Notify parent component of selected files
      onFilesSelected?.(result.files);

      // Ask user if they want to import the files
      Alert.alert(
        'Import Notes',
        `Found ${result.files.length} note file(s). Would you like to import them?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: () => handleImportFiles(result.files)
          }
        ]
      );

    } catch (error) {
      console.error('File browser error:', error);
      Alert.alert('Error', 'Failed to open file browser. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFiles = async (files: Array<{ uri: string; name: string }>) => {
    try {
      setIsLoading(true);

      const importResult = await iOSFileBrowserService.importNotesFromFiles(files);
      setLastResult(importResult);

      // Show import results
      const message = importResult.imported > 0
        ? `Successfully imported ${importResult.imported} note(s).${
            importResult.errors.length > 0 
              ? `\n\n${importResult.errors.length} error(s) occurred.` 
              : ''
          }`
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
      return 'Browse Notes Directory (iOS 16+)';
    } else if (isIOS) {
      return 'Browse Files';
    } else {
      return 'Browse Files (iOS Only)';
    }
  };

  const getButtonSubtitle = () => {
    if (isIOS16Plus) {
      return 'Enhanced file browser with direct directory access';
    } else if (isIOS) {
      return 'Select note files from your device';
    } else {
      return 'Feature available on iOS devices only';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, !isIOS && styles.disabledContainer, style]}
      onPress={handleBrowseFiles}
      disabled={!isIOS || isLoading}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
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
              <Text style={styles.featureBadgeText}>iOS 16 Enhanced</Text>
            </View>
          )}

          {/* Last import result */}
          {lastResult && (
            <View style={styles.resultContainer}>
              <FileText size={14} color="#34C759" />
              <Text style={styles.resultText}>
                Last import: {lastResult.imported} notes
                {lastResult.errors.length > 0 && ` (${lastResult.errors.length} errors)`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Opening file browser...</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  disabledContainer: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  content: {
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
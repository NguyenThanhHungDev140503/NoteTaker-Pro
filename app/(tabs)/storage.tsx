import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HardDrive, Folder, Smartphone, Cloud, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, RefreshCw, FolderOpen, Info } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { storageLocationService } from '@/services/storageLocationService';
import { useStorageInfo } from '@/hooks/useStorageInfo';

interface StorageOption {
  id: string;
  name: string;
  path: string;
  type: 'internal' | 'external' | 'cloud' | 'custom';
  available: boolean;
  freeSpace?: string;
  totalSpace?: string;
  icon: any;
  description: string;
}

export default function StorageScreen() {
  const [storageOptions, setStorageOptions] = useState<StorageOption[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  
  const { storageInfo, refreshStorageInfo, loading: storageInfoLoading } = useStorageInfo();

  useEffect(() => {
    loadStorageOptions();
    loadCurrentLocation();
  }, []);

  const loadStorageOptions = async () => {
    try {
      setLoading(true);
      const options = await getAvailableStorageOptions();
      setStorageOptions(options);
    } catch (error) {
      console.error('Failed to load storage options:', error);
      Alert.alert('Error', 'Failed to load storage options');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentLocation = async () => {
    try {
      const location = await storageLocationService.getCurrentStorageLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.error('Failed to load current location:', error);
    }
  };

  const getAvailableStorageOptions = async (): Promise<StorageOption[]> => {
    const options: StorageOption[] = [];

    // Default internal storage
    options.push({
      id: 'internal',
      name: 'Internal Storage',
      path: FileSystem.documentDirectory || '',
      type: 'internal',
      available: true,
      icon: Smartphone,
      description: 'Default secure storage within the app',
    });

    // Document directory (if different from internal)
    if (FileSystem.documentDirectory && FileSystem.cacheDirectory) {
      options.push({
        id: 'documents',
        name: 'Documents Folder',
        path: FileSystem.documentDirectory,
        type: 'internal',
        available: true,
        icon: Folder,
        description: 'App documents directory',
      });
    }

    // Platform-specific options
    if (Platform.OS === 'android') {
      // Android external storage (if available)
      try {
        const externalDir = FileSystem.StorageAccessFramework;
        if (externalDir) {
          options.push({
            id: 'external',
            name: 'External Storage',
            path: 'external',
            type: 'external',
            available: true,
            icon: HardDrive,
            description: 'External SD card or USB storage',
          });
        }
      } catch (error) {
        console.warn('External storage not available');
      }
    }

    // Add storage space information
    for (const option of options) {
      if (option.path && option.path !== 'external') {
        try {
          const info = await FileSystem.getInfoAsync(option.path);
          if (info.exists) {
            // Note: FileSystem.getFreeDiskStorageAsync() is available but limited
            // This is a simplified implementation
            option.freeSpace = 'Available';
            option.totalSpace = 'N/A';
          }
        } catch (error) {
          console.warn(`Failed to get storage info for ${option.path}`);
        }
      }
    }

    return options;
  };

  const handleSelectCustomLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Web Platform Limitation', 
          'Custom storage locations are not supported on web. Please use the default internal storage.'
        );
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        
        // Validate the selected location
        const isValid = await validateStorageLocation(selectedUri);
        if (isValid) {
          await storageLocationService.setStorageLocation(selectedUri);
          setCurrentLocation(selectedUri);
          
          Alert.alert(
            'Success',
            'Storage location updated successfully. Notes will be saved to the new location.'
          );
          
          await refreshStorageInfo();
        } else {
          Alert.alert(
            'Invalid Location',
            'The selected location is not suitable for storing notes. Please choose a different location.'
          );
        }
      }
    } catch (error) {
      console.error('Failed to select custom location:', error);
      Alert.alert(
        'Error',
        'Failed to select storage location. Please try again or choose a different location.'
      );
    }
  };

  const validateStorageLocation = async (path: string): Promise<boolean> => {
    try {
      setChecking(true);
      
      // Check if the path exists and is accessible
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) {
        return false;
      }

      // Try to write a test file
      const testPath = `${path}/test-write-permission.txt`;
      await FileSystem.writeAsStringAsync(testPath, 'test', { encoding: 'utf8' });
      
      // Clean up test file
      await FileSystem.deleteAsync(testPath, { idempotent: true });
      
      return true;
    } catch (error) {
      console.error('Storage validation failed:', error);
      return false;
    } finally {
      setChecking(false);
    }
  };

  const handleSelectStorageOption = async (option: StorageOption) => {
    if (!option.available) {
      Alert.alert('Unavailable', 'This storage option is not currently available.');
      return;
    }

    try {
      if (option.type === 'external' && Platform.OS === 'android') {
        // Handle Android external storage with SAF
        Alert.alert(
          'External Storage Access',
          'This feature requires native implementation. Please use the custom location option instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Select Custom', onPress: handleSelectCustomLocation },
          ]
        );
        return;
      }

      const isValid = await validateStorageLocation(option.path);
      if (isValid) {
        await storageLocationService.setStorageLocation(option.path);
        setCurrentLocation(option.path);
        
        Alert.alert(
          'Success',
          `Storage location changed to ${option.name}. Your notes will now be saved here.`
        );
        
        await refreshStorageInfo();
      } else {
        Alert.alert(
          'Invalid Location',
          'Unable to access this storage location. Please try another option.'
        );
      }
    } catch (error) {
      console.error('Failed to set storage location:', error);
      Alert.alert('Error', 'Failed to change storage location. Please try again.');
    }
  };

  const handleResetToDefault = async () => {
    Alert.alert(
      'Reset to Default',
      'This will reset the storage location to the default internal storage. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageLocationService.resetToDefault();
              await loadCurrentLocation();
              await refreshStorageInfo();
              
              Alert.alert('Success', 'Storage location reset to default.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset storage location.');
            }
          },
        },
      ]
    );
  };

  const renderStorageOption = (option: StorageOption) => {
    const isSelected = currentLocation === option.path;
    const IconComponent = option.icon;

    return (
      <TouchableOpacity
        key={option.id}
        style={[styles.storageOption, isSelected && styles.selectedOption]}
        onPress={() => handleSelectStorageOption(option)}
        disabled={!option.available}
      >
        <View style={styles.optionLeft}>
          <View style={[styles.iconContainer, !option.available && styles.disabledIcon]}>
            <IconComponent size={24} color={isSelected ? '#007AFF' : '#6B7280'} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionName, !option.available && styles.disabledText]}>
              {option.name}
            </Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
            {option.freeSpace && (
              <Text style={styles.optionStorage}>
                Free: {option.freeSpace} {option.totalSpace && `/ ${option.totalSpace}`}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.optionRight}>
          {isSelected && (
            <CheckCircle size={20} color="#34C759" />
          )}
          {!option.available && (
            <AlertTriangle size={20} color="#FF9500" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading storage options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Storage Location</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadStorageOptions}
          disabled={checking}
        >
          <RefreshCw size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Storage Info */}
        <View style={styles.currentStorageCard}>
          <View style={styles.cardHeader}>
            <HardDrive size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>Current Storage</Text>
          </View>
          
          <Text style={styles.currentPath} numberOfLines={2}>
            {currentLocation || 'Default internal storage'}
          </Text>
          
          {storageInfo && (
            <View style={styles.storageStats}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Total Notes</Text>
                <Text style={styles.statValue}>{storageInfo.totalNotes}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Storage Used</Text>
                <Text style={styles.statValue}>{storageInfo.totalSize}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Info size={20} color="#FF9500" />
            <Text style={styles.infoTitle}>Important Information</Text>
          </View>
          <Text style={styles.infoText}>
            • Notes will be stored in the selected location{'\n'}
            • Changing location doesn't move existing notes{'\n'}
            • Ensure the selected location has sufficient space{'\n'}
            • External storage may require additional permissions
          </Text>
        </View>

        {/* Storage Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Storage Options</Text>
          
          {storageOptions.map(renderStorageOption)}
          
          {/* Custom Location Option */}
          <TouchableOpacity
            style={styles.customLocationButton}
            onPress={handleSelectCustomLocation}
            disabled={Platform.OS === 'web'}
          >
            <FolderOpen size={24} color="#007AFF" />
            <View style={styles.customLocationText}>
              <Text style={styles.customLocationTitle}>Select Custom Location</Text>
              <Text style={styles.customLocationSubtitle}>
                {Platform.OS === 'web' 
                  ? 'Not available on web platform'
                  : 'Choose any accessible folder on your device'
                }
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Reset Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetToDefault}
          >
            <Text style={styles.resetButtonText}>Reset to Default Location</Text>
          </TouchableOpacity>
        </View>

        {/* Checking Indicator */}
        {checking && (
          <View style={styles.checkingOverlay}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.checkingText}>Validating storage location...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  currentStorageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  currentPath: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  storageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoCard: {
    backgroundColor: '#FFF8DC',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  storageOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedOption: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  disabledIcon: {
    opacity: 0.5,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  optionStorage: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  optionRight: {
    marginLeft: 12,
  },
  customLocationButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  customLocationText: {
    marginLeft: 12,
    flex: 1,
  },
  customLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  customLocationSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  resetButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  checkingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  checkingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1E40AF',
  },
});
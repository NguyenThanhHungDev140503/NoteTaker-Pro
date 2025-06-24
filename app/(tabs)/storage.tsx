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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  HardDrive, 
  Folder, 
  Smartphone, 
  Cloud, 
  CircleCheck as CheckCircle, 
  TriangleAlert as AlertTriangle, 
  RefreshCw, 
  FolderOpen, 
  Info,
  Zap,
  Shield,
  Wifi
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { storageLocationService } from '@/services/storageLocationService';
import { iOSStorageServiceInstance as iOSStorageService } from '@/services/iOSStorageService';
import { IOSFileBrowserButton } from '@/components/IOSFileBrowserButton';
import { useStorageInfo } from '@/hooks/useStorageInfo';

interface StorageOption {
  id: string;
  name: string;
  path: string;
  type: 'internal' | 'external' | 'cloud' | 'custom' | 'ios_specific';
  available: boolean;
  freeSpace?: string;
  totalSpace?: string;
  icon: any;
  description: string;
  iosFeatures?: {
    iCloudSync?: boolean;
    securityScoped?: boolean;
    backgroundSync?: boolean;
    batteryOptimized?: boolean;
  };
}

export default function StorageScreen() {
  const [storageOptions, setStorageOptions] = useState<StorageOption[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [iosOptimizations, setIosOptimizations] = useState(false);
  
  const { storageInfo, refreshStorageInfo, loading: storageInfoLoading } = useStorageInfo();

  const isIOS16Plus = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 16;

  useEffect(() => {
    loadStorageOptions();
    loadCurrentLocation();
    if (isIOS16Plus) {
      setupiOSOptimizations();
    }
  }, []);

  const setupiOSOptimizations = async () => {
    try {
      await iOSStorageService.optimizeForBattery();
      await iOSStorageService.setupiOSBackgroundSync();
      setIosOptimizations(true);
    } catch (error) {
      console.warn('iOS optimizations setup failed:', error);
    }
  };

  const loadStorageOptions = async () => {
    try {
      setLoading(true);
      let options = await getAvailableStorageOptions();
      
      // Add iOS-specific options if on iOS 16+
      if (isIOS16Plus) {
        const iosOptions = await iOSStorageService.getiOSSpecificStorageOptions();
        const convertedOptions = iosOptions.map(iosOption => ({
          id: iosOption.id,
          name: iosOption.name,
          path: iosOption.path,
          type: 'ios_specific' as const,
          available: iosOption.available,
          icon: getIconForType(iosOption.type),
          description: iosOption.description,
          iosFeatures: {
            iCloudSync: iosOption.type === 'icloud_drive',
            securityScoped: iosOption.securityScoped,
            backgroundSync: iosOption.type !== 'app_support',
            batteryOptimized: true,
          },
        }));
        options = [...options, ...convertedOptions];
      }
      
      setStorageOptions(options);
    } catch (error) {
      console.error('Failed to load storage options:', error);
      Alert.alert('Error', 'Failed to load storage options');
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type: string): any => {
    switch (type) {
      case 'app_documents': return Folder;
      case 'app_support': return Smartphone;
      case 'icloud_drive': return Cloud;
      case 'files_app': return FolderOpen;
      case 'shared_container': return Shield;
      default: return HardDrive;
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

    // Default internal storage (always available)
    options.push({
      id: 'internal',
      name: 'Internal Storage',
      path: FileSystem.documentDirectory || '',
      type: 'internal',
      available: true,
      icon: Smartphone,
      description: isIOS16Plus 
        ? 'Default secure storage with iOS 16 optimizations'
        : 'Default secure storage within the app',
      iosFeatures: isIOS16Plus ? {
        batteryOptimized: true,
        backgroundSync: true,
      } : undefined,
    });

    // iOS 16+ enhanced documents folder
    if (isIOS16Plus && FileSystem.documentDirectory) {
      try {
        const detailedInfo = await iOSStorageService.getDetailedStorageInfo(FileSystem.documentDirectory);
        if (detailedInfo) {
          options[0].freeSpace = iOSStorageService.formatBytes(detailedInfo.freeSpace);
          options[0].iosFeatures = {
            ...options[0].iosFeatures,
            iCloudSync: true,
          };
        }
      } catch (error) {
        console.warn('Failed to get iOS storage details:', error);
      }
    }

    return options;
  };

  const handleSelectiOSLocation = async (option: StorageOption) => {
    if (!isIOS16Plus) return;

    try {
      setChecking(true);

      switch (option.id) {
        case 'files_app':
          const selectedPath = await iOSStorageService.selectFilesAppLocation();
          if (selectedPath) {
            await handleLocationChange(selectedPath, option.name);
          }
          break;
        
        case 'icloud_drive':
          Alert.alert(
            'iCloud Drive',
            'This will store your notes in iCloud Drive for automatic sync across your devices. Continue?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Enable iCloud', 
                onPress: () => handleLocationChange('icloud_drive', option.name)
              },
            ]
          );
          break;
        
        default:
          await handleLocationChange(option.path, option.name);
          break;
      }
    } catch (error) {
      console.error('iOS location selection failed:', error);
      Alert.alert(
        'Error', 
        'Failed to set up iOS storage location. Please try again or contact support.'
      );
    } finally {
      setChecking(false);
    }
  };

  const handleLocationChange = async (path: string, name: string) => {
    try {
      let isValid = false;

      if (isIOS16Plus && path.includes('icloud_drive')) {
        isValid = await iOSStorageService.validateiOSStorageLocation(path, 'icloud_drive');
      } else if (isIOS16Plus && path.includes('files_app')) {
        isValid = await iOSStorageService.validateiOSStorageLocation(path, 'files_app');
      } else {
        isValid = await storageLocationService.validateStorageLocation(path);
      }

      if (isValid) {
        await storageLocationService.setStorageLocation(path);
        setCurrentLocation(path);
        
        Alert.alert(
          'Success',
          `Storage location changed to ${name}. ${isIOS16Plus ? 'iOS 16 optimizations are active.' : ''}`
        );
        
        await refreshStorageInfo();
      } else {
        Alert.alert(
          'Invalid Location',
          'Unable to access this storage location. Please check permissions and try again.'
        );
      }
    } catch (error) {
      console.error('Location change failed:', error);
      Alert.alert('Error', 'Failed to change storage location.');
    }
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

      let selectedUri: string | null = null;

      if (isIOS16Plus) {
        // Use iOS 16+ enhanced file picker
        selectedUri = await iOSStorageService.selectFilesAppLocation();
      } else {
        // Fallback to standard document picker
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          selectedUri = result.assets[0].uri;
        }
      }

      if (selectedUri) {
        await handleLocationChange(selectedUri, 'Custom Location');
      }
    } catch (error) {
      console.error('Custom location selection failed:', error);
      Alert.alert(
        'Error',
        isIOS16Plus 
          ? 'Failed to access Files app. Please ensure you have granted necessary permissions.'
          : 'Failed to select storage location. Please try again.'
      );
    }
  };

  // Function to open folder in file manager
  const openFolderInFileManager = async (folderPath: string) => {
    try {
      if (Platform.OS === 'android') {
        // Check if directory exists
        const dirInfo = await FileSystem.getInfoAsync(folderPath);
        if (!dirInfo.exists) {
          // Create directory if it doesn't exist
          await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });
        }

        try {
          // Convert file:// URI to content:// URI
          const contentUri = await FileSystem.getContentUriAsync(folderPath);
          
          // Open folder in file manager
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1,  // FLAG_GRANT_READ_URI_PERMISSION
            type: 'resource/folder'
          });
        } catch (err) {
          // Fallback to ACTION_OPEN_DOCUMENT_TREE if folder can't be opened directly
          console.log('Falling back to ACTION_OPEN_DOCUMENT_TREE');
          await IntentLauncher.startActivityAsync('android.intent.action.OPEN_DOCUMENT_TREE', {});
        }
      } else if (Platform.OS === 'ios') {
        try {
          // Try to open folder in Files app using URL scheme
          // Convert file:// path to shareddocuments://
          if (folderPath.startsWith('file://')) {
            // On iOS, try using shareddocuments:// URL scheme to open Files app
            const filesAppUrl = folderPath.replace('file://', 'shareddocuments://');
            
            // Open URL with Linking
            const canOpen = await Linking.canOpenURL(filesAppUrl);
            if (canOpen) {
              await Linking.openURL(filesAppUrl);
              return;
            }
          }
          
          // If direct opening fails, try using expo-sharing to share the folder
          const shareResult = await Sharing.isAvailableAsync();
          if (shareResult) {
            await Sharing.shareAsync(folderPath, {
              UTI: 'public.folder', // UTI for folders
              dialogTitle: 'Open in Files App'
            });
            return;
          }
          
          // If sharing is not available, show message to user
          Alert.alert(
            'iOS Limitation',
            'Cannot open folder directly. You can access your notes through the Files app manually.'
          );
        } catch (error) {
          console.error('Failed to open folder on iOS:', error);
          Alert.alert(
            'iOS Limitation',
            'Opening folder in Files app is not supported on this iOS version. You can access your notes through the Files app manually.'
          );
        }
      } else {
        Alert.alert('Not Supported', 'This feature is only supported on mobile devices.');
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
      Alert.alert(
        'Error',
        'Could not open the folder in file manager. The folder may not be accessible.'
      );
    }
  };

  const handleFilesSelected = (files: Array<{ uri: string; name: string }>) => {
    console.log('Files selected for import:', files);
  };

  const handleImportComplete = (result: { imported: number; errors: string[] }) => {
    console.log('Import completed:', result);
    // Refresh storage info to reflect new notes
    refreshStorageInfo();
  };

  const renderStorageOption = (option: StorageOption) => {
    const isSelected = currentLocation === option.path;
    const IconComponent = option.icon;
    const hasIosFeatures = option.iosFeatures && Object.keys(option.iosFeatures).length > 0;

    return (
      <TouchableOpacity
        key={option.id}
        style={[styles.storageOption, isSelected && styles.selectedOption]}
        onPress={() => {
          if (option.type === 'ios_specific') {
            handleSelectiOSLocation(option);
          } else {
            handleLocationChange(option.path, option.name);
          }
        }}
        disabled={!option.available}
      >
        <View style={styles.optionLeft}>
          <View style={[styles.iconContainer, !option.available && styles.disabledIcon]}>
            <IconComponent size={24} color={isSelected ? '#007AFF' : '#6B7280'} />
          </View>
          <View style={styles.optionInfo}>
            <View style={styles.optionHeader}>
              <Text style={[styles.optionName, !option.available && styles.disabledText]}>
                {option.name}
              </Text>
              {isIOS16Plus && hasIosFeatures && (
                <View style={styles.iosBadge}>
                  <Text style={styles.iosBadgeText}>iOS 16+</Text>
                </View>
              )}
            </View>
            <Text style={styles.optionDescription}>{option.description}</Text>
            
            {/* iOS Features */}
            {hasIosFeatures && (
              <View style={styles.iosFeatures}>
                {option.iosFeatures?.iCloudSync && (
                  <View style={styles.featureBadge}>
                    <Cloud size={12} color="#007AFF" />
                    <Text style={styles.featureText}>iCloud Sync</Text>
                  </View>
                )}
                {option.iosFeatures?.batteryOptimized && (
                  <View style={styles.featureBadge}>
                    <Zap size={12} color="#34C759" />
                    <Text style={styles.featureText}>Battery Optimized</Text>
                  </View>
                )}
                {option.iosFeatures?.securityScoped && (
                  <View style={styles.featureBadge}>
                    <Shield size={12} color="#FF9500" />
                    <Text style={styles.featureText}>Secure Access</Text>
                  </View>
                )}
              </View>
            )}
            
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
          <Text style={styles.loadingText}>
            {isIOS16Plus ? 'Loading iOS 16+ storage options...' : 'Loading storage options...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Storage Location</Text>
        <View style={styles.headerRight}>
          {isIOS16Plus && iosOptimizations && (
            <View style={styles.optimizedBadge}>
              <Zap size={16} color="#34C759" />
              <Text style={styles.optimizedText}>iOS 16 Optimized</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadStorageOptions}
            disabled={checking}
          >
            <RefreshCw size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Storage Info */}
        <View style={styles.currentStorageCard}>
          <View style={styles.cardHeader}>
            <HardDrive size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>Current Storage</Text>
            {isIOS16Plus && (
              <View style={styles.platformBadge}>
                <Text style={styles.platformBadgeText}>iOS 16+</Text>
              </View>
            )}
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
              {isIOS16Plus && (
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Sync Status</Text>
                  <View style={styles.syncStatus}>
                    <Wifi size={12} color="#34C759" />
                    <Text style={styles.syncText}>Active</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {Platform.OS === 'android' && (
            <TouchableOpacity 
              style={styles.openLocationButton}
              onPress={async () => {
                const location = await storageLocationService.getCurrentStorageLocation();
                openFolderInFileManager(location);
              }}
            >
              <FolderOpen size={16} color="#FFFFFF" />
              <Text style={styles.openLocationText}>Open in File Manager</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* iOS 16+ File Browser */}
        {isIOS16Plus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>iOS 16+ File Browser</Text>
            <IOSFileBrowserButton
              onFilesSelected={handleFilesSelected}
              onImportComplete={handleImportComplete}
            />
          </View>
        )}

        {/* iOS 16+ Information Card */}
        {isIOS16Plus && (
          <View style={styles.ios16InfoCard}>
            <View style={styles.infoHeader}>
              <Zap size={20} color="#007AFF" />
              <Text style={styles.infoTitle}>iOS 16+ Enhanced Features</Text>
            </View>
            <Text style={styles.infoText}>
              • Files app integration with security-scoped access{'\n'}
              • iCloud Drive automatic synchronization{'\n'}
              • Battery optimized background operations{'\n'}
              • Enhanced file system performance{'\n'}
              • Direct notes directory browser{'\n'}
              • Improved security and privacy controls
            </Text>
          </View>
        )}

        {/* General Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Info size={20} color="#FF9500" />
            <Text style={styles.infoTitle}>Storage Information</Text>
          </View>
          <Text style={styles.infoText}>
            • Notes will be stored in selected location{'\n'}
            • Changing location doesn't move existing notes{'\n'}
            • Ensure selected location has sufficient space{'\n'}
            {isIOS16Plus 
              ? '• iOS 16+ provides enhanced security and sync features'
              : '• External storage may require additional permissions'
            }
          </Text>
        </View>

        {/* Storage Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Available Storage Options
            {isIOS16Plus && (
              <Text style={styles.sectionSubtitle}> (iOS 16+ Enhanced)</Text>
            )}
          </Text>
          
          {storageOptions.map(renderStorageOption)}
          
          {/* Custom Location Option */}
          <TouchableOpacity
            style={styles.customLocationButton}
            onPress={handleSelectCustomLocation}
            disabled={Platform.OS === 'web'}
          >
            <FolderOpen size={24} color="#007AFF" />
            <View style={styles.customLocationText}>
              <Text style={styles.customLocationTitle}>
                {Platform.OS === 'ios' 
                  ? (isIOS16Plus ? 'Browse Files App' : 'Select Custom Location')
                  : 'Browse File Location'}
              </Text>
              <Text style={styles.customLocationSubtitle}>
                {Platform.OS === 'web' 
                  ? 'Not available on web platform'
                  : Platform.OS === 'ios'
                    ? (isIOS16Plus
                      ? 'Choose any location accessible through iOS Files app'
                      : 'Choose any accessible folder on your device')
                    : 'Open your current storage location in file manager'
                }
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Reset Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={async () => {
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
            }}
          >
            <Text style={styles.resetButtonText}>Reset to Default Location</Text>
          </TouchableOpacity>
        </View>

        {/* Checking Indicator */}
        {checking && (
          <View style={styles.checkingOverlay}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.checkingText}>
              {isIOS16Plus 
                ? 'Validating iOS storage location...' 
                : 'Validating storage location...'
              }
            </Text>
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
    textAlign: 'center',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optimizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  optimizedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
    marginLeft: 4,
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
    flex: 1,
  },
  platformBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  platformBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0284C7',
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
    marginBottom: 16,
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
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncText: {
    fontSize: 12,
    color: '#15803D',
    marginLeft: 4,
    fontWeight: '600',
  },
  ios16InfoCard: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
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
    color: '#1E40AF',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
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
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#007AFF',
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
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  iosBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  iosBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0284C7',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  iosFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
    color: '#4B5563',
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
  openLocationButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  openLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
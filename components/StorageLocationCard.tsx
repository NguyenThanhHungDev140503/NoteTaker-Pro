import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { HardDrive, Settings, ExternalLink, FolderOpen } from 'lucide-react-native';
import { router } from 'expo-router';
import { useStorageInfo } from '@/hooks/useStorageInfo';
import { storageLocationService } from '@/services/storageLocationService';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';

interface StorageLocationCardProps {
  showFullInfo?: boolean;
}

export function StorageLocationCard({ showFullInfo = false }: StorageLocationCardProps) {
  const { storageInfo, loading } = useStorageInfo();

  const handlePress = () => {
    router.push('/(tabs)/storage');
  };

  // Function to open storage folder in file manager
  const openStorageLocation = async () => {
    if (!storageInfo) return;
    
    try {
      const folderPath = storageInfo.currentLocation;
      
      if (Platform.OS === 'android') {
        // Check if directory exists
        const dirInfo = await FileSystem.getInfoAsync(folderPath);
        if (!dirInfo.exists) {
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
          // Convert file:// path to shareddocuments:// URL
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

  if (loading || !storageInfo) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <HardDrive size={20} color="#007AFF" />
          <Text style={styles.title}>Storage Location</Text>
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.header}>
        <HardDrive size={20} color="#007AFF" />
        <Text style={styles.title}>Storage Location</Text>
        <ExternalLink size={16} color="#9CA3AF" />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.locationText} numberOfLines={showFullInfo ? undefined : 1}>
          {storageInfo.currentLocation}
        </Text>
        
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{storageInfo.totalNotes}</Text>
            <Text style={styles.statLabel}>Notes</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{storageInfo.totalSize}</Text>
            <Text style={styles.statLabel}>Used</Text>
          </View>
          {showFullInfo && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>{storageInfo.freeSpace}</Text>
              <Text style={styles.statLabel}>Free</Text>
            </View>
          )}
        </View>
        
        <View style={styles.typeIndicator}>
          <Text style={styles.typeText}>
            {storageInfo.locationType.charAt(0).toUpperCase() + storageInfo.locationType.slice(1)} Storage
          </Text>
        </View>

        <TouchableOpacity style={styles.openButton} onPress={openStorageLocation}>
          <FolderOpen size={14} color="#007AFF" />
          <Text style={styles.openButtonText}>
            {Platform.OS === 'ios' ? 'Open in Files App' : 'Open in File Manager'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  content: {
    gap: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  typeIndicator: {
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '500',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  openButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});
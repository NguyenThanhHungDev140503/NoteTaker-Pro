import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { HardDrive, Settings, ExternalLink } from 'lucide-react-native';
import { router } from 'expo-router';
import { useStorageInfo } from '@/hooks/useStorageInfo';

interface StorageLocationCardProps {
  showFullInfo?: boolean;
}

export function StorageLocationCard({ showFullInfo = false }: StorageLocationCardProps) {
  const { storageInfo, loading } = useStorageInfo();

  const handlePress = () => {
    router.push('/(tabs)/storage');
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
});
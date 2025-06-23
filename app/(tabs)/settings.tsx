import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Bell,
  Shield,
  Crown,
  Download,
  Upload,
  Trash2,
  Info,
  LogOut,
  Moon,
  Sun,
  HardDrive,
} from 'lucide-react-native';
import { authService } from '@/services/authService';
import { storageService } from '@/services/storageService';
import { syncService } from '@/services/syncService';
import { getUserSubscription } from '@/services/stripeService';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { StorageLocationCard } from '@/components/StorageLocationCard';

export default function SettingsScreen() {
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSync, setAutoSync] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  useEffect(() => {
    loadUserData();
    loadSubscriptionData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadSubscriptionData = async () => {
    try {
      setIsLoadingSubscription(true);
      const subscription = await getUserSubscription();
      setUserSubscription(subscription);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
              // Navigation will be handled by auth state change
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      await storageService.exportData();
      Alert.alert('Success', 'Data exported successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleImportData = async () => {
    Alert.alert(
      'Import Data',
      'This will replace your current notes. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            try {
              await storageService.importData();
              Alert.alert('Success', 'Data imported successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to import data');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your notes and cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.clearAllData();
              Alert.alert('Success', 'All data deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete data');
            }
          },
        },
      ]
    );
  };

  const isSubscribed = userSubscription?.subscription_status === 'active';

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const SettingsRow = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    rightElement,
    destructive = false,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.rowLeft}>
        <Icon size={20} color={destructive ? '#FF3B30' : '#007AFF'} />
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, destructive && styles.destructiveText]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Account">
          <SettingsRow
            icon={User}
            title={user?.email || 'Not signed in'}
            subtitle="Manage your account"
          />
        </SettingsSection>

        {/* Storage Location Card */}
        <SettingsSection title="Storage">
          <StorageLocationCard showFullInfo />
        </SettingsSection>

        {!isLoadingSubscription && (
          <SubscriptionCard 
            userSubscription={userSubscription}
            onPurchaseComplete={loadSubscriptionData}
          />
        )}

        <SettingsSection title="Preferences">
          <SettingsRow
            icon={isDarkMode ? Moon : Sun}
            title="Dark Mode"
            subtitle="Toggle dark theme"
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: '#E5E7EB', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            }
          />

          <SettingsRow
            icon={Bell}
            title="Notifications"
            subtitle="Enable push notifications"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E5E7EB', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            }
          />

          {isSubscribed && (
            <SettingsRow
              icon={Upload}
              title="Auto Sync"
              subtitle="Automatically sync to cloud"
              rightElement={
                <Switch
                  value={autoSync}
                  onValueChange={setAutoSync}
                  trackColor={{ false: '#E5E7EB', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          )}
        </SettingsSection>

        <SettingsSection title="Data">
          <SettingsRow
            icon={Download}
            title="Export Data"
            subtitle="Download your notes"
            onPress={handleExportData}
          />

          <SettingsRow
            icon={Upload}
            title="Import Data"
            subtitle="Restore from backup"
            onPress={handleImportData}
          />

          {isSubscribed && (
            <SettingsRow
              icon={Upload}
              title="Sync Now"
              subtitle="Manual cloud synchronization"
              onPress={async () => {
                try {
                  await syncService.syncNow();
                  Alert.alert('Success', 'Sync completed');
                } catch (error) {
                  Alert.alert('Error', 'Sync failed');
                }
              }}
            />
          )}
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsRow
            icon={Info}
            title="About"
            subtitle="Version 1.0.0"
          />

          <SettingsRow
            icon={Shield}
            title="Privacy Policy"
            subtitle="Learn how we protect your data"
          />
        </SettingsSection>

        <SettingsSection title="Danger Zone">
          <SettingsRow
            icon={Trash2}
            title="Delete All Data"
            subtitle="Permanently remove all notes"
            onPress={handleDeleteAllData}
            destructive
          />

          <SettingsRow
            icon={LogOut}
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            destructive
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowText: {
    marginLeft: 12,
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  rowSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  destructiveText: {
    color: '#FF3B30',
  },
});
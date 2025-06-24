import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';

interface MediaPickerProps {
  onImagePicked: (imageUri: string) => void;
}

export function MediaPicker({ onImagePicked }: MediaPickerProps) {
  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return {
      camera: cameraPermission.status === 'granted',
      library: libraryPermission.status === 'granted',
    };
  };

  const createPersistentImageDirectory = async () => {
    const imageDir = `${FileSystem.documentDirectory}images/`;
    const dirInfo = await FileSystem.getInfoAsync(imageDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(imageDir, { intermediates: true });
    }
    return imageDir;
  };

  const moveImageToPersistentStorage = async (tempUri: string) => {
    try {
      const imageDir = await createPersistentImageDirectory();
      const fileExtension = tempUri.split('.').pop() || 'jpg';
      const fileName = `image_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const persistentUri = `${imageDir}${fileName}`;
      
      await FileSystem.copyAsync({
        from: tempUri,
        to: persistentUri
      });
      
      return persistentUri;
    } catch (error) {
      console.error('Failed to move image to persistent storage:', error);
      throw error;
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const permissions = await requestPermissions();
      if (!permissions.library) {
        Alert.alert('Permission Required', 'Please grant access to photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        try {
          // Move image file to persistent storage
          const persistentUri = await moveImageToPersistentStorage(result.assets[0].uri);
          onImagePicked(persistentUri);
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } catch (error) {
          console.error('Failed to save image to persistent storage:', error);
          Alert.alert('Error', 'Failed to save image');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const permissions = await requestPermissions();
      if (!permissions.camera) {
        Alert.alert('Permission Required', 'Please grant camera access');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        try {
          // Move image file to persistent storage
          const persistentUri = await moveImageToPersistentStorage(result.assets[0].uri);
          onImagePicked(persistentUri);
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } catch (error) {
          console.error('Failed to save image to persistent storage:', error);
          Alert.alert('Error', 'Failed to save image');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImageFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={showImagePickerOptions}>
        <ImageIcon size={20} color="#007AFF" />
        <Text style={styles.buttonText}>Add Image</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
});
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { Star, Calendar, Camera, Mic, MoveVertical as MoreVertical } from 'lucide-react-native';
import { Note } from '@/types/note';
import { noteService } from '@/services/noteService';
import { router } from 'expo-router';

interface NoteCardProps {
  note: Note;
  onUpdate: () => void;
  compact?: boolean;
}

export function NoteCard({ note, onUpdate, compact = false }: NoteCardProps) {
  const handleToggleFavorite = async () => {
    try {
      await noteService.toggleFavorite(note.id);
      onUpdate();
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await noteService.deleteNote(note.id);
              onUpdate();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const handleViewNote = () => {
    router.push({
      pathname: '/note-detail',
      params: { noteId: note.id }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compactContainer]}
      activeOpacity={0.7}
      onPress={handleViewNote}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleToggleFavorite}>
          <Star
            size={16}
            color={note.isFavorite ? '#FFD700' : '#D1D5DB'}
            fill={note.isFavorite ? '#FFD700' : 'transparent'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <MoreVertical size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title} numberOfLines={compact ? 2 : 3}>
        {note.title || 'Untitled'}
      </Text>

      <Text style={styles.content} numberOfLines={compact ? 3 : 4}>
        {truncateText(note.content, compact ? 100 : 150)}
      </Text>

      {/* Hiển thị hình ảnh preview */}
      {note.images.length > 0 && (
        <View style={styles.imagePreviewContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.imagePreviewScroll}
          >
            {note.images.slice(0, 3).map((uri, index) => (
              <Image 
                key={index} 
                source={{ uri }} 
                style={styles.imagePreview}
              />
            ))}
            {note.images.length > 3 && (
              <View style={styles.moreImagesIndicator}>
                <Text style={styles.moreImagesText}>+{note.images.length - 3}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {(note.images.length > 0 || note.audioRecordings.length > 0) && (
        <View style={styles.mediaIndicators}>
          {note.images.length > 0 && (
            <View style={styles.mediaIndicator}>
              <Camera size={12} color="#6B7280" />
              <Text style={styles.mediaCount}>{note.images.length}</Text>
            </View>
          )}
          {note.audioRecordings.length > 0 && (
            <View style={styles.mediaIndicator}>
              <Mic size={12} color="#6B7280" />
              <Text style={styles.mediaCount}>{note.audioRecordings.length}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.dateContainer}>
          <Calendar size={12} color="#9CA3AF" />
          <Text style={styles.date}>{formatDate(note.updatedAt)}</Text>
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  compactContainer: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  content: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  imagePreviewContainer: {
    marginBottom: 12,
  },
  imagePreviewScroll: {
    flexDirection: 'row',
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  moreImagesIndicator: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  mediaIndicators: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  mediaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mediaCount: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 2,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
});
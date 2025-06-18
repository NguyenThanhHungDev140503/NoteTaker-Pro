import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { NoteFilter } from '@/types/note';

interface FilterModalProps {
  visible: boolean;
  filters: NoteFilter;
  onApply: (filters: NoteFilter) => void;
  onClose: () => void;
}

export function FilterModal({ visible, filters, onApply, onClose }: FilterModalProps) {
  const [localFilters, setLocalFilters] = React.useState<NoteFilter>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const sortOptions = [
    { key: 'updatedAt', label: 'Last Modified' },
    { key: 'createdAt', label: 'Date Created' },
    { key: 'title', label: 'Title' },
  ] as const;

  const orderOptions = [
    { key: 'desc', label: 'Newest First' },
    { key: 'asc', label: 'Oldest First' },
  ] as const;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filter & Sort</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.option}
                onPress={() =>
                  setLocalFilters(prev => ({ ...prev, sortBy: option.key }))
                }
              >
                <Text style={styles.optionText}>{option.label}</Text>
                {localFilters.sortBy === option.key && (
                  <Check size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order</Text>
            {orderOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.option}
                onPress={() =>
                  setLocalFilters(prev => ({ ...prev, sortOrder: option.key }))
                }
              >
                <Text style={styles.optionText}>{option.label}</Text>
                {localFilters.sortOrder === option.key && (
                  <Check size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.switchOption}>
              <Text style={styles.optionText}>Show Favorites Only</Text>
              <Switch
                value={localFilters.showFavoritesOnly}
                onValueChange={(value) =>
                  setLocalFilters(prev => ({ ...prev, showFavoritesOnly: value }))
                }
                trackColor={{ false: '#E5E7EB', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  switchOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, X } from 'lucide-react-native';

interface ImportResultModalProps {
  visible: boolean;
  result: {
    success: boolean;
    imported: number;
    errors: string[];
  } | null;
  onClose: () => void;
}

export function ImportResultModal({ visible, result, onClose }: ImportResultModalProps) {
  if (!result) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Import Results</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Success Summary */}
          <View style={[styles.resultCard, result.success ? styles.successCard : styles.errorCard]}>
            {result.success ? (
              <CheckCircle size={24} color="#34C759" />
            ) : (
              <AlertTriangle size={24} color="#FF3B30" />
            )}
            <View style={styles.resultText}>
              <Text style={[styles.resultTitle, result.success ? styles.successText : styles.errorText]}>
                {result.success ? 'Import Successful' : 'Import Failed'}
              </Text>
              <Text style={styles.resultSubtitle}>
                {result.imported > 0 
                  ? `${result.imported} note${result.imported !== 1 ? 's' : ''} imported successfully`
                  : 'No notes were imported'
                }
              </Text>
            </View>
          </View>

          {/* Errors Section */}
          {result.errors.length > 0 && (
            <View style={styles.errorsSection}>
              <Text style={styles.errorsTitle}>
                Issues ({result.errors.length})
              </Text>
              <ScrollView style={styles.errorsList} showsVerticalScrollIndicator={false}>
                {result.errors.map((error, index) => (
                  <View key={index} style={styles.errorItem}>
                    <AlertTriangle size={16} color="#FF9500" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Import Tips</Text>
            <Text style={styles.tipText}>• Only JSON files exported from this app are supported</Text>
            <Text style={styles.tipText}>• Duplicate notes will be imported with "(Imported)" suffix</Text>
            <Text style={styles.tipText}>• Invalid notes are skipped to protect data integrity</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
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
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  successCard: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  errorCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  resultText: {
    marginLeft: 12,
    flex: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  successText: {
    color: '#15803D',
  },
  errorText: {
    color: '#DC2626',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  errorsList: {
    maxHeight: 200,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  tipsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  doneButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
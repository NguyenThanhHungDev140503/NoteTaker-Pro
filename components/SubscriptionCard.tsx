import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Crown, Check } from 'lucide-react-native';
import { stripeProducts } from '@/src/stripe-config';
import { createCheckoutSession } from '@/services/stripeService';

interface SubscriptionCardProps {
  userSubscription?: {
    subscription_status: string;
    price_id?: string;
  } | null;
  onPurchaseComplete?: () => void;
}

export function SubscriptionCard({ userSubscription, onPurchaseComplete }: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const product = stripeProducts[0]; // SuperNote Premium
  const isActive = userSubscription?.subscription_status === 'active' || 
                   userSubscription?.price_id === product.priceId;

  const handlePurchase = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await createCheckoutSession({
        priceId: product.priceId,
        mode: product.mode,
        successUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/(tabs)/settings`,
      });

      if (result.url) {
        await Linking.openURL(result.url);
        onPurchaseComplete?.();
      }
    } catch (error: any) {
      setError(error.message || 'Failed to start checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Crown size={24} color="#FFD700" />
        <Text style={styles.title}>{product.name}</Text>
        {isActive && (
          <View style={styles.activeBadge}>
            <Check size={16} color="#FFFFFF" />
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        )}
      </View>

      <Text style={styles.description}>{product.description}</Text>

      <View style={styles.features}>
        <View style={styles.feature}>
          <Check size={16} color="#34C759" />
          <Text style={styles.featureText}>Cloud synchronization</Text>
        </View>
        <View style={styles.feature}>
          <Check size={16} color="#34C759" />
          <Text style={styles.featureText}>Automatic backup</Text>
        </View>
        <View style={styles.feature}>
          <Check size={16} color="#34C759" />
          <Text style={styles.featureText}>Unlimited storage</Text>
        </View>
        <View style={styles.feature}>
          <Check size={16} color="#34C759" />
          <Text style={styles.featureText}>Priority support</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!isActive && (
        <TouchableOpacity
          style={[styles.purchaseButton, isLoading && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Crown size={20} color="#FFFFFF" />
              <Text style={styles.purchaseButtonText}>
                Purchase for ${(product.price! / 100).toFixed(2)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {isActive && (
        <View style={styles.activeContainer}>
          <Text style={styles.activeText}>Premium features are active</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 22,
  },
  features: {
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  activeContainer: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  activeText: {
    color: '#15803D',
    fontSize: 14,
    fontWeight: '500',
  },
});
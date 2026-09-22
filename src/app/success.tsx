import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function SuccessScreen() {
  const { orderId } = useLocalSearchParams();

  // Format order ID display (e.g., if it's a MongoDB ObjectId, shorten it or show it clearly)
  const displayOrderId = orderId 
    ? `#${typeof orderId === 'string' ? orderId.slice(-6).toUpperCase() : 'ELC-84729'}` 
    : '#ELC-84729';

  return (
    <View style={styles.container}>
      <Ionicons name="checkmark-circle" size={100} color="#10b981" style={styles.icon} />
      
      <Text style={styles.title}>Order Confirmed!</Text>
      <Text style={styles.subtitle}>
        Thank you for your purchase. Your order <Text style={styles.orderId}>{displayOrderId}</Text> is currently being processed.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/orders')}>
          <Text style={styles.primaryBtnText}>Track Order</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/shop')}>
          <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#4b5563', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  orderId: { fontWeight: 'bold', color: '#111827' },
  buttonContainer: { width: '100%', gap: 16 },
  primaryBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 8, alignItems: 'center', width: '100%' },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryBtn: { backgroundColor: '#f3f4f6', paddingVertical: 16, borderRadius: 8, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#e5e7eb' },
  secondaryBtnText: { color: '#374151', fontWeight: 'bold', fontSize: 16 },
});
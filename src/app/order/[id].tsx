import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { apiClient } from '../../api/client';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Automatically re-fetch order details every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchOrderDetails();
      }
    }, [id])
  );

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get(`/order/${id}`);
      setOrder(response.data);
    } catch (err: any) {
      console.error('Order detail fetch error:', err);
      if (err.response?.status === 401) {
        setError('You must be logged in to view this order.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this order.');
      } else {
        setError('Failed to load order details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || 'pending';
    if (s === 'delivered') return '#10b981'; 
    if (s === 'shipped') return '#8b5cf6'; 
    if (s === 'pending') return '#3b82f6'; 
    if (s === 'cancelled') return '#ef4444'; 
    return '#6b7280'; 
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (isLoading && !order) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <Text style={styles.errorText}>{error || 'Order not found'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Order Header Info */}
        <View style={styles.card}>
          <View style={styles.orderHeaderRow}>
            <Text style={styles.orderIdTitle}>Order #{order._id.substring(order._id.length - 8).toUpperCase()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '1A' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {order.status?.toUpperCase() || 'PENDING'}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>Placed on {formatDate(order.createdAt)}</Text>
        </View>

        {/* Shipping Address */}
        {order.address && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <Text style={styles.addressText}>{order.address.fullName || 'No Name Provided'}</Text>
            <Text style={styles.addressText}>{order.address.street}</Text>
            <Text style={styles.addressText}>{order.address.city}, {order.address.state} {order.address.zipCode || order.address.postalCode}</Text>
            <Text style={styles.addressText}>{order.address.country}</Text>
            {order.address.phoneNumber && <Text style={styles.addressText}>📞 {order.address.phoneNumber}</Text>}
          </View>
        )}

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items ({order.items?.length || 0})</Text>
          {order.items?.map((item: any, index: number) => {
            const product = item.product || {};
            const imageUrl = Array.isArray(product.image) ? product.image[0] : (product.image || 'https://via.placeholder.com/100');

            return (
              <View key={index} style={styles.itemRow}>
                <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>{product.name || 'Unknown Product'}</Text>
                  <Text style={styles.itemQty}>Qty: {item.quantity || 1}</Text>
                  <Text style={styles.itemPrice}>${item.price || product.price || '0.00'}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Method</Text>
            <Text style={styles.summaryValue}>{order.paymentMethod || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.totalPrice}>${Number(order.amount || order.totalPrice || 0).toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  iconBtn: { padding: 4 },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  scrollContent: { padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  orderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderIdTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  dateText: { fontSize: 14, color: '#6b7280' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  addressText: { fontSize: 14, color: '#4b5563', marginBottom: 4, lineHeight: 20 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  itemImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f9fafb', resizeMode: 'contain' },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 },
  itemQty: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: '#2563eb' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#6b7280' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 12 },
  totalPrice: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  errorText: { color: '#ef4444', fontSize: 16, marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#2563eb', borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: 'bold' }
});
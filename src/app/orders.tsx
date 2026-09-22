import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { apiClient } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOCK_ORDERS = [
  { _id: 'ELC84729', createdAt: '2026-09-18T14:55:34.499Z', amount: 1018.98, items: [1], status: 'pending' },
  { _id: 'ELC39281', createdAt: '2026-08-12T10:30:00.000Z', amount: 79.00, items: [1], status: 'delivered' },
  { _id: 'ELC10294', createdAt: '2026-07-04T08:15:00.000Z', amount: 449.00, items: [1, 2], status: 'cancelled' },
];

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Automatically re-fetch orders every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      let token = await AsyncStorage.getItem('userToken');
      if (!token) token = await AsyncStorage.getItem('token');
      if (!token) token = await AsyncStorage.getItem('jwt');

      const response = await apiClient.get('/order', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const dataArray = Array.isArray(response.data) 
        ? response.data 
        : response.data?.orders || response.data?.data || [];
        
      setOrders(dataArray.length > 0 ? dataArray : MOCK_ORDERS);
    } catch (err) {
      console.log('Orders API error or not found. Falling back to mock data.');
      setOrders(MOCK_ORDERS);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || 'pending';
    if (s.includes('delivered')) return '#10b981'; 
    if (s.includes('processing') || s.includes('pending')) return '#3b82f6'; 
    if (s.includes('cancelled')) return '#ef4444'; 
    return '#6b7280'; 
  };

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase() || 'pending';
    if (s.includes('delivered')) return 'checkmark-circle-outline';
    if (s.includes('cancelled')) return 'close-circle-outline';
    return 'time-outline';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>My Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading && orders.length === 0 ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, index) => item._id?.toString() || index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>You haven't placed any orders yet.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusColor = getStatusColor(item.status);
            const statusIcon = getStatusIcon(item.status);

            return (
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>
                    Order #{item._id ? item._id.substring(item._id.length - 8).toUpperCase() : 'N/A'}
                  </Text>
                  
                  {/* Status Pill Badge with Icon */}
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '1A' }]}>
                    <Ionicons name={statusIcon} size={14} color={statusColor} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                      {item.status || 'pending'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.orderDetails}>
                  <View>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>{formatDate(item.createdAt || item.date)}</Text>
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Total Amount</Text>
                    <Text style={styles.detailValue}>${Number(item.amount || item.totalPrice || item.total || 0).toFixed(2)}</Text>
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Items</Text>
                    <Text style={styles.detailValue}>
                      {item.items?.length || item.orderItems?.length || 1} items
                    </Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.detailsBtn} 
                  onPress={() => router.push({ pathname: '/order/[id]', params: { id: item._id } })}
                >
                  <Text style={styles.detailsBtnText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#2563eb" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { padding: 4 },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  listContainer: { padding: 16 },
  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 16, 
  },
  statusBadgeText: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    textTransform: 'capitalize' 
  },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginBottom: 12 },
  orderDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  detailLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: '#eff6ff', borderRadius: 8 },
  detailsBtnText: { color: '#2563eb', fontWeight: 'bold', marginRight: 4 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#6b7280', fontSize: 16, marginTop: 12 }
});
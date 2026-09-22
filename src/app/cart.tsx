import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, ScrollView, KeyboardAvoidingView, Platform, Modal, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCartStore } from '../store/cartStore';
import { apiClient } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';

export default function CartScreen() {
  const { items, addToCart, decreaseQuantity, removeFromCart, getCartTotal } = useCartStore();
  const [promoCode, setPromoCode] = useState('');
  
  // Address states
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // New address form fields (aligned with Mongoose schema: area, pincode, fullName, phoneNumber)
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');

  const subtotal = getCartTotal();
  const tax = subtotal * 0.02; // 2% Tax calculation
  const total = subtotal + tax;
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Proactive auth and address synchronization on focus
  useFocusEffect(
    useCallback(() => {
      checkAuthAndFetchAddresses();
    }, [])
  );

  const checkAuthAndFetchAddresses = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setAddresses([]);
        setSelectedAddress(null);
        return;
      }

      const response = await apiClient.get('/address');
      const addressList = response.data || [];
      setAddresses(addressList);
      if (addressList.length > 0 && !selectedAddress) {
        setSelectedAddress(addressList[0]);
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setAddresses([]);
        setSelectedAddress(null);
      } else {
        console.error('Failed to fetch addresses:', error?.response?.status || error.message);
      }
    }
  };

  const handleAddressPress = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert(
          'Login Required', 
          'Please log in to manage your delivery addresses.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log In', onPress: () => router.push('/login') }
          ]
        );
        return;
      }
      await checkAuthAndFetchAddresses();
      setIsAddressModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Unable to verify login status.');
    }
  };

  const handleAddAddress = async () => {
    if (!fullName || !phoneNumber || !street || !city || !state || !postalCode || !country) {
      Alert.alert('Error', 'Please fill in all address fields');
      return;
    }

    try {
      let token = await AsyncStorage.getItem('userToken');
      if (!token) token = await AsyncStorage.getItem('token');
      if (!token) token = await AsyncStorage.getItem('jwt');

      if (!token) {
        Alert.alert('Login Required', 'Your session has expired. Please log in again.');
        router.push('/login');
        return;
      }

      // Send payload mapping directly to schema expectations
      const response = await apiClient.post(
        '/address', 
        { 
          fullName, 
          phoneNumber, 
          street, 
          city, 
          state, 
          postalCode, 
          country 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedList = response.data;
      setAddresses(updatedList);
      setSelectedAddress(updatedList[updatedList.length - 1]);
      setIsAddModalVisible(false);
      
      // Reset inputs
      setFullName(''); setPhoneNumber(''); setStreet(''); setCity(''); setState(''); setPostalCode(''); setCountry('India');
      Alert.alert('Success', 'Address added successfully!');
    } catch (error: any) {
      console.error('Add address error response status:', error?.response?.status);
      console.error('Add address error response data:', error?.response?.data);
      const errorMessage = error?.response?.data?.error || 'Failed to add new address';
      Alert.alert('Error', errorMessage);
    }
  };

  // Handle Address Deletion using dynamic route path /address/[id]
  const handleDeleteAddress = async (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to remove this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              let token = await AsyncStorage.getItem('userToken');
              if (!token) token = await AsyncStorage.getItem('token');
              if (!token) token = await AsyncStorage.getItem('jwt');

              const response = await apiClient.delete(`/address/${addressId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });

              const updatedList = response.data || [];
              setAddresses(updatedList);

              if (selectedAddress?._id === addressId) {
                setSelectedAddress(updatedList.length > 0 ? updatedList[0] : null);
              }
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.error || 'Failed to delete address');
            }
          }
        }
      ]
    );
  };

  // Handle Complete Two-Step Order & Razorpay Checkout Flow
  const handlePlaceOrder = async () => {
    try {
      let token = await AsyncStorage.getItem('userToken');
      if (!token) token = await AsyncStorage.getItem('token');
      if (!token) token = await AsyncStorage.getItem('jwt');

      if (!token) {
        Alert.alert('Login Required', 'Please log in to place an order.');
        router.push('/login');
        return;
      }
      if (!selectedAddress) {
        Alert.alert('Address Required', 'Please select a delivery address');
        return;
      }

      // 1. Format cart items safely using 'any' casting for product references
      const formattedItems = items.map((item) => {
        const prod = item.product as any;
        return {
          productId: prod?.id || prod?._id || item.id,
          quantity: item.quantity,
        };
      });

      // 2. Step 1: Create initial Order document in MongoDB via POST /api/order
      const createOrderResponse = await apiClient.post(
        '/order',
        {
          items: formattedItems,
          addressId: selectedAddress._id,
          paymentMethod: 'Razorpay',
          discount: 0,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const dbOrderId = createOrderResponse.data._id;

      // 3. Step 2: Request the Razorpay order ID using the new database orderId
      const razorpayOrderResponse = await apiClient.post(
        '/payment/create-order',
        { orderId: dbOrderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { razorpayOrderId, key, amount, currency } = razorpayOrderResponse.data;

      // 4. Configure options for Razorpay native checkout modal
      const options = {
        description: 'Electro Purchase',
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: currency || 'INR',
        key: key,
        amount: Math.round(amount * 100),
        name: 'Electro',
        order_id: razorpayOrderId,
        prefill: {
          email: selectedAddress.email || 'user@electro.com',
          contact: selectedAddress.phoneNumber || '9999999999',
          name: selectedAddress.fullName || 'Valued Customer',
        },
        theme: { color: '#2563eb' },
      };

      // 5. Open Razorpay native checkout modal
      RazorpayCheckout.open(options)
        .then(async (data: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            // Step 3: Verify signature on backend
            await apiClient.post(
              '/payment/verify',
              {
                orderId: dbOrderId,
                razorpay_order_id: data.razorpay_order_id,
                razorpay_payment_id: data.razorpay_payment_id,
                razorpay_signature: data.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            useCartStore.getState().clearCart();
            router.push({ pathname: '/success', params: { orderId: dbOrderId } });
          } catch (verifyError) {
            Alert.alert('Verification Failed', 'Payment was successful, but server signature verification failed.');
          }
        })
        .catch((error: { code: number; description: string }) => {
          Alert.alert('Payment Cancelled', error.description || 'Transaction was aborted.');
        });

    } catch (error: any) {
      console.error('Checkout error:', error?.response?.data || error.message);
      Alert.alert('Checkout Error', error?.response?.data?.error || 'Failed to initialize order.');
    }
  };
  
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyHeader}>Your cart is empty</Text>
        <TouchableOpacity style={styles.continueShoppingBtn} onPress={() => router.push('/shop')}>
          <Ionicons name="chevron-back" size={16} color="#2563eb" />
          <Text style={styles.continueShoppingText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Your Cart</Text>
          <Text style={styles.itemCountText}>{itemCount} item{itemCount !== 1 && 's'}</Text>
        </View>

        {/* Cart Items List */}
        <View style={styles.cartList}>
          {items.map((item) => {
            const product = item.product || {};
            const rawPrice = product.price || (product as any).offerPrice || '0';
            const priceStr = rawPrice.toString();
            const numericPrice = parseFloat(priceStr.replace('$', '')) || 0;

            let imageUrl = 'https://via.placeholder.com/150';
            if (typeof product.image === 'string' && product.image.trim() !== '') {
              imageUrl = product.image;
            } else if (Array.isArray(product.image) && product.image.length > 0) {
              imageUrl = product.image[0];
            }

            return (
              <View key={item.id} style={styles.cartItem}>
                <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                
                <View style={styles.itemDetails}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.itemName} numberOfLines={2}>{product.name}</Text>
                    <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                      <Ionicons name="trash-outline" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.itemActionRow}>
                    <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
                      <Ionicons name="trash-outline" size={14} color="#ef4444" />
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                    <Text style={styles.itemPrice}>${numericPrice.toFixed(2)}</Text>
                  </View>

                  <View style={styles.itemQuantityRow}>
                    <View style={styles.qtyController}>
                      <TouchableOpacity onPress={() => decreaseQuantity(item.id)} style={styles.qtyBtn}>
                        <Ionicons name="remove" size={16} color="#4b5563" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => addToCart(product)} style={styles.qtyBtn}>
                        <Ionicons name="add" size={16} color="#4b5563" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.itemSubtotal}>${(numericPrice * item.quantity).toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.continueShoppingBtn} onPress={() => router.push('/shop')}>
          <Ionicons name="chevron-back" size={16} color="#2563eb" />
          <Text style={styles.continueShoppingText}>Continue Shopping</Text>
        </TouchableOpacity>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.divider} />

          {/* Select Address Dropdown Field */}
          <Text style={styles.inputLabel}>Select Address</Text>
          <TouchableOpacity 
            style={styles.inputWrapper} 
            onPress={handleAddressPress}
          >
            <Text style={[styles.textInput, { color: selectedAddress ? '#111827' : '#9ca3af' }]} numberOfLines={1}>
              {selectedAddress 
                ? `${selectedAddress.fullName || ''} - ${selectedAddress.street || selectedAddress.area}, ${selectedAddress.city}` 
                : 'Select delivery address'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9ca3af" style={styles.inputIcon} />
          </TouchableOpacity>

          {/* Promo Code */}
          <Text style={styles.inputLabel}>Promo Code</Text>
          <View style={styles.promoRow}>
            <View style={[styles.inputWrapper, styles.promoInputWrapper]}>
              <Ionicons name="pricetag-outline" size={20} color="#9ca3af" style={{ marginLeft: 12 }} />
              <TextInput 
                style={[styles.textInput, { paddingLeft: 8 }]} 
                placeholder="Enter code" 
                value={promoCode}
                onChangeText={setPromoCode}
                placeholderTextColor="#9ca3af"
              />
            </View>
            <TouchableOpacity style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>

          {/* Cost Breakdown */}
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Subtotal</Text>
            <Text style={styles.costValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Shipping</Text>
            <Text style={[styles.costValue, styles.freeShipping]}>Free</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Tax (2%)</Text>
            <Text style={styles.costValue}>${tax.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>

          {/* Place Order / Pay via Razorpay */}
          <TouchableOpacity 
            style={styles.placeOrderBtn}
            onPress={handlePlaceOrder}
          >
            <Text style={styles.placeOrderText}>Place Order & Pay</Text>
          </TouchableOpacity>
          <Text style={styles.termsText}>By placing your order, you agree to our Terms & Conditions.</Text>
        </View>

      </ScrollView>

      {/* ─── Address Selection Modal ─── */}
      <Modal visible={isAddressModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Delivery Address</Text>
              <TouchableOpacity onPress={() => setIsAddressModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={addresses}
              keyExtractor={(item, index) => item._id || index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.addressOption, selectedAddress?._id === item._id && styles.selectedAddressOption]}
                  onPress={() => {
                    setSelectedAddress(item);
                    setIsAddressModalVisible(false);
                  }}
                >
                  <Ionicons name="location-outline" size={20} color="#2563eb" style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressText}>{item.fullName} ({item.phoneNumber})</Text>
                    <Text style={styles.addressSubText}>{item.street || item.area}, {item.city}, {item.state} - {item.postalCode || item.pincode}</Text>
                    <Text style={styles.countryText}>{item.country}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleDeleteAddress(item._id)} 
                    style={styles.deleteAddressBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyAddressText}>No saved addresses found.</Text>
              }
            />

            <TouchableOpacity 
              style={styles.addNewAddressBtn}
              onPress={() => {
                setIsAddressModalVisible(false);
                setIsAddModalVisible(true);
              }}
            >
              <Ionicons name="add" size={18} color="#2563eb" />
              <Text style={styles.addNewAddressText}>Add New Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Add New Address Modal ─── */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput style={styles.modalInput} placeholder="John Doe" value={fullName} onChangeText={setFullName} placeholderTextColor="#9ca3af" />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput style={styles.modalInput} placeholder="9876543210" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" placeholderTextColor="#9ca3af" />

              <Text style={styles.inputLabel}>Street / Area Address</Text>
              <TextInput style={styles.modalInput} placeholder="123 Main St, Apartment block" value={street} onChangeText={setStreet} placeholderTextColor="#9ca3af" />

              <Text style={styles.inputLabel}>City</Text>
              <TextInput style={styles.modalInput} placeholder="Siliguri" value={city} onChangeText={setCity} placeholderTextColor="#9ca3af" />

              <Text style={styles.inputLabel}>State</Text>
              <TextInput style={styles.modalInput} placeholder="West Bengal" value={state} onChangeText={setState} placeholderTextColor="#9ca3af" />

              <Text style={styles.inputLabel}>Postal Code / Pincode</Text>
              <TextInput style={styles.modalInput} placeholder="734001" value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" placeholderTextColor="#9ca3af" />

              <Text style={styles.inputLabel}>Country</Text>
              <TextInput style={styles.modalInput} placeholder="India" value={country} onChangeText={setCountry} placeholderTextColor="#9ca3af" />

              <TouchableOpacity style={styles.saveAddressBtn} onPress={handleAddAddress}>
                <Text style={styles.saveAddressText}>Save Address</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  emptyContainer: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  emptyHeader: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#2563eb' },
  itemCountText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  cartList: { marginBottom: 16 },
  cartItem: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f9fafb', marginRight: 16, resizeMode: 'contain' },
  itemDetails: { flex: 1 },
  itemTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1, marginRight: 12 },
  itemActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 12 },
  removeBtn: { flexDirection: 'row', alignItems: 'center' },
  removeText: { fontSize: 12, color: '#ef4444', marginLeft: 4, fontWeight: '500' },
  itemPrice: { fontSize: 14, color: '#4b5563', fontWeight: '500' },
  itemQuantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyController: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 4, paddingVertical: 2 },
  qtyBtn: { padding: 4 },
  qtyText: { marginHorizontal: 12, fontSize: 14, fontWeight: '600', color: '#111827' },
  itemSubtotal: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  continueShoppingBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  continueShoppingText: { color: '#2563eb', fontSize: 14, fontWeight: '500', marginLeft: 4 },
  summaryCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 20, backgroundColor: '#fff', marginBottom: 40 },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, backgroundColor: '#fff', marginBottom: 16, paddingHorizontal: 12 },
  textInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#111827' },
  inputIcon: { paddingRight: 4 },
  promoRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  promoInputWrapper: { flex: 1, marginBottom: 0, paddingHorizontal: 0 },
  applyBtn: { backgroundColor: '#93c5fd', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 6 },
  applyBtnText: { color: '#fff', fontWeight: 'bold' },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  costLabel: { fontSize: 14, color: '#4b5563' },
  costValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  freeShipping: { color: '#10b981' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#2563eb' },
  placeOrderBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  placeOrderText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  termsText: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  addressOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  selectedAddressOption: { backgroundColor: '#eff6ff', paddingHorizontal: 8, borderRadius: 8 },
  addressText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  addressSubText: { fontSize: 13, color: '#4b5563', marginTop: 2 },
  countryText: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  deleteAddressBtn: { padding: 8, marginLeft: 8 },
  emptyAddressText: { textAlign: 'center', color: '#6b7280', marginVertical: 20 },
  addNewAddressBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#2563eb', borderRadius: 8, borderStyle: 'dashed' },
  addNewAddressText: { color: '#2563eb', fontWeight: 'bold', marginLeft: 8 },
  modalInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12, fontSize: 14, color: '#111827' },
  saveAddressBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 16, marginBottom: 20 },
  saveAddressText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
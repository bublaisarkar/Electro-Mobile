import { Tabs, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';

export default function TabLayout() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const items = useCartStore((state) => state.items);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);
  
  const cartItemCount = items.reduce((total, item) => total + (item.quantity || 0), 0);

  useEffect(() => {
    const checkAuthAndSync = async () => {
      try {
        // Step 1: Retrieve user token securely from local storage
        const token = await AsyncStorage.getItem('userToken');
        
        if (!token) {
          // If no token exists, immediately redirect to login screen
          router.replace('/login');
          return;
        }

        // Step 2: Attempt to sync live data from MongoDB via backend API routes
        try {
          await Promise.all([
            fetchCart(),
            fetchWishlist()
          ]);
        } catch (syncError) {
          console.error('Non-fatal background sync error:', syncError);
          // Even if network sync fails, we allow the user to stay in the app 
          // using offline or cached store states instead of crashing.
        }

      } catch (err) {
        console.error('Critical Auth check error:', err);
        router.replace('/login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndSync();
  }, []);

  // Show loading spinner while verifying token and syncing database state
  if (isCheckingAuth) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <Tabs 
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerTitle: '', 
        headerLeft: () => (
          <Text style={{ marginLeft: 16, fontSize: 22, fontWeight: '900', color: '#2563eb', fontStyle: 'italic' }}>
            Electro
          </Text>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/cart')} style={{ marginRight: 16, position: 'relative' }}>
            <Ionicons name="cart-outline" size={28} color="#111827" />
            {cartItemCount > 0 && (
              <View style={{
                position: 'absolute', right: -6, top: -6, backgroundColor: '#ef4444',
                borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center',
                alignItems: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff'
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ),
      }}
    >
      {/* --- VISIBLE TABS --- */}
      <Tabs.Screen 
        name="index" 
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="shop" 
        options={{ tabBarLabel: 'Shop', tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="cart" 
        options={{ 
          tabBarLabel: 'Cart', 
          tabBarBadge: cartItemCount > 0 ? cartItemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ef4444' },
          tabBarIcon: ({ color }) => <Ionicons name="cart-outline" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="wishlist" 
        options={{ 
          tabBarLabel: 'Wishlist', 
          tabBarIcon: ({ color }) => <Ionicons name="heart-outline" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          tabBarLabel: 'Profile', 
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} /> 
        }} 
      />

      {/* --- HIDDEN SCREENS --- */}
      <Tabs.Screen name="product/[id]" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="success" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="orders" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="contact" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="login" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="signup" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="order/[id]" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }
});
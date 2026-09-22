import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';

export default function WishlistScreen() {
  const addToCart = useCartStore((state) => state.addToCart);
  
  const wishlist = useWishlistStore((state) => state.items);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  const handleAddToCart = (item: any) => {
    addToCart(item);
    router.push('/cart');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={wishlist}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No items in your wishlist.</Text>
          </View>
        }
        renderItem={({ item }) => {
          let imageUrl = 'https://via.placeholder.com/200';
          if (typeof item.image === 'string' && item.image.trim() !== '') {
            imageUrl = item.image;
          } else if (Array.isArray(item.image) && item.image.length > 0) {
            imageUrl = item.image[0];
          }

          return (
            <View style={styles.card}>
              <View style={styles.saleBadge}>
                <Text style={styles.saleText}>SALE</Text>
              </View>
              
              <TouchableOpacity style={styles.heartBtn} onPress={() => toggleWishlist(item as any)}>
                <Ionicons name="heart" size={20} color="#ef4444" />
              </TouchableOpacity>

              <Image source={{ uri: imageUrl }} style={styles.image} />
              
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              
              <View style={styles.ratingRow}>
                {[1,2,3,4,5].map(star => <Ionicons key={star} name="star-outline" size={12} color="#9ca3af" />)}
                <Text style={styles.ratingText}>(0)</Text>
              </View>

              <View style={styles.priceRow}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.price}>{item.price}</Text>
                </View>
                <TouchableOpacity style={styles.cartBtn} onPress={() => handleAddToCart(item)}>
                  <Ionicons name="cart-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.fullWidthCartBtn} onPress={() => handleAddToCart(item)}>
                <Text style={styles.fullWidthCartText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  grid: { padding: 12 },
  card: { flex: 1, margin: 6, minWidth: '45%', maxWidth: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', position: 'relative' },
  saleBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#2563eb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, zIndex: 10 },
  saleText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  heartBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: '#fff', borderRadius: 15, padding: 6, zIndex: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  image: { width: '100%', height: 120, resizeMode: 'contain', borderRadius: 8, marginBottom: 12, backgroundColor: '#f3f4f6' },
  productName: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 2 },
  ratingText: { fontSize: 12, color: '#9ca3af', marginLeft: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  cartBtn: { backgroundColor: '#2563eb', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  fullWidthCartBtn: { backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  fullWidthCartText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#6b7280', fontSize: 16, marginTop: 12 }
}); 
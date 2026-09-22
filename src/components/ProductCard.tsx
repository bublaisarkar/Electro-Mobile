import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { router } from 'expo-router';

export interface Product {
  id: string;
  name: string;
  price: string;
  image: string | string[]; // Allow both string or array just in case
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  
  const isWished = isInWishlist(product.id);

  const navigateToDetails = () => {
    router.push(`/product/${product.id}`);
  };

  // 🛠️ Safe image normalizer: guarantees uri is always a string
  let imageUrl = 'https://via.placeholder.com/150';
  if (typeof product.image === 'string' && product.image.trim() !== '') {
    imageUrl = product.image;
  } else if (Array.isArray(product.image) && product.image.length > 0) {
    imageUrl = product.image[0];
  }

  return (
    <TouchableOpacity style={styles.card} onPress={navigateToDetails} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        
        {/* Working Wishlist Button */}
        <TouchableOpacity 
          style={styles.wishlistBtn} 
          onPress={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
        >
          <Ionicons name={isWished ? "heart" : "heart-outline"} size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.price}>{product.price}</Text>
        
        <TouchableOpacity 
          style={styles.addToCartBtn} 
          onPress={(e) => {
            e.stopPropagation(); 
            addToCart(product);
          }}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, margin: 8, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  imageContainer: { backgroundColor: '#f9fafb', padding: 16, alignItems: 'center', position: 'relative' },
  image: { width: 120, height: 120, resizeMode: 'contain' },
  wishlistBtn: { position: 'absolute', bottom: 8, right: 8, backgroundColor: '#fff', padding: 6, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  details: { padding: 12 },
  name: { fontSize: 14, fontWeight: '500', color: '#111827', marginBottom: 4, height: 40 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  addToCartBtn: { backgroundColor: '#2563eb', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  addToCartText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});
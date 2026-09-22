import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ProductCard, { Product } from '../components/ProductCard';
import { apiClient } from '../api/client';

export default function HomeScreen() {
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/products');
        
        const dataArray = Array.isArray(response.data) 
          ? response.data 
          : response.data?.products || response.data?.data || [];

        // Extract dynamic categories for the horizontal scroll
        const uniqueCats = Array.from(new Set(dataArray.map((p: any) => p.category).filter(Boolean))).sort();
        setCategories(uniqueCats as string[]);

        // Grab first 4 products for Popular section
        const formattedProducts = dataArray.slice(0, 4).map((item: any) => {
          let imageUrl = 'https://via.placeholder.com/150';
          if (typeof item.image === 'string' && item.image.trim() !== '') {
            imageUrl = item.image;
          } else if (Array.isArray(item.image) && item.image.length > 0) {
            imageUrl = item.image[0];
          }

          const displayPrice = item.offerPrice ? item.offerPrice : item.price;

          return {
            id: item._id || item.id,
            name: item.name || item.title,
            price: `$${displayPrice}`,
            image: imageUrl,
          };
        });

        setPopularProducts(formattedProducts);
      } catch (err) {
        console.error('Home screen fetch error:', err);
        setError('Failed to load home data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <Text style={styles.heroBadge}>NEW ARRIVALS</Text>
        <Text style={styles.heroTitle}>Upgrade Your Tech Setup</Text>
        <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/shop')}>
          <Text style={styles.heroButtonText}>Shop Now</Text>
          <Ionicons name="arrow-forward" size={16} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="small" color="#2563eb" style={{ marginVertical: 20 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.categoryCard} 
              // Pass the category as a URL parameter
              onPress={() => router.push(`/shop?category=${encodeURIComponent(cat)}`)}
            >
              <Text style={styles.categoryCardText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔥 Popular Products</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.productGrid}>
          {popularProducts.map((product) => (
            <View key={product.id} style={styles.gridItem}>
              <ProductCard product={product} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centerContent: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#ef4444', textAlign: 'center' },
  heroCard: { backgroundColor: '#2563eb', margin: 16, padding: 24, borderRadius: 16, alignItems: 'flex-start' },
  heroBadge: { color: '#bfdbfe', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20, lineHeight: 32 },
  heroButton: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, gap: 8 },
  heroButtonText: { color: '#2563eb', fontWeight: 'bold', fontSize: 14 },
  sectionHeader: { paddingHorizontal: 16, marginBottom: 12, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  categoryScroll: { paddingHorizontal: 16, paddingBottom: 10 },
  categoryCard: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, marginRight: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  categoryCardText: { fontWeight: '600', color: '#374151' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingBottom: 24 },
  gridItem: { width: '50%' }
});
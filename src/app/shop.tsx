import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, StyleSheet, TextInput, ScrollView, TouchableOpacity, Text, ListRenderItem, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import ProductCard, { Product } from '../components/ProductCard';
import { apiClient } from '../api/client';

export default function ShopScreen() {
  // Extract category from URL if we navigated from the Home screen
  const { category } = useLocalSearchParams<{ category?: string }>();
  
  const [searchQuery, setSearchQuery] = useState('');
  // Set initial state to the URL parameter, or fallback to 'All'
  const [activeCategory, setActiveCategory] = useState(category || 'All');
  
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If the user navigates from Home multiple times with different categories, update the active pill
  useEffect(() => {
    if (category) {
      setActiveCategory(category);
    }
  }, [category]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/products');
        
        const dataArray = Array.isArray(response.data) 
          ? response.data 
          : response.data?.products || response.data?.data || [];
          
        setProducts(dataArray);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load products. Check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const uniqueCats = new Set(products.map(p => p.category).filter(Boolean));
    return ['All', ...Array.from(uniqueCats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const name = (item.name || item.title || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  const renderItem: ListRenderItem<any> = ({ item }) => {
    const imageUrl = Array.isArray(item.image) && item.image.length > 0 
      ? item.image[0] 
      : (item.image || 'https://via.placeholder.com/150');

    const displayPrice = item.offerPrice ? item.offerPrice : item.price;

    const formattedProduct: Product = {
      id: item._id, 
      name: item.name,
      price: `$${displayPrice}`, 
      image: imageUrl,
    };
    
    return <ProductCard product={formattedProduct} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            underlineColorAndroid="transparent"
          />
        </View>
      </View>

      <View style={styles.categoryWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity 
                key={cat} 
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setIsLoading(true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList 
          data={filteredProducts}
          keyExtractor={(item, index) => item._id?.toString() || index.toString()}
          numColumns={2}
          contentContainerStyle={styles.productList}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No products found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, color: '#111827', fontSize: 16, paddingVertical: 0 },
  categoryWrapper: { height: 50, marginBottom: 8 },
  categoryScroll: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  pillActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  pillText: { color: '#4b5563', fontWeight: '500', fontSize: 14 },
  pillTextActive: { color: '#fff' },
  productList: { padding: 8, paddingBottom: 24 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#ef4444', marginBottom: 12, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#f3f4f6', borderRadius: 8 },
  retryText: { color: '#111827', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#6b7280', marginTop: 12, fontSize: 16 }
});
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import ProductCard, { Product } from '../../components/ProductCard';
import { apiClient } from '../../api/client';

export default function ProductScreen() {
    const { id } = useLocalSearchParams();
    const addToCart = useCartStore((state) => state.addToCart);

    const [product, setProduct] = useState<any>(null);
    const [activeImage, setActiveImage] = useState<string>('');
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                setIsLoading(true);
                // Fetch all products so we can populate both the main item AND the featured grid
                const response = await apiClient.get('/products');
                
                const dataArray = Array.isArray(response.data) 
                    ? response.data 
                    : response.data?.products || response.data?.data || [];

                // Find the specific product that matches the URL ID
                const foundProduct = dataArray.find((p: any) => p._id === id || p.id === id);

                if (foundProduct) {
                    setProduct(foundProduct);
                    
                    // Safely extract the image array from MongoDB and set the first image as active
                    const images = Array.isArray(foundProduct.image) ? foundProduct.image : [foundProduct.image || 'https://via.placeholder.com/400'];
                    setActiveImage(images[0]);
                } else {
                    setError('Product not found.');
                }

                // Grab 2 other real products for the Featured Section
                const otherProducts = dataArray
                    .filter((p: any) => p._id !== id && p.id !== id)
                    .slice(0, 2)
                    .map((p: any) => {
                        const img = Array.isArray(p.image) && p.image.length > 0 ? p.image[0] : (p.image || 'https://via.placeholder.com/150');
                        return {
                            id: p._id || p.id,
                            name: p.name || p.title,
                            price: `$${p.offerPrice || p.price}`,
                            image: img
                        };
                    });
                setFeaturedProducts(otherProducts);

            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to load product details.');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchProductData();
    }, [id]);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (error || !product) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text style={{ color: '#ef4444', fontSize: 16, marginBottom: 16 }}>{error}</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={20} color="#4b5563" />
                    <Text style={styles.backText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Prepare data for the UI
    const displayPrice = product.offerPrice ? product.offerPrice : product.price;
    const productImages = Array.isArray(product.image) ? product.image : [product.image || 'https://via.placeholder.com/400'];
    
    // Format the object exactly as the Cart Store expects it
    const formattedProductForCart: Product = {
        id: product._id || product.id,
        name: product.name || product.title,
        price: `$${displayPrice}`,
        image: productImages[0]
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={20} color="#4b5563" />
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            {/* Image Gallery */}
            <View style={styles.mainImageContainer}>
                <Image source={{ uri: activeImage }} style={styles.mainImage} />
            </View>
            
            {/* Only show thumbnails if there is more than 1 image */}
            {productImages.length > 1 && (
                <View style={styles.thumbnailRow}>
                    {productImages.map((img: string, idx: number) => (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.thumbnailContainer, activeImage === img && styles.thumbnailActive]}
                            onPress={() => setActiveImage(img)}
                        >
                            <Image source={{ uri: img }} style={styles.thumbnail} />
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Product Info */}
            <View style={styles.infoContainer}>
                <Text style={styles.title}>{product.name || product.title}</Text>

                {/* Star Rating Mock */}
                <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map(star => <Ionicons key={star} name="star" size={16} color="#fbbf24" />)}
                    <Text style={styles.reviewCount}>({product.numReviews || 0})</Text>
                </View>

                <Text style={styles.description}>{product.description || 'No description available.'}</Text>
                
                {/* Updated Price Row to handle offerPrice cross-outs */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 20 }}>
                    <Text style={styles.price}>${displayPrice}</Text>
                    {product.offerPrice && (
                        <Text style={{ fontSize: 16, color: '#9ca3af', textDecorationLine: 'line-through', marginBottom: 4 }}>
                            ${product.price}
                        </Text>
                    )}
                </View>

                {/* Specs Table */}
                <View style={styles.specsTable}>
                    <View style={styles.specRow}>
                        <Text style={styles.specLabel}>Category</Text>
                        <Text style={styles.specValue}>{product.category || 'General'}</Text>
                    </View>
                    {/* Only show these if they exist in your MongoDB */}
                    {product.brand && (
                        <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Brand</Text>
                            <Text style={styles.specValue}>{product.brand}</Text>
                        </View>
                    )}
                    {product.color && (
                        <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Color</Text>
                            <Text style={styles.specValue}>{product.color}</Text>
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.addToCartBtn}
                        onPress={() => addToCart(formattedProductForCart)}
                    >
                        <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.buyNowBtn}
                        onPress={() => {
                            addToCart(formattedProductForCart);
                            router.push('/cart');
                        }}
                    >
                        <Text style={styles.buyNowText}>Buy now</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Featured Products pulled from API */}
            {featuredProducts.length > 0 && (
                <View style={styles.featuredSection}>
                    <Text style={styles.featuredTitle}>Featured Products</Text>
                    <View style={styles.productGrid}>
                        {featuredProducts.map((prod) => (
                            <View key={prod.id} style={styles.gridItem}>
                                <ProductCard product={prod} />
                            </View>
                        ))}
                    </View>
                </View>
            )}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    backButton: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 20 },
    backText: { fontSize: 16, color: '#4b5563', marginLeft: 4 },
    mainImageContainer: { height: 300, backgroundColor: '#f9fafb', marginHorizontal: 16, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#f3f4f6' },
    mainImage: { width: '100%', height: '100%', resizeMode: 'contain' },
    thumbnailRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12, gap: 12 },
    thumbnailContainer: { width: 60, height: 60, borderRadius: 8, borderWidth: 2, borderColor: 'transparent', backgroundColor: '#f9fafb', padding: 4 },
    thumbnailActive: { borderColor: '#2563eb' },
    thumbnail: { width: '100%', height: '100%', resizeMode: 'contain' },
    infoContainer: { padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 2 },
    reviewCount: { color: '#6b7280', fontSize: 14, marginLeft: 4 },
    description: { fontSize: 15, color: '#4b5563', lineHeight: 22, marginBottom: 16 },
    price: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
    specsTable: { marginBottom: 24, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 16 },
    specRow: { flexDirection: 'row', paddingVertical: 8 },
    specLabel: { width: 100, fontSize: 14, color: '#6b7280' },
    specValue: { fontSize: 14, color: '#111827', fontWeight: '500' },
    actionRow: { flexDirection: 'row', gap: 12 },
    addToCartBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', backgroundColor: '#f9fafb' },
    addToCartText: { color: '#374151', fontWeight: 'bold', fontSize: 16 },
    buyNowBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, backgroundColor: '#2563eb', alignItems: 'center' },
    buyNowText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    featuredSection: { paddingVertical: 24, borderTopWidth: 1, borderTopColor: '#f3f4f6', marginTop: 16 },
    featuredTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, color: '#111827' },
    productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
    gridItem: { width: '50%' }
});
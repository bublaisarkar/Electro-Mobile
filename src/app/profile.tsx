import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Href, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCartStore } from '../store/cartStore'; // 🛠️ Import cart store to clear items on logout

export default function ProfileScreen() {
    const [loading, setLoading] = useState(true);

    // Verify token validity whenever the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            checkAuth();
        }, [])
    );

    const checkAuth = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                router.replace('/login');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            router.replace('/login');
        } finally {
            setLoading(false);
        }
    };

    const menuItems: { icon: keyof typeof Ionicons.glyphMap; label: string; route: Href }[] = [
        { icon: 'cube-outline', label: 'My Orders', route: '/orders' },
        { icon: 'heart-outline', label: 'Wishlist', route: '/wishlist' }, 
        { icon: 'mail-outline', label: 'Contact Us', route: '/contact' },
    ];

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            useCartStore.getState().clearCart(); // 🛠️ Wipe local cart state on logout
            router.replace('/login');
        } catch (error) {
            console.error('Logout Error:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Profile Header */}
            <View style={styles.headerCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>BS</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>Bublai Sarkar</Text>
                    <Text style={styles.userEmail}>user@example.com</Text>
                </View>
                <TouchableOpacity style={styles.editBtn}>
                    <Ionicons name="pencil" size={18} color="#6b7280" />
                </TouchableOpacity>
            </View>

            {/* Menu Links */}
            <View style={styles.menuSection}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.menuItem}
                        onPress={() => router.push(item.route)}
                    >
                        <View style={styles.menuIconWrapper}>
                            <Ionicons name={item.icon} size={20} color="#4b5563" />
                        </View>
                        <Text style={styles.menuText}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    headerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 24,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    userInfo: { flex: 1 },
    userName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    userEmail: { fontSize: 14, color: '#6b7280' },
    editBtn: { padding: 8, backgroundColor: '#f3f4f6', borderRadius: 8 },
    menuSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
        marginBottom: 24,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    menuIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#374151' },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    logoutText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
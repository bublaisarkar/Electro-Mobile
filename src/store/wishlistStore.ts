import { create } from 'zustand';
import { Product } from '../components/ProductCard';
import { apiClient } from '../api/client';

interface WishlistState {
  items: Product[];
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],

  fetchWishlist: async () => {
    try {
      // Updated to match your Next.js route: /api/user/wishlist
      const response = await apiClient.get('/user/wishlist');
      
      // MongoDB / User model returns the array of populated products or items
      const rawData = response.data?.wishlist || response.data?.items || response.data || [];
      
      // Ensure each item has a clean 'id' field matching _id
      const formattedWishlist = rawData.map((item: any) => ({
        ...item,
        id: item._id || item.id,
      }));

      set({ items: formattedWishlist });
    } catch (err) {
      console.log('Failed to fetch wishlist from server:', err);
    }
  },

  toggleWishlist: async (product) => {
    const productId = product.id || (product as any)._id;
    const currentItems = get().items;
    const exists = currentItems.some((item) => (item.id || (item as any)._id) === productId);

    // Optimistic UI update
    if (exists) {
      set({ items: currentItems.filter((item) => (item.id || (item as any)._id) !== productId) });
    } else {
      set({ items: [...currentItems, product] });
    }

    // Sync with backend API pointing to /user/wishlist
    try {
      if (exists) {
        await apiClient.delete('/user/wishlist', { data: { productId } });
      } else {
        await apiClient.post('/user/wishlist', { productId });
      }
    } catch (err) {
      console.error('Failed to sync wishlist with backend:', err);
      // Optional: Rollback optimistic update on failure if desired
    }
  },

  isInWishlist: (productId) => {
    return get().items.some((item) => (item.id || (item as any)._id) === productId);
  },
}));
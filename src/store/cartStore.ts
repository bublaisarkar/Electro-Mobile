import { create } from 'zustand';
import { Product } from '../components/ProductCard';
import { apiClient } from '../api/client';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  decreaseQuantity: (productId: string) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchCart: async () => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get('/cart');
      const rawItems = response.data?.items || [];
      
      const formattedItems = rawItems.map((item: any) => ({
        id: item.product?._id || item.product?.id,
        product: item.product,
        quantity: item.quantity,
      }));

      set({ items: formattedItems });
    } catch (err) {
      console.log('Failed to fetch cart from server:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (product, quantity = 1) => {
    const productId = product.id || (product as any)._id;

    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.id === productId);
      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex].quantity += quantity;
        return { items: updated };
      }
      return { items: [...state.items, { id: productId, product, quantity }] };
    });

    try {
      await apiClient.post('/cart', { productId, quantity });
    } catch (err) {
      console.error('Failed to sync add to cart with backend:', err);
    }
  },

  decreaseQuantity: async (productId) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === productId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ),
    }));

    try {
      await apiClient.post('/cart', { productId, quantity: -1 });
    } catch (err) {
      console.error('Failed to sync quantity decrease with backend:', err);
    }
  },

 removeFromCart: async (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }));

    try {
      // 🛠️ Pass productId via query parameter to prevent body-stripping issues
      await apiClient.delete(`/cart?productId=${productId}`);
    } catch (err) {
      console.error('Failed to sync remove from cart with backend:', err);
    }
  },
  clearCart: async () => {
    set({ items: [] });
  },

  getCartTotal: () => {
    const { items } = get();
    return items.reduce((total, item) => {
      // Access price safely from the populated product object
      const rawPrice = item.product?.price || (item.product as any)?.offerPrice || '0';
      const priceStr = rawPrice.toString().replace('$', '');
      const numericPrice = parseFloat(priceStr);
      return total + (isNaN(numericPrice) ? 0 : numericPrice) * item.quantity;
    }, 0);
  },
}));
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Expo automatically exposes variables prefixed with EXPO_PUBLIC_
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the auth token conditionally
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Skip auth header for known public endpoints (like product catalog browsing)
      const isPublicRoute = config.url?.includes('/products');

      let token = null;
      if (!isPublicRoute) {
        // 🛠️ Check multiple common storage keys so it never misses your login token
        token = await AsyncStorage.getItem('userToken');
        if (!token) token = await AsyncStorage.getItem('token');
        if (!token) token = await AsyncStorage.getItem('jwt');
      }
      
      // Debug log to verify outgoing requests and check if token exists
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url} | Token:`, 
        token ? `Bearer ${token.substring(0, 10)}...` : 'NONE (Skipped/Missing)'
      );

      if (token) {
        // Append it to the headers (Standard Bearer token format)
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Ensure header is removed if no token or public route
        delete config.headers.Authorization;
      }
    } catch (error) {
      console.error('Error fetching token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors (like 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🛠️ Bypass console.error logging for 401 Unauthorized responses 
    // to prevent cluttering the LogBox during background unauthenticated checks.
    if (error.response?.status === 401) {
      return Promise.reject(error);
    }

    console.error(
      'API Error Response:', 
      error.response?.status, 
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);
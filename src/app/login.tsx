import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
// Added statusCodes to handle cancellation gracefully
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '460535782844-n5h3fv5p448hsrsn6ho70vbk4pk2o7k8.apps.googleusercontent.com',
});

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const response = await apiClient.post('/auth/login', { email, password });
      const { token } = response.data;
      
      if (token) {
        await AsyncStorage.setItem('userToken', token);
        router.replace('/profile'); 
      } else {
        setError('No token received from server.');
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      if (err.response?.status === 400) {
        setError(err.response?.data?.error || err.response?.data?.message || 'Invalid email or password format.');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Invalid credentials. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginMobile = async () => {
    try {
      setError('');
      setIsGoogleLoading(true);

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      // Safely extract the idToken depending on which version of the Google SignIn library you are using
      const idToken = (response as any).idToken || (response as any).data?.idToken;

      if (!idToken) {
        throw new Error('No ID token found in Google response.');
      }

      const backendRes = await apiClient.post('/auth/google-mobile', { idToken });
      const { token } = backendRes.data;

      if (token) {
        await AsyncStorage.setItem('userToken', token);
        router.replace('/profile');
      } else {
        setError('Authentication failed: No token received.');
      }
      
    } catch (err: any) {
      // Prevents displaying an ugly red error banner if the user simply closes the Google modal
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the Google login flow');
      } else if (err.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress already');
      } else {
        console.error('Google Sign-In Error:', err);
        setError('Google Sign-In failed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.logo}>Electro</Text>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to access your orders and wishlist.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput 
            style={styles.input} 
            placeholder="john@example.com" 
            placeholderTextColor="#9ca3af"
            keyboardType="email-address" 
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput 
            style={styles.input} 
            placeholder="••••••••" 
            placeholderTextColor="#9ca3af"
            secureTextEntry 
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Log In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLoginMobile} disabled={isGoogleLoading}>
          {isGoogleLoading ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#111827" />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/signup', params: { animation: 'none' } })}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 32, fontWeight: '900', color: '#2563eb', fontStyle: 'italic', textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  errorText: { color: '#ef4444', backgroundColor: '#fef2f2', padding: 12, borderRadius: 8, marginBottom: 16, textAlign: 'center', overflow: 'hidden' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 14, fontSize: 16, color: '#111827' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: '#2563eb', fontWeight: '500' },
  loginBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginBottom: 24 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  divider: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { marginHorizontal: 16, color: '#9ca3af', fontWeight: '600' },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', gap: 12 },
  googleBtnText: { color: '#111827', fontWeight: 'bold', fontSize: 16 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: '#6b7280' },
  footerLink: { color: '#2563eb', fontWeight: 'bold' }
});
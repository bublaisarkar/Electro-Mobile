import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiClient } from '../api/client';
// Added statusCodes to handle cancellation gracefully
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '460535782844-n5h3fv5p448hsrsn6ho70vbk4pk2o7k8.apps.googleusercontent.com',
});

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const response = await apiClient.post('/auth/register', { name, email, password });
      const { token } = response.data;
      
      if (token) {
        await AsyncStorage.setItem('userToken', token);
        router.replace('/profile');
      } else {
        router.replace('/login');
      }
    } catch (err: any) {
      console.error('Signup Error:', err);
      if (err.response?.status === 409) {
        setError('An account with this email already exists. Please log in.');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignupMobile = async () => {
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
        console.log('User cancelled the Google sign-up flow');
      } else if (err.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress already');
      } else {
        console.error('Google Sign-Up Error:', err);
        setError('Google Sign-Up failed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Electro to start shopping.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput 
            style={styles.input} 
            placeholder="John Doe" 
            placeholderTextColor="#9ca3af"
            value={name} 
            onChangeText={setName} 
          />
        </View>

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

        <TouchableOpacity style={styles.loginBtn} onPress={handleSignup} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignupMobile} disabled={isGoogleLoading}>
          {isGoogleLoading ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#111827" />
              <Text style={styles.googleBtnText}>Sign up with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/login', params: { animation: 'none' } })}>
            <Text style={styles.footerLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 40 },
  backBtn: { marginBottom: 24, alignSelf: 'flex-start' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  errorText: { color: '#ef4444', backgroundColor: '#fef2f2', padding: 12, borderRadius: 8, marginBottom: 16, textAlign: 'center', overflow: 'hidden' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 14, fontSize: 16, color: '#111827' },
  loginBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 12, marginBottom: 24 },
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
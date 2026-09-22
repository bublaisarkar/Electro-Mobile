import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function ContactScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Get in Touch</Text>
      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Send a Message</Text>
        
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#9ca3af" />
        
        <Text style={styles.label}>Email Address</Text>
        <TextInput 
          style={styles.input} 
          placeholder="john@example.com" 
          placeholderTextColor="#9ca3af"
          keyboardType="email-address" 
          autoCapitalize="none"
        />
        
        <Text style={styles.label}>Message</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Your message..." 
          placeholderTextColor="#9ca3af"
          multiline 
          numberOfLines={4} 
        />
        
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Send Message</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2563eb', marginBottom: 20 },
  formCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 20, marginBottom: 40 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 15, color: '#111827' },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
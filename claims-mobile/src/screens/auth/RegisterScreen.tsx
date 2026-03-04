import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { registerUser, db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing fields', 'Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      const result = await registerUser(email, password);
      const policyNumber = `POL-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      const newUser = {
        id: result.user.uid,
        name,
        email,
        phone,
        policyNumber,
      };
      await setDoc(doc(db, 'users', result.user.uid), newUser);
      setUser(newUser);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Back button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start tracking your claims today</Text>
          </View>

          <View style={styles.card}>
            <Input label="Full Name" value={name} onChangeText={setName}
              placeholder="John Doe" icon="👤" />
            <Input label="Email Address" value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none"
              placeholder="you@example.com" icon="✉️" />
            <Input label="Phone Number" value={phone} onChangeText={setPhone}
              keyboardType="phone-pad" placeholder="+1 234 567 8900" icon="📱" />
            <Input label="Password" value={password} onChangeText={setPassword}
              secureTextEntry placeholder="Create a strong password" icon="🔒" />

            <View style={styles.policyNote}>
              <Text style={styles.policyIcon}>ℹ️</Text>
              <Text style={styles.policyText}>
                A policy number will be automatically assigned to your account.
              </Text>
            </View>

            <Button label="Create Account" onPress={handleRegister}
              loading={loading} size="lg" style={{ width: '100%' }} />
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.xl },
  back: { marginBottom: Spacing.lg },
  backText: { color: Colors.primary, fontSize: Typography.base, fontWeight: '600' },
  header: { marginBottom: Spacing.xl },
  title: { fontSize: Typography.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.base, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.xl, ...Shadow.lg,
  },
  policyNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.primaryLighter, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.base,
  },
  policyIcon: { fontSize: 14 },
  policyText: { flex: 1, fontSize: Typography.sm, color: Colors.primary, lineHeight: 18 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  loginText: { color: Colors.textSecondary, fontSize: Typography.base },
  loginLink: { color: Colors.primary, fontWeight: '700', fontSize: Typography.base },
});
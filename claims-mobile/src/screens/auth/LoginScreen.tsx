import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { loginUser, db } from '../../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import Input from '../../components/Input';
import Button from '../../components/Button';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await loginUser(email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists()) {
        setUser({ id: result.user.uid, ...userDoc.data() } as any);
      } else {
        const newUser = {
          id: result.user.uid,
          name: result.user.displayName || email.split('@')[0],
          email: result.user.email || email,
          phone: '',
          policyNumber: `POL-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        };
        await setDoc(doc(db, 'users', result.user.uid), newUser);
        setUser(newUser);
      }
    } catch (error: any) {
      Alert.alert('Sign in failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand mark */}
          <View style={styles.brandSection}>
            <View style={styles.logoMark}>
              <View style={styles.logoInner} />
            </View>
            <Text style={styles.appName}>ClaimTrack</Text>
            <Text style={styles.tagline}>Insurance claims, simplified.</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.cardSubtitle}>Welcome back to your account</Text>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Enter your password"
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              label="Sign In"
              onPress={handleLogin}
              loading={loading}
              size="lg"
            />
          </View>

          {/* Register link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}> Create one</Text>
            </TouchableOpacity>
          </View>

          {/* Trust strip */}
          <View style={styles.trustStrip}>
            {['Bank-grade encryption', '256-bit SSL', 'SOC 2 compliant'].map((item) => (
              <View key={item} style={styles.trustItem}>
                <View style={styles.trustDot} />
                <Text style={styles.trustText}>{item}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl + Spacing.md,
  },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  logoInner: {
    width: 20,
    height: 20,
    borderRadius: 2,
    borderWidth: 2.5,
    borderColor: Colors.white,
    transform: [{ rotate: '45deg' }],
  },
  appName: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    letterSpacing: 0.1,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.lg,
  },
  cardTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
  },
  forgotText: {
    color: Colors.accent,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  footerLink: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: Typography.sm,
  },
  trustStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  trustDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  trustText: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
});
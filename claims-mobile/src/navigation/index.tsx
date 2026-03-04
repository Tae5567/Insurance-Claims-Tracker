import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { useAuthStore } from '../store/useAuthStore';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ClaimsListScreen from '../screens/claims/ClaimsListScreen';
import ClaimDetailScreen from '../screens/claims/ClaimDetailScreen';
import NewClaimScreen from '../screens/claims/NewClaimScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// ─── Types ────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Register: undefined;
  Main: undefined;
  ClaimDetail: { claimId: string };
  NewClaim: { preselectedType?: string } | undefined;
  Chat: { claimId: string; claimTitle: string };
};

export type TabParamList = {
  Dashboard: undefined;
  Claims: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// ─── Tab Icon — text labels only, no emojis ───────────────

const TAB_ICONS: Record<string, string> = {
  Dashboard: 'Home',
  Claims: 'Claims',
  Notifications: 'Alerts',
  Profile: 'Profile',
};

// Small geometric icon drawn with Views — no emoji, no icon library needed
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, React.ReactNode> = {
    Dashboard: (
      <View style={[tabIconStyles.homeGrid, focused && tabIconStyles.active]}>
        <View style={tabIconStyles.homeTop} />
        <View style={tabIconStyles.homeBottom} />
      </View>
    ),
    Claims: (
      <View style={[tabIconStyles.listWrap, focused && tabIconStyles.active]}>
        <View style={tabIconStyles.listLine} />
        <View style={[tabIconStyles.listLine, { width: 14 }]} />
        <View style={[tabIconStyles.listLine, { width: 18 }]} />
      </View>
    ),
    Notifications: (
      <View style={[tabIconStyles.bell, focused && tabIconStyles.active]}>
        <View style={tabIconStyles.bellTop} />
        <View style={tabIconStyles.bellBottom} />
      </View>
    ),
    Profile: (
      <View style={[tabIconStyles.profileWrap, focused && tabIconStyles.active]}>
        <View style={tabIconStyles.profileHead} />
        <View style={tabIconStyles.profileBody} />
      </View>
    ),
  };

  return (
    <View style={tabStyles.tabItem}>
      {icons[name]}
      <Text style={[tabStyles.tabLabel, focused && tabStyles.tabLabelActive]}>
        {TAB_ICONS[name]}
      </Text>
    </View>
  );
}

// ─── Main Tabs ────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: tabStyles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      {(['Dashboard', 'Claims', 'Notifications', 'Profile'] as const).map((name) => (
        <Tab.Screen
          key={name}
          name={name}
          component={
            name === 'Dashboard' ? DashboardScreen :
            name === 'Claims' ? ClaimsListScreen :
            name === 'Notifications' ? NotificationsScreen :
            ProfileScreen
          }
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon name={name} focused={focused} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────

export default function Navigation() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Auth" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="ClaimDetail"
              component={ClaimDetailScreen}
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="NewClaim"
              component={NewClaimScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────

const tabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 82,
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabItem: {
    alignItems: 'center',
    gap: 5,
    width: 56,
  },
  tabLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

// Geometric micro-icons drawn with Views
const IC = { color: Colors.textTertiary, activeColor: Colors.primary };
const tabIconStyles = StyleSheet.create({
  active: { opacity: 1 },

  // Home — 2x2 grid
  homeGrid: { width: 18, height: 16, flexDirection: 'column', gap: 2, opacity: 0.4 },
  homeTop: { flex: 1, backgroundColor: Colors.primary, borderRadius: 2 },
  homeBottom: { flex: 1, backgroundColor: Colors.primary, borderRadius: 2 },

  // List
  listWrap: { gap: 3, opacity: 0.4 },
  listLine: { width: 20, height: 2, backgroundColor: Colors.primary, borderRadius: 1 },

  // Bell
  bell: { alignItems: 'center', gap: 1, opacity: 0.4 },
  bellTop: {
    width: 14, height: 12,
    borderWidth: 2, borderColor: Colors.primary,
    borderTopLeftRadius: 7, borderTopRightRadius: 7,
    borderBottomWidth: 0,
  },
  bellBottom: { width: 7, height: 2, backgroundColor: Colors.primary, borderRadius: 1 },

  // Profile
  profileWrap: { alignItems: 'center', gap: 2, opacity: 0.4 },
  profileHead: {
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 2, borderColor: Colors.primary,
  },
  profileBody: {
    width: 16, height: 7,
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    borderWidth: 2, borderColor: Colors.primary,
    borderBottomWidth: 0,
  },
});
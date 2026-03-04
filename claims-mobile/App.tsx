import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import Navigation from './src/navigation';
import { useAuthStore } from './src/store/useAuthStore';
import { onAuthChange, db } from './src/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { registerForPushNotifications, useNotificationListeners } from './src/services/notifications';
import * as Notifications from 'expo-notifications';

export default function App() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const user = useAuthStore((s) => s.user);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ id: firebaseUser.uid, ...userDoc.data() } as any);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  // Register for push notifications once user is logged in
  useEffect(() => {
    if (user?.id) {
      registerForPushNotifications(user.id).catch(console.error);
    }
  }, [user?.id]);

  // Handle notification interactions
  useNotificationListeners(
    (notification) => {
      console.log('Notification received:', notification);
    },
    (response) => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
      // You can navigate to specific claim here
    }
  );

  return (
    <>
      <StatusBar style="dark" />
      <Navigation />
    </>
  );
}
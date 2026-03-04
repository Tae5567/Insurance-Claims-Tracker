import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// ─── Foreground Notification Behaviour ───────────────────
// SDK 55+: use setNotificationChannel on Android and
// NotificationBehavior on the channel — setNotificationHandler
// was removed. Instead we configure per-channel on Android,
// and on iOS the system sheet handles foreground display.
// For cross-platform foreground display we use the newer API:

Notifications.setNotificationChannelAsync('claims', {
  name: 'Claim Updates',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#2563EB',
  sound: 'default',
}).catch(() => {
  // setNotificationChannelAsync is a no-op on iOS, safe to ignore
});

// ─── Register for Push Notifications ─────────────────────

export async function registerForPushNotifications(
  userId: string
): Promise<string | null> {
  // Push notifications only work on a real device
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device.');
    return null;
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission was denied.');
    return null;
  }

  // Get the Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  // Persist token to Firestore so the backend can send to it
  await updateDoc(doc(db, 'users', userId), {
    expoPushToken: token,
  });

  return token;
}

// ─── Notification Listeners ───────────────────────────────

export function useNotificationListeners(
  onNotification: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void
): () => void {
  // Fires when a notification arrives while the app is foregrounded
  const notificationSub = Notifications.addNotificationReceivedListener(
    onNotification
  );

  // Fires when the user taps a notification (foreground or background)
  const responseSub = Notifications.addNotificationResponseReceivedListener(
    onResponse
  );

  // Return a cleanup function — call subscription.remove() in SDK 55+
  return () => {
    notificationSub.remove();
    responseSub.remove();
  };
}
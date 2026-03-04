import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import { format } from 'date-fns';

interface NotifItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: any;
}

export default function NotificationsScreen() {
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotifItem)));
    });
  }, [user?.id]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, !item.read && styles.cardUnread]}>
            <Text style={styles.notifTitle}>{item.title}</Text>
            <Text style={styles.notifBody}>{item.body}</Text>
            {item.createdAt?.toDate && (
              <Text style={styles.notifTime}>
                {format(item.createdAt.toDate(), 'dd MMM, HH:mm')}
              </Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.xl, paddingBottom: Spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  list: { padding: Spacing.base, paddingBottom: 80 },
  empty: { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  notifTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  notifBody: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 3, lineHeight: 18 },
  notifTime: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 6 },
});
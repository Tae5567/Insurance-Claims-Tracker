import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { listenToMessages, sendMessage } from '../../services/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import { Message } from '../../types';
import { format } from 'date-fns';

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { claimId, claimTitle } = route.params;
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsubscribe = listenToMessages(claimId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    });
    return unsubscribe;
  }, [claimId]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const messageText = text.trim();
    setText('');
    setSending(true);

    try {
      await sendMessage(claimId, {
        claimId,
        senderId: user.id,
        senderName: user.name,
        senderRole: 'customer',
        content: messageText,
        timestamp: new Date().toISOString(),
        read: false,
      });
    } catch (error) {
      console.error('Send failed:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;
    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        {!isOwn && (
          <View style={styles.avatarBubble}>
            <Text style={styles.avatarText}>{item.senderName.charAt(0)}</Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isOwn ? styles.bubbleOwn : styles.bubbleOther,
          ]}
        >
          {!isOwn && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
            {format(new Date(item.timestamp), 'HH:mm')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{claimTitle}</Text>
          <Text style={styles.headerSubtitle}>Claims Support Chat</Text>
        </View>
        <View style={styles.onlineIndicator}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatIcon}>💬</Text>
            <Text style={styles.emptyChatTitle}>Start the conversation</Text>
            <Text style={styles.emptyChatSubtitle}>
              Send a message to your claims adjuster. We typically respond within 2 hours.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />
        )}

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type your message..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  back: { width: 36 },
  backText: { fontSize: Typography.xl, color: Colors.primary },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  headerSubtitle: { fontSize: Typography.xs, color: Colors.textSecondary },
  onlineIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  onlineText: { fontSize: Typography.xs, color: Colors.success, fontWeight: '600' },
  emptyChat: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl,
  },
  emptyChatIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyChatTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptyChatSubtitle: {
    fontSize: Typography.base, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },
  messagesList: { padding: Spacing.base, gap: Spacing.sm },
  messageRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  messageRowOwn: { flexDirection: 'row-reverse' },
  avatarBubble: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryLighter, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.xs, fontWeight: '700', color: Colors.primary },
  bubble: {
    maxWidth: '75%', borderRadius: Radius.lg, padding: Spacing.md,
  },
  bubbleOwn: {
    backgroundColor: Colors.primary, borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.white, borderBottomLeftRadius: 4, ...Shadow.sm,
  },
  senderName: { fontSize: Typography.xs, fontWeight: '700', color: Colors.primary, marginBottom: 3 },
  messageText: { fontSize: Typography.base, color: Colors.textPrimary, lineHeight: 20 },
  messageTextOwn: { color: Colors.white },
  messageTime: { fontSize: 10, color: Colors.textTertiary, marginTop: 4, alignSelf: 'flex-end' },
  messageTimeOwn: { color: 'rgba(255,255,255,0.6)' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    padding: Spacing.base, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, backgroundColor: Colors.background, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Typography.base, color: Colors.textPrimary,
    maxHeight: 120, borderWidth: 1.5, borderColor: Colors.border,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendBtnText: { color: Colors.white, fontSize: Typography.lg, fontWeight: '800' },
});
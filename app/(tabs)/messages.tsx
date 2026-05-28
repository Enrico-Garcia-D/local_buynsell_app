// app/(tabs)/messages.tsx  — replace your existing file
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import { auth } from '../../services/firebase';
import { subscribeToConversations, Conversation } from '../../services/chatService';
import { useTheme } from '../theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts as unknown as number);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MessagesTab() {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsub = subscribeToConversations(uid, (convos) => {
      setConversations(convos);
      setLoading(false);
    });
    return unsub;
  }, []);

  const openChat = (convo: Conversation) => {
    const uid = auth.currentUser?.uid;
    const otherUid = convo.participants.find((p) => p !== uid) ?? '';
    const otherName = convo.participantNames?.[otherUid] ?? 'User';

    const qs = new URLSearchParams({
      conversationId: convo.id,
      listingId: convo.listingId,
      listingTitle: convo.listingTitle ?? '',
      listingImage: convo.listingImage ?? '',
      listingPrice: convo.listingPrice != null ? String(convo.listingPrice) : '',
      sellerUid: '',
      sellerName: '',
      otherUid: otherUid ?? '',
      otherName: otherName ?? '',
    }).toString();

    router.push((`/chat?${qs}`) as any);
  };

  const getUnread = (convo: Conversation): number => {
    const uid = auth.currentUser?.uid;
    return uid ? (convo.unreadCount?.[uid] ?? 0) : 0;
  };

  const renderItem = ({ item }: ListRenderItemInfo<Conversation>) => {
    const uid = auth.currentUser?.uid;
    const otherUid = item.participants.find((p) => p !== uid) ?? '';
    const otherName = item.participantNames?.[otherUid] ?? 'Unknown';
    const unread = getUnread(item);

    return (
      <TouchableOpacity
        style={styles.convoItem}
        activeOpacity={0.8}
        onPress={() => openChat(item)}
      >
        <View style={styles.convoAvatar}>
          <Ionicons name="person" size={22} color={theme.primary} />
        </View>
        <View style={styles.convoBody}>
          <View style={styles.convoTop}>
            <Text style={styles.convoName}>{otherName}</Text>
            <Text style={styles.convoTime}>{formatTime(item.lastMessageTime)}</Text>
          </View>
          <Text style={styles.convoItem2} numberOfLines={1}>{item.listingTitle}</Text>
          <Text
            style={[styles.convoMsg, unread > 0 && styles.convoMsgUnread]}
            numberOfLines={1}
          >
            {item.lastMessage || 'No messages yet'}
          </Text>
        </View>
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {!loading && conversations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={52} color={theme.secondary} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            When buyers contact you, their messages will appear here.
          </Text>
        </View>
      ) : (
        <FlatList<Conversation>
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
    headerTitle: { fontSize: 26, fontWeight: '800', color: theme.text },
    list: { paddingHorizontal: 20 },
    convoItem: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.surface, gap: 12,
    },
    convoAvatar: {
      width: 50, height: 50, borderRadius: 25,
      backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center',
    },
    convoBody: { flex: 1, gap: 2 },
    convoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    convoName: { fontSize: 15, fontWeight: '700', color: theme.text },
    convoTime: { fontSize: 12, color: theme.secondary },
    convoItem2: { fontSize: 12, color: theme.primary, fontWeight: '600' },
    convoMsg: { fontSize: 13, color: theme.subtext },
    convoMsgUnread: { fontWeight: '700', color: theme.text },
    badge: {
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center',
    },
    badgeText: { fontSize: 11, fontWeight: '800', color: theme.primaryText },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
    emptyText: { fontSize: 14, color: theme.subtext, textAlign: 'center', lineHeight: 21 },
  });
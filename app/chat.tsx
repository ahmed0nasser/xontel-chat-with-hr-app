import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import {
  getHRUser,
  subscribeToMessages,
  sendMessage,
} from "@/services/firebase";
import { User, Message } from "@/types";
import { theme } from "@/utils/theme";
import { formatDateBadge, formatMessageTime } from "@/utils/formatters";
import DateBadge from "@/components/DateBadge";

export default function ChatScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [hrUser, setHrUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadHRUser = async () => {
      if (!user) return;
      try {
        const hr = await getHRUser();
        setHrUser(hr);
        setConversationId(user.id);
      } catch (error) {
        console.error("Error loading HR user:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHRUser();
  }, [user]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const unsubscribe = subscribeToMessages(conversationId, (msgs) =>
      setMessages(msgs)
    );

    return () => unsubscribe();
  }, [conversationId, user]);

  useEffect(() => {
    if (messages.length > 0) {
      // Delay to ensure layout is updated before scroll
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || !user || !hrUser || sending || !conversationId) {
      return;
    }

    const content = messageText.trim();
    setMessageText("");
    setSending(true);

    try {
      await sendMessage(conversationId, user.id, content);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessageText(content);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isSent = item.senderId === user?.id;

    const showDateBadge =
      index === 0 ||
      new Date(messages[index - 1].timestamp).toDateString() !==
        new Date(item.timestamp).toDateString();

    return (
      <>
        {showDateBadge && (
          <DateBadge date={formatDateBadge(new Date(item.timestamp))} />
        )}
        <View
          style={[
            styles.messageContainer,
            isSent
              ? styles.sentMessageContainer
              : styles.receivedMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isSent ? styles.sentBubble : styles.receivedBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isSent ? styles.sentMessageText : styles.receivedMessageText,
              ]}
            >
              {item.text}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isSent ? styles.sentMessageTime : styles.receivedMessageTime,
              ]}
            >
              {formatMessageTime(new Date(item.timestamp))}
            </Text>
          </View>
        </View>
      </>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No messages yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Start a conversation with {hrUser?.firstName}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={10}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Image
              source={{ uri: hrUser?.profilePictureUrl }}
              style={styles.headerAvatar}
            />
            <View style={styles.headerText}>
              <Text style={styles.headerName}>
                {hrUser?.firstName} {hrUser?.lastName}
              </Text>
              <Text style={styles.headerTitle}>{hrUser?.title}</Text>
            </View>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.messagesListEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textLight}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.border,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text,
  },
  headerTitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  messagesList: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  messagesListEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  emptyStateText: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  emptyStateSubtext: {
    ...theme.typography.bodySmall,
    color: theme.colors.textLight,
    textAlign: "center",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  sentMessageContainer: {
    justifyContent: "flex-end",
  },
  receivedMessageContainer: {
    justifyContent: "flex-start",
  },

  messageBubble: {
    maxWidth: "75%",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  sentBubble: {
    backgroundColor: theme.colors.messageSent,
    borderBottomRightRadius: theme.borderRadius.xs,
  },
  receivedBubble: {
    backgroundColor: theme.colors.messageReceived,
    borderBottomLeftRadius: theme.borderRadius.xs,
  },

  messageText: {
    ...theme.typography.body,
    lineHeight: 20,
  },
  sentMessageText: {
    color: theme.colors.text,
  },
  receivedMessageText: {
    color: theme.colors.text,
  },
  messageTime: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
  },
  sentMessageTime: {
    color: theme.colors.textSecondary,
    textAlign: "right",
  },
  receivedMessageTime: {
    color: theme.colors.textSecondary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingTop: theme.spacing.md,
    maxHeight: 100,
    color: theme.colors.text,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

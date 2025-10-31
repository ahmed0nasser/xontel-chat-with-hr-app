import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import {
  getHRUser,
  subscribeToUnreadCount,
  subscribeToConversation,
} from "@/services/firebase";
import { User } from "@/types";
import { theme } from "@/utils/theme";
import { formatRelativeTime, truncateText } from "@/utils/formatters";

interface MessageBrief {
  text: string;
  timestamp: Date;
  lastMessageSenderFirstName: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [hrUser, setHrUser] = useState<User | null>(null);
  const [lastMessage, setLastMessage] = useState<MessageBrief | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHRUser().then((hrUser) => setHrUser(hrUser));
  }, [setHrUser]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToConversation(user.id, async (conv) => {
      setLastMessage({
        text: conv.lastMessage,
        timestamp: conv.lastMessageTimestamp,
        lastMessageSenderFirstName:
          conv.lastMessageSenderId === user.id
            ? "You"
            : (hrUser?.firstName as string),
      });
    });
    setLoading(false);

    return unsubscribe;
  }, [user, hrUser]);

  useEffect(() => {
    if (!user || !hrUser) return;

    let unsubscribe;
    subscribeToUnreadCount(user.id, (count) => {
      setUnreadCount(count);
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return unsubscribe;
  }, [user, hrUser]);

  const handleChatPress = () => {
    if (hrUser) {
      router.push("/chat");
    }
  };

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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: user?.profilePictureUrl }}
              style={styles.userAvatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userTitle}>{user?.title}</Text>
            </View>
          </View>
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.firstName}!
          </Text>
          <Text style={styles.welcomeSubtext}>
            Stay connected with your HR team
          </Text>
        </View>

        <View style={styles.chatSection}>
          <Text style={styles.sectionTitle}>Messages</Text>

          {hrUser ? (
            <TouchableOpacity
              style={styles.chatCard}
              onPress={handleChatPress}
              activeOpacity={0.7}
            >
              <View style={styles.chatCardContent}>
                <Image
                  source={{ uri: hrUser.profilePictureUrl }}
                  style={styles.hrAvatar}
                />

                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.hrName}>
                      {hrUser.firstName} {hrUser.lastName}
                    </Text>
                    {lastMessage && (
                      <Text style={styles.timestamp}>
                        {formatRelativeTime(lastMessage.timestamp)}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.hrTitle}>{hrUser.title}</Text>

                  {lastMessage ? (
                    <View style={styles.messagePreview}>
                      <MessageCircle
                        size={14}
                        color={theme.colors.textSecondary}
                        style={styles.messageIcon}
                      />
                      <Text
                        style={[
                          styles.lastMessage,
                          unreadCount > 0 && styles.lastMessageUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {lastMessage.lastMessageSenderFirstName + ": "}
                        {truncateText(lastMessage.text, 60)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noMessages}>
                      Start a conversation with HR
                    </Text>
                  )}
                </View>

                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                Unable to load HR information
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.border,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userTitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  welcomeSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  welcomeText: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  chatSection: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  chatCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  chatCardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  hrAvatar: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.border,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  hrName: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text,
  },
  hrTitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  timestamp: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  messagePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  messageIcon: {
    marginTop: 2,
  },
  lastMessage: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  lastMessageUnread: {
    fontWeight: "600",
    color: theme.colors.text,
  },
  noMessages: {
    ...theme.typography.bodySmall,
    color: theme.colors.textLight,
    fontStyle: "italic",
  },
  unreadBadge: {
    backgroundColor: theme.colors.unreadBadge,
    borderRadius: theme.borderRadius.full,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xs,
  },
  unreadText: {
    ...theme.typography.caption,
    color: "#fff",
    fontWeight: "700",
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: "center",
  },
});

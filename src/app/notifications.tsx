import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, RADIUS, SPACING } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      // Pointing directly to singular /api/user/notification.php
      const response = await api.get(`/api/user/notification.php?user_id=${user.id}`);
      if (response.data?.status === "success" && Array.isArray(response.data.data)) {
        setNotifications(response.data.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setIsLoading(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Safe MySQL Timestamp Date formatting for Web/iOS/Android
  const formatNotificationDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const safeString = dateString.replace(" ", "T");
      const dateObj = new Date(safeString);
      if (isNaN(dateObj.getTime())) return dateString;
      return dateObj.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return dateString;
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isUnread = item.is_read == 0 || item.is_read === false;
    return (
      <TouchableOpacity
        style={[styles.notificationCard, isUnread && styles.unreadCard]}
        activeOpacity={0.8}
        onPress={() => {
          if (isUnread) markAsRead(item.id);
        }}
      >
        <View style={styles.iconContainer}>
          <Feather
            name="bell"
            size={20}
            color={isUnread ? COLORS.primary : COLORS.textSecondary}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, isUnread && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.date}>
            {formatNotificationDate(item.created_at)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Feather
            name="bell-off"
            size={48}
            color={COLORS.textSecondary}
            style={{ marginBottom: 16 }}
          />
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.text },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
  listContainer: { padding: SPACING.m },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.medium,
    padding: SPACING.m,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unreadCard: { backgroundColor: "#FFF0F0", borderColor: COLORS.primary },
  iconContainer: { marginRight: SPACING.m, justifyContent: "center" },
  textContainer: { flex: 1 },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  unreadTitle: { fontWeight: "bold", color: COLORS.primary },
  message: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  date: { fontSize: 12, color: COLORS.textSecondary },
});
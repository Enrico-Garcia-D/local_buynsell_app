import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "../../services/auth";
import { auth, db } from "../../services/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";

export default function ProfileTab() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [totalListings, setTotalListings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          if (mounted) setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, "users", uid));
        if (!mounted) return;
        if (userDoc.exists()) setUser(userDoc.data());

        const listingsQuery = query(
          collection(db, "listings"),
          where("sellerUID", "==", uid),
        );
        const countSnap = await getCountFromServer(listingsQuery);
        if (mounted) setTotalListings(countSnap.data().count);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSignOut = async () => {
  try {
    console.log('Profile sign-out button pressed');
    await signOut();
    console.log('Profile sign-out: signOut() returned');
  } catch (error) {
    console.error('Sign out failed:', error);
  }
};

  const getJoinedAt = (isoDate: string) => {
    if (!isoDate) return "—";
    const date = new Date(isoDate);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={36} color="#0f766e" />
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user?.name ?? auth.currentUser?.displayName ?? "—"}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email ?? auth.currentUser?.email ?? "—"}
          </Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#0f766e" />
            <Text style={styles.verifiedText}>Verified member</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalListings}</Text>
          <Text style={styles.statLabel}>Listings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Sold</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{getJoinedAt(user?.createdAt)}</Text>
          <Text style={styles.statLabel}>Joined</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.8}
          onPress={() => router.push("/my-listings")}
        >
          <Ionicons name="list" size={20} color="#0f766e" />
          <Text style={styles.menuLabel}>My Listings</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
          <Ionicons name="heart" size={20} color="#0f766e" />
          <Text style={styles.menuLabel}>Saved Items</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
          <Ionicons name="star" size={20} color="#0f766e" />
          <Text style={styles.menuLabel}>Reviews</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
          <Ionicons name="settings" size={20} color="#0f766e" />
          <Text style={styles.menuLabel}>Settings</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#111827" },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ccfbf1",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 18, fontWeight: "800", color: "#111827" },
  userEmail: { fontSize: 13, color: "#64748b" },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  verifiedText: { fontSize: 12, color: "#0f766e", fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statNumber: { fontSize: 18, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  statDivider: { width: 1, backgroundColor: "#e2e8f0" },
  menu: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 12,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1f2937" },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff",
    gap: 8,
  },
  signOutText: { fontSize: 15, fontWeight: "700", color: "#ef4444" },
});

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { useRouter } from 'expo-router';

const CATEGORIES = [
  { id: "all", label: "All", icon: "grid" },
  { id: "electronics", label: "Electronics", icon: "phone-portrait" },
  { id: "clothing", label: "Clothing", icon: "shirt" },
  { id: "furniture", label: "Furniture", icon: "bed" },
  { id: "food", label: "Food", icon: "fast-food" },
  { id: "vehicles", label: "Vehicles", icon: "car" },
  { id: "others", label: "Others", icon: "ellipsis-horizontal" },
];

export default function HomeTab() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
  
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setListings(data);
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  }, []);

  const filtered = listings.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" ||
      item.category === selectedCategory.toLowerCase();
    const matchesSearch = item.title
      ?.toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getTimeAgo = (isoDate: string) => {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${mins}m ago`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.location}>
            <Ionicons name="location" size={14} color="#0f766e" /> Quezon City
          </Text>
          <Text style={styles.headerTitle}>M-Place</Text>
        </View>
        <TouchableOpacity style={styles.notifButton}>
          <Ionicons name="notifications-outline" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search listings..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={cat.icon as any}
              size={15}
              color={selectedCategory === cat.id ? "#fff" : "#475569"}
            />
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === cat.id && styles.categoryLabelActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Listings */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => setRefreshing(true)}
              tintColor="#0f766e"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={42} color="#cbd5e1" />
              <Text style={styles.emptyText}>No listings found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push(`/listing/${item.id}`)}>
              <View style={styles.cardImage}>
                {item.imageURL ? (
                  <Image
                    source={{ uri: item.imageURL }}
                    style={styles.cardImg}
                  />
                ) : (
                  <Ionicons name="image-outline" size={36} color="#cbd5e1" />
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.cardPrice}>
                  ₱{item.price ? Number(item.price).toLocaleString() : 'N/A'}
                </Text>
                <View style={styles.cardMeta}>
                  <Ionicons name="location-outline" size={11} color="#94a3b8" />
                  <Text style={styles.cardMetaText}>{item.location}</Text>
                  <Text style={styles.cardDot}>·</Text>
                  <Text style={styles.cardMetaText}>
                    {getTimeAgo(item.createdAt)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  location: { fontSize: 12, color: "#0f766e", fontWeight: "700" },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#111827" },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchRow: { paddingHorizontal: 20, marginBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1f2937" },
  categoryScroll: { flexGrow: 0, marginBottom: 12 },
  categoryContent: { paddingHorizontal: 20, gap: 8 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  categoryChipActive: { backgroundColor: "#0f766e", borderColor: "#0f766e" },
  categoryLabel: { fontSize: 13, fontWeight: "700", color: "#475569" },
  categoryLabelActive: { color: "#fff" },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  row: { justifyContent: "space-between", marginBottom: 12 },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  cardImage: {
    height: 120,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  cardImg: { width: "100%", height: "100%", resizeMode: "cover" },
  cardBody: { padding: 10, gap: 4 },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18,
  },
  cardPrice: { fontSize: 15, fontWeight: "800", color: "#0f766e" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardMetaText: { fontSize: 11, color: "#94a3b8" },
  cardDot: { fontSize: 11, color: "#94a3b8" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyText: { fontSize: 14, color: "#94a3b8", fontWeight: "600" },
});

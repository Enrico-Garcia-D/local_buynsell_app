import React, { useMemo, useState, useEffect } from "react";
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
import * as Location from "expo-location";
import { useTheme } from "../theme";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
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

const LOCATION_OPTIONS = [
  "All Locations",
  "Quezon City",
  "Manila",
  "Makati",
  "Taguig",
  "Pasig",
];

export default function HomeTab() {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now] = useState<number>(() => Date.now());

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
    const matchesLocation =
      selectedLocation === "All Locations" ||
      item.location === selectedLocation;
    return matchesCategory && matchesSearch && matchesLocation;
  });

  const getTimeAgo = (isoDate: string) => {
    if (!now) return "";
    const diff = now - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${mins}m ago`;
  };

  const getReverseGeocodedLocation = async (coords: Location.LocationObjectCoords) => {
    const [address] = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    const city = address.city || address.subregion || address.region || address.district;
    const barangay = address.name || address.street;
    if (barangay && city && barangay !== city) {
      return `${barangay}, ${city}`;
    }
    return city || barangay || "Current Location";
  };

  const fetchCurrentLocation = async () => {
    setLocationError("");
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("GPS permission denied.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const locationLabel = await getReverseGeocodedLocation(position.coords);
      setSelectedLocation(locationLabel);
      setLocationOpen(false);
      setLocationSearch("");
    } catch (error) {
      console.error("GPS location error:", error);
      setLocationError("Unable to get current location.");
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => setLocationOpen((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={14} color="#0f766e" />
            <Text style={styles.location}>{selectedLocation}</Text>
            <Ionicons
              name={locationOpen ? "chevron-up" : "chevron-down"}
              size={14}
              color="#0f766e"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>M-Place</Text>
          {locationOpen && (
            <View style={styles.locationMenu}>
              <TouchableOpacity
                style={styles.locationAction}
                activeOpacity={0.8}
                onPress={fetchCurrentLocation}
              >
                <Text style={styles.locationActionText}>
                  {gpsLoading ? "Getting GPS location..." : "Use current GPS location"}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={styles.locationSearchInput}
                placeholder="Search locations"
                placeholderTextColor="#94a3b8"
                value={locationSearch}
                onChangeText={setLocationSearch}
              />
              {locationError ? (
                <Text style={styles.locationError}>{locationError}</Text>
              ) : null}
              <ScrollView style={styles.locationList} nestedScrollEnabled>
                {LOCATION_OPTIONS.filter((loc) =>
                  loc.toLowerCase().includes(locationSearch.toLowerCase()),
                ).map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[
                      styles.locationOption,
                      selectedLocation === loc && styles.locationOptionActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedLocation(loc);
                      setLocationOpen(false);
                      setLocationSearch("");
                    }}
                  >
                    <Text
                      style={[
                        styles.locationOptionText,
                        selectedLocation === loc &&
                          styles.locationOptionTextActive,
                      ]}
                    >
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
                {locationSearch.trim().length > 0 &&
                  !LOCATION_OPTIONS.some(
                    (loc) =>
                      loc.toLowerCase() === locationSearch.trim().toLowerCase(),
                  ) && (
                    <TouchableOpacity
                      style={styles.locationOption}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedLocation(locationSearch.trim());
                        setLocationOpen(false);
                        setLocationSearch("");
                      }}
                    >
                      <Text style={styles.locationOptionText}>
                        Use "{locationSearch.trim()}"
                      </Text>
                    </TouchableOpacity>
                  )}
              </ScrollView>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.notifButton}>
            <Ionicons name="notifications-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={theme.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search listings..."
            placeholderTextColor={theme.placeholder}
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
              <Ionicons name="search-outline" size={42} color={theme.secondary} />
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
                  <Ionicons name="location-outline" size={11} color={theme.secondary} />
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

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingHorizontal: 20,
      paddingTop: 56,
      paddingBottom: 12,
    },
    headerLeft: { gap: 8, flex: 1, position: "relative" },
    locationButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "transparent",
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    location: { fontSize: 15, color: theme.primary, fontWeight: "700" },
    locationMenu: {
      position: "absolute",
      top: 38,
      left: 0,
      width: 240,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
      zIndex: 1000,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 6,
    },
    locationAction: {
      paddingHorizontal: 14,
      paddingVertical: 14,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    locationActionText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: "700",
    },
    locationSearchInput: {
      backgroundColor: theme.surface,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.text,
      fontSize: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    locationError: {
      color: theme.danger,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 13,
    },
    locationList: { maxHeight: 180 },
    locationOption: {
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    locationOptionActive: {
      backgroundColor: theme.primary,
    },
    locationOptionText: {
      fontSize: 14,
      color: theme.text,
    },
    locationOptionTextActive: {
      color: theme.primaryText,
    },
    headerTitle: { fontSize: 26, fontWeight: "800", color: theme.text },
    notifButton: {
      width: 42,
      height: 42,
      borderRadius: 8,
      backgroundColor: theme.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchRow: { paddingHorizontal: 20, marginBottom: 12 },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      height: 46,
      gap: 8,
    },
    searchInput: { flex: 1, fontSize: 14, color: theme.text },
    categoryScroll: { flexGrow: 0, marginBottom: 12 },
    categoryContent: { paddingHorizontal: 20, gap: 8 },
    categoryChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    categoryChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    categoryLabel: { fontSize: 13, fontWeight: "700", color: theme.subtext },
    categoryLabelActive: { color: theme.primaryText },
    listContent: { paddingHorizontal: 20, paddingBottom: 20 },
    row: { justifyContent: "space-between", marginBottom: 12 },
    card: {
      width: "48%",
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.primarySoft,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
      overflow: "hidden",
    },
    cardImage: {
      height: 120,
      backgroundColor: theme.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    cardImg: { width: "100%", height: "100%", resizeMode: "cover" },
    cardBody: { padding: 10, gap: 4 },
    cardTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.text,
      lineHeight: 18,
    },
    cardPrice: { fontSize: 15, fontWeight: "800", color: theme.primary },
    cardMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
    cardMetaText: { fontSize: 11, color: theme.secondary },
    cardDot: { fontSize: 11, color: theme.secondary },
    loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
    empty: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 60,
      gap: 10,
    },
    emptyText: { fontSize: 14, color: theme.secondary, fontWeight: "600" },
  });

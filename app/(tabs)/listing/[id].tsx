import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../services/firebase";
import ImageViewing from "react-native-image-viewing";

export default function ListingDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageVisible, setImageVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchListing = async () => {
      setLoading(true);
      try {
        const listingId = Array.isArray(id) ? id[0] : id;
        if (!listingId) {
          if (mounted) setListing(null);
          return;
        }

        const docRef = doc(db, "listings", listingId as string);
        const docSnap = await getDoc(docRef);
        if (!mounted) return;

        if (docSnap.exists()) {
          setListing({ id: docSnap.id, ...docSnap.data() });
        } else {
          setListing(null);
        }
      } catch (error) {
        console.error("Failed to fetch listing:", error);
        if (mounted) Alert.alert("Error", "Failed to load listing.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchListing();
    return () => {
      mounted = false;
    };
  }, [id]);

  const isOwner = listing?.sellerUID === auth.currentUser?.uid;

  const handleMessageSeller = () => {
    if (!auth.currentUser) {
      Alert.alert('Sign in required', 'Please sign in to message the seller.');
      return;
    }

    if (isOwner) {
      Alert.alert('This is your listing', 'You cannot message yourself.');
      return;
    }

    if (!listing?.id) {
      Alert.alert('Unable to message', 'Listing data is not available yet.');
      return;
    }

    const qs = new URLSearchParams({
      listingId: listing.id,
      listingTitle: listing.title ?? '',
      listingImage: listing.imageURL ?? '',
      listingPrice: listing.price != null ? String(listing.price) : '',
      sellerUid: listing.sellerUID ?? '',
      sellerName: listing.sellerName ?? 'Seller',
      otherUid: listing.sellerUID ?? '',
      otherName: listing.sellerName ?? 'Seller',
    }).toString();

    router.push((`/chat?${qs}`) as any);
  };

  const handleEditListing = () => {
    if (!listing?.id) {
      Alert.alert("Unable to edit", "Listing data is not available yet.");
      return;
    }

    router.push(`/sell?id=${listing.id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.notFound}>Listing not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageBox}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => listing.imageURL && setImageVisible(true)}
            style={{ flex: 1 }}
          >
            {listing.imageURL ? (
              <Image
                source={{ uri: listing.imageURL }}
                style={styles.image}
                onError={() => console.warn("Image failed to load")}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={52} color="#cbd5e1" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1f2937" />
          </TouchableOpacity>

          {listing.imageURL && (
            <View style={styles.expandHint}>
              <Ionicons name="expand" size={16} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{listing.title}</Text>
            <Text style={styles.price}>
              ₱{listing.price ? Number(listing.price).toLocaleString() : "N/A"}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="#64748b" />
              <Text style={styles.metaText}>{listing.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="pricetag-outline" size={14} color="#64748b" />
              <Text style={styles.metaText}>{listing.category}</Text>
            </View>
          </View>

          {listing.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          ) : null}

          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              {listing.sellerPhoto ? (
                <Image
                  source={{ uri: listing.sellerPhoto }}
                  style={styles.sellerAvatarImage}
                />
              ) : (
                <Ionicons name="person" size={22} color="#0f766e" />
              )}
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerLabel}>Seller</Text>
              <Text style={styles.sellerName}>
                {listing.sellerName ?? "Unknown"}
              </Text>
            </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#0f766e" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
          </View>
        </View>
      </ScrollView>

      {/* Fullscreen Image Viewer */}
      {listing.imageURL && (
        <ImageViewing
          images={[{ uri: listing.imageURL }]}
          imageIndex={0}
          visible={imageVisible}
          onRequestClose={() => setImageVisible(false)}
        />
      )}

      <View style={styles.bottomBar}>
        {isOwner ? (
          <TouchableOpacity
            style={styles.messageButton}
            onPress={handleEditListing}
            activeOpacity={0.85}
          >
            <Ionicons name="pencil" size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Edit Listing</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.messageButton}
            onPress={handleMessageSeller}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Message Seller</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 16, color: "#64748b" },
  imageBox: { width: "100%", height: 300, backgroundColor: "#f1f5f9" },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  backButton: {
    position: "absolute",
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expandHint: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 20, gap: 16 },
  titleRow: { gap: 6 },
  title: { fontSize: 22, fontWeight: "800", color: "#111827", lineHeight: 28 },
  price: { fontSize: 24, fontWeight: "800", color: "#0f766e" },
  metaRow: { flexDirection: "row", gap: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 13, color: "#64748b" },
  section: { gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#111827" },
  description: { fontSize: 14, color: "#475569", lineHeight: 22 },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ccfbf1",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sellerAvatarImage: { width: 48, height: 48, borderRadius: 24 },
  sellerInfo: { flex: 1, gap: 2 },
  sellerLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  sellerName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  verifiedText: { fontSize: 12, color: "#0f766e", fontWeight: "700" },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  messageButton: {
    minHeight: 54,
    borderRadius: 8,
    backgroundColor: "#0f766e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  messageButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});

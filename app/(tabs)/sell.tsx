import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { auth, db } from "../../services/firebase";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { compressAndConvertToBase64 } from "../../services/storage";
import { useTheme } from "../theme";

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Furniture",
  "Food",
  "Vehicles",
  "Others",
];

const LOCATIONS = [
  "Quezon City",
  "Manila",
  "Makati",
  "Taguig",
  "Pasig",
];

export default function SellTab() {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("Quezon City");
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);

  const { id } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!id) {
      return;
    }

    const fetchListing = async () => {
      try {
        const docRef = doc(db, "listings", id as string);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return;

        const data = docSnap.data();
        if (data.sellerUID !== auth.currentUser?.uid) {
          Alert.alert("Cannot edit", "You can only edit your own listings.");
          router.back();
          return;
        }

        setTitle(data.title ?? "");
        setPrice(data.price ? String(data.price) : "");
        setDescription(data.description ?? "");
        setCategory(data.category ?? "");
        setLocation(data.location ?? "Quezon City");
        setLocationSearch("");
        setImage(data.imageURL ?? null);
        setEditing(true);
      } catch (error) {
        console.error("Load listing error:", error);
      }
    };

    fetchListing();
  }, [id, router]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.3,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
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
      setLocation(locationLabel);
      setLocationOpen(false);
      setLocationSearch("");
    } catch (error) {
      console.error("GPS location error:", error);
      setLocationError("Unable to get current location.");
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !price || !category || !location) {
      Alert.alert(
        "Missing fields",
        "Please fill in title, price, category, and location.",
      );
      return;
    }

    try {
      setSubmitting(true);

      let imageBase64 = null;
      if (image) {
        imageBase64 = image.startsWith("data:image/")
          ? image
          : await compressAndConvertToBase64(image);
      }

      if (editing && id) {
        await updateDoc(doc(db, "listings", id as string), {
          title,
          price: Number(price),
          description,
          category: category.toLowerCase(),
          imageURL: imageBase64,
          location,
          updatedAt: new Date().toISOString(),
        });

        Alert.alert("Updated!", "Your listing has been updated successfully.", [
          { text: "OK", onPress: () => router.replace("/home") },
        ]);
        return;
      }

      await addDoc(collection(db, "listings"), {
        title,
        price: Number(price),
        description,
        category: category.toLowerCase(),
        imageURL: imageBase64,
        sellerUID: auth.currentUser?.uid,
        sellerName: auth.currentUser?.displayName,
        sellerPhoto: auth.currentUser?.photoURL,
        location,
        status: "active",
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Listed!", "Your item has been posted successfully.");
      setTitle("");
      setPrice("");
      setDescription("");
      setCategory("");
      setLocation("Quezon City");
      setImage(null);
      setEditing(false);
    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {editing ? "Edit Listing" : "Post a Listing"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {editing
            ? "Update your item details"
            : "Sell something to your neighbors"}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.photoBox}
        onPress={pickImage}
        activeOpacity={0.8}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera" size={32} color={theme.muted} />
            <Text style={styles.photoPlaceholderText}>Add a photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. iPhone 13 Pro Max"
            placeholderTextColor={theme.muted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Price (₱)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 35000"
            placeholderTextColor={theme.muted}
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.field, styles.locationField]}>
          <Text style={styles.label}>Location</Text>
          <TouchableOpacity
            style={styles.locationSelector}
            onPress={() => setLocationOpen((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={styles.locationSelectorText}>{location || "Select location"}</Text>
            <Ionicons
              name={locationOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.primary}
            />
          </TouchableOpacity>
          {locationOpen && (
            <View style={styles.locationDropdown}>
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
                placeholderTextColor={theme.muted}
                value={locationSearch}
                onChangeText={setLocationSearch}
              />
              {locationError ? (
                <Text style={styles.locationError}>{locationError}</Text>
              ) : null}
              <ScrollView style={styles.locationList} nestedScrollEnabled>
                {LOCATIONS.filter((loc) =>
                  loc.toLowerCase().includes(locationSearch.toLowerCase()),
                ).map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[
                      styles.locationItem,
                      location === loc && styles.locationItemActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setLocation(loc);
                      setLocationOpen(false);
                      setLocationSearch("");
                    }}
                  >
                    <Text
                      style={[
                        styles.locationItemText,
                        location === loc && styles.locationItemTextActive,
                      ]}
                    >
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
                {locationSearch.trim().length > 0 &&
                  !LOCATIONS.some(
                    (loc) =>
                      loc.toLowerCase() === locationSearch.trim().toLowerCase(),
                  ) && (
                    <TouchableOpacity
                      style={styles.locationItem}
                      activeOpacity={0.8}
                      onPress={() => {
                        setLocation(locationSearch.trim());
                        setLocationOpen(false);
                        setLocationSearch("");
                      }}
                    >
                      <Text style={styles.locationItemText}>
                        Use "{locationSearch.trim()}"
                      </Text>
                    </TouchableOpacity>
                  )}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your item..."
            placeholderTextColor={theme.muted}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={theme.surface} />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color={theme.surface} />
              <Text style={styles.submitButtonText}>
                {editing ? "Update Listing" : "Post Listing"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function getStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 4 },
    headerTitle: { fontSize: 26, fontWeight: "800", color: theme.text },
    headerSubtitle: { fontSize: 14, color: theme.subtext },
    photoBox: {
      marginHorizontal: 20,
      height: 200,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 20,
    },
    photoPreview: { width: "100%", height: "100%", resizeMode: "cover" },
    photoPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surface,
      gap: 8,
    },
    photoPlaceholderText: {
      fontSize: 14,
      color: theme.muted,
      fontWeight: "600",
    },
    form: { paddingHorizontal: 20, gap: 16, paddingBottom: 32 },
    field: { gap: 8 },
    label: { fontSize: 14, fontWeight: "700", color: theme.text },
    input: {
      backgroundColor: theme.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: theme.text,
    },
    textArea: { height: 100, textAlignVertical: "top" },
    categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    locationField: { position: "relative" },
    locationSelector: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 0,
      paddingVertical: 10,
      backgroundColor: "transparent",
    },
    locationSelectorText: {
      fontSize: 15,
      color: theme.primary,
      fontWeight: "700",
    },
    locationDropdown: {
      position: "absolute",
      top: 46,
      left: 0,
      right: 0,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
      zIndex: 1000,
      shadowColor: "#000",
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
      backgroundColor: theme.background,
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
    locationItem: {
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    locationItemActive: { backgroundColor: theme.primary },
    locationItemText: { fontSize: 14, color: theme.text },
    locationItemTextActive: { color: theme.surface },
    categoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    categoryChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    categoryChipText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.subtext,
    },
    categoryChipTextActive: { color: theme.surface },
    submitButton: {
      minHeight: 56,
      borderRadius: 8,
      backgroundColor: theme.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 8,
    },
    submitButtonDisabled: { backgroundColor: theme.muted },
    submitButtonText: {
      color: theme.surface,
      fontSize: 16,
      fontWeight: "800",
    },
  });
}

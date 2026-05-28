import React, { useEffect, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { auth, db } from "../../services/firebase";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { compressAndConvertToBase64 } from "../../services/storage";

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Furniture",
  "Food",
  "Vehicles",
  "Others",
];

export default function SellTab() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [existingImageURL, setExistingImageURL] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);

  const { id } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!id) {
      setTitle("");
      setPrice("");
      setDescription("");
      setCategory("");
      setImage(null);
      setExistingImageURL(null);
      setEditing(false);
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
        setImage(data.imageURL ?? null);
        setExistingImageURL(data.imageURL ?? null);
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

  const handleSubmit = async () => {
    if (!title || !price || !category) {
      Alert.alert(
        "Missing fields",
        "Please fill in title, price, and category.",
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
        location: "Quezon City",
        status: "active",
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Listed!", "Your item has been posted successfully.");
      setTitle("");
      setPrice("");
      setDescription("");
      setCategory("");
      setImage(null);
      setExistingImageURL(null);
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
            <Ionicons name="camera" size={32} color="#94a3b8" />
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
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Price (₱)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 35000"
            placeholderTextColor="#94a3b8"
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

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your item..."
            placeholderTextColor="#94a3b8"
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
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color="#fff" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 4 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#111827" },
  headerSubtitle: { fontSize: 14, color: "#64748b" },
  photoBox: {
    marginHorizontal: 20,
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  photoPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    gap: 8,
  },
  photoPlaceholderText: { fontSize: 14, color: "#94a3b8", fontWeight: "600" },
  form: { paddingHorizontal: 20, gap: 16, paddingBottom: 32 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "700", color: "#1f2937" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1f2937",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  categoryChipActive: { backgroundColor: "#0f766e", borderColor: "#0f766e" },
  categoryChipText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  categoryChipTextActive: { color: "#fff" },
  submitButton: {
    minHeight: 56,
    borderRadius: 8,
    backgroundColor: "#0f766e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: { backgroundColor: "#94a3b8" },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});

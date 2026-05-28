import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { uploadGovernmentIdImage } from "../../services/storage";

export default function IDUploadScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photo library.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your camera.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadID = async () => {
    if (!image || !auth.currentUser) return;

    try {
      setUploading(true);

      const uid = auth.currentUser.uid;
      const downloadURL = await uploadGovernmentIdImage(uid, image);

      await setDoc(
        doc(db, "users", uid),
        {
          idPhotoURL: downloadURL,
          status: "pending",
          idUploadedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      Alert.alert(
        "ID submitted",
        "Your ID has been submitted for review. You will get access within 24-48 hours.",
        [{ text: "OK", onPress: () => router.replace("/pending") }],
      );
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Upload failed", "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.brandMark}>
          <Ionicons name="shield-checkmark" size={30} color="#0f766e" />
        </View>
        <Text style={styles.kicker}>M-Place verification</Text>
        <Text style={styles.title}>Secure your local marketplace account</Text>
        <Text style={styles.subtitle}>
          Upload a clear government ID so buyers and sellers know they are
          dealing with a verified neighbor.
        </Text>
      </View>

      <View style={styles.trustRow}>
        <View style={styles.trustItem}>
          <Ionicons name="lock-closed" size={18} color="#0f766e" />
          <Text style={styles.trustText}>Private review</Text>
        </View>
        <View style={styles.trustDivider} />
        <View style={styles.trustItem}>
          <Ionicons name="time" size={18} color="#0f766e" />
          <Text style={styles.trustText}>24-48 hours</Text>
        </View>
      </View>

      <View style={styles.previewBox}>
        {image ? (
          <>
            <Image source={{ uri: image }} style={styles.previewImage} />
            <View style={styles.previewBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#0f766e" />
              <Text style={styles.previewBadgeText}>Ready to submit</Text>
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.placeholderIcon}>
              <Ionicons name="id-card" size={42} color="#64748b" />
            </View>
            <Text style={styles.placeholderTitle}>No ID selected</Text>
            <Text style={styles.placeholderText}>
              Use a well-lit photo where all details are readable.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={pickImage}
          activeOpacity={0.82}
        >
          <Ionicons name="images" size={20} color="#1f2937" />
          <Text style={styles.optionButtonText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={takePhoto}
          activeOpacity={0.82}
        >
          <Ionicons name="camera" size={20} color="#1f2937" />
          <Text style={styles.optionButtonText}>Camera</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.guidelines}>
        <Text style={styles.guidelinesTitle}>Accepted IDs</Text>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark" size={16} color="#0f766e" />
          <Text style={styles.guidelineText}>
            PhilSys ID, driver license, passport, UMID, or PRC ID
          </Text>
        </View>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark" size={16} color="#0f766e" />
          <Text style={styles.guidelineText}>
            Full ID inside the frame with no blur or glare
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!image || uploading) && styles.submitButtonDisabled,
        ]}
        onPress={uploadID}
        disabled={!image || uploading}
        activeOpacity={0.85}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="cloud-upload" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Submit for verification</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.securityNote}>
        <Ionicons name="lock-closed-outline" size={16} color="#64748b" />
        <Text style={styles.note}>
          Your ID is stored securely and used only to verify your M-Place
          account.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: {
    paddingHorizontal: 24,
    paddingTop: 62,
    paddingBottom: 32,
    gap: 18,
  },
  header: { gap: 10 },
  brandMark: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: "#ccfbf1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  kicker: {
    color: "#0f766e",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: { color: "#111827", fontSize: 30, fontWeight: "800", lineHeight: 36 },
  subtitle: { color: "#475569", fontSize: 15, lineHeight: 23 },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1fae5",
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  trustItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  trustDivider: { width: 1, height: 22, backgroundColor: "#bbf7d0" },
  trustText: { color: "#14532d", fontSize: 13, fontWeight: "700" },
  previewBox: {
    width: "100%",
    height: 238,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    backgroundColor: "#fff",
  },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  previewBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  previewBadgeText: { color: "#0f766e", fontSize: 12, fontWeight: "800" },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 8,
  },
  placeholderIcon: {
    width: 76,
    height: 76,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  placeholderTitle: { color: "#111827", fontSize: 16, fontWeight: "800" },
  placeholderText: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  actionRow: { flexDirection: "row", gap: 12 },
  optionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  optionButtonText: { fontSize: 14, color: "#1f2937", fontWeight: "800" },
  guidelines: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    padding: 16,
    gap: 10,
  },
  guidelinesTitle: { color: "#111827", fontSize: 15, fontWeight: "800" },
  guidelineItem: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  guidelineText: { flex: 1, color: "#475569", fontSize: 13, lineHeight: 19 },
  submitButton: {
    minHeight: 56,
    borderRadius: 8,
    backgroundColor: "#0f766e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: { backgroundColor: "#94a3b8" },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 8,
  },
  note: {
    flex: 1,
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
});

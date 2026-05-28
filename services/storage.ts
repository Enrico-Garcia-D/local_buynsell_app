import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const uploadGovernmentIdImage = async (uid: string, imageUri: string) => {
  const compressed = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 800 } }],
    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
  );

  const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const base64Image = `data:image/jpeg;base64,${base64}`;

  await updateDoc(doc(db, 'users', uid), {
    idPhotoURL: base64Image,
  });

  return base64Image;
};

export const compressAndConvertToBase64 = async (imageUri: string) => {
  const compressed = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 600 } }],
    { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG }
  );

  const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return `data:image/jpeg;base64,${base64}`;
};
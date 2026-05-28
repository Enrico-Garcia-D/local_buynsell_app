export type UserStatus = 'needs_id' | 'pending' | 'verified' | 'rejected';

export interface UserProfile {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL: string | null;
  status: UserStatus;
  idPhotoURL: string | null;
  createdAt: string;
}

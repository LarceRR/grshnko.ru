

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  username: string;
  email: string;
  role?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  isVerified?: boolean;
  theme?: string | null;
  language?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
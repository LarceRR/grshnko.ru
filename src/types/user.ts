

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  username: string;
  email: string;
  role?: Role;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  permissions: string[];
  isVerified?: boolean;
  theme?: string | null;
  language?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  name: string;
  createdAt?: string;
  key?: string;
  color?: string;
}
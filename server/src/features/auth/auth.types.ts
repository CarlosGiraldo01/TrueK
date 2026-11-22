export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: 'client' | 'provider';
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string | null;
  avatar_url?: string | null;
  location?: string | null;
}

export interface AuthResponse {
  token: string;
  user: SafeUser;
}
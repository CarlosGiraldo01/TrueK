export type UserRole = "client" | "provider";

export interface User {
  id: string;
  name: string;
  email: string;
  profile_picture: string | null;
  age: number;
  location: string;
  description: string | null;
  role: UserRole;
  latitude: number | null;
  longitude: number | null;
  trueks_count?: number;
  rating?: number;
}

// Campos editables vía PATCH /users/:id (sin role ni email)
export interface UpdateUserInput {
  name?: string;
  description?: string | null;
  profile_picture?: string | null;
  age?: number;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
}
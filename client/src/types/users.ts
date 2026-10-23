export type UserRole = "client" | "provider";

export interface User {
  id: string;
  name: string;
  email: string;
  profile_picture: string | null;
  age: number;
  location: string;
  description: string;
  role: UserRole;
  trueks_count?: number;
  rating?: number;   
}
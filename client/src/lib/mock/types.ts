// Structure of the simulated data: they mirror the database tables (same names, snake_case) 
// so the real API can replace the mock later without renaming fields. 

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

export interface Post {
  id: string;
  user_id: string; 
  name: string;
  description: string;
  tags: string[];
  location: string;
  latitude: number;
  longitude: number;
  post_image: string;
  created_at: string;
  age?: number | string;
  offer?: string;
  price?: number;
  published_ago?: string;
  rating?: number;
}

export type ServiceStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "active"
  | "finished"
  | "cancelled";

export interface ServiceRequest {
  id: string;
  post_id: string;
  client_id: string;
  meeting_address: string;
  meeting_date: string; 
  hours: number;
  status: ServiceStatus;
  request_image: string | null;
  payment_confirmed: boolean;
  price: number;
}

export interface Rating {
  id: string;
  service_request_id: string;
  rated_user_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
}

export type NotificationType =
  | "incoming_services"
  | "services_finished"
  | "request_accepted"
  | "request_rejected";

export interface Notification {
  id: string;
  user_id: string;
  service_request_id: string;
  type: NotificationType;
  message: string;
}

export interface Message {
  id: string;
  service_request_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

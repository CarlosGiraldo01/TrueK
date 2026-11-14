export interface Post {
  id: string;
  user_id: string;
  name: string;
  description: string;
  tags: string[];
  location: string;
  latitude: number;
  longitude: number;
  post_image: string | null;
  created_at: string;
  age?: number | string;
  offer?: string;
  price?: number;
  published_ago?: string;
  rating?: number;  
}

// Cuerpo de POST /posts (el servidor completa name e id)
export interface CreatePostInput {
  user_id: string;
  description: string;
  offer: string;
  location: string;
  latitude: number;
  longitude: number;
  price: number;
  tags: string[];
  post_image?: string;
}

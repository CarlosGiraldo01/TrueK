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

export interface CreatePostData extends CreatePostInput {
    name: string;
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
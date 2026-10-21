"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { POSTS, type Post } from "@/lib/mock";

interface PostsContextValue {
  posts: Post[];
  addPost: (postData: Omit<Post, "id" | "created_at">) => Post;
  getPostById: (id: string) => Post | undefined;
  getPostsByUserId: (userId: string) => Post[];
  searchPosts: (query: string, tag?: string) => Post[];
}

const PostsContext = createContext<PostsContextValue | null>(null);

const STORAGE_KEY = "truek_posts_data";

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading posts from storage:", e);
      }
    }
    return POSTS;
  });

  // Guardar en localStorage cuando cambian las publicaciones
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
      console.error("Error saving posts to storage:", e);
    }
  }, [posts]);

  const addPost = (postData: Omit<Post, "id" | "created_at">): Post => {
    const newPost: Post = {
      ...postData,
      id: `p_${Date.now()}`,
      created_at: new Date().toISOString(),
      published_ago: "Publicado hace un momento",
    };

    setPosts((prev) => [newPost, ...prev]);

    // También actualizar array mock en memoria para compatibilidad
    POSTS.unshift(newPost);

    return newPost;
  };

  const getPostById = (id: string) => {
    return posts.find((p) => p.id === id);
  };

  const getPostsByUserId = (userId: string) => {
    return posts.filter((p) => p.user_id === userId);
  };

  const searchPosts = (query: string, tag?: string) => {
    const cleanQuery = query.trim().toLowerCase();

    return posts.filter((post) => {
      // Filtro por categoría/tag si está activo
      if (tag && !post.tags.includes(tag)) {
        return false;
      }

      // Si no hay texto de búsqueda, cumple el filtro de tag
      if (!cleanQuery) return true;

      // Filtro por texto en nombre, descripción, ubicación o tags
      const matchName = post.name.toLowerCase().includes(cleanQuery);
      const matchDesc = post.description.toLowerCase().includes(cleanQuery);
      const matchLocation = post.location.toLowerCase().includes(cleanQuery);
      const matchTags = post.tags.some((t) => t.toLowerCase().includes(cleanQuery));

      return matchName || matchDesc || matchLocation || matchTags;
    });
  };

  return (
    <PostsContext.Provider
      value={{
        posts,
        addPost,
        getPostById,
        getPostsByUserId,
        searchPosts,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error("usePosts must be used inside PostsProvider");
  return ctx;
}

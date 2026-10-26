"use client";

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { Post } from "@/types";

interface PostsContextValue {
  posts: Post[];
  tags: string[];
  loading: boolean;
  error: string | null;
  addPost: (postData: Omit<Post, "id" | "created_at">) => Post;
  getPostById: (id: string) => Post | undefined;
  getPostsByUserId: (userId: string) => Post[];
  searchPosts: (query: string, tag?: string) => Post[];
}

const PostsContext = createContext<PostsContextValue | null>(null);

// Clave para guardar los posts creados localmente
const STORAGE_KEY = "truek_created_posts";

export function PostsProvider({ children }: { children: ReactNode }) {
  const [serverPosts, setServerPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Leer posts creados desde el localStorage
  const [createdPosts, setCreatedPosts] = useState<Post[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading posts from storage:", e);
      }
    }
    return [];
  });

  // Cargar posts y etiquetas del servidor al iniciar
  useEffect(() => {
    let cancelled = false;

    Promise.all([api.get<Post[]>("/posts"), api.get<string[]>("/posts/tags")])
      .then(([postsRes, tagsRes]) => {
        if (cancelled) return;
        setServerPosts(postsRes.data);
        setTags(tagsRes.data);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar las publicaciones");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Guardar en localStorage cuando se creen nuevos posts
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createdPosts));
    } catch (e) {
      console.error("Error saving posts to storage:", e);
    }
  }, [createdPosts]);

  // Unir los posts locales con los del servidor
  const posts = useMemo(() => [...createdPosts, ...serverPosts], [createdPosts, serverPosts]);

  // Crear un nuevo post y guardarlo arriba del todo
  const addPost = (postData: Omit<Post, "id" | "created_at">): Post => {
    const newPost: Post = {
      ...postData,
      id: "p_" + Date.now(),
      created_at: new Date().toISOString(),
      published_ago: "Publicado hace un momento",
    };

    setCreatedPosts((prev) => [newPost, ...prev]);

    return newPost;
  };

  const getPostById = (id: string) => {
    return posts.find((p) => p.id === id);
  };

  const getPostsByUserId = (userId: string) => {
    return posts.filter((p) => p.user_id === userId);
  };

  // Buscar y filtrar posts por texto o categoría
  const searchPosts = (query: string, tag?: string) => {
    const cleanQuery = query.trim().toLowerCase();

    return posts.filter((post) => {
      if (tag && !post.tags.includes(tag)) {
        return false;
      }

      if (!cleanQuery) return true;

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
        tags,
        loading,
        error,
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
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { Post, CreatePostInput } from "@/types";

interface PostsContextValue {
  posts: Post[];
  tags: string[];
  loading: boolean;
  error: string | null;
  addPost: (input: CreatePostInput) => Promise<Post>;
  getPostById: (id: string) => Post | undefined;
  getPostsByUserId: (userId: string) => Post[];
  searchPosts: (query: string, tag?: string) => Post[];
}

const PostsContext = createContext<PostsContextValue | null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [serverPosts, setServerPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const posts = serverPosts;

  // Crear el post en el servidor y ponerlo arriba del todo (quien llama maneja los errores)
  const addPost = async (input: CreatePostInput): Promise<Post> => {
    const res = await api.post<Post>("/posts", input);
    setServerPosts((prev) => [res.data, ...prev.filter((p) => p.id !== res.data.id)]);
    return res.data;
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
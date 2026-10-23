"use client";

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { Post } from "@/types";

/**
 * Interfaz de valores y operaciones para la gestión de publicaciones de TrueK.
 */
interface PostsContextValue {
  /** Colección total de publicaciones (las del servidor y las creadas en este navegador) */
  posts: Post[];
  /** Categorías disponibles para las publicaciones */
  tags: string[];
  loading: boolean;
  error: string | null;
  /** Registra una nueva publicación en el tope de la lista */
  addPost: (postData: Omit<Post, "id" | "created_at">) => Post;
  /** Obtiene una publicación por su ID único */
  getPostById: (id: string) => Post | undefined;
  /** Obtiene las publicaciones pertenecientes a un usuario específico */
  getPostsByUserId: (userId: string) => Post[];
  /** Filtra publicaciones por término de búsqueda y/o categoría */
  searchPosts: (query: string, tag?: string) => Post[];
}

const PostsContext = createContext<PostsContextValue | null>(null);

// Las publicaciones que se crean aquí se guardan aparte porque el servidor solo responde GET.
const STORAGE_KEY = "truek_created_posts";

/**
 * Proveedor de contexto de publicaciones:
 * Centraliza la creación, consulta, filtrado y persistencia en localStorage de los trueks.
 */
export function PostsProvider({ children }: { children: ReactNode }) {
  const [serverPosts, setServerPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Publicaciones creadas en este navegador (leídas de localStorage)
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

  /**
   * Al abrir la app pide al servidor las publicaciones y las categorías.
   */
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

  /**
   * Efecto de persistencia en localStorage cada vez que cambian las publicaciones creadas.
   */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createdPosts));
    } catch (e) {
      console.error("Error saving posts to storage:", e);
    }
  }, [createdPosts]);

  // Las creadas aquí van primero para que se vean de inmediato en el feed y en el perfil
  const posts = useMemo(() => [...createdPosts, ...serverPosts], [createdPosts, serverPosts]);

  /**
   * Crea y añade una nueva publicación a la plataforma:
   * - Genera un ID único con timestamp.
   * - Establece fecha de creación ISO y etiqueta 'Publicado hace un momento'.
   * - La guarda al inicio de las publicaciones creadas para que se vea de inmediato en el feed y perfil.
   *
   * @param postData - Datos de la publicación sin ID ni fecha de creación.
   * @returns La publicación recién creada.
   */
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

  /**
   * Retorna una publicación específica según su identificador.
   *
   * @param id - Identificador de la publicación.
   */
  const getPostById = (id: string) => {
    return posts.find((p) => p.id === id);
  };

  /**
   * Retorna todas las publicaciones creadas por un usuario (usado para el perfil del proveedor).
   *
   * @param userId - Identificador del usuario autor.
   */
  const getPostsByUserId = (userId: string) => {
    return posts.filter((p) => p.user_id === userId);
  };

  /**
   * Búsqueda y filtrado compuesto de publicaciones:
   * - Si se especifica una categoría (tag), filtra únicamente aquellas que la contengan.
   * - Si se especifica un texto de búsqueda, evalúa coincidencias en nombre, descripción, ubicación o tags.
   *
   * @param query - Texto libre de búsqueda.
   * @param tag - Categoría temática opcional.
   */
  const searchPosts = (query: string, tag?: string) => {
    const cleanQuery = query.trim().toLowerCase();

    return posts.filter((post) => {
      // Filtrado por categoría temática si está activa
      if (tag && !post.tags.includes(tag)) {
        return false;
      }

      // Si no hay texto de búsqueda, cumple el filtro de tag
      if (!cleanQuery) return true;

      // Coincidencias en nombre, descripción, ubicación o etiquetas
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

/**
 * Hook para consumir los métodos y valores de PostsContext.
 */
export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error("usePosts must be used inside PostsProvider")
  return ctx;
}
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { POSTS, type Post } from "@/lib/mock";

/**
 * Interfaz de valores y operaciones para la gestión de publicaciones de TrueK.
 */
interface PostsContextValue {
  /** Colección total de publicaciones en memoria y almacenamiento */
  posts: Post[];
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

const STORAGE_KEY = "truek_posts_data";

/**
 * Proveedor de contexto de publicaciones:
 * Centraliza la creación, consulta, filtrado y persistencia en localStorage de los trueks.
 */
export function PostsProvider({ children }: { children: ReactNode }) {
  // Inicialización de publicaciones con lectura de localStorage o listado inicial de POSTS
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

  /**
   * Efecto de persistencia en localStorage cada vez que la colección de publicaciones cambia.
   */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
      console.error("Error saving posts to storage:", e);
    }
  }, [posts]);

  /**
   * Crea y añade una nueva publicación a la plataforma:
   * - Genera un ID único con timestamp.
   * - Establece fecha de creación ISO y etiqueta 'Publicado hace un momento'.
   * - Inserta la publicación al inicio de la lista (unshift) para visibilidad inmediata en el feed y perfil.
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

    setPosts((prev) => [newPost, ...prev]);

    // Sincroniza el arreglo mock en memoria para compatibilidad
    POSTS.unshift(newPost);

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
  if (!ctx) throw new Error("usePosts must be used inside PostsProvider");
  return ctx;
}

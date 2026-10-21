import type { Post } from "./types";

export const TAGS = [
  "Compañía",
  "Conversar",
  "Planes",
  "Salir",
  "Mentoría",
  "Tutoría",
  "Escucha activa",
];

export const POSTS: Post[] = [
  {
    id: "p1",
    user_id: "u2",
    name: "Valentina Arias",
    description: "Me gusta salir a comer y jugar bolos.",
    tags: ["Conversar", "Escucha activa"],
    location: "Cali, ciudad pacifica",
    latitude: 3.4516,
    longitude: -76.532,
    post_image: "/mock/valentina.png",
    created_at: "2026-10-14T10:00:00Z",
  },
  {
    id: "p2",
    user_id: "u1",
    name: "Camilo Ordoñez",
    description: "Me gusta leer y los video juegos",
    tags: ["Conversar", "Escucha activa"],
    location: "Cali, Bochalema",
    latitude: 3.3768,
    longitude: -76.5327,
    post_image: "/mock/camilo.png",
    created_at: "2026-10-12T15:30:00Z",
  },
  {
    id: "p3",
    user_id: "u3",
    name: "Camila Restrepo",
    description: "Te ayudo a mejorar tu portafolio y a perder el miedo a mostrarlo.",
    tags: ["Mentoría", "Tutoría"],
    location: "Medellín",
    latitude: 6.2442,
    longitude: -75.5812,
    post_image: "/mock/valentina.png",
    created_at: "2026-10-10T09:15:00Z",
  },
];

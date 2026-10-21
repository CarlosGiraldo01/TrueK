import { placeholderImage } from "./images";
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
    name: "Compañía para salir",
    description: "Me gusta salir a comer y jugar bolos.",
    tags: ["Conversar", "Escucha activa"],
    location: "Cali, ciudad pacifica",
    latitude: 3.4516,
    longitude: -76.532,
    post_image: placeholderImage("Valentina"),
    created_at: "2026-10-14T10:00:00Z",
  },
  {
    id: "p2",
    user_id: "u3",
    name: "Mentoría en diseño",
    description: "Te ayudo a mejorar tu portafolio y a perder el miedo a mostrarlo.",
    tags: ["Mentoría", "Tutoría"],
    location: "Medellín",
    latitude: 6.2442,
    longitude: -75.5812,
    post_image: placeholderImage("Camila"),
    created_at: "2026-10-12T15:30:00Z",
  },
  {
    id: "p3",
    user_id: "u4",
    name: "Planes de fin de semana",
    description: "Te acompaño a conocer sitios nuevos de la ciudad.",
    tags: ["Planes", "Salir", "Compañía"],
    location: "Bogotá",
    latitude: 4.711,
    longitude: -74.0721,
    post_image: placeholderImage("Mateo"),
    created_at: "2026-10-10T09:15:00Z",
  },
];
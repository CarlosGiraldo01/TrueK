import type { User } from "./types";

/**
 * Simulated Logged users.
 * To test the provider side of the app (receiving requests) change "CURRENT_USER_ID" to "u2". For more examples change to "u3"
 */
export const CURRENT_USER_ID = "u1";

export const USERS: User[] = [
  {
    id: "u1",
    name: "Camilo Ordoñez",
    email: "camilo@example.com",
    profile_picture: "/mock/camilo.png",
    age: 23,
    location: "Cali, Bochalema",
    description: "Me gusta leer y los video juegos",
    role: "client",
  },
  {
    id: "u2",
    name: "Valentina Arias",
    email: "valentina@example.com",
    profile_picture: "/mock/valentina.png",
    age: 24,
    location: "Cali, ciudad pacifica",
    description: "Me gusta salir a comer y jugar bolos.",
    role: "provider",
  },
  {
    id: "u3",
    name: "Camila Restrepo",
    email: "camila@example.com",
    profile_picture: "https://i.pravatar.cc/150?img=26",
    age: 26,
    location: "Medellín, Manrique",
    description: "Diseñadora, me encanta enseñar lo que sé.",
    role: "client",
  },
  {
    id: "u4",
    name: "Mateo Ríos",
    email: "mateo@example.com",
    profile_picture: "https://i.pravatar.cc/150?img=67",
    age: 28,
    location: "Pasto, Aranda",
    description: "Siempre tengo un plan para el fin de semana.",
    role: "provider",
  },
];
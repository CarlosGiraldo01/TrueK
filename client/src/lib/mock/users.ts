import type { User } from "./types";

/**
 * Usuarios simulados de TrueK.
 * u2 = Proveedor principal (Valentina Arias)
 * u3 = Cliente principal (Camila restrepo)
 * u1 = Usuario secundario (Camilo Ordoñez)
 */
export const CURRENT_USER_ID = "u2";

export const USERS: User[] = [
  {
    id: "u2",
    name: "Valentina Arias",
    email: "valentina@example.com",
    profile_picture: "/mock/valentina.png",
    age: 20,
    location: "Cali - Ciudad Pacífica",
    description: "Soy tranquila, pero me encanta salir de la rutina. Disfruto conocer gente, descubrir nuevos lugares y aprender de los demás. Busco conectar con personas con las que pueda compartir buenos momentos.",
    role: "provider",
    rating: 4.7,
  },
  {
    id: "u3",
    name: "Camila restrepo",
    email: "camila@example.com",
    profile_picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60",
    age: 24,
    location: "Cali - Ricardo Balcazar",
    description: "Soy una persona tranquila y curiosa. Me gusta conocer gente nueva, conversar y probar planes diferentes. Estoy aquí para compartir experiencias y encontrar personas con las que pueda sentirme cómoda.",
    role: "client",
    trueks_count: 10,
    rating: 5.0,
  },
  {
    id: "u1",
    name: "Camilo Torres",
    email: "camilo@example.com",
    profile_picture: "https://i.pravatar.cc/150?img=12",
    age: 22,
    location: "Bogotá, Bosa",
    description: "Me gusta conocer gente nueva y probar planes distintos.",
    role: "client",
    trueks_count: 5,
    rating: 5.0,
  },
  {
    id: "u2",
    name: "Valentina Arias",
    email: "valentina@example.com",
    profile_picture: "https://i.pravatar.cc/150?img=47",
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

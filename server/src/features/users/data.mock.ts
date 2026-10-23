import type { User } from "./users.types";

/**
 * Usuarios simulados de TrueK.
 * u2 = Proveedor principal (Valentina Arias)
 * u3 = Cliente principal (Camila restrepo)
 * u1 = Usuario secundario (Camilo Ordoñez)
 */
export const usersMock: User[] = [
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
    name: "Camilo Ordoñez",
    email: "camilo@example.com",
    profile_picture: "/mock/camilo.png",
    age: 23,
    location: "Cali, Bochalema",
    description: "Me gusta leer y los videojuegos",
    role: "client",
    trueks_count: 5,
    rating: 5.0,
  },
];

import type { Message } from "./messages.types";

// "r7" is the main demo: u1 (client) talks with u3 (provider of post p2).
export const messagesMock: Message[] = [
  { id: "m1", service_request_id: "r7", sender_id: "u1", content: "Hola!", created_at: "2026-10-16T11:23:00-05:00" },
  { id: "m2", service_request_id: "r7", sender_id: "u1", content: "Cuánto sería por 1 hora?", created_at: "2026-10-16T11:23:30-05:00" },
  { id: "m3", service_request_id: "r7", sender_id: "u3", content: "Hola, cómo estás?\nPor hora el precio es de $15.000.", created_at: "2026-10-16T11:25:00-05:00" },
  { id: "m4", service_request_id: "r7", sender_id: "u1", content: "Listo 👍", created_at: "2026-10-16T11:26:00-05:00" },

  { id: "m5", service_request_id: "r2", sender_id: "u1", content: "Hola! Ya acepté la fecha, quedamos así.", created_at: "2026-10-04T18:00:00-05:00" },
  { id: "m6", service_request_id: "r2", sender_id: "u3", content: "Perfecto, nos vemos en el Parque Lleras.", created_at: "2026-10-04T18:05:00-05:00" },

    // Examples to "Current Id u2"
  { id: "m7", service_request_id: "r4", sender_id: "u3", content: "Hola Valentina! Me gustaría salir por 1 hora.", created_at: "2026-09-19T16:00:00-05:00" },
  { id: "m8", service_request_id: "r4", sender_id: "u2", content: "Hola! Claro, por hora son $5.000.", created_at: "2026-09-19T16:02:00-05:00" },
  { id: "m9", service_request_id: "r4", sender_id: "u3", content: "Listo, nos vemos en el Boulevard del Río 👍", created_at: "2026-09-19T16:05:00-05:00" },

  { id: "m10", service_request_id: "r1", sender_id: "u1", content: "Hola! Quisiera salir contigo por 2 horas.", created_at: "2026-10-15T09:00:00-05:00" },
  { id: "m11", service_request_id: "r1", sender_id: "u2", content: "Hola Camilo! Dame un momento y reviso mi agenda.", created_at: "2026-10-15T09:10:00-05:00" },
];
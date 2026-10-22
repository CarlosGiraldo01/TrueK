import type { Rating } from "./ratings.types";

export const ratingsMock: Rating[] = [
  {
    id: "g1",
    service_request_id: "r1",
    rated_user_id: "u1",
    rating: 5,
    comment: "Excelente disposición e interacción.",
  },
  {
    id: "g2",
    service_request_id: "r2",
    rated_user_id: "u2",
    rating: 5,
    comment: "Muy buena compañía, super recomendada.",
  },
  {
    id: "g3",
    service_request_id: "r3",
    rated_user_id: "u3",
    rating: 5,
    comment: "Me ayudó muchísimo con mi portafolio.",
  },
  {
    id: "g4",
    service_request_id: "r4",
    rated_user_id: "u4",
    rating: 5,
    comment: "Excelente compañía, muy puntual.",
  },
];

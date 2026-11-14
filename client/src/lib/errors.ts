import axios from "axios";

// Mensaje del servidor (Boom) si existe; si no, el texto de respaldo.
export const getErrorMessage = (err: unknown, fallback: string): string => {
  const serverMessage = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
  return typeof serverMessage === "string" && serverMessage ? serverMessage : fallback;
};

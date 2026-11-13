import Boom from "@hapi/boom";
import type { Request } from "express";

const readUserId = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;

// TODO(auth): reemplazar esta implementación por una que lea req.user.id una vez exista el middleware real de JWT (/add-auth). Los controllers que llaman a getUserId(req) no deben cambiar, solo esta función.
export const getUserId = (req: Request): string => {
  const body: unknown = req.body;
  const fromBody =
    typeof body === "object" && body !== null && "user_id" in body
      ? readUserId(body.user_id)
      : undefined;
  const userId = fromBody ?? readUserId(req.query.user_id);

  if (!userId) {
    throw Boom.badRequest("Falta user_id");
  }

  return userId;
};

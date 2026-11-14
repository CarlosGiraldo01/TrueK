import Boom from "@hapi/boom";
import type { Request, Response } from "express";
import { getUserId } from "../../middlewares/auth-placeholder";
import { isUuid } from "../../utils/uuid";
import { ratingsService } from "./ratings.service";
import type { CreateRatingInput, Rating } from "./ratings.types";

const MAX_COMMENT_LENGTH = 500;

// Pura (sin req/res) para poder probarla de forma unitaria. rater_id lo aporta getUserId.
export const parseCreateRatingBody = (body: unknown, raterId: string): CreateRatingInput => {
  if (!isUuid(raterId)) {
    throw Boom.badRequest("user_id inválido");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw Boom.badRequest("Cuerpo de la solicitud inválido");
  }
  const data = body as Record<string, unknown>;

  const requestId = data.service_request_id;
  if (typeof requestId !== "string" || !isUuid(requestId)) {
    throw Boom.badRequest("El campo service_request_id debe ser un id válido");
  }

  const rating = data.rating;
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw Boom.badRequest("El campo rating debe ser un entero entre 1 y 5");
  }

  let comment: string | null = null;
  if (data.comment !== undefined && data.comment !== null) {
    if (typeof data.comment !== "string") {
      throw Boom.badRequest("El campo comment debe ser un texto");
    }
    const trimmed = data.comment.trim();
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      throw Boom.badRequest(`El comentario no puede superar ${MAX_COMMENT_LENGTH} caracteres`);
    }
    comment = trimmed === "" ? null : trimmed;
  }

  return {
    rater_id: raterId,
    service_request_id: requestId,
    rating: rating as Rating["rating"],
    comment,
  };
};

export const createRating = async (req: Request, res: Response) => {
  const raterId = getUserId(req);
  const input = parseCreateRatingBody(req.body, raterId);
  const created = await ratingsService.create(input);
  res.status(201).json(created);
};


export const getRatings = async (_req: Request, res: Response) => {
  res.json(await ratingsService.getAll());
};
//Se conecta con ratingsService para obtener todas las calificaciones, 
// buscar una calificación específica por su ID y consultar los promedios de calificación de los usuarios.
export const getRatingById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const item = await ratingsService.getById(id);

    if (!item) {
    res.status(404).json({ error: "Calificación no encontrada" });
    return;
    }

    res.json(item);
};
// GET /ratings/averages
export const getRatingAverages = async (_req: Request, res: Response) => {
  res.json(await ratingsService.getAverages());
};

import Boom from "@hapi/boom";
import type { Request, Response } from "express";
import { getUserId } from "../../middlewares/auth-placeholder";
import { isUuid } from "../../utils/uuid";
import { postsService } from "./posts.service";
import type { CreatePostInput } from "./posts.types";

const MIN_PRICE = 100;
const MAX_PRICE = 50000;
const MAX_TAGS = 3;

const requireString = (body: Record<string, unknown>, field: string): string => {
  const value = body[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw Boom.badRequest(`El campo ${field} es obligatorio`);
  }
  return value.trim();
};

const requireFiniteNumber = (body: Record<string, unknown>, field: string): number => {
  const value = body[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw Boom.badRequest(`El campo ${field} debe ser un número válido`);
  }
  return value;
};

// Pura (sin req/res) para poder probarla de forma unitaria. user_id lo aporta getUserId.
export const parseCreatePostBody = (
  body: unknown,
  userId: string
): CreatePostInput => {
  // Evita que Postgres falle al castear a uuid (500) con un user_id mal formado.
  if (!isUuid(userId)) {
    throw Boom.badRequest("user_id inválido");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw Boom.badRequest("Cuerpo de la solicitud inválido");
  }
  const data = body as Record<string, unknown>;

  const description = requireString(data, "description");
  const offer = requireString(data, "offer");
  const location = requireString(data, "location");
  const latitude = requireFiniteNumber(data, "latitude");
  const longitude = requireFiniteNumber(data, "longitude");

  const price = data.price;
  if (
    typeof price !== "number" ||
    !Number.isInteger(price) ||
    price < MIN_PRICE ||
    price > MAX_PRICE
  ) {
    throw Boom.badRequest(
      `El campo price debe ser un entero entre ${MIN_PRICE} y ${MAX_PRICE}`
    );
  }

  const rawTags = data.tags;
  if (
    !Array.isArray(rawTags) ||
    !rawTags.every((t): t is string => typeof t === "string" && t.trim() !== "")
  ) {
    throw Boom.badRequest("El campo tags debe ser una lista de textos no vacíos");
  }
  const tags = [...new Set(rawTags.map((t) => t.trim()))];
  if (tags.length < 1 || tags.length > MAX_TAGS) {
    throw Boom.badRequest(`Debes seleccionar entre 1 y ${MAX_TAGS} categorías`);
  }

  const input: CreatePostInput = {
    user_id: userId,
    description,
    offer,
    location,
    latitude,
    longitude,
    price,
    tags,
  };

  if (data.post_image !== undefined && data.post_image !== null) {
    if (typeof data.post_image !== "string") {
      throw Boom.badRequest("El campo post_image debe ser un texto");
    }
    input.post_image = data.post_image;
  }

  return input;
};

export const getPosts = async (_req: Request, res: Response) => {
  res.json(await postsService.getAll());
};

export const getPostById = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const item = await postsService.getById(id);

  if (!item) {
    res.status(404).json({ error: "Publicación no encontrada" });
    return;
  }

  res.json(item);
};

export const getPostTags = async (_req: Request, res: Response) => {
  res.json(await postsService.getTags());
};

export const createPost = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const input = parseCreatePostBody(req.body, userId);
  const post = await postsService.create(input);
  res.status(201).json(post);
};

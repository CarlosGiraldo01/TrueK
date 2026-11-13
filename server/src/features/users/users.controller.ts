import Boom from "@hapi/boom";
import type { Request, Response } from "express";
import { getUserId } from "../../middlewares/auth-placeholder";
import { isUuid } from "../../utils/uuid";
import { usersService } from "./users.service";
import type { UpdateUserInput } from "./users.types";

export const USER_MIN_AGE = 18;
export const USER_MAX_AGE = 120;
const MAX_NAME_LENGTH = 60;
const MAX_LOCATION_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

const EDITABLE_KEYS = new Set([
  "user_id",
  "name",
  "description",
  "profile_picture",
  "age",
  "location",
  "latitude",
  "longitude",
]);

const trimmedBetween = (value: unknown, max: number): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= max ? trimmed : undefined;
};

// Pura (sin req/res) para poder probarla de forma unitaria. user_id es la identidad del placeholder y se ignora.
export const parseUpdateUserBody = (body: unknown): UpdateUserInput => {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw Boom.badRequest("Cuerpo de la solicitud inválido");
  }
  const data = body as Record<string, unknown>;

  for (const key of Object.keys(data)) {
    if (!EDITABLE_KEYS.has(key)) {
      throw Boom.badRequest(`Campo no editable: ${key}`);
    }
  }

  const patch: UpdateUserInput = {};

  if (data.name !== undefined) {
    const name = trimmedBetween(data.name, MAX_NAME_LENGTH);
    if (name === undefined) {
      throw Boom.badRequest(`El campo name debe tener entre 1 y ${MAX_NAME_LENGTH} caracteres`);
    }
    patch.name = name;
  }

  if (data.location !== undefined) {
    const location = trimmedBetween(data.location, MAX_LOCATION_LENGTH);
    if (location === undefined) {
      throw Boom.badRequest(`El campo location debe tener entre 1 y ${MAX_LOCATION_LENGTH} caracteres`);
    }
    patch.location = location;
  }

  if (data.description !== undefined) {
    if (data.description === null) {
      patch.description = null;
    } else {
      const trimmed = typeof data.description === "string" ? data.description.trim() : undefined;
      if (trimmed === undefined || trimmed.length > MAX_DESCRIPTION_LENGTH) {
        throw Boom.badRequest(
          `El campo description debe ser un texto de máximo ${MAX_DESCRIPTION_LENGTH} caracteres`,
        );
      }
      patch.description = trimmed === "" ? null : trimmed;
    }
  }

  if (data.age !== undefined) {
    const age = data.age;
    if (typeof age !== "number" || !Number.isInteger(age) || age < USER_MIN_AGE || age > USER_MAX_AGE) {
      throw Boom.badRequest(`El campo age debe ser un entero entre ${USER_MIN_AGE} y ${USER_MAX_AGE}`);
    }
    patch.age = age;
  }

  if (data.profile_picture !== undefined) {
    if (data.profile_picture !== null && typeof data.profile_picture !== "string") {
      throw Boom.badRequest("El campo profile_picture debe ser un texto o null");
    }
    patch.profile_picture = data.profile_picture;
  }

  const { latitude, longitude } = data;
  if (latitude !== undefined || longitude !== undefined) {
    if (latitude === undefined || longitude === undefined) {
      throw Boom.badRequest("latitude y longitude deben enviarse juntas");
    }
    if (latitude === null && longitude === null) {
      patch.latitude = null;
      patch.longitude = null;
    } else if (latitude === null || longitude === null) {
      throw Boom.badRequest("latitude y longitude deben enviarse juntas");
    } else if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw Boom.badRequest("Coordenadas inválidas");
    } else {
      patch.latitude = latitude;
      patch.longitude = longitude;
    }
  }

  if (Object.keys(patch).length === 0) {
    throw Boom.badRequest("No hay campos para actualizar");
  }
  return patch;
};

export const getUsers = async (_req: Request, res: Response) => {
  res.json(await usersService.getAll());
};

export const getUserById = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const item = await usersService.getById(id);

  if (!item) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  res.json(item);
};

export const updateUser = async (req: Request, res: Response) => {
  const requesterId = getUserId(req);
  const id = String(req.params.id);
  if (!isUuid(id)) {
    throw Boom.badRequest("id de usuario inválido");
  }
  // 403 deliberado (a pedido del usuario) aunque la regla general prefiere 404 para recursos ajenos.
  if (requesterId !== id) {
    throw Boom.forbidden("Solo puedes editar tu propio perfil");
  }
  const patch = parseUpdateUserBody(req.body);
  const user = await usersService.update(id, patch);
  res.json(user);
};

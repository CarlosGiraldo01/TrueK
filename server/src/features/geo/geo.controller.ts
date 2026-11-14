import Boom from "@hapi/boom";
import type { Request, Response } from "express";
import { geoService } from "./geo.service";

export const GEOCODE_MIN_LENGTH = 3;
export const GEOCODE_MAX_LENGTH = 200;

export const geocodeAddress = async (req: Request, res: Response): Promise<void> => {
  const q = req.query.q;
  if (typeof q !== "string" || q.trim().length < GEOCODE_MIN_LENGTH) {
    throw Boom.badRequest(
      "El parámetro q es obligatorio y debe tener al menos 3 caracteres"
    );
  }
  const trimmed = q.trim();
  if (trimmed.length > GEOCODE_MAX_LENGTH) {
    throw Boom.badRequest("El parámetro q no puede superar 200 caracteres");
  }
  const result = await geoService.geocode(trimmed);
  res.status(200).json(result);
};

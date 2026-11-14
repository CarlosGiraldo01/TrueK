import Boom from "@hapi/boom";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { IMAGE_MAX_SIZE_MB } from "../features/uploads/uploads.constants";

// Errores 4xx de body-parser/http-errors (p. ej. JSON mal formado): marcan `expose: true`
// cuando su mensaje es seguro para el cliente. Sin esto, un body inválido acabaría en 500.
const isExposedClientError = (err: unknown): err is Error & { status: number } =>
  err instanceof Error &&
  "status" in err &&
  typeof err.status === "number" &&
  err.status >= 400 &&
  err.status < 500 &&
  "expose" in err &&
  err.expose === true;

const toBoom = (err: unknown): Boom.Boom => {
  if (Boom.isBoom(err)) return err;
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return Boom.entityTooLarge(`La imagen supera el tamaño máximo de ${IMAGE_MAX_SIZE_MB} MB`);
    }
    return Boom.badRequest('Subida inválida: envía un único archivo en el campo "file"');
  }
  if (isExposedClientError(err)) return new Boom.Boom(err.message, { statusCode: err.status });

  // Error inesperado (bug, fallo de BD): se registra en el servidor y el cliente solo recibe
  // el mensaje genérico de Boom para 500, nunca el mensaje ni el stack originales.
  console.error(err);
  return Boom.internal();
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const { statusCode, payload } = toBoom(err).output;
  res.status(statusCode).json(payload);
};

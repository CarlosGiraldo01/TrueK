import Boom from "@hapi/boom";
import type { NextFunction, Request, Response } from "express";
import { getUserId } from "../../middlewares/auth-placeholder";
import { isUuid } from "../../utils/uuid";

// Corre ANTES de multer para no parsear cuerpos multipart de peticiones sin identificar.
// Aún no se parseó el body, así que getUserId lee req.query.user_id.
// TODO(auth): /add-auth reemplaza este middleware por authMiddleware.
export const requireUploaderId = (req: Request, _res: Response, next: NextFunction): void => {
  if (!isUuid(getUserId(req))) {
    throw Boom.badRequest("user_id inválido");
  }
  next();
};

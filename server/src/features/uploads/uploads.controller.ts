import Boom from "@hapi/boom";
import type { Request, Response } from "express";
import { getUserId } from "../../middlewares/auth-placeholder";
import { isUuid } from "../../utils/uuid";
import { uploadsService } from "./uploads.service";

export const uploadImage = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!isUuid(userId)) {
    throw Boom.badRequest("user_id inválido");
  }
  if (!req.file) {
    throw Boom.badRequest('Falta la imagen en el campo "file"');
  }

  res.status(201).json(await uploadsService.uploadImage(userId, req.file));
};

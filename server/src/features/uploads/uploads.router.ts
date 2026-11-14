import Boom from "@hapi/boom";
import { Router } from "express";
import type { Request } from "express";
import multer from "multer";
import { IMAGE_MAX_SIZE_MB, IMAGE_MIME_TYPES } from "./uploads.constants";
import { uploadImage } from "./uploads.controller";
import { requireUploaderId } from "./uploads.middleware";

export const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(Boom.unsupportedMediaType("Solo se permiten imágenes png, jpeg o webp"));
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMAGE_MAX_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: imageFileFilter,
});

export const uploadsRouter = Router();

uploadsRouter.post("/images", requireUploaderId, upload.single("file"), uploadImage);

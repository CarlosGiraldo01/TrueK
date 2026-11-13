import Boom from "@hapi/boom";
import { randomUUID } from "node:crypto";
import { isUuid } from "../../utils/uuid";
import { IMAGE_EXTENSIONS, IMAGE_FILE_NAME_REGEX } from "./uploads.constants";
import { uploadsRepository } from "./uploads.repository";
import type { UploadedImage } from "./uploads.types";

export const buildImagePath = (userId: string, mimetype: string): string =>
  `${userId}/${randomUUID()}.${IMAGE_EXTENSIONS[mimetype]}`;

export const uploadsService = {
  uploadImage: async (userId: string, file: Express.Multer.File): Promise<UploadedImage> => {
    const path = buildImagePath(userId, file.mimetype);

    try {
      await uploadsRepository.upload(path, file.buffer, file.mimetype);
    } catch (err) {
      console.error(err);
      throw Boom.badGateway("No se pudo guardar la imagen");
    }

    return { url: uploadsRepository.getPublicUrl(path), path };
  },

  // Un simple startsWith(prefijo) se puede burlar con segmentos de punto
  // (`<id>/../<otro>/x.png`, `%2e%2e`) o con `?`/`#`. Por eso lo que sigue al
  // prefijo debe ser exactamente `<uuid>.<ext>`, el nombre que generamos nosotros.
  isUserImageUrl: (url: string, userId: string): boolean => {
    if (!isUuid(userId)) return false;
    const prefix = uploadsRepository.getPublicUrl(`${userId}/`);
    if (!url.startsWith(prefix)) return false;
    return IMAGE_FILE_NAME_REGEX.test(url.slice(prefix.length));
  },
};

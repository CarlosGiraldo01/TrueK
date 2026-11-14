export const IMAGE_MAX_SIZE_MB = 5;

export const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export const IMAGE_MIME_TYPES: string[] = Object.keys(IMAGE_EXTENSIONS);

// Nombre exacto que genera buildImagePath: <uuid>.<ext>, sin nada más.
export const IMAGE_FILE_NAME_REGEX = new RegExp(
  `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(${[...new Set(Object.values(IMAGE_EXTENSIONS))].join("|")})$`,
  "i",
);

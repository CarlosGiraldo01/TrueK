import { api } from "@/lib/api";

export const IMAGE_MAX_SIZE_MB = 5;
export const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

export interface UploadedImage {
  url: string;
  path: string;
}

// Devuelve un mensaje de error en español, o null si el archivo es válido
export const validateImageFile = (file: File): string | null => {
  if (!IMAGE_MIME_TYPES.includes(file.type)) {
    return "Solo se permiten imágenes png, jpeg o webp.";
  }
  if (file.size > IMAGE_MAX_SIZE_MB * 1024 * 1024) {
    return `La imagen supera el tamaño máximo de ${IMAGE_MAX_SIZE_MB} MB.`;
  }
  return null;
};

// user_id va en el query string: el servidor lo valida antes de leer el multipart.
// Sin Content-Type manual: axios agrega el boundary del FormData.
export const uploadImage = async (file: File, userId: string): Promise<UploadedImage> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<UploadedImage>("/uploads/images", formData, {
    params: { user_id: userId },
  });
  return res.data;
};

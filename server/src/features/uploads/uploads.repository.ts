import { config } from "../../config";
import { supabase } from "../../config/supabase";

const bucket = () => supabase.storage.from(config.imagesBucket);

export const uploadsRepository = {
  // Lanza el error de Supabase tal cual; el service decide cómo traducirlo.
  upload: async (path: string, buffer: Buffer, contentType: string): Promise<void> => {
    const { error } = await bucket().upload(path, buffer, { contentType });
    if (error) {
      throw error;
    }
  },

  getPublicUrl: (path: string): string => bucket().getPublicUrl(path).data.publicUrl,
};

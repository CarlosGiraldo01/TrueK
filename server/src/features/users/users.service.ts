import Boom from "@hapi/boom";
import { uploadsService } from "../uploads/uploads.service";
import { usersRepository } from "./users.repository";
import type { UpdateUserInput, User } from "./users.types";

export const usersService = {
  getAll: () => usersRepository.findAll(),
  getById: (id: string) => usersRepository.findById(id),
  update: async (id: string, patch: UpdateUserInput): Promise<User> => {
    if (typeof patch.profile_picture === "string" && !uploadsService.isUserImageUrl(patch.profile_picture, id)) {
      throw Boom.badRequest("La imagen no pertenece al usuario");
    }
    const user = await usersRepository.update(id, patch);
    if (!user) {
      throw Boom.notFound("Usuario no encontrado");
    }
    return user;
  },
};

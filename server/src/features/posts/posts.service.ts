import Boom from "@hapi/boom";
import { uploadsService } from "../uploads/uploads.service";
import { usersService } from "../users/users.service";
import { postsRepository } from "./posts.repository";
import type { CreatePostInput, Post } from "./posts.types";

export const postsService = {
  getAll: () => postsRepository.findAll(),
  getById: (id: string) => postsRepository.findById(id),
  getTags: () => postsRepository.findTags(),

  create: async (input: CreatePostInput): Promise<Post> => {
    if (input.post_image && !uploadsService.isUserImageUrl(input.post_image, input.user_id)) {
      throw Boom.badRequest("La imagen no pertenece al usuario");
    }

    const user = await usersService.getById(input.user_id);
    if (!user) {
      throw Boom.notFound("Usuario no encontrado");
    }

    const validTags = await postsRepository.findTags();
    const unknown = input.tags.find((tag) => !validTags.includes(tag));
    if (unknown !== undefined) {
      throw Boom.badRequest(`Categoría no válida: ${unknown}`);
    }

    const newId = await postsRepository.create({ ...input, name: user.name });
    const post = await postsRepository.findById(newId);
    if (!post) {
      throw Boom.internal("No se pudo recuperar la publicación creada");
    }
    return post;
  },
};

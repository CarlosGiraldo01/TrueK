import { postsRepository } from "./posts.repository";

export const postsService = {
  getAll: () => postsRepository.findAll(),
  getById: (id: string) => postsRepository.findById(id),
  getTags: () => postsRepository.findTags(),
};
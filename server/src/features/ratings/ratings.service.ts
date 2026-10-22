import { ratingsRepository } from "./ratings.repository";

export const ratingsService = {
  getAll: () => ratingsRepository.findAll(),
  getById: (id: string) => ratingsRepository.findById(id),
};
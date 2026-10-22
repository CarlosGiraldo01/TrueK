import { usersRepository } from "./users.repository";

export const usersService = {
  getAll: () => usersRepository.findAll(),
  getById: (id: string) => usersRepository.findById(id),
};
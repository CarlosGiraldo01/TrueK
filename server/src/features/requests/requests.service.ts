import { requestsRepository } from "./requests.repository";

export const requestsService = {
  getAll: () => requestsRepository.findAll(),
  getById: (id: string) => requestsRepository.findById(id),
};
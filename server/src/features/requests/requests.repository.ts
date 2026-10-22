import { requestsMock } from "./data.mock";

export const requestsRepository = {
  findAll: async () => requestsMock,
  findById: async (id: string) => requestsMock.find((item) => item.id === id),
};
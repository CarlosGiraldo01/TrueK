import { ratingsMock } from "./data.mock";

export const ratingsRepository = {
  findAll: async () => ratingsMock,
  findById: async (id: string) => ratingsMock.find((item) => item.id === id),
};
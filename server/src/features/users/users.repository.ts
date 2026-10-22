import { usersMock } from "./data.mock";

export const usersRepository = {
  findAll: async () => usersMock,
  findById: async (id: string) => usersMock.find((item) => item.id === id),
};
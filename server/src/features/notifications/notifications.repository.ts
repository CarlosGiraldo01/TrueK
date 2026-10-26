import { notificationsMock } from "./data.mock";

export const notificationsRepository = {
  findAll: async () => notificationsMock,
  findById: async (id: string) => notificationsMock.find((item) => item.id === id),
  findByUserId: async (userId: string) => notificationsMock.filter((item) => item.user_id === userId),
};
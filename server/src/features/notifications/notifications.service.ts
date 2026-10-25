import { notificationsRepository } from "./notifications.repository";
import type { NotificationType } from "./notifications.types";


const getByUser = async (userId: string, type?: NotificationType) => {
  const notifications = await notificationsRepository.findByUserId(userId);
  if (!type) return notifications;
  return notifications.filter((item) => item.type === type);
};

export const notificationsService = {
getAll: () => notificationsRepository.findAll(),
getById: (id: string) => notificationsRepository.findById(id),
getByUser,
};
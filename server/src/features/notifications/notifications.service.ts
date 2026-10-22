import { notificationsRepository } from "./notifications.repository";

export const notificationsService = {
getAll: () => notificationsRepository.findAll(),
getById: (id: string) => notificationsRepository.findById(id),
};
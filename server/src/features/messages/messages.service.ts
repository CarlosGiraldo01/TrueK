import { messagesRepository } from "./messages.repository";

export const messagesService = {
    getAll: (requestId?: string) => messagesRepository.findAll(requestId),
    getById: (id: string) => messagesRepository.findById(id),
};
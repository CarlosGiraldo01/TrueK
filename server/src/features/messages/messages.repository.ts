import { messagesMock } from "./data.mock";

export const messagesRepository = {
  findAll: async (requestId?: string) =>
    requestId ? messagesMock.filter((m) => m.service_request_id === requestId) : messagesMock,
  findById: async (id: string) => messagesMock.find((item) => item.id === id),
};
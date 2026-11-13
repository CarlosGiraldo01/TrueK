import Boom from "@hapi/boom";
import { requestsService } from "../requests/requests.service";
import { messagesRepository } from "./messages.repository";
import type { CreateMessageInput, Message } from "./messages.types";

const create = async (input: CreateMessageInput): Promise<Message> => {
  const request = await requestsService.getById(input.service_request_id);
  if (!request) {
    throw Boom.notFound("Solicitud no encontrada");
  }

  // 403 deliberado (a pedido del usuario) aunque la regla general prefiere 404 para recursos ajenos.
  if (request.client_id !== input.sender_id && request.provider_id !== input.sender_id) {
    throw Boom.forbidden("No participaste en esta solicitud");
  }

  if (request.status === "cancelled" || request.status === "rejected") {
    throw Boom.conflict("No puedes enviar mensajes en una solicitud cancelada o rechazada");
  }

  return messagesRepository.create({
    service_request_id: request.id,
    sender_id: input.sender_id,
    content: input.content,
  });
};

export const messagesService = {
  create,
  getAll: (requestId?: string) => messagesRepository.findAll(requestId),
  getById: (id: string) => messagesRepository.findById(id),
};

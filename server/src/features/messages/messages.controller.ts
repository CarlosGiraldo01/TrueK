import Boom from "@hapi/boom";
import type { Request, Response } from "express";
import { getUserId } from "../../middlewares/auth-placeholder";
import { isUuid } from "../../utils/uuid";
import { messagesService } from "./messages.service";
import type { CreateMessageInput } from "./messages.types";

export const MESSAGE_MAX_LENGTH = 1000;

// Pura (sin req/res) para poder probarla de forma unitaria. sender_id lo aporta getUserId.
export const parseCreateMessageBody = (body: unknown, senderId: string): CreateMessageInput => {
  if (!isUuid(senderId)) {
    throw Boom.badRequest("user_id inválido");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw Boom.badRequest("Cuerpo de la solicitud inválido");
  }
  const data = body as Record<string, unknown>;

  const requestId = data.service_request_id;
  if (typeof requestId !== "string" || !isUuid(requestId)) {
    throw Boom.badRequest("El campo service_request_id debe ser un id válido");
  }

  const content = typeof data.content === "string" ? data.content.trim() : "";
  if (content === "") {
    throw Boom.badRequest("El mensaje no puede estar vacío");
  }
  if (content.length > MESSAGE_MAX_LENGTH) {
    throw Boom.badRequest(`El mensaje no puede superar ${MESSAGE_MAX_LENGTH} caracteres`);
  }

  return { sender_id: senderId, service_request_id: requestId, content };
};

export const createMessage = async (req: Request, res: Response) => {
  const senderId = getUserId(req);
  const input = parseCreateMessageBody(req.body, senderId);
  res.status(201).json(await messagesService.create(input));
};


export const getMessages = async (req: Request, res: Response) => {
   const requestId = typeof req.query.service_request_id === "string" ? req.query.service_request_id : undefined; 
   res.json(await messagesService.getAll(requestId));
};

export const getMessageById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const item = await messagesService.getById(id);

    if (!item) {
        res.status(404).json({ error: "Mensaje no encontrado" });
        return;
    }
     res.json(item);
};
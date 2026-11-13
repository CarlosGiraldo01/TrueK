import Boom from "@hapi/boom";
import type { Request, Response } from "express";
import { getUserId } from "../../middlewares/auth-placeholder";
import { isUuid } from "../../utils/uuid";
import { requestsService } from "./requests.service";
import type { CreateRequestInput, RequestAction, ServiceStatus } from "./requests.types";

const STATUSES: ServiceStatus[] = ["pending", "accepted", "rejected", "active", "finished", "cancelled"];
const ACTIONS: RequestAction[] = ["accept", "reject", "finish"];
export const MIN_HOURS = 1;
export const MAX_HOURS = 12;
const MAX_ADDRESS_LENGTH = 200;
const ALLOWED_CREATE_KEYS = ["user_id", "post_id", "meeting_address", "meeting_date", "hours", "request_image"];

// Pura (sin req/res) para poder probarla de forma unitaria. user_id lo aporta getUserId.
export const parseCreateRequestBody = (body: unknown): CreateRequestInput => {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw Boom.badRequest("Cuerpo de la solicitud inválido");
  }
  const data = body as Record<string, unknown>;

  for (const key of Object.keys(data)) {
    if (!ALLOWED_CREATE_KEYS.includes(key)) {
      throw Boom.badRequest(`Campo no editable: ${key}`);
    }
  }

  const postId = data.post_id;
  if (typeof postId !== "string" || !isUuid(postId)) {
    throw Boom.badRequest("post_id inválido");
  }

  const address = typeof data.meeting_address === "string" ? data.meeting_address.trim() : "";
  if (address.length < 1 || address.length > MAX_ADDRESS_LENGTH) {
    throw Boom.badRequest(`El campo meeting_address debe tener entre 1 y ${MAX_ADDRESS_LENGTH} caracteres`);
  }

  const hours = data.hours;
  if (typeof hours !== "number" || !Number.isInteger(hours) || hours < MIN_HOURS || hours > MAX_HOURS) {
    throw Boom.badRequest(`Las horas deben ser un número entre ${MIN_HOURS} y ${MAX_HOURS}`);
  }

  const timestamp = typeof data.meeting_date === "string" ? Date.parse(data.meeting_date) : NaN;
  if (Number.isNaN(timestamp) || timestamp <= Date.now()) {
    throw Boom.badRequest("meeting_date debe ser una fecha futura");
  }

  const input: CreateRequestInput = {
    post_id: postId,
    meeting_address: address,
    meeting_date: new Date(timestamp).toISOString(),
    hours,
  };

  if (data.request_image !== undefined) {
    if (data.request_image !== null && typeof data.request_image !== "string") {
      throw Boom.badRequest("El campo request_image debe ser un texto o null");
    }
    input.request_image = data.request_image;
  }

  return input;
};
//controlador de solicitudes del backend de Truek. 
//Recibe las peticiones del frontend y se conecta con requestsService para consultar las solicitudes, buscar una solicitud específica
export const getRequests = async (_req: Request, res: Response) => {
  res.json(await requestsService.getAll());
};

export const getRequestById = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const item = await requestsService.getById(id);

  if (!item) {
    res.status(404).json({ error: "Solicitud no encontrada" });
    return;
  }

  res.json(item);
};


export const getCurrentRequest = async (req: Request, res: Response) => {
  const userId = String(req.params.userId);
  res.json(await requestsService.getCurrent(userId));
};


export const getQuote = async (req: Request, res: Response) => {
  const postId = typeof req.query.post_id === "string" ? req.query.post_id : "";
  const hours = Number(req.query.hours);

  if (!postId) {
    res.status(400).json({ error: "Falta el post_id" });
    return;
  }

  if (!Number.isInteger(hours) || hours < MIN_HOURS || hours > MAX_HOURS) {
    res.status(400).json({ error: `Las horas deben ser un número entre ${MIN_HOURS} y ${MAX_HOURS}` });
    return;
  }

  const quote = await requestsService.getQuote(postId, hours);

  if (!quote) {
    res.status(404).json({ error: "Publicación no encontrada" });
    return;
  }

  res.json(quote);
};


export const getTransition = async (req: Request, res: Response) => {
  const status = req.query.status as ServiceStatus;
  const action = req.query.action as RequestAction;

  if (!STATUSES.includes(status)) {
    res.status(400).json({ error: "Estado no válido" });
    return;
  }

  if (!ACTIONS.includes(action)) {
    res.status(400).json({ error: "Acción no válida" });
    return;
  }

  const transition = requestsService.getTransition(status, action);

  if (!transition) {
    res.status(400).json({ error: `No se puede hacer "${action}" con una solicitud en estado "${status}"` });
    return;
  }

  res.json(transition);
};


export const createRequest = async (req: Request, res: Response) => {
  const clientId = getUserId(req);
  if (!isUuid(clientId)) {
    throw Boom.badRequest("user_id inválido");
  }
  const input = parseCreateRequestBody(req.body);
  const request = await requestsService.create(clientId, input);
  res.status(201).json(request);
};

import type { Request, Response } from "express";
import { requestsService } from "./requests.service";
import type { RequestAction, ServiceStatus } from "./requests.types";

const STATUSES: ServiceStatus[] = ["pending", "accepted", "rejected", "active", "finished", "cancelled"];
const ACTIONS: RequestAction[] = ["accept", "reject", "finish"];
const MAX_HOURS = 12;

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

// GET /requests/current/:userId
export const getCurrentRequest = async (req: Request, res: Response) => {
  const userId = String(req.params.userId);
  res.json(await requestsService.getCurrent(userId));
};

// GET /requests/quote?post_id=p1&hours=2
export const getQuote = async (req: Request, res: Response) => {
  const postId = typeof req.query.post_id === "string" ? req.query.post_id : "";
  const hours = Number(req.query.hours);

  if (!postId) {
    res.status(400).json({ error: "Falta el post_id" });
    return;
  }

  if (!Number.isInteger(hours) || hours < 1 || hours > MAX_HOURS) {
    res.status(400).json({ error: `Las horas deben ser un número entre 1 y ${MAX_HOURS}` });
    return;
  }

  const quote = await requestsService.getQuote(postId, hours);

  if (!quote) {
    res.status(404).json({ error: "Publicación no encontrada" });
    return;
  }

  res.json(quote);
};

// GET /requests/transition?status=pending&action=accept
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

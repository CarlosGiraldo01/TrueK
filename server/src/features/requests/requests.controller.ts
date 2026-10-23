import type { Request, Response } from "express";
import { requestsService } from "./requests.service";

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
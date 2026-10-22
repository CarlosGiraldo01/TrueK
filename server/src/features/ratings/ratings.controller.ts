import type { Request, Response } from "express";
import { ratingsService } from "./ratings.service";

export const getRatings = async (_req: Request, res: Response) => {
  res.json(await ratingsService.getAll());
};

export const getRatingById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const item = await ratingsService.getById(id);

    if (!item) {
    res.status(404).json({ error: "Calificación no encontrada" });
    return;
    }

    res.json(item);
};
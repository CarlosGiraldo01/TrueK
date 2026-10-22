import type { Request, Response } from "express";
import { postsService } from "./posts.service";

export const getPosts = async (_req: Request, res: Response) => {
  res.json(await postsService.getAll());
};

export const getPostById = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const item = await postsService.getById(id);

  if (!item) {
    res.status(404).json({ error: "Publicación no encontrada" });
    return;
  }

  res.json(item);
};

export const getPostTags = async (_req: Request, res: Response) => {
  res.json(await postsService.getTags());
};
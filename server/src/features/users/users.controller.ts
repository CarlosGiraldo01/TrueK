import type { Request, Response } from "express";
import { usersService } from "./users.service";

export const getUsers = async (_req: Request, res: Response) => {
  res.json(await usersService.getAll());
};

export const getUserById = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const item = await usersService.getById(id);

  if (!item) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  res.json(item);
};
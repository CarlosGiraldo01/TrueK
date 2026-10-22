import type { Request, Response } from "express";
import { notificationsService } from "./notifications.service";

export const getNotifications = async (_req: Request, res: Response) => {
    res.json(await notificationsService.getAll());
};

export const getNotificationById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const item = await notificationsService.getById(id);

    if(!item) {
        res.status(404).json({error: "Notificación no encontrada"});
        return;
    }

    res.json(item);
};
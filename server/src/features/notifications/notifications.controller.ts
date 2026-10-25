import type { Request, Response } from "express";
import { notificationsService } from "./notifications.service";
import type { NotificationType } from "./notifications.types";

const TYPES: NotificationType[] = ["incoming_services", "services_finished", "request_accepted", "request_rejected"];

// GET /notifications  o  GET /notifications?user_id=u2&type=incoming_services
export const getNotifications = async (req: Request, res: Response) => {
    const userId = typeof req.query.user_id === "string" ? req.query.user_id : undefined;
    const type = req.query.type as NotificationType | undefined;

    if (type && !TYPES.includes(type)) {
        res.status(400).json({ error: "Tipo de aviso no válido" });
        return;
    }

    if (!userId) {
        res.json(await notificationsService.getAll());
        return;
    }

    res.json(await notificationsService.getByUser(userId, type));
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
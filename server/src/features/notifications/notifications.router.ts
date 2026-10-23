import { Router } from "express";
import { getNotifications, getNotificationById } from "./notifications.controller";

export const notificationsRouter = Router();

notificationsRouter.get("/", getNotifications);
notificationsRouter.get("/:id", getNotificationById);
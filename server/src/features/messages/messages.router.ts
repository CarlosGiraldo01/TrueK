import { Router } from "express";
import { getMessages, getMessageById } from "./messages.controller";

export const messagesRouter = Router();

messagesRouter.get("/", getMessages);
messagesRouter.get("/:id", getMessageById);

import { Router } from "express";
import { createMessage, getMessages, getMessageById } from "./messages.controller";

export const messagesRouter = Router();

messagesRouter.get("/", getMessages);
messagesRouter.post("/", createMessage);
messagesRouter.get("/:id", getMessageById);

import type { Request, Response } from "express";
import { messagesService } from "./messages.service";

export const getMessages = async (req: Request, res: Response) => {
   const requestId = typeof req.query.service_request_id === "string" ? req.query.service_request_id : undefined; 
   res.json(await messagesService.getAll(requestId));
};

export const getMessageById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const item = await messagesService.getById(id);

    if (!item) {
        res.status(404).json({ error: "Mensaje no encontrado" });
        return;
    }
     res.json(item);
};
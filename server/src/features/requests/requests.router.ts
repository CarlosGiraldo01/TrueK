import { Router } from "express";
import { getRequests, getRequestById } from "./requests.controller";

export const requestsRouter = Router();

requestsRouter.get("/", getRequests);
requestsRouter.get("/:id", getRequestById);
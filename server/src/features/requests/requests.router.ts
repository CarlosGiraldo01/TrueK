import { Router } from "express";
import { getRequests, getRequestById,getCurrentRequest,getQuote,getTransition } from "./requests.controller";

export const requestsRouter = Router();

requestsRouter.get("/", getRequests);
requestsRouter.get("/current/:userId", getCurrentRequest);
requestsRouter.get("/quote", getQuote);
requestsRouter.get("/transition",getTransition);
requestsRouter.get("/:id", getRequestById);
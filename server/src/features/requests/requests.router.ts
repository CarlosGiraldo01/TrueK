import { Router } from "express";
import { getRequests, getRequestById,getCurrentRequest,getQuote,getTransition,createRequest } from "./requests.controller";

export const requestsRouter = Router();

requestsRouter.get("/", getRequests);
requestsRouter.post("/", createRequest);
requestsRouter.get("/current/:userId", getCurrentRequest);
requestsRouter.get("/quote", getQuote);
requestsRouter.get("/transition",getTransition);
requestsRouter.get("/:id", getRequestById);//rutas
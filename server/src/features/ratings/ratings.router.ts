import { Router } from "express";
import { getRatings, getRatingById } from "./ratings.controller";

export const ratingsRouter = Router();

ratingsRouter.get("/", getRatings);
ratingsRouter.get("/:id", getRatingById);
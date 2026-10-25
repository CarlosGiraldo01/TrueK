import { Router } from "express";
import { getRatings, getRatingById, getRatingAverages } from "./ratings.controller";

export const ratingsRouter = Router();

ratingsRouter.get("/", getRatings);
ratingsRouter.get("/averages", getRatingAverages)
ratingsRouter.get("/:id", getRatingById);
import { Router } from "express";
import { getRatings, getRatingById, getRatingAverages, createRating } from "./ratings.controller";

export const ratingsRouter = Router();

ratingsRouter.get("/", getRatings);
ratingsRouter.post("/", createRating);
ratingsRouter.get("/averages", getRatingAverages)
ratingsRouter.get("/:id", getRatingById);

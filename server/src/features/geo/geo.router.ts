import { Router } from "express";
import { geocodeAddress } from "./geo.controller";

export const geoRouter = Router();

geoRouter.get("/", geocodeAddress);

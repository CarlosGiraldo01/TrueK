import { Router } from "express";
import { getUsers, getUserById} from "./users.controller";

export const usersRouter = Router();

usersRouter.get("/", getUsers);
usersRouter.get ("/:id", getUserById);
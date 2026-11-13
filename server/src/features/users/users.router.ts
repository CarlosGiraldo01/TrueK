import { Router } from "express";
import { getUsers, getUserById, updateUser } from "./users.controller";

export const usersRouter = Router();

usersRouter.get("/", getUsers);
usersRouter.get("/:id", getUserById);
usersRouter.patch("/:id", updateUser);

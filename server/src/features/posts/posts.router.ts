import { Router } from "express";
import { getPosts, getPostById, getPostTags } from "./posts.controller";

export const postsRouter = Router();

postsRouter.get("/", getPosts);
postsRouter.get("/tags", getPostTags);
postsRouter.get("/:id", getPostById);
import { Router } from "express";
import { getPosts, getPostById, getPostTags, createPost } from "./posts.controller";

export const postsRouter = Router();

postsRouter.get("/", getPosts);
postsRouter.get("/tags", getPostTags);
postsRouter.post("/", createPost);
postsRouter.get("/:id", getPostById);

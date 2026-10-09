import express from "express";
import authmiddleware from "../middlewares/authmiddleware.js";
import {
  getHomeFeed,
  post,
  updateLike,
} from "../controllers/post.controller.js";
import { getAllPost } from './../controllers/post.controller.js';
import upload from './../utils/upload.js';
const postRoutes=express.Router()
postRoutes.post("/post",authmiddleware,upload.single("image"),post)
postRoutes.get("/feed",authmiddleware,getHomeFeed)
postRoutes.get("/posts",authmiddleware,getAllPost)
postRoutes.post("/:post_id/like",authmiddleware,updateLike)
export default postRoutes
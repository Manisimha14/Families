import express from "express"
import authmiddleware from "../middlewares/authmiddleware.js"
import upload from './../utils/upload.js';
import { createStory,getStories } from "../controllers/story.controller.js";
const storyRouter= express.Router()
storyRouter.post(
  "/createStory",
  authmiddleware,
  upload.single("image"),
  createStory,
);
storyRouter.get("/getStory", authmiddleware, getStories);
export default storyRouter
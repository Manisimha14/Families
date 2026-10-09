import registerUser, {
  getProfile,
  loginUser,
  getUsersProfile,
  searchUsers,
  getUserRecommendations,
  followUser,
  unfollowUser,
} from "../controllers/user.controller.js";

import express from "express"
import authmiddleware from "../middlewares/authmiddleware.js"
const userRoutes=express.Router()
userRoutes.post("/register",registerUser)
userRoutes.post("/login",loginUser)
userRoutes.get("/me", authmiddleware,getProfile);
userRoutes.get("/search", authmiddleware, searchUsers);
userRoutes.get("/recommendations", authmiddleware, getUserRecommendations);
userRoutes.post("/:id/follow", authmiddleware, followUser);
userRoutes.delete("/:id/follow", authmiddleware, unfollowUser);
userRoutes.get("/profile/:user_name",getUsersProfile)
export default userRoutes
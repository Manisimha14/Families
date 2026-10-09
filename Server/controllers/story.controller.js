import { User } from "../models/user.model.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import Story from "./../models/story.model.js";
const STORY_LIFETIME = 24 * 60 * 60 * 1000;
export const createStory = async (req, res) => {
  try {
    const { caption } = req.body;
    let image;

    if (caption.length > 200) {
      res
        .status(400)
        .json({ message: "Caption should be less than 200 characters" });
    }

    if (!req.file) {
      res.status(404).json({ message: "No Content to Upload" });
    }

    if (req.file) {
      let upoloadedImage = await uploadToCloudinary(req.file.buffer);
      image = upoloadedImage.secure_url;
      console.log(image);
    }

    const story = await Story.create({
      caption,
      author: req.user_id,
      image,
      expiresAt: new Date(Date.now() + STORY_LIFETIME),
    });

    await User.findByIdAndUpdate(req.user_id, {
      $push: { stories: story._id },
    });

    const populatedStory = await Story.findById(story._id).populate(
      "author",
      "user_name ",
    );

    res.status(201).json({ message: "Story Created", story: populatedStory });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
export const getStories = async (req, res) => {
  try {
    const user_id = req.user_id;
    const currentUser= await User.findById(user_id)
    

    const allowedUsers = [req.user_id, ...(currentUser.following || [])];

    const stories = await Story.find({
      author: { $in: allowedUsers },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate("author", "user_name");

    res.status(200).json({ message: "Stories Fetched", stories: stories });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import gentoken from "../utils/jwt.js";
import mongoose from "mongoose";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};
const registerUser = async (req, res) => {
  try {
    const { name, user_name, email, password } = req.body || {};
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedUsername =
      typeof user_name === "string" ? user_name.trim() : "";
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (
      !normalizedName ||
      !normalizedUsername ||
      !normalizedEmail ||
      typeof password !== "string"
    ) {
      return res.status(422).json({ message: "Please complete all fields." });
    }
    if (password.length < 7) {
      return res
        .status(400)
        .json({ message: "Password must be at least 7 characters." });
    }

    const [usernameExists, emailExists] = await Promise.all([
      User.findOne({ user_name: normalizedUsername }),
      User.findOne({ email: normalizedEmail }),
    ]);
    if (usernameExists) {
      return res
        .status(409)
        .json({ message: "That username is already taken." });
    }
    if (emailExists) {
      return res
        .status(409)
        .json({ message: "An account with that email already exists." });
    }

    const hashpassword = bcrypt.hashSync(password, 10);
    await User.create({
      name: normalizedName,
      user_name: normalizedUsername,
      email: normalizedEmail,
      password: hashpassword,
    });

    return res.status(201).json({ message: "Your account has been created." });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      const message =
        duplicateField === "email"
          ? "An account with that email already exists."
          : "That username is already taken.";
      return res.status(409).json({ message });
    }

    console.error("Account registration failed:", error);
    return res.status(500).json({
      message: "We could not create your account right now. Please try again.",
    });
  }
};
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(422).json({ message: "Email Enter Cheyyu" });
    }
    const userExists = await User.findOne({ email });
    if (!userExists) {
      return res.status(400).json({ message: "Levu Mama Nuvvu" });
    }
    const correctPassword = bcrypt.compareSync(password, userExists.password);
    if (!correctPassword) {
      return res.status(420).json({ message: "Password Does not matches" });
    }
    const token = gentoken(userExists._id);
    res.cookie("jwttoken", token, cookieOptions);
    res.json({ message: "Success" });
  } catch (error) {
    return res.status(500).json({ error });
  }
};
export const getProfile = async (req, res) => {
  try {
    const user_id = req.user_id;
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).json({ message: "No user Exists" });
    }
    res
      .status(201)
      .json({ sucess: true, message: "User Fetched Successfully", user: user });
  } catch (error) {
    return res.status(500).json({ error });
  }
};
export const getUsersProfile = async (req, res) => {
  try {
    const { user_name } = req.params;
    const user = await User.findOne({ user_name: user_name })
      .select("-password")
      .populate("followers", "name user_name profileImage")
      .populate("following", "name user_name profileImage ");
    if (!user) {
      return res.status(400).json({ message: "No user Exists" });
    }
    res.status(201).json({
      sucess: true,
      message: "User Fetched Successfully",
      user: user,
    });
  } catch (error) {
    return res.status(500).json({ error });
  }
};
const publicUserFields = "name user_name profileImage bio followers";
const discoveryLimit = 20;

const toPublicDiscoveryUser = (candidate, { isFollowing, mutualCount = 0, reason }) => ({
  _id: candidate._id,
  name: candidate.name,
  user_name: candidate.user_name,
  profileImage: candidate.profileImage,
  bio: candidate.bio,
  followerCount: candidate.followers?.length || 0,
  isFollowing,
  mutualCount,
  reason,
});

export const searchUsers = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (query.length < 2 || query.length > 80) {
      return res.status(400).json({ message: "Search must be between 2 and 80 characters." });
    }

    const currentUser = await User.findById(req.user_id).select("following");
    if (!currentUser) {
      return res.status(404).json({ message: "No user Exists" });
    }

    const searchTerm = query.startsWith("@") ? query.slice(1) : query;
    const safeQuery = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = await User.find({
      _id: { $ne: currentUser._id },
      $or: [
        { name: { $regex: safeQuery, $options: "i" } },
        { user_name: { $regex: safeQuery, $options: "i" } },
      ],
    })
      .select(publicUserFields)
      .sort({ user_name: 1 })
      .limit(discoveryLimit)
      .lean();

    const followingIds = new Set(
      (currentUser.following || []).map((id) => id.toString()),
    );
    const users = matches.map((candidate) => {
      const mutualCount = (candidate.followers || []).filter((id) =>
        followingIds.has(id.toString()),
      ).length;
      return toPublicDiscoveryUser(candidate, {
        isFollowing: followingIds.has(candidate._id.toString()),
        mutualCount,
        reason: mutualCount
          ? `${mutualCount} mutual ${mutualCount === 1 ? "connection" : "connections"}`
          : "Search result",
      });
    });

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Could not search users." });
  }
};

export const getUserRecommendations = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user_id).select("following");
    if (!currentUser) {
      return res.status(404).json({ message: "No user Exists" });
    }

    const currentFollowing = currentUser.following || [];
    const followingIds = currentFollowing.map((id) => id.toString());
    const excludedIds = [currentUser._id, ...currentFollowing];
    const followedUsers = followingIds.length
      ? await User.find({ _id: { $in: currentFollowing } })
          .select("following")
          .lean()
      : [];
    const mutualCandidates = new Set(
      followedUsers.flatMap((followedUser) =>
        (followedUser.following || []).map((id) => id.toString()),
      ),
    );
    const suggestionIds = [...mutualCandidates]
      .filter((id) => !excludedIds.some((excludedId) => excludedId.toString() === id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const personalized = suggestionIds.length
      ? await User.find({ _id: { $in: suggestionIds } })
          .select(publicUserFields)
          .lean()
      : [];
    const personalizedById = new Map(
      personalized.map((candidate) => [candidate._id.toString(), candidate]),
    );
    const suggestions = suggestionIds
      .map((id) => personalizedById.get(id.toString()))
      .filter(Boolean)
      .map((candidate) => {
        const mutualCount = (candidate.followers || []).filter((id) =>
          followingIds.includes(id.toString()),
        ).length;
        return {
          candidate,
          mutualCount,
          reason: `${mutualCount} mutual ${mutualCount === 1 ? "connection" : "connections"}`,
        };
      })
      .sort((a, b) => b.mutualCount - a.mutualCount)
      .slice(0, discoveryLimit);

    const fallbackLimit = discoveryLimit - suggestions.length;
    const popular = fallbackLimit
      ? await User.aggregate([
          {
            $match: {
              _id: {
                $nin: [...excludedIds, ...suggestions.map(({ candidate }) => candidate._id)],
              },
            },
          },
          {
            $addFields: {
              followerCount: { $size: { $ifNull: ["$followers", []] } },
            },
          },
          { $sort: { followerCount: -1, user_name: 1 } },
          { $limit: fallbackLimit },
          {
            $project: {
              name: 1,
              user_name: 1,
              profileImage: 1,
              bio: 1,
              followers: 1,
              followerCount: 1,
            },
          },
        ])
      : [];

    const users = [
      ...suggestions.map(({ candidate, mutualCount, reason }) =>
        toPublicDiscoveryUser(candidate, { isFollowing: false, mutualCount, reason }),
      ),
      ...popular.map((candidate) =>
        toPublicDiscoveryUser(candidate, {
          isFollowing: false,
          reason: "Popular in Commonplace",
        }),
      ),
    ];

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Could not load recommendations." });
  }
};

export const followUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id." });
    }
    if (id.toString() === req.user_id.toString()) {
      return res.status(400).json({ message: "You cannot Follow yourselves" });
    }
    const user = await User.findById(req.user_id);
    const userToFollow = await User.findById(id);
    if (!user || !userToFollow) {
      return res.status(400).json({ message: "No user Exists" });
    }
    const alreadyFollowing = user.following.some((ids) => {
      return ids.toString() === id.toString();
    });
    if (alreadyFollowing) {
      return res
        .status(400)
        .json({ message: "You already follow this person." });
    }

    await User.findByIdAndUpdate(req.user_id, {
      $addToSet: { following: id },
    });
    await User.findByIdAndUpdate(id, {
      $addToSet: { followers: req.user_id },
    });

    return res.status(200).json({
      message: "You followed The user successfully",
      following: true,
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not follow this user." });
  }
};
export const unfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id." });
    }
    if (id.toString() === req.user_id.toString()) {
      return res.status(400).json({ message: "You cannot unfollow yourselves" });
    }

    const user = await User.findById(req.user_id);
    const userToFollow = await User.findById(id);
    if (!user || !userToFollow) {
      return res.status(400).json({ message: "No user Exists" });
    }

    await Promise.all([
      User.findByIdAndUpdate(req.user_id, { $pull: { following: id } }),
      User.findByIdAndUpdate(id, { $pull: { followers: req.user_id } }),
    ]);

    return res.status(200).json({
      message: "You unfollowed this user.",
      following: false,
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not unfollow this user." });
  }
};

export default registerUser;

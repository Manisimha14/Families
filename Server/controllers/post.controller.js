
import Post from "../models/post.model.js";
import { User } from "../models/user.model.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js"



export const post = async (req,res)=>{
  try {
    const user_id = req.user_id;
    if (!user_id) {
      return res.status(400).json({ message: "Please Login first" });
    }
    const { caption } = req.body;
    const image = req.file;
    if (!caption) {
      return res.status(400).json({ message: "Caption Is requiered" });
    }
    if (caption.length > 500) {
      return res.status(400).json({ message: "Caption Length is to large" });
    }
    if (image) {
      const imageupload = await uploadToCloudinary(image.buffer);
      const url=imageupload.secure_url
      if(!url){
        return res.status(520).json({message:"Clodinary Upload Error In Backend"})
      }else{
        const newPost=await Post.create({author:user_id,caption:caption,image:url})
        await User.findByIdAndUpdate(user_id, {
          $push: { posts: newPost._id },
        });
        return res.status(200).json({message:"New Post Created",post:newPost})
      }
    }else{
        const newPost = await Post.create({
          author: user_id,
          caption: caption,
        });
        await User.findByIdAndUpdate(user_id,{$push:{posts:newPost._id}})
        return res
          .status(200)
          .json({ message: "New Post Created", post: newPost });
    }
    
  } catch (error) {
    return res.status(500).json({message:"Internal Server Error",error:error})
  }


}
export const getHomeFeed= async (req,res)=>{
    try {
        const user_id = req.user_id;
        if (!user_id) {
          return res.status(400).json({ message: "Please Login first" });
        }
        const user = await User.findById(user_id);
        const feeduser = [user_id, ...user.following, ...user.followers];
        const posts=await Post.find({author:{$in:feeduser}}).populate("author","name").sort({createdAt:-1})
        return res.status(200).json({message:"Posts fetched Successfully",posts:posts})
      
    } catch (error) {
        return res.status(500).json({message:"Internal Server Error",error:error})
        
    }
   


}
export const getAllPost= async (req,res)=>{
    try {
        const user_id = req.user_id;
        if (!user_id) {
          return res.status(400).json({ message: "Please Login first" });
        }
        const user = await User.findById(user_id);
        const posts = await Post.find()
          .populate("author", "name")
          .sort({ createdAt: -1 });
        return res
          .status(200)
          .json({ message: "Posts fetched Successfully", posts: posts });
    } catch (error) {
        return res
          .status(500)
          .json({ message: "Internal Server Error", error: error });
    }
}
export const updateLike = async(req,res)=>{
    try {
        const {post_id}=req.params
        const user_id = req.user_id;
        if (!user_id) {
          return res.status(400).json({ message: "Please Login first" });
        }
        const requiredPost=await Post.findById(post_id)
        if (!requiredPost) {
          return res.status(404).json({ message: "Post not found" });
        }
        const alreadyLiked=requiredPost.likes.some(
          (likedUserId) => likedUserId.toString() === user_id.toString(),
        )
        if(alreadyLiked){
            requiredPost.likes.pull(user_id)
        }else{
            requiredPost.likes.push(user_id)
        }
        await requiredPost.save()
        return res.status(200).json({
          message:"Successfully Updated Like",
          liked: !alreadyLiked,
          totallikes: requiredPost.likes.length,
        })

    } catch (error) {
        return res
          .status(500)
          .json({ message: "Internal Server Error", error: error });
    }

}
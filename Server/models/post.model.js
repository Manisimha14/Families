import mongoose, { Schema, trusted }  from "mongoose";
import { User } from "./user.model.js";
const postSchema = new Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  image: {
    type: String,
  },
  likes:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
        
    }
  ]
},{timestamps:true});
const Post = mongoose.model("Post",postSchema)
export default Post
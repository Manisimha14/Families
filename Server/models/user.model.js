import mongoose from "mongoose";
import Post from "./post.model.js";
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  user_name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password:{
    type:String,
    required:true
  },
  bio: {
    type: String,
   
  },
  followers:[
    // array of object_id
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
    }
  ],
  following:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
    }

  ],
  posts:[
    {type:mongoose.Schema.Types.ObjectId,
      ref:"Post"
    }

  ],
  profileImage:{
    type:String
  }
});
export const User=mongoose.model("User",userSchema)
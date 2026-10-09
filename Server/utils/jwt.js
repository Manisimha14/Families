import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import "dotenv/config";
const gentoken=(user_id)=>{
    return jwt.sign({ user_id }, process.env.JWT_SECRET,{expiresIn:"7d"});

}
export default gentoken
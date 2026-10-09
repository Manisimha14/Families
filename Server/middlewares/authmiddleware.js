import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const authmiddleware= async (req,res,next)=>{
    try {
        const token = req.cookies.jwttoken;
        if(!token){
            return res.status(404).json({message:"Unauthorised"})
        }else{
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user_id=decoded.user_id

           
            next()
        }

    } catch (error) {
        return res.status(501).json({message:"Internal Server error"})
        
    }
}
export default authmiddleware
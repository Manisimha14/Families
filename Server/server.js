import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import http from 'node:http'
import "dotenv/config";
import userRoutes from "./routes/user.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors"
import postRoutes from "./routes/post.routes.js";
import storyRouter from "./routes/stories.routes.js";
import { Server } from "socket.io";
const app=express()
const httpServer=http.createServer(app)
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173"
const io= new Server(httpServer,{cors :{
    origin: clientUrl,
    credentials: true
}})
const port=process.env.PORT||3000
app.use(cors({ origin: clientUrl, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use("/api/users",userRoutes)
app.use("/api/post",postRoutes)
app.use("/api/story",storyRouter)
// app.listen(port ,()=>{
//     console.log(`server is running on the port ${port}`);

    
// })
app.get("/",(req,res)=>{
    res.send("Server is Ready")
})
mongoose.connect(process.env.MONGODB_URI).then(()=>{
    console.log("DB Connection Successful");
    
}).catch((err)=>{
    console.log(err);
    

})
io.on("connection",(socket)=>{
    console.log("Socket Connected :"+socket.id);
    socket.on("hello",(message)=>{
        console.log("Message From The Client"+message);
        
    })
    socket.emit("hello-response","Hi From The Server")
    
})
io.on("disconnect",(socket)=>{
    console.log("Socket disconnected :" + socket.id);

})
httpServer.listen(port,()=>{
    console.log(`Server Running on Port ${port}`);
    
})

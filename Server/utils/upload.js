import multer from "multer";
const storage=multer.memoryStorage()
const filefilter=(req,file,cb)=>{
    if(file.mimetype.startsWith("image/")){
        cb("Sucess",true)

    }else{
        cb(new Error("Only Image Files Are Accepted"),false)
    }
}
const upload=multer(storage,filefilter,{limits:{fileSize:10*1024*1024}})
export default upload
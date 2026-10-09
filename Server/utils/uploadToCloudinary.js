import cloudinary from "./cloudinary.js";
const uploadToCloudinary= (buffer)=>{
    return new Promise((resolve,reject)=>{
        const upstream=cloudinary.uploader.upload_stream({folder:"posts"},(error,result)=>{
            if(error){
                reject(error)
            }else{
                resolve(result)
            }
        })
        upstream.end(buffer,()=>{console.log("Successfully uploaded To Cloudinary");
        })
    })
}
export default uploadToCloudinary
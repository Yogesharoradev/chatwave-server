import mongoose from "mongoose";
import jwt  from "jsonwebtoken";
import {v2 as cloudinary} from "cloudinary"
import {v4 as uuid} from "uuid"
import  {getBase64, getSockets} from "../lib/helper.js";

const options = {
    maxAge : 15 * 24 * 60 * 60 *1000,
    sameSite : "none",
    httpOnly : true ,
    secure : true
}

const ConnectDb = (url)=>{
    mongoose.connect(url , {dbName:"ChatWave" } )
    .then((data)=> console.log(`connected to Db : ${data.connection.host}`))
    .catch((err)=>{throw err})
}

const SendToken =(res , user ,code , message)=>{
    const token = jwt.sign({_id : user._id} , process.env.JWT_SECRET )
    return  res.status(code).cookie("Chat-token" ,token , options).json({
        success : "true",
        user,
        message
    })
}
 
const emitEvent = (req , event , users , data)=>{
    const io = req.app.get("io")
    const userSocket = getSockets(users)
    io.to(userSocket).emit(event , data)    
}

const UploadCloaudinaryFiles = async (files = []) => {
    const uploadPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          getBase64(file),
          {
            resource_type: "auto",
            public_id: uuid(),
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
      });
    });
  
    try {
      const results = await Promise.all(uploadPromises);
  
      const formattedResults = results.map((result) => ({
        public_id: result.public_id,
        url: result.secure_url,
      }));
      return formattedResults;
    } catch (err) {
      console.log(err)
    }
  };

const DeleteFilesFromCloudinary = (public_ids)=>{
    console.log(public_ids)
}

export {ConnectDb , SendToken , options , emitEvent , DeleteFilesFromCloudinary , UploadCloaudinaryFiles}
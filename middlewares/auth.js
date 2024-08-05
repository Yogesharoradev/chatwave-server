import  jwt  from "jsonwebtoken"
import { User } from "../models/users.model.js"

const isAuth =(req,res ,next)=>{
try{    

    const token = req.cookies["Chat-token"]
   if(!token) return  res.status(500).send(" unable to find token")
    const decodedData = jwt.verify(token , process.env.JWT_SECRET)
    req.user = decodedData._id
    next()

}catch(err){
    res.status(500).send("authentication fail")
    console.log(err)
}
}

const isAdmin =(req,res ,next)=>{
    try{    
    
        const token = req.cookies["chatwave-admin-token"]

       if(!token) return  res.status(500).send(" unable to find token")

        const secretKey = jwt.verify(token , process.env.JWT_SECRET)

        const adminSecretKey = "anything"

        const isMatched = secretKey === adminSecretKey
        if(!isMatched) return res.status(402).send("unathaothorise")
        next()
    
    }catch(err){
        res.status(500).send("authentication fail")
        console.log(err)
    }
    }

const SocketAuthenticator = async (err, socket ,next)=>{
try{
    if(err) return next(err)
    const authToken = socket.request.cookies["Chat-token"]
    if(!authToken) return new Error 

    const decodedKey = jwt.verify(authToken , process.env.JWT_SECRET)

    socket.user = await User.findById(decodedKey._id)
    return next()

}catch(err){
    console.log(err)
    return next(err)
}
}

export {isAuth ,isAdmin ,SocketAuthenticator}
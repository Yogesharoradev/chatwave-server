import express from "express"
import { ConnectDb } from "./utils/features.js"
import dotenv  from "dotenv"
import cookieParser from "cookie-parser"
import userRoute from "./routes/user.routes.js"
import chatRoute from "./routes/chats.route.js"
import adminRoute from "./routes/admin.route.js"
import { Server } from "socket.io"
import { createServer } from "http"
import { v4 } from "uuid"
import cors from 'cors'
import {v2 as cloudinary} from "cloudinary"
import { getSockets } from "./lib/helper.js"
import { CHAT_JOINED, CHAT_LEAVED, NEW_MESSAGE, NEW_MESSAGE_ALERT, ONLINE_USERS, START_TYPING, STOP_TYPING } from "./constants/events.js"
import { Message } from "./models/messgae.model.js"
import { configOptions } from "./constants/config.js"
import { SocketAuthenticator } from "./middlewares/auth.js"

dotenv.config()

const userSocketIds = new Map()
const mongoUrl = process.env.MONOGOURL
const port = process.env.PORT || 3000
const OnlineUsers = new Set()

const app = express()
const server = createServer(app) 
const io = new Server(server, { cors : configOptions})

app.set("io" , io)

app.use(express.json()) 
app.use(cookieParser())
app.use(cors(configOptions))

ConnectDb(mongoUrl)
cloudinary.config({
      cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
      api_key :  process.env.CLOUDINARY_API_KEY,
      api_secret :  process.env.CLOUDINARY_API_SECRET,
})

app.use("/api/v1/user" , userRoute)
app.use("/api/v1/chat" , chatRoute)
app.use("/api/v1/admin" , adminRoute)


io.use((socket , next)=>{
    cookieParser()(
         socket.request ,
         socket.request.res, 
         async (err)=>{ await SocketAuthenticator(err , socket , next)})
})

io.on("connection" , (socket)=>{

    const user = socket.user

    userSocketIds.set(user._id.toString(), socket.id)


    socket.on(NEW_MESSAGE, async ({chatId , members , message})=>{
        const messageForRealTime = {
            content : message,
            _id : v4() ,
            sender : {
                _id : user._id,
                name : user.name
            },
            chat : chatId,
            createdAt  : new Date().toISOString() 
        }
        const messageForDB = {
            content : message ,
            sender : user._id,
            chat : chatId
        }

        const MembersSocket = getSockets(members)
        io.to(MembersSocket).emit(NEW_MESSAGE , {
            chatId,
            message : messageForRealTime
        })
        io.to(MembersSocket).emit(NEW_MESSAGE_ALERT , {chatId})
        try{
            await Message.create(messageForDB)
        } catch(err){
            console.log(err , " error in saving db")
        }

    })

    socket.on(START_TYPING , ({members ,chatId}) =>{
        const memberSocket = getSockets(members)
        socket.to(memberSocket).emit(START_TYPING , {chatId})
    })
    socket.on(STOP_TYPING , ({members ,chatId}) =>{   
        const memberSocket = getSockets(members)
        socket.to(memberSocket).emit(STOP_TYPING , {chatId})
    })

    socket.on(CHAT_JOINED , (userId ,members)=>{
        OnlineUsers.add(userId.toString())

        const memberSocket = getSockets(members)
        io.to(memberSocket).emit(ONLINE_USERS , Array.from(OnlineUsers))
    })
    socket.on(CHAT_LEAVED , (userId , members)=>{
        OnlineUsers.delete(userId.toString())

        const memberSocket = getSockets(members)
        io.to(memberSocket).emit(ONLINE_USERS , Array.from(OnlineUsers))
    })



    socket.on("disconnect" , ()=>{
        userSocketIds.delete(user._id.toString())
    })
})

server.listen(3000 , ()=>{
    console.log(`app is running on ${port}`)
})

export {userSocketIds}
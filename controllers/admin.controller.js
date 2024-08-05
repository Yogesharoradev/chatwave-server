import { Chat } from "../models/chat.model.js"
import { User } from "../models/users.model.js"
import { Message } from "../models/messgae.model.js"
import {options} from "../utils/features.js"
import jwt  from "jsonwebtoken"


const adminLogin = async (req,res)=>{
    try{
       const {secretKey} = req.body 

       const adminSecretKey = "anything"

        const isMatched = secretKey === adminSecretKey
        if(!isMatched) return res.status(402).json({ sucess : false , message : "Invalid Secret Key"})

        const token = jwt.sign(secretKey , process.env.JWT_SECRET)

          return  res.status(200).cookie("chatwave-admin-token", token , {options}).json({
            success : true,
            message : "verified , welcome Boss"
        })
    }
    catch(err){
        res.status(500).json({
            success :false,
            message : "Error"
        })
    }
    }
    
const GetAdmin = (req,res)=>{
    return res.status(200).json({
        success :true , 
        message : "admin true"
    })
}

const  allUsers =async (req,res)=>{
try{

    const users = await User.find({})

    const transformedUsers = await Promise.all(
        users.map( 
            async ({_id , name , username,avatar , createdAt })=>{
            const [groups , friends] = await Promise.all([
                Chat.countDocuments({groupchat :true, members : _id}),
                Chat.countDocuments({groupchat :false, members : _id})
            ]);
    
            return {
                _id , 
                name ,
                username,
                avatar : avatar.url,
                groups ,
                friends,
                createdAt
            }
        }
        )
    
    )
    return  res.status(200).json({
        success : true,
       transformedUsers
    })
}
catch(err){
    res.status(500).json({
        success :false,
        message : "Error"
    })
}
}

const allChats = async (req,res)=>{
    try{
        const chats = await Chat.find({})
        .populate("members", "name avatar")
        .populate("creator", "name avatar");
    
      const transformedChats = await Promise.all(
        chats.map(async ({ members, _id, groupChat, name, creator }) => {
          const totalMessages = await Message.countDocuments({ chat: _id });
    
          return {
            _id,
            groupChat,
            name,
            avatar: members.slice(0, 3).map((member) => member.avatar.url),
            members: members.map(({ _id, name, avatar }) => ({
              _id,
              name,
              avatar: avatar.url,
            })),
            creator: {
              name: creator?.name || "None",
              avatar: creator?.avatar.url || "",
            },
            totalMembers: members.length,
            totalMessages,
          };
        })
      );
          return  res.status(200).json({
            success : true,
            transformedChats
        })
    }
    catch(err){
        res.status(500).json({
            success :false,
            message : "Error"
        })
    }
    }
    
const allMessages = async (req,res)=>{
    try{
        const messages = await Message.find({})
        .populate("sender", "name avatar")
        .populate("chat", "groupChat");
    
      const transformedMessages = messages.map(
        ({ content, attachments, _id, sender, createdAt, chat }) => ({
          _id,
          attachments,
          content,
          createdAt,
          chat: chat._id,
          groupChat: chat.groupChat,
          sender: {
            _id: sender._id,
            name: sender.name,
            avatar: sender.avatar.url,
          },
        })
      );
          return  res.status(200).json({
            success : true,
            transformedMessages
        })
    }
    catch(err){
        res.status(500).json({
            success :false,
            message : "Error"
        })
    }
 }

    const allStats = async (req,res)=>{
        try{
            const [groupCount , usersCount , messagesCount , totalChatsCount] = await Promise.all([
                Chat.countDocuments({groupchat : true}),
                User.countDocuments(),
                Message.countDocuments(),
                Chat.countDocuments()
            ])

            const today  = new Date()
            const last7Days = new Date();
            last7Days.setDate(last7Days.getDate()-7)

            const last7DaysMessages = await Message.find({
                createdAt : {
                $gte : last7Days ,
                $lte : today,
            }}).select("createdAt")

            const messages = new Array(7).fill(0)

            last7DaysMessages.forEach(message=> {
                const indexApprox = (today.getTime() - message.createdAt.getTime() / 1000 * 60 * 60 * 24)

                const index = Math.floor(indexApprox)
                messages[6-index]++
            })

            const stats = {
                groupCount ,
                 usersCount ,
                  messagesCount ,
                   totalChatsCount,
                 last7DaysMessages
                }
              return  res.status(200).json({
                success : true,
                stats
            })
        }
        catch(err){
            res.status(500).json({
                success :false,
                message : "Error"
            })
        }
      }
    
 const adminLogout = async (req,res)=>{
        try{
    
              return  res.status(200).cookie("chatwave-admin-token", "" , {options , maxAge :0}).json({
                success : true,
                message : "Logout Successfully"
            })
        }
        catch(err){
            res.status(500).json({
                success :false,
                message : "Error"
            })
        }
 }
        


export { allUsers , allChats , allMessages , allStats ,adminLogin , adminLogout , GetAdmin}
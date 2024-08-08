import bcrypt from "bcrypt"
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js"
import { otherMember } from "../lib/helper.js"
import { Chat } from "../models/chat.model.js"
import { Request } from "../models/request.model.js"
import { User } from "../models/users.model.js"
import { SendToken, UploadCloaudinaryFiles, emitEvent, options } from "../utils/features.js"

const Signup = async (req, res)=>{
   try{ 

    const {name , username , password , bio } = req.body

    const file = req.file

    if (!file || file.length === 0) {
        return res.status(402).json({success :false , message :"No files uploaded"});
    }


    const result = await UploadCloaudinaryFiles([file])
    
    const avatar = {
        public_id : result[0].public_id,
        url : result[0].url
    }

    const newUser = await User.create({
        name , username , password , bio ,avatar
    })
    SendToken( res , newUser , 201 , "user created")

   }catch(err){  
        return res.status(500).json({success :false , message :"error in signup"});
   }
}


const Login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username }).select("+password");
        if (!user) return res.status(400).json({ success :false ,message : "Incorect username"});

        const isMatchPass = await bcrypt.compare(password, user.password);
        if (!isMatchPass) return res.status(400).json({ success :false ,message : "incoreect password"});

        SendToken(res, user, 200, `Welcome back, ${user.username}`);
    } catch (err) {
        res.status(500).json({ success :false ,message : "Error during login"});
        console.log(err);
    }
};

const GetMyProfile =async (req,res)=>{
    try{
        const user = await User.findById(req.user)

        res.status(200).json({
            success : true,
              user
        })
    }
catch(err){
    res.status(500).json({ success: false ,message :err })
}
}

const Logout =(req,res)=>{
    try{
        return res.status(200).cookie("Chat-token" , "" , {...options , maxAge : 0} ).json({
            success : "true",
            message : "logged out successfully"
        })
    }catch(err){
        res.status(500).json({
            success : "false",
            message : "logged out failed"
        });
    }
}

const searchUser =async(req ,res )=>{
    try{
        
        const {name = ""} = req.query

        const myChats = await Chat.find({groupchat : false , members: req.user})

        const UsersWithmyMessages = myChats.flatMap((chat)=> chat.members)

        const AllUsersNotMyFriends  = await User.find({
            _id:{$nin : UsersWithmyMessages ,  $ne: req.user},
            name : {$regex : name , $options: "i"}
        })

        const users = AllUsersNotMyFriends.map(({_id , name ,avatar})=>({
            _id,
             name ,
             avatar:avatar.url
        }))

        return res.status(200).json({
            success:true,
            users
        })

    }catch(err){
        res.status(500).json({
            success: false ,
            message : "Error in searching"
        })
    }
}

const SendRequest=async (req,res)=>{
    try{
        const {userId} = req.body

        const request =  await Request.findOne({
            $or : [
                {sender : req.user , receiver : userId},
                {sender : userId , receiver :  req.user}
            ]

        })

        if(request) return res.status(500).send("req already send")

        await Request.create({
            sender : req.user,
            receiver : userId
        })

        emitEvent(req , NEW_REQUEST , [userId] )

        return res.status(200).json({
            succes : "true",
            message : "sent request successfully"
        })
    }catch(err){
        res.status(500).send("request failed");
        console.log(err);
    }
}

const acceptRequest = async(req,res)=>{
    try{
        const {requestId , accept} = req.body

        const request = await Request.findById(requestId).populate("sender" ,"name").populate("receiver" ,"name")

        if(!request) return res.status(404).json({ success :false ,message :"error in getting request"})

        if(request.receiver._id.toString() !== req.user.toString()) return res.status(404).json({ success :false ,message :"unauthorised"})

        if(!accept) {
            await request.deleteOne()
            return res.status(200).json({
                succes : "true",
                message : "friend request rejected"
            })
        }

        const members = [request.sender._id , request.receiver._id]
        await Promise.all([
            Chat.create({
                members ,
                 name:`${request.sender.name}-${request.receiver.name}`,
            }),
         request.deleteOne()
        ])

        emitEvent(req, REFETCH_CHATS , members)
        return res.status(200).json({
            succes : "true",
            message : "friend request Accepted",
            senderId : request.sender._id
        })
    }catch(err){
        res.status(500).send(" err in accepting request");
        console.log(err);
    }
}

const getAllNotification = async(req,res)=>{
    try{
      const requests = await Request.find({receiver : req.user}).populate(
        "sender", " name avatar"
      )

      const allRequests = requests.map(({sender , _id})=>({
        _id,
        sender:{
            _id : sender.id,
            name: sender.name,
            avatar : sender.avatar
            }
      })) 
      
        return res.status(200).json({
            succes : "true",
            message : "notifications",
            allRequests
        })
    }catch(err){
        res.status(500).send(" err in getting notofication");
        console.log(err);
    }
}

const getFriends =async(req,res)=>{
try{
    const chatId = req.query.chatId
    const chats = await Chat.find({
        members : req.user,
        groupchat: false
    }).populate("members" , "name avatar")

    const friends = chats.map(({members})=>{
        const otherUser  = otherMember(members ,req.user)
        return {
            _id: otherUser.id,
            name: otherUser.name,
            avatar : otherUser.avatar.url
        }
    })

    if(chatId){
        const chat = await Chat.findById(chatId)
        const availableFriends = friends.filter(
            (friend) => !chat.members.includes(friend._id)
        )
        res.status(200).json({
            success : true,
            friends : availableFriends
        })
    } else {
        return res.status(200).json({
            success : true,
            friends
        })
    }
}catch(err){
    res.status(500).json({
        success : false,
        message : err.message
    })
}
}

export { GetMyProfile, Login, Logout, SendRequest, Signup, acceptRequest, getAllNotification, getFriends, searchUser }

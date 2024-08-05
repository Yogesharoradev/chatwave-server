import mongoose from 'mongoose'
import { ALERT, NEW_MESSAGE, NEW_MESSAGE_ALERT, REFETCH_CHATS } from '../constants/events.js'
import { otherMember } from "../lib/helper.js"
import { Chat } from "../models/chat.model.js"
import { Message } from "../models/messgae.model.js"
import { User } from "../models/users.model.js"
import { DeleteFilesFromCloudinary, UploadCloaudinaryFiles, emitEvent } from "../utils/features.js"

const newGroupchat = async(req , res , next)=>{
    try{ 
            const {members , name } = req.body

            if(members.length < 2 )return  res.status(500).send(" group chat must have 3 members")
 
            const allMembers = [...members , req.user] 

            await Chat.create({
                name ,
                groupchat:true,
                creator : req.user,
                members : allMembers
            })

            emitEvent(req , ALERT , allMembers , `welcome to ${name} group`)
            emitEvent(req , REFETCH_CHATS , members)

            return res.status(201).json({
                success : true,
                message : "Group created"
            })
            
    }catch(err){
        res.status(500).json( {success : false,
            message : err.message
        })
    }
}

const getMyChat = async (req,res)=>{
    try{
        const chats = await Chat.find({members : req.user}).populate(
            "members",
            "name avatar"
        ) ;
      
        const transformChats = chats.map(({_id ,name , members , groupchat})=>{

            const otherMembers = otherMember(members , req.user)
            return{
                _id , 
                groupchat,
                name : groupchat ? name : otherMembers.name , 
                members: members.filter(member => member._id.toString() !== req.user.toString()).map(member => member._id),
                avatar:groupchat?members.slice(0,3).map(({avatar})=>avatar?.url): [otherMembers?.avatar?.url]
            }
        })
        return res.status(201).json({
            success : true,
            chats : transformChats
        })

    }catch(err){
        res.status(500).json({
            success : false,
            message : "error in getting chat"
        })

    
    }
}

const getMyGroups = async(req,res)=>{
    try{
        const chats = await Chat.find({members : req.user , groupchat :true , creator:req.user}).populate(
            "members",
            "name avatar"
        ) ;

        const groups = chats.map(({members , _id , groupchat , name})=>({
            _id ,
            groupchat, 
            name,
            avatar : members.slice(0,3).map(({avatar})=>avatar.url)
        }))
        return res.status(200).json({
            success : true,
            groups
        })

    }catch(err){
        res.status(500).json({
            success :false , 
            message : err.message
        })
    }
}

const addMembers = async(req,res)=>{
    try{

        const {chatId , members} = req.body
        const chat = await Chat.findById(chatId)
        
        if(!chat){
         return  res.status(404).json({success : false , message : "error in getting chat resolve" })
        } 
        if(!chat.groupchat) {  
         return res.status(404).json({success : false , message : "error in getting group chat resolve" })
        }
        if(chat.creator.toString() !== req.user.toString()){
            return res.status(404).json({success : false , message : "you are not alowwed to add members" })
        }

        const allNewmembersPromise = members.map((i)=>User.findById(i , "name"))
 
        const allNewMembers = await Promise.all(allNewmembersPromise)

        const uniqueMember = allNewMembers.filter((i)=> !chat.members.includes(i._id.toString())).map(i => i._id)

        chat.members.push(...uniqueMember)

        if(chat.members.length > 100){   
            return res.status(404).json({success : false , message : "limit reached" })
        }

       await chat.save()
       const allUserName = allNewMembers.map((i)=>i.name).join(",")

       emitEvent(
        req ,
        ALERT ,
        chat.members,
        `${allUserName} has been added in the group`
       )
       emitEvent(
        req ,
        REFETCH_CHATS ,
        chat.members,
       )
        return res.status(201).json({
            success : true,
            message : "members added successfully"
        })

    }catch(err){
      return  res.status(404).json({success : false , message : "errorrrrrr"})
    }
}

const removeMember = async (req,res)=>{
    try{
        const {userId , chatId} = req.body

        const [chat , userthatRemoved] = await Promise.all([
            Chat.findById(chatId),
            User.findById(userId , "name")
        ])

        if(!chat){
            return res.status(404).json({success:false , message :"error in getting chat resolve"})
        } 
        if(!chat.groupchat) {
         return  res.status(404).json({success:false , message :"error in getting group chat"})
        }
        if(chat.creator.toString() !== req.user.toString())  {
            return  res.status(404).json({success:false , message :"you are not allowed to remove member "})
        }
        if(chat.members.length <= 3 ) {
            return res.status(404).json({success:false , message :"group should have more than 3 members"})
        }
        const allChatMembers = chat.members.map((i)=> i.toString())

        chat.members = chat.members.filter((member)=> member.toString() !== userId.toString() )

        await chat.save();

        emitEvent(
            req ,
            ALERT ,
            chat.members,
             {message : `${userthatRemoved.name} has been removed from the group ` , chatId}
        );
        emitEvent(
            req, 
            REFETCH_CHATS,
            allChatMembers
        )
        return res.status(200).json({
            success :true,
            message : "member removed succesfully"
        })

    } catch(err){
       return res.status(500).json({
            success : false ,
            message  : "error"
        })
    }
}

const leaveGroup = async(req,res)=>{
        try{
                const  chatId = req.params.id
                const chat = await Chat.findById(chatId)
                if(!chat) return  res.status(404).json({success : false , message :"error in getting chat resolve"})

                if(!chat.groupchat) return  res.status(404).json({success : false , message :"error in getting chat resolve"})
                const remainingMember =  chat.members.filter((member) => member.toString() !== req.user.toString())

              if(chat.creator.toString() === req.user.toString()){
                        const randomElement = Math.floor(Math.random()* remainingMember.length)
                        const NewAdmin = remainingMember[randomElement]
                        chat.creator = NewAdmin
                    }
                
                

                chat.members = remainingMember

                const [user] = await Promise.all([User.findById(req.user , "name"), 
                await chat.save(

                )])
                 emitEvent(
                    req,
                    ALERT ,
                     chat.members,
                      {message :  `user ${user.name} has left the group` , chatId} 
                 )
                return res.status(200).json({
                    success :true,
                    message : "you left the group"
                })
        }   
        catch(err){
            res.status(500).json({success : false , message : err})
        }
}

const GetAttachments = async (req, res) => {
    try {
        const { chatId } = req.body;
        const files = req.files || [];
        
        if (!chatId) {
            return res.status(400).json({ success: false, message: "Please enter ChatId" });
        }
        if (files.length < 1) {
            return res.status(400).json({ success: false, message: "Please upload attachments" });
        }
        if (files.length > 5) {
            return res.status(400).json({ success: false, message: "Not more than 5 attachments" });
        }
        
        const [chat, me] = await Promise.all([
            Chat.findById(chatId),
            User.findById(req.user, "name")
        ]);
        
        if (!chat) {
            return res.status(500).json({ success: false, message: "Chat not found" });
        }

        const Attachments = await UploadCloaudinaryFiles(files);

        const MessageForDb = {
            content: "",
            Attachments,
            sender: me.id,
            chat: chatId
        };

        const message = await Message.create(MessageForDb);
        const MessageForRealTime = {
            ...MessageForDb,
            sender: {
                _id: me._id,
                name: me.name
            }
        };
        emitEvent(req, NEW_MESSAGE, chat.members, {
            message: MessageForRealTime,
            chatId
        });
        emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });

        return res.status(200).json({
            success: true,
            message
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error uploading files to Cloudinary"
        });
    }
};

const GetChatDetails = async (req, res)=>{
    try{
        if(req.query.populate === "true"){
         const chat = await Chat.findById(req.params.id).populate("members" , "name avatar").lean()

         if(!chat) return  res.status(400).send("error in getting chat")

         chat.members = chat.members.map(({_id , name , avatar})=>({
            _id ,
            name ,
            avatar : avatar.url
         }))

         return   res.status(200).json({
          success : true,
            chat
         })
        }else{
            const chat = await Chat.findById(req.params.id)
            return   res.status(200).json({
                success : true,
                  chat
                })
        }
    }catch(err){
        res.status(400).send(err)
    }
}

const RenameGroup = async (req, res)=>{
    try{

        const chatId = req.params.id
        const {name} = req.body

        const chat = await Chat.findById(chatId)

        if(!chat) return res.status(402).send("not able to find chat")

        if(!chat.groupchat) return res.status(402).send("not able to find chat")

        if(chat.creator.toString() !== req.user.toString()) return res.status(402).send("not allowed to rename")

        chat.name = name

        await chat.save()

        emitEvent(req ,REFETCH_CHATS , chat.members)

       return res.status(200).json({
            suuces :true ,
            message  : "group name changed successfully"
        })
    }catch(err){
        res.status(500).json({
            suuces :false ,
            err
        })
    }
}

const DeleteChat = async (req, res) => {
    try {
        // Ensure `chatId` is provided
        const chatId = req.params.id;
        if (!chatId) {
            return res.status(400).json({
                success: false,
                message: "Chat ID is required"
            });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        if (chat.groupchat) {
            if (chat.creator.toString() !== req.user.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "You are not allowed to delete this chat"
                });
            }

            if (!chat.members.includes(req.user.toString())) {
                return res.status(403).json({
                    success: false,
                    message: "You are not a member of this chat"
                });
            }
        }

        const MessageWithAttachments = await Message.find({
            chat: chatId,
            attachments: { $exists: true, $ne: [] }
        });

        const public_ids = [];

        MessageWithAttachments.forEach(({ attachments }) => {
            attachments.forEach(({ public_id }) => {
                public_ids.push(public_id);
            });
        });

        await Promise.all([
            DeleteFilesFromCloudinary(public_ids),
            chat.deleteOne(),
            Message.deleteMany({ chat: chatId })
        ]);

        emitEvent(req, REFETCH_CHATS, chat.members);

        return res.status(200).json({
            success: true,
            message: "Chat successfully deleted"
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "An error occurred while deleting the chat",
            error: err.message || err
        });
    }
};



 const GetMessages = async (req , res )=>{
       try{
                
               const chatId = req.params.id
               const {page  = 1 } = req.query
               const limit = 20
               const skip =(page-1)*limit

               const chat = await Chat.findById(chatId)
               if(!chat) return res.status(400).json({success :false , message : "not chat available"})
               if(!chat.members.includes(req.user.toString())){
                return res.status(400).json({success :false , message : "you r removed by admin of group"})
               }
                    
               const [messages , totalMessageCount] = await Promise.all([
                Message.find({chat : chatId})
                .sort({createdAt:-1})
                .skip(skip)
                .limit(limit)
                .populate("sender", "name")
                .lean(),
                Message.countDocuments({chat : chatId})
               ]
               ) 

               const TotalPages = Math.ceil(totalMessageCount / limit )
                            
                
          return res.status(200).json({
             sucess :true , 
          message : messages.reverse(),
          TotalPages
          })
           }
         catch(err){ 
          return res.status(500).json({
             success: false,
              message: "An error occurred while deleting the chat",
              error: err.message || err
              });
                  }
     }            
                
export {
    DeleteChat, GetAttachments,
    GetChatDetails, GetMessages, RenameGroup, addMembers, getMyChat,
    getMyGroups, leaveGroup, newGroupchat, removeMember
}


import express from "express";
import {
     DeleteChat, GetAttachments,
     GetChatDetails,
     GetMessages,
     RenameGroup,
     addMembers,
     getMyChat,
     getMyGroups,
     leaveGroup,
     newGroupchat,
     removeMember
} from "../controllers/chat.controller.js";
import {
     ChatIDValidators,
     NameValidators,
     NewGroupChatValidator,
     errValidate
} from "../lib/validators.js";
import { isAuth } from "../middlewares/auth.js";
import { MultipleAttachments } from "../middlewares/multer.js";
const app = express.Router()

app.use(isAuth)

app.post("/new" , NewGroupChatValidator(), errValidate , newGroupchat)

app.get("/mychat" , getMyChat)
app.get("/mygroups" , getMyGroups)

app.put("/addmembers",  addMembers)
app.put("/removemember" ,removeMember)

app.delete("/leave/:id" , leaveGroup)

app.post("/message" , MultipleAttachments , GetAttachments)

app.get("/message/:id" , ChatIDValidators(), errValidate, GetMessages)

app.route("/:id" ,ChatIDValidators(), errValidate).get(GetChatDetails)
.put(NameValidators() , RenameGroup)
.delete( DeleteChat)


export default app
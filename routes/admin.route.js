import express from "express";
import { GetAdmin, adminLogin, adminLogout, allChats, allMessages, allStats, allUsers } from "../controllers/admin.controller.js";
import { adminLoginValidator, errValidate } from "../lib/validators.js";
import { isAdmin } from "../middlewares/auth.js";
const app = express.Router()




app.put("/verify" , adminLoginValidator(), errValidate ,  adminLogin)

app.get("/logout" , adminLogout)

app.use(isAdmin)

app.get("/" , GetAdmin)

app.get("/users" , allUsers)

app.get("/chats" , allChats)

app.get("/messages" , allMessages )

app.get("/stats" , allStats)


export default app
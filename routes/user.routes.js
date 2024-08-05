import express from "express";
import { GetMyProfile, Login, Logout, SendRequest, Signup, acceptRequest, getAllNotification, getFriends, searchUser } from "../controllers/user.controller.js";
import { LoginValidator, acceptRequestValidator, errValidate, registerValidator, sendRequestValidator } from "../lib/validators.js";
import { isAuth } from "../middlewares/auth.js";
import { SingleAvatarr } from "../middlewares/multer.js";


const app = express.Router();
 
app.post("/signup",  SingleAvatarr, registerValidator(), errValidate, Signup)
app.post("/login", LoginValidator() , errValidate , Login)

// after login

app.use(isAuth)

app.get("/me"  ,GetMyProfile)

app.get("/logout"  , Logout)

app.get("/search" , searchUser)

app.put("/sendRequest" ,sendRequestValidator(), errValidate, SendRequest)

app.put("/acceptRequest" ,acceptRequestValidator(), errValidate, acceptRequest)

app.get("/notifications" , getAllNotification)

app.get("/friends" , getFriends)


export default app 
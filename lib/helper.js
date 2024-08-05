import { userSocketIds } from "../app.js"


export const otherMember = (members , userId)=>{
return members.find((member)=> member._id.toString() !== userId.toString())
}

export const getBase64 = (file)=> `data:${file.mimetype};base64,${file.buffer.toString("base64")}`

export const getSockets = (users=[])=> users.map((user)=>userSocketIds.get(user.toString()))
   
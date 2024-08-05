import  mongoose ,  { model , Schema, Types } from "mongoose";

const schema = new Schema ({
    name:{
        type: String , 
        required : true
    },
    groupchat : {
        type : Boolean,
       default : false,
    },
    creator : {
        type :Types.ObjectId,
        ref : "User",
    },
    members : 
    [{
        type : Types.ObjectId,
        ref  :"User"
    }]
},
{timestamps : true}
)

export const Chat  = mongoose.models.Chat || model("Chat" , schema)
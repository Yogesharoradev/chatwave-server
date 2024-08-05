
import { body, check, param, validationResult } from "express-validator"


const registerValidator = ()=>[
    body("name","please enter Name").notEmpty(),
    body("username","please enter username").notEmpty(),
    body("bio","please enter bio").notEmpty(),
    body("password","please enter password").notEmpty(),
]

const LoginValidator = () => [
    body("username","please enter username").notEmpty(),
    body("password","please enter password").notEmpty(),
]

const NewGroupChatValidator = ()=>[
    body("name","please enter Name").notEmpty(),
    body("members").notEmpty().withMessage("please enter Memebers").isArray({min:2 , max:100}).withMessage("members btw 2-100")
]


const addMemberValidator =()=>[
    body("ChatId","please enter ChatId").notEmpty(),
    body("members").notEmpty().withMessage("please enter Members").isArray({min:1 , max:97}).withMessage("members btw 1-97")
]

const RemoveMemberValidator =()=> [
    body("ChatId","please enter ChatId").notEmpty(),
    body("userID" , "please enter UserID").notEmpty()
]

const GetAttachmentsValidator = ()=>[
    body("ChatId","please enter ChatId").notEmpty(),
    check("files" ).notEmpty().withMessage( "please upload attachments").isArray({min:1 , max:5 }).withMessage("not more than 5 attchments")
]

const ChatIDValidators =()=>[
param("id", "please provide  Chatid").notEmpty(),
]

const NameValidators =()=>[
    body("name", "please provide Name").notEmpty(),
    ]


const errValidate = (req ,res , next)=>{
    const errors =  validationResult(req)
    const errorMessage = errors.array().map((error)=>error.msg).join(",")
    if (errors.isEmpty()) return next()
    else res.status(500).send(errorMessage)
}

const acceptRequestValidator =()=>[
    body("requestId", "please provide  requestid").notEmpty(),
    body("accept" ).notEmpty().withMessage( "please add accept").isBoolean().withMessage("accept must be  a boolean")
]
const sendRequestValidator =()=>[
    body("userId", "please provide  userid").notEmpty(),
]

const adminLoginValidator =()=>[
    body("secretKey", "please provide secretKey").notEmpty(),
]


export {
    ChatIDValidators, GetAttachmentsValidator, LoginValidator,
    NewGroupChatValidator,sendRequestValidator, RemoveMemberValidator,adminLoginValidator,
    acceptRequestValidator, addMemberValidator, errValidate, registerValidator,NameValidators
}

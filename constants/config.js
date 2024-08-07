

const configOptions = {
    origin:  process.env.CLIENT_URL , 
    methods  : ["GET", "PUT", "DELETE" , "POST"],
    credentials : true,
}

export {configOptions}
import {User} from "../models/users.model.js"
import {faker} from "@faker-js/faker"

export const FakeUser = async(newUsers)=>{
    try{
        const userPromises = []

        for (let i=0 ; i < newUsers ; i++){
            const tempUser = User.create({
                name : faker.person.fullName(),
                username : faker.internet.userName(),
                bio : faker.lorem.sentence(10),
                password : "password",
                avatar:{
                    url: faker.image.avatar(),
                    public_id : faker.system.fileName()
                }
            })

            userPromises.push(tempUser)
        }

        await Promise.all(userPromises)
        console.log("fake user created")
        process.exit(1)
    }catch(err){
        console.log(err)
        process.exit(1)
    }
}
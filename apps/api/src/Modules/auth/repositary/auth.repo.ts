import { db } from "../../../prisma/db";
import type { LoginInput, RegisterInput } from "@vaultgraph/shared/auth-types";

export class authRepositary{
    constructor(
        private readonly authDB:typeof db
    ){}

    register=async(data:RegisterInput)=>{
        const user=await this.authDB.orm.public.User.create({
            username:data.username,
            email:data.email,
            hashPassword:data.password
        })
        return user
    }
    login = async (data: LoginInput) => {
        const user = await this.authDB.orm.public.User.first({
            email: data.email,
    });

        return user;
    };

    findBiID=async(id:string)=>{
        const user=await this.authDB.orm.public.User.first({
            id:id
        })
        return user
    }

    findByEmail=async(email:string)=>{
        const user=await this.authDB.orm.public.User.first({
            email:email
        })
        return user
    }

    findByUsername=async(username:string)=>{
        const user=await this.authDB.orm.public.User.first({
            username:username
        })
        return user
    }

    


}

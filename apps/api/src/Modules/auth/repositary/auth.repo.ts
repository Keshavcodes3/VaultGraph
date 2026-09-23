import { db } from "../../../prisma/db";
import type { CreateUserData } from "@repo/shared/auth-types";

export class AuthRepository {
  constructor(private readonly authDB: typeof db = db) {}

  register = async (data: CreateUserData) => {
    const user = await this.authDB.orm.public.User.create({
      username: data.username,
      email: data.email,
      hashPassword: data.hashPassword,
    });
    return user;
  };

  findByEmail = async (email: string) => {
    const user = await this.authDB.orm.public.User.first({
      email: email,
    });
    return user;
  };

  findById = async (id: string) => {
    const user = await this.authDB.orm.public.User.first({
      id: id,
    });
    return user;
  };

  findByUsername = async (username: string) => {
    const user = await this.authDB.orm.public.User.first({
      username: username,
    });
    return user;
  };

  /** @deprecated Typo alias. Use `findById`. */
  findBiID = this.findById;
}

/** @deprecated Typo alias. Use `AuthRepository`. */
export const authRepositary = AuthRepository;

export const authRepository = new AuthRepository(db);

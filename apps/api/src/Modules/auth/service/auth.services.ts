import type {
  LoginInput,
  PublicUser,
  RegisterInput,
} from "@repo/shared/auth-types";
import { HttpError } from "../../../Shared/httpError";
import { AuthRepository } from "../repositary/auth.repo";
import { hashPassword, verifyPassword } from "../utils/hashPassword";
import { signAuthToken } from "../utils/jwt";
import { toPublicUser } from "../utils/sanitizeUser";

export type AuthResult = {
  user: PublicUser;
  token: string;
};

export class AuthService {
  constructor(private readonly authRepo: AuthRepository) {}

  register = async (data: RegisterInput): Promise<AuthResult> => {
    const { username, email, password } = data;

    const existingUser = await this.authRepo.findByEmail(email);
    if (existingUser) {
      throw new HttpError("User already exists", 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await this.authRepo.register({
      username,
      email,
      hashPassword: hashedPassword,
    });

    if (!user) {
      throw new HttpError("User could not be created", 500);
    }

    const publicUser = toPublicUser(user);
    return { user: publicUser, token: signAuthToken(publicUser) };
  };

  login = async (data: LoginInput): Promise<AuthResult> => {
    const { email, password } = data;

    const user = await this.authRepo.findByEmail(email);
    if (!user) {
      throw new HttpError("Invalid email or password", 401);
    }

    const isPasswordValid = await verifyPassword(password, user.hashPassword);
    if (!isPasswordValid) {
      throw new HttpError("Invalid email or password", 401);
    }

    const publicUser = toPublicUser(user);
    return { user: publicUser, token: signAuthToken(publicUser) };
  };

  me = async (id: string): Promise<PublicUser> => {
    const user = await this.authRepo.findById(id);
    if (!user) {
      throw new HttpError("User not found", 404);
    }
    return toPublicUser(user);
  };
}

export const authServiceClass = AuthService;
export type authServiceClass = AuthService;

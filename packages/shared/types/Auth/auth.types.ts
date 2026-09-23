import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(30),
  email: z.email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type CreateUserData = {
  username: string;
  email: string;
  hashPassword: string;
};

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

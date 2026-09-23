import type { PublicUser } from "@repo/shared/auth-types";

type UserLike = PublicUser & { hashPassword?: string };

export const toPublicUser = (user: UserLike): PublicUser => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

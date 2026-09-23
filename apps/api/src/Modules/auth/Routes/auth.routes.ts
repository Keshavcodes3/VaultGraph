import { Router } from "express";
import { loginSchema, registerSchema } from "@repo/shared/auth-types";
import { validateBody } from "../../../Shared/validate";
import { AuthController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/requireAuth";
import { authRepository } from "../repositary/auth.repo";
import { AuthService } from "../service/auth.services";

const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

export const authRouter = Router();

authRouter.post(
  "/register",
  validateBody(registerSchema),
  authController.register
);
authRouter.post("/login", validateBody(loginSchema), authController.login);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", requireAuth, authController.me);

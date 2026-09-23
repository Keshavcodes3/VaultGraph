import { apiSuccess } from "../../../Shared/apiResponse";
import { asyncHandler } from "../../../Shared/asyncHandler";
import { HttpError } from "../../../Shared/httpError";
import type { AuthRequest } from "../middleware/requireAuth";
import { AuthService } from "../service/auth.services";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = asyncHandler(async (req, res) => {
    const result = await this.authService.register(req.body);
    return apiSuccess(res, result, "User registered successfully", 201);
  });

  login = asyncHandler(async (req, res) => {
    const result = await this.authService.login(req.body);
    return apiSuccess(res, result, "Login successful", 200);
  });

  me = asyncHandler(async (req: AuthRequest, res) => {
    if (!req.auth) {
      throw new HttpError("Unauthorized", 401);
    }
    const user = await this.authService.me(req.auth.sub);
    return apiSuccess(res, { user }, "User fetched successfully", 200);
  });
}

/** @deprecated Alias. Use `AuthController`. */
export const authControllerClass = AuthController;
export type authControllerClass = AuthController;

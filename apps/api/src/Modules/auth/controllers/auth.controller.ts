import { apiSuccess } from "../../../Shared/apiResponse";
import { asyncHandler } from "../../../Shared/asyncHandler";
import { HttpError } from "../../../Shared/httpError";
import type { AuthRequest } from "../middleware/requireAuth";
import { AuthService } from "../service/auth.services";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookie = (
    res: Parameters<Parameters<typeof asyncHandler>[0]>[1],
    token: string
  ) => {
    res.cookie("accessToken", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env["NODE_ENV"] === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    // Backwards compat: older middleware read `refreshToken`.
    res.cookie("refreshToken", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env["NODE_ENV"] === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
  };

  register = asyncHandler(async (req, res) => {
    const result = await this.authService.register(req.body);
    this.setAuthCookie(res, result.token);
    return apiSuccess(res, result, "User registered successfully", 201);
  });

  login = asyncHandler(async (req, res) => {
    const result = await this.authService.login(req.body);
    this.setAuthCookie(res, result.token);
    return apiSuccess(res, result, "Login successful", 200);
  });

  logout = asyncHandler(async (_req, res) => {
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
    return apiSuccess(res, null, "Logged out successfully", 200);
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

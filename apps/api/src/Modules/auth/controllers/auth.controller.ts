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
    // Split-domain deploys (web on Vercel, API on Render) are cross-site:
    // `SameSite=Lax` cookies are never sent by fetch there, so production
    // must use `SameSite=None; Secure`. Local dev stays Lax (plain http).
    const isProd = process.env["NODE_ENV"] === "production";
    const flags = {
      httpOnly: true,
      sameSite: (isProd ? "none" : "lax") as "none" | "lax",
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    };
    res.cookie("accessToken", token, flags);
    // Backwards compat: older middleware read `refreshToken`.
    res.cookie("refreshToken", token, flags);
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
    // Flags must match setAuthCookie or the browser keeps the cookies.
    const isProd = process.env["NODE_ENV"] === "production";
    const flags = {
      path: "/",
      sameSite: (isProd ? "none" : "lax") as "none" | "lax",
      secure: isProd,
    };
    res.clearCookie("accessToken", flags);
    res.clearCookie("refreshToken", flags);
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

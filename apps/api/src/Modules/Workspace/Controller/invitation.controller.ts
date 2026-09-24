import { asyncHandler } from "../../../Shared/asyncHandler";
import { apiSuccess } from "../../../Shared/apiResponse";
import { HttpError } from "../../../Shared/httpError";

import { invitationServiceClass } from "../service/invitation.service";

const INVITATION_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
  "REVOKED",
] as const;

export class invitationControllerClass {
  constructor(
    private readonly invitationService: invitationServiceClass
  ) {}

  // CREATE INVITATION
  // The raw single-use token is returned exactly once here; every later
  // response carries safe fields only. It is never logged server-side.
  create = asyncHandler(async (req, res) => {
    const result = await this.invitationService.create(
      req.params.workspaceId as string,
      req.body,
      req.user.id
    );

    return apiSuccess(
      res,
      result,
      result.emailSent
        ? "Invitation sent successfully."
        : "Invitation created. Email delivery is not configured — share the invitation link below.",
      201
    );
  });

  // LIST INVITATIONS (?status=)
  list = asyncHandler(async (req, res) => {
    const rawStatus = req.query.status as string | undefined;
    const status =
      rawStatus === undefined
        ? undefined
        : (INVITATION_STATUSES.find((s) => s === rawStatus) ?? null);
    if (status === null) {
      throw new HttpError("Invalid invitation status filter", 400);
    }

    const invitations = await this.invitationService.list(
      req.params.workspaceId as string,
      req.user.id,
      status
    );

    return apiSuccess(
      res,
      invitations,
      "Workspace invitations fetched successfully"
    );
  });

  // INVITATION DETAILS (public — powers the accept page for guests)
  details = asyncHandler(async (req, res) => {
    const details = await this.invitationService.details(
      req.params.token as string
    );

    return apiSuccess(
      res,
      details,
      "Invitation fetched successfully"
    );
  });

  // ACCEPT INVITATION
  accept = asyncHandler(async (req, res) => {
    const result = await this.invitationService.accept(
      req.params.token as string,
      req.user.id
    );

    return apiSuccess(
      res,
      result,
      "Invitation accepted. Welcome to the workspace."
    );
  });

  // REJECT INVITATION
  reject = asyncHandler(async (req, res) => {
    const invitation = await this.invitationService.reject(
      req.params.token as string,
      req.user.id
    );

    return apiSuccess(
      res,
      invitation,
      "Invitation rejected."
    );
  });

  // REVOKE INVITATION
  revoke = asyncHandler(async (req, res) => {
    const invitation = await this.invitationService.revoke(
      req.params.workspaceId as string,
      req.params.invitationId as string,
      req.user.id
    );

    return apiSuccess(
      res,
      invitation,
      "Invitation revoked."
    );
  });

  // RESEND INVITATION
  // A fresh raw token is returned exactly once, like creation.
  resend = asyncHandler(async (req, res) => {
    const result = await this.invitationService.resend(
      req.params.workspaceId as string,
      req.params.invitationId as string,
      req.user.id
    );

    return apiSuccess(
      res,
      result,
      result.emailSent
        ? "Invitation resent successfully."
        : "Invitation refreshed. Email delivery is not configured — share the invitation link below."
    );
  });
}

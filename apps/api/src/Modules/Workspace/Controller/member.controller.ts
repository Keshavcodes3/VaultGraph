import { asyncHandler } from "../../../Shared/asyncHandler";
import { apiSuccess } from "../../../Shared/apiResponse";

import { memberServiceClass } from "../service/member.service";

export class memberControllerClass {
  constructor(
    private readonly memberService: memberServiceClass
  ) {}

  // GET WORKSPACE MEMBERS
  list = asyncHandler(async (req, res) => {
    const members = await this.memberService.list(
      req.params.workspaceId as string,
      req.user.id
    );

    return apiSuccess(
      res,
      members,
      "Workspace members fetched successfully"
    );
  });

  // CHANGE MEMBER ROLE
  changeRole = asyncHandler(async (req, res) => {
    const member = await this.memberService.changeRole(
      req.params.workspaceId as string,
      req.params.memberId as string,
      req.body.role,
      req.user.id
    );

    return apiSuccess(
      res,
      member,
      "Member role updated successfully"
    );
  });

  // REMOVE MEMBER
  remove = asyncHandler(async (req, res) => {
    await this.memberService.remove(
      req.params.workspaceId as string,
      req.params.memberId as string,
      req.user.id
    );

    return apiSuccess(
      res,
      null,
      "Member removed successfully"
    );
  });

  // LEAVE WORKSPACE
  leave = asyncHandler(async (req, res) => {
    await this.memberService.leave(
      req.params.workspaceId as string,
      req.user.id
    );

    return apiSuccess(
      res,
      null,
      "Left workspace successfully"
    );
  });

  // TRANSFER OWNERSHIP
  transferOwnership = asyncHandler(async (req, res) => {
    const member = await this.memberService.transferOwnership(
      req.params.workspaceId as string,
      req.body.targetUserId,
      req.user.id
    );

    return apiSuccess(
      res,
      member,
      "Workspace ownership transferred successfully"
    );
  });
}

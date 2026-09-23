import { asyncHandler } from "../../../Shared/asyncHandler";
import { apiSuccess } from "../../../Shared/apiResponse";

import { workspaceServiceClass } from "../service/workspace.service";

export class workspaceControllerClass {
  constructor(
    private readonly workspaceService: workspaceServiceClass
  ) {}

  // CREATE WORKSPACE
  create = asyncHandler(async (req, res) => {
    const workspace = await this.workspaceService.create(
      req.body,
      req.user.id
    );

    return apiSuccess(
      res,
      workspace,
      "Workspace created successfully",
      201
    );
  });

  // GET ALL WORKSPACES
  getAll = asyncHandler(async (req, res) => {
    const workspaces = await this.workspaceService.getAll(
      req.user.id
    );

    return apiSuccess(
      res,
      workspaces,
      "Workspaces fetched successfully"
    );
  });

  // GET WORKSPACE BY ID
  getById = asyncHandler(async (req, res) => {
    const workspace = await this.workspaceService.getById(
      req.params.workspaceId as string,
      req.user.id
    );

    return apiSuccess(
      res,
      workspace,
      "Workspace fetched successfully"
    );
  });

  // GET WORKSPACE BY SLUG
  getBySlug = asyncHandler(async (req, res) => {
    const workspace = await this.workspaceService.getBySlug(
      req.params.slug as string,
      req.user.id
    );

    return apiSuccess(
      res,
      workspace,
      "Workspace fetched successfully"
    );
  });

  // UPDATE WORKSPACE
  update = asyncHandler(async (req, res) => {
    const workspace = await this.workspaceService.update(
      req.params.workspaceId as string,
      req.user.id,
      req.body
    );

    return apiSuccess(
      res,
      workspace,
      "Workspace updated successfully"
    );
  });

  // DELETE WORKSPACE
  delete = asyncHandler(async (req, res) => {
    await this.workspaceService.delete(
      req.params.workspaceId as string,
      req.user.id
    );

    return apiSuccess(
      res,
      null,
      "Workspace deleted successfully"
    );
  });
}

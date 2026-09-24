import { asyncHandler } from "../../../Shared/asyncHandler";
import { apiSuccess } from "../../../Shared/apiResponse";
import { HttpError } from "../../../Shared/httpError";

import { projectServiceClass } from "../service/project.service";

export class projectControllerClass {
  constructor(
    private readonly projectService: projectServiceClass
  ) {}

  // CREATE PROJECT
  create = asyncHandler(async (req, res) => {
    const project = await this.projectService.createProject(
      req.body,
      req.user.id
    );

    return apiSuccess(
      res,
      { project },
      "Project created successfully",
      201
    );
  });

  // GET PROJECTS OF A WORKSPACE
  getByWorkspace = asyncHandler(async (req, res) => {
    const workspaceId = req.query.workspaceId;

    if (typeof workspaceId !== "string" || !workspaceId) {
      throw new HttpError("workspaceId query parameter is required", 400);
    }

    const projects = await this.projectService.getWorkspaceProjects(
      workspaceId,
      req.user.id
    );

    return apiSuccess(
      res,
      { projects, total: projects.length },
      "Projects fetched successfully"
    );
  });

  // GET PROJECT BY ID
  getById = asyncHandler(async (req, res) => {
    const project = await this.projectService.getProject(
      req.params.projectId as string,
      req.user.id
    );

    return apiSuccess(
      res,
      { project },
      "Project fetched successfully"
    );
  });

  // GET PROJECT DETAILS
  getDetails = asyncHandler(async (req, res) => {
    const project = await this.projectService.getProjectDetails(
      req.params.projectId as string,
      req.user.id
    );

    return apiSuccess(
      res,
      { project },
      "Project details fetched successfully"
    );
  });

  // GET PROJECT BY SLUG WITHIN A WORKSPACE
  getBySlug = asyncHandler(async (req, res) => {
    const project = await this.projectService.getProjectBySlug(
      req.params.workspaceId as string,
      req.params.slug as string,
      req.user.id
    );

    return apiSuccess(
      res,
      { project },
      "Project fetched successfully"
    );
  });

  // UPDATE PROJECT
  update = asyncHandler(async (req, res) => {
    const project = await this.projectService.updateProject(
      req.params.projectId as string,
      req.user.id,
      req.body
    );

    return apiSuccess(
      res,
      { project },
      "Project updated successfully"
    );
  });

  // DELETE PROJECT
  delete = asyncHandler(async (req, res) => {
    const projectId = req.params.projectId as string;

    await this.projectService.deleteProject(
      projectId,
      req.user.id
    );

    return apiSuccess(
      res,
      { message: "Project deleted successfully", projectId },
      "Project deleted successfully"
    );
  });
}

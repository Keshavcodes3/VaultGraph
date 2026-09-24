import { asyncHandler } from "../../../Shared/asyncHandler";
import { apiSuccess } from "../../../Shared/apiResponse";
import { HttpError } from "../../../Shared/httpError";
import { pageServiceClass } from "../Services/page.service";

/**
 * Page controller — thin HTTP layer.
 * Follows existing VaultGraph controller conventions (asyncHandler +
 * apiSuccess envelope, req.user.id as the authenticated user).
 */
export class pageControllerClass {
  constructor(private readonly pageService: pageServiceClass) {}

  create = asyncHandler(async (req, res) => {
    const page = await this.pageService.createPage(req.body, req.user.id);
    return apiSuccess(res, { page }, "Page created successfully", 201);
  });

  list = asyncHandler(async (req, res) => {
    const pages = await this.pageService.listPages(
      {
        workspaceId: req.query["workspaceId"] as string | undefined,
        projectId: req.query["projectId"] as string | undefined,
        parentId: req.query["parentId"] as string | undefined,
        archived: req.query["archived"] as "true" | "false" | undefined,
        favorites: req.query["favorites"] as "true" | "false" | undefined,
      } as any,
      req.user.id
    );
    return apiSuccess(
      res,
      { pages, total: pages.length },
      "Pages fetched successfully"
    );
  });

  tree = asyncHandler(async (req, res) => {
    const tree = await this.pageService.getPageTree(
      {
        workspaceId: req.query["workspaceId"] as string | undefined,
        projectId: req.query["projectId"] as string | undefined,
      },
      req.user.id
    );
    return apiSuccess(res, { tree }, "Page tree fetched successfully");
  });

  getById = asyncHandler(async (req, res) => {
    const result = await this.pageService.getPageWithBlocks(
      req.params["pageId"] as string,
      req.user.id
    );
    return apiSuccess(res, result, "Page fetched successfully");
  });

  update = asyncHandler(async (req, res) => {
    const page = await this.pageService.updatePage(
      req.params["pageId"] as string,
      req.body,
      req.user.id
    );
    return apiSuccess(res, { page }, "Page updated successfully");
  });

  move = asyncHandler(async (req, res) => {
    const page = await this.pageService.movePage(
      req.params["pageId"] as string,
      req.body,
      req.user.id
    );
    return apiSuccess(res, { page }, "Page moved successfully");
  });

  reorder = asyncHandler(async (req, res) => {
    const pages = await this.pageService.reorderPages(req.body, req.user.id);
    return apiSuccess(res, { pages }, "Pages reordered successfully");
  });

  duplicate = asyncHandler(async (req, res) => {
    const page = await this.pageService.duplicatePage(
      req.params["pageId"] as string,
      req.user.id,
      req.body && Object.keys(req.body).length > 0 ? req.body : undefined
    );
    return apiSuccess(res, { page }, "Page duplicated successfully", 201);
  });

  favorite = asyncHandler(async (req, res) => {
    const page = await this.pageService.favoritePage(
      req.params["pageId"] as string,
      req.user.id
    );
    return apiSuccess(res, { page }, "Page added to favorites");
  });

  unfavorite = asyncHandler(async (req, res) => {
    const page = await this.pageService.unfavoritePage(
      req.params["pageId"] as string,
      req.user.id
    );
    return apiSuccess(res, { page }, "Page removed from favorites");
  });

  archive = asyncHandler(async (req, res) => {
    const page = await this.pageService.archivePage(
      req.params["pageId"] as string,
      req.user.id
    );
    return apiSuccess(res, { page }, "Page archived successfully");
  });

  restore = asyncHandler(async (req, res) => {
    const page = await this.pageService.restorePage(
      req.params["pageId"] as string,
      req.user.id
    );
    return apiSuccess(res, { page }, "Page restored successfully");
  });

  delete = asyncHandler(async (req, res) => {
    const pageId = req.params["pageId"] as string;
    if (!pageId) throw new HttpError("pageId is required", 400);
    await this.pageService.deletePage(pageId, req.user.id);
    return apiSuccess(
      res,
      { message: "Page deleted successfully", pageId },
      "Page deleted successfully"
    );
  });
}

/** Conventional-casing alias. */
export const PageController = pageControllerClass;
export type PageController = pageControllerClass;

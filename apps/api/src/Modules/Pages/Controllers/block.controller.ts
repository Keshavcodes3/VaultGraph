import { asyncHandler } from "../../../Shared/asyncHandler";
import { apiSuccess } from "../../../Shared/apiResponse";
import { HttpError } from "../../../Shared/httpError";
import { blockServiceClass } from "../Services/block.service";

/**
 * Block controller — thin HTTP layer for page content units.
 * Every operation verifies page access via the block service.
 */
export class blockControllerClass {
  constructor(private readonly blockService: blockServiceClass) {}

  create = asyncHandler(async (req, res) => {
    const block = await this.blockService.createBlock(
      req.params["pageId"] as string,
      req.body,
      req.user.id
    );
    return apiSuccess(res, { block }, "Block created successfully", 201);
  });

  list = asyncHandler(async (req, res) => {
    const blocks = await this.blockService.listBlocks(
      req.params["pageId"] as string,
      req.user.id
    );
    return apiSuccess(
      res,
      { blocks, total: blocks.length },
      "Blocks fetched successfully"
    );
  });

  getById = asyncHandler(async (req, res) => {
    const block = await this.blockService.getBlock(
      req.params["blockId"] as string,
      req.user.id
    );
    return apiSuccess(res, { block }, "Block fetched successfully");
  });

  update = asyncHandler(async (req, res) => {
    const block = await this.blockService.updateBlock(
      req.params["blockId"] as string,
      req.body,
      req.user.id
    );
    return apiSuccess(res, { block }, "Block updated successfully");
  });

  move = asyncHandler(async (req, res) => {
    const block = await this.blockService.moveBlock(
      req.params["blockId"] as string,
      req.body,
      req.user.id
    );
    return apiSuccess(res, { block }, "Block moved successfully");
  });

  reorder = asyncHandler(async (req, res) => {
    const pageId = (req.params["pageId"] as string | undefined) ??
      (req.body?.pageId as string | undefined);
    if (!pageId) throw new HttpError("pageId is required to reorder blocks", 400);
    const blocks = await this.blockService.reorderBlocks(
      pageId,
      req.body,
      req.user.id
    );
    return apiSuccess(res, { blocks }, "Blocks reordered successfully");
  });

  delete = asyncHandler(async (req, res) => {
    const blockId = req.params["blockId"] as string;
    if (!blockId) throw new HttpError("blockId is required", 400);
    await this.blockService.deleteBlock(blockId, req.user.id);
    return apiSuccess(
      res,
      { message: "Block deleted successfully", blockId },
      "Block deleted successfully"
    );
  });
}

/** Conventional-casing alias. */
export const BlockController = blockControllerClass;
export type BlockController = blockControllerClass;

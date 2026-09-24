"use client";

import type { ApiBlock, ApiPage } from "@/lib/api/blocks";
import type { Block, BlockType, PageItem } from "@/components/workspace/data";

/** DB (uppercase) -> editor block type. Extensible, single place. */
export function apiBlockTypeToEditor(
  type: string,
  content: Record<string, unknown>
): BlockType {
  const t = String(type ?? "").toUpperCase();
  switch (t) {
    case "HEADING": {
      const level = content["level"];
      if (level === 3) return "h3";
      if (level === 2) return "h2";
      return "h1";
    }
    case "TODO":
      return "checkbox";
    case "BULLET":
    case "BULLETED_LIST":
      return "bullet";
    case "NUMBERED_LIST":
      return "numbered";
    case "QUOTE":
      return "quote";
    case "CODE":
      return "code";
    case "CALLOUT":
      return "callout";
    case "DIVIDER":
      return "divider";
    case "IMAGE":
      return "image";
    case "FILE":
      return "file";
    case "BOOKMARK":
    case "LINK":
      return "paragraph";
    case "PARAGRAPH":
    case "TEXT":
    default:
      return "paragraph";
  }
}

/** Editor block type -> DB (uppercase) enum. */
export function editorBlockTypeToApi(type: BlockType): string {
  switch (type) {
    case "h1":
    case "h2":
    case "h3":
      return "HEADING";
    case "checkbox":
      return "TODO";
    case "bullet":
      return "BULLETED_LIST";
    case "numbered":
      return "NUMBERED_LIST";
    case "quote":
      return "QUOTE";
    case "code":
      return "CODE";
    case "callout":
      return "CALLOUT";
    case "divider":
      return "DIVIDER";
    case "image":
      return "IMAGE";
    case "file":
      return "FILE";
    case "toggle":
      return "CALLOUT";
    case "table":
    case "database":
    case "video":
      return "TEXT";
    case "paragraph":
    default:
      return "PARAGRAPH";
  }
}

/** API block -> editor block (content object -> editor fields). */
export function apiBlockToEditor(b: ApiBlock): Block {
  const content = (b.content ?? {}) as Record<string, unknown>;
  const type = apiBlockTypeToEditor(b.type, content);
  const text =
    typeof content["text"] === "string" ? (content["text"] as string) : "";
  const editor: Block = {
    id: b.id,
    type,
    content: text,
  };
  if (typeof content["checked"] === "boolean")
    editor.checked = content["checked"] as boolean;
  if (typeof content["language"] === "string")
    editor.language = content["language"] as string;
  if (typeof content["url"] === "string")
    editor.url = content["url"] as string;
  if (typeof content["fileName"] === "string")
    editor.fileName = content["fileName"] as string;
  if (typeof content["fileSize"] === "string")
    editor.fileSize = content["fileSize"] as string;
  if (Array.isArray(content["tableCells"]))
    editor.tableCells = content["tableCells"] as string[][];
  if (type === "h1") editor.content = text;
  return editor;
}

/** Editor block -> API payload (editor fields -> content object). */
export function editorBlockToApiPayload(b: Block): Record<string, unknown> {
  const content: Record<string, unknown> = { text: b.content ?? "" };
  if (b.checked !== undefined) content["checked"] = b.checked;
  if (b.language) content["language"] = b.language;
  if (b.url) content["url"] = b.url;
  if (b.fileName) content["fileName"] = b.fileName;
  if (b.fileSize) content["fileSize"] = b.fileSize;
  if (b.tableCells) content["tableCells"] = b.tableCells;
  if (b.type === "h1") content["level"] = 1;
  if (b.type === "h2") content["level"] = 2;
  if (b.type === "h3") content["level"] = 3;
  return {
    type: editorBlockTypeToApi(b.type),
    content,
  };
}

/** API page -> editor PageItem (reuses existing PageCanvas/BlockEditor). */
export function apiPageToEditor(
  page: ApiPage,
  blocks: ApiBlock[]
): PageItem {
  // The editor surface is flat (nested server blocks with parentId are
  // preserved on the server and shown flat here so the autosave diff never
  // deletes them as "removed"). Ordering follows persistent position.
  const editorBlocks = [...blocks]
    .sort(
      (a, b) =>
        String(a.parentId ?? "").localeCompare(String(b.parentId ?? "")) ||
        (a.position ?? 0) - (b.position ?? 0)
    )
    .map(apiBlockToEditor);
  return {
    id: page.id,
    title: page.title ?? "",
    icon: page.icon ?? "📄",
    description: page.description ?? "",
    cover: page.cover ?? undefined,
    favorite: page.isFavorite ?? false,
    updatedAt: page.updatedAt,
    blocks: editorBlocks.length > 0
      ? editorBlocks
      : [{ id: `b-empty`, type: "paragraph", content: "" }],
  };
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import PageCanvas from "./PageCanvas";
import PageHeader, { type SaveState } from "./PageHeader";
import { EmptyPage } from "./EmptyPage";
import { usePage } from "@/hooks/pages/use-page";
import { useFavoritePage } from "@/hooks/pages/use-page-mutations";
import { useAutosave } from "@/hooks/pages/use-autosave";
import { blocksApi, type ApiBlock } from "@/lib/api/blocks";
import { ApiError } from "@/lib/api/client";
import { pagesApi } from "@/lib/api/pages";
import { blockKeys, pageKeys } from "@/lib/query/query-keys";
import {
  apiPageToEditor,
  editorBlockToApiPayload,
} from "@/lib/pages/mapping";
import { patchPageTitleInCache } from "@/lib/pages/optimistic";
import type { Block, PageItem } from "./data";

function isFreshEditor(page: PageItem): boolean {
  return (
    !page.title &&
    page.blocks.every((b) => !b.content.trim() && !b.url)
  );
}

function blocksEqual(a: ApiBlock[], b: Block[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const api = a[i];
    const ed = b[i];
    if (!api || !ed) return false;
    if (api.id !== ed.id) return false;
    const content = (api.content ?? {}) as Record<string, unknown>;
    if ((content["text"] as string | undefined ?? "") !== (ed.content ?? ""))
      return false;
  }
  return true;
}

/**
 * Connected Page experience — backend-backed, Notion-like, content-first.
 * Reuses the existing presentational PageCanvas + BlockEditor (slash menu,
 * keyboard, drag-reorder) and adds debounced persistence, loading, error
 * and empty states on top. No admin-dashboard chrome.
 */
export default function PageView({
  pageId,
  propsOpen = false,
  onToggleProps,
  onOpenSidebar,
  onDeletePage,
}: {
  pageId: string;
  propsOpen?: boolean;
  onToggleProps?: () => void;
  onOpenSidebar?: () => void;
  onDeletePage?: (id: string) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = usePage(pageId);

  const [editorPage, setEditorPage] = useState<PageItem | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const serverBlocks = useRef<ApiBlock[]>([]);
  const pageIdRef = useRef(pageId);
  pageIdRef.current = pageId;
  const setEditorPageRef = useRef(setEditorPage);
  setEditorPageRef.current = setEditorPage;

  const crumbs = useMemo(() => {
    if (!data) return [{ id: pageId, title: "Untitled" }];
    return [
      ...data.ancestors.map((a) => ({ id: a.id, title: a.title || "Untitled" })),
      { id: data.page.id, title: data.page.title || "Untitled" },
    ];
  }, [data, pageId]);

  // Meta autosave (title/description/icon/cover): debounced, versioned.
  const metaSave = useCallback(
    async (patch: { title?: string; description?: string; icon?: string }) => {
      const id = pageIdRef.current;
      await pagesApi.update(id, patch);
      // Tree + sidebar read from pageKeys.all — detail-only invalidation
      // left the sidebar showing the previous name.
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
    },
    [queryClient]
  );
  const metaAutosave = useAutosave(metaSave, 800);

  // Block autosave: diff local editor blocks vs last-known server blocks,
  // then issue minimal create/update/delete calls (debounced). Positions are
  // written per block, so ordering persists without a separate reorder call
  // (avoids mixing parent scopes; nested server blocks keep their parent).
  // Saves run strictly one at a time (chained): overlapping saves would
  // otherwise read the same stale snapshot and double-delete a block,
  // surfacing a phantom 404 + error banner.
  const blockSaveChain = useRef(Promise.resolve());
  const blockSaveInner = useCallback(async (next: Block[]) => {
    const id = pageIdRef.current;
    const prev = serverBlocks.current;
    const prevById = new Map(prev.map((b) => [b.id, b]));
    const nextIds = new Set(next.map((b) => b.id));

    // Delete removed top-level blocks. Nested server blocks (parentId set)
    // are preserved — the flat editor surface doesn't own their hierarchy.
    // A 404 here means "already gone" (deleted elsewhere/cascade) — not an
    // error, the desired end state already holds.
    for (const b of prev) {
      if (!nextIds.has(b.id) && !b.parentId) {
        try {
          await blocksApi.remove(b.id);
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 404)) throw error;
        }
      }
    }
    // Create / update in editor order (positions follow array order).
    const idMap = new Map<string, string>();
    for (let i = 0; i < next.length; i += 1) {
      const ed = next[i];
      if (!ed) continue;
      const payload = editorBlockToApiPayload(ed);
      const existing = prevById.get(ed.id);
      if (!existing) {
        const created = await blocksApi.create(id, {
          type: String(payload["type"]),
          content: payload["content"] as Record<string, unknown>,
          position: i,
        });
        // Remap temp local id -> real server id for future diffs.
        idMap.set(ed.id, created.block.id);
        next[i] = { ...ed, id: created.block.id };
      } else {
        const content = (existing.content ?? {}) as Record<string, unknown>;
        const sameType =
          String(existing.type).toUpperCase() ===
          String(payload["type"]).toUpperCase();
        const sameText =
          (content["text"] as string | undefined ?? "") ===
          (ed.content ?? "");
        const samePos = (existing.position ?? 0) === i;
        if (!sameType || !sameText || !samePos) {
          await blocksApi.update(ed.id, {
            type: String(payload["type"]),
            content: payload["content"] as Record<string, unknown>,
            position: i,
          });
        }
      }
    }
    const fresh = await blocksApi.list(id);
    serverBlocks.current = fresh.blocks;
    // Push real server ids back into local editor state so the next diff
    // doesn't re-create the same blocks (prevents duplicates + stale writes).
    if (idMap.size > 0) {
      const remap = new Map(idMap);
      setEditorPageRef.current((prev) =>
        prev
          ? {
              ...prev,
              blocks: prev.blocks.map((b) =>
                remap.has(b.id) ? { ...b, id: remap.get(b.id) as string } : b
              ),
            }
          : prev
      );
    }
    queryClient.invalidateQueries({ queryKey: blockKeys.byPage(id) });
    queryClient.invalidateQueries({ queryKey: pageKeys.detail(id) });
  }, [queryClient]);

  const blockSave = useCallback((next: Block[]) => {
    const run = () => blockSaveInner(next);
    const chained: Promise<unknown> = blockSaveChain.current.then(run, run);
    // Keep the chain alive for the next save even when this one fails;
    // the rejection still reaches useAutosave so real errors surface.
    blockSaveChain.current = chained.catch(() => {});
    return chained;
  }, [blockSaveInner]);

  const blockAutosave = useAutosave(blockSave, 900);

  // Sync server -> local on page change / settled load. While a debounced
  // save is pending, in flight, or failed, local state is newer than the
  // server snapshot — resetting here would eat fresh keystrokes, so skip it
  // (it converges on the next successful save). Header/meta reads `data`
  // directly, so it still stays fresh while typing.
  useEffect(() => {
    if (!data) return;
    serverBlocks.current = data.blocks;
    if (blockAutosave.state !== "saved" || metaAutosave.state !== "saved") return;
    setEditorPage(apiPageToEditor(data.page, data.blocks));
    setSaveError(null);
  }, [data, pageId, blockAutosave.state, metaAutosave.state]);

  useEffect(() => {
    if (blockAutosave.state === "error") {
      setSaveError("Couldn't save your latest edits. Check your connection.");
    } else if (blockAutosave.state === "saved") {
      setSaveError(null);
    }
  }, [blockAutosave.state]);

  const saveState: SaveState =
    metaAutosave.state === "saving" || blockAutosave.state === "saving"
      ? "saving"
      : "saved";

  const { favorite, unfavorite } = useFavoritePage(pageId);

  const patchBlocks = useCallback(
    (blocks: Block[]) => {
      setEditorPage((prev) =>
        prev ? { ...prev, blocks, updatedAt: "Just now" } : prev
      );
      // Skip the echo: if the patch exactly matches the server, don't save.
      if (blocksEqual(serverBlocks.current, blocks)) return;
      blockAutosave.schedule(blocks);
    },
    [blockAutosave]
  );

  const patchMeta = useCallback(
    (patch: Partial<PageItem>) => {
      setEditorPage((prev) =>
        prev ? { ...prev, ...patch, updatedAt: "Just now" } : prev
      );
      // Optimistic: sidebar + breadcrumbs update on this keystroke,
      // not 800ms later when the debounced save fires.
      if (patch.title !== undefined) {
        patchPageTitleInCache(queryClient, pageIdRef.current, patch.title);
      }
      const body: { title?: string; description?: string; icon?: string } = {};
      if (patch.title !== undefined) body.title = patch.title;
      if (patch.description !== undefined)
        body.description = patch.description;
      if (patch.icon !== undefined) body.icon = patch.icon;
      if (Object.keys(body).length > 0) metaAutosave.schedule(body);
    },
    [metaAutosave, queryClient]
  );

  const toggleFav = useCallback(() => {
    if (!data) return;
    if (data.page.isFavorite) {
      unfavorite.mutate();
    } else {
      favorite.mutate();
    }
  }, [data, favorite, unfavorite]);

  const copyLink = useCallback(() => {
    try {
      void navigator.clipboard.writeText(
        `${window.location.origin}/workspace/${pageId}`
      );
    } catch {
      /* clipboard unavailable */
    }
  }, [pageId]);

  if (isLoading || !editorPage) {
    return (
      <div className="flex min-h-[60vh] flex-col">
        <div className="h-12 shrink-0 border-b border-line dark:border-[#272727]" />
        <div className="mx-auto w-full max-w-[850px] space-y-3 px-6 py-10 sm:px-12">
          <div className="h-10 w-2/3 animate-pulse rounded-lg bg-soft dark:bg-white/5" />
          <div className="h-4 w-full animate-pulse rounded bg-soft dark:bg-white/5" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-soft dark:bg-white/5" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-soft dark:bg-white/5" />
          <p className="sr-only" role="status">
            Loading page…
          </p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col">
        <EmptyPage
          title="This page didn't load."
          hint="Check your connection or permissions, then try again."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
        <div className="mx-auto pb-10">
          <button
            onClick={() => router.push("/workspace")}
            className="text-[13px] text-faint underline-offset-2 hover:underline"
          >
            Back to workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col overflow-x-clip">
      <PageHeader
        crumbs={crumbs}
        isFavorite={data.page.isFavorite}
        saveState={saveState}
        propsOpen={propsOpen}
        onSelectCrumb={(id) => {
          if (id !== pageId) router.push(`/workspace/${id}`);
        }}
        onToggleFav={toggleFav}
        onCopyLink={copyLink}
        onToggleProps={onToggleProps ?? (() => {})}
        onOpenSidebar={onOpenSidebar ?? (() => router.push("/workspace"))}
        onDelete={onDeletePage ? () => onDeletePage(pageId) : undefined}
      />
      {saveError ? (
        <div className="mx-auto mt-3 flex w-full max-w-[850px] items-center justify-between gap-3 rounded-lg border border-rosy/30 bg-rosy/10 px-3 py-2 text-[13px] text-ink sm:mx-auto sm:px-12 dark:text-white">
          <span>{saveError}</span>
          <button
            onClick={() => {
              setSaveError(null);
              blockAutosave.retry();
            }}
            className="shrink-0 rounded-md bg-ink px-3 py-1 font-semibold text-white dark:bg-white dark:text-ink"
          >
            Retry
          </button>
        </div>
      ) : null}
      <main className="min-w-0 flex-1 overflow-y-auto bg-white dark:bg-[#111111]">
        <PageCanvas
          page={editorPage}
          dbRows={[]}
          isFresh={isFreshEditor(editorPage)}
          onPatchBlocks={patchBlocks}
          onMeta={patchMeta}
          onDbChange={() => {}}
        />
      </main>
    </div>
  );
}

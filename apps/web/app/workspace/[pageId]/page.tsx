import type { Metadata } from "next";
import PageView from "@/components/workspace/PageView";

export const metadata: Metadata = {
  title: "Page — VaultGraph",
  description: "A focused Notion-style page. Title, blocks and hierarchy.",
};

export default async function WorkspacePageRoute({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;

  if (!pageId) {
    return (
      <main className="mx-auto w-full max-w-[850px] px-6 py-20 text-center">
        <h1 className="text-[19px] font-semibold text-ink dark:text-white">
          No page selected.
        </h1>
        <p className="mt-1.5 text-[13.5px] text-ink-soft dark:text-[#A1A1AA]">
          Choose a page from the sidebar to start writing.
        </p>
      </main>
    );
  }

  return <PageView pageId={pageId} />;
}

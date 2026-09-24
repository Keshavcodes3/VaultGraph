import type { Metadata } from "next";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

export const metadata: Metadata = {
  title: "Workspace — VaultGraph",
  description: "Your thinking environment. Pages, projects and databases in one calm canvas.",
};

export default function WorkspacePage() {
  return <WorkspaceShell />;
}

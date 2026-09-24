import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { projectKeys } from "@/lib/query/query-keys";
import type { ProjectDetails } from "./types";

/** One project with its workspace and pages. */
export function useProjectDetails(projectId: string | null) {
  return useQuery({
    queryKey: projectId
      ? projectKeys.detail(projectId)
      : projectKeys.all,
    queryFn: async () => {
      const { project } = await api.get<{ project: ProjectDetails }>(
        `/api/projects/${encodeURIComponent(projectId ?? "")}/details`
      );
      return project;
    },
    enabled: Boolean(projectId),
  });
}

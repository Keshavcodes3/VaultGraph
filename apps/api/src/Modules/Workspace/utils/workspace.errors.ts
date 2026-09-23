export class WorkspaceNotFoundError extends Error {
  constructor() {
    super("Workspace not found");
    this.name = "WorkspaceNotFoundError";
  }
}

export class WorkspaceAccessDeniedError extends Error {
  constructor() {
    super("You do not have access to this workspace");
    this.name = "WorkspaceAccessDeniedError";
  }
}

export class WorkspaceSlugAlreadyExistsError extends Error {
  constructor() {
    super("Workspace slug already exists");
    this.name = "WorkspaceSlugAlreadyExistsError";
  }
}

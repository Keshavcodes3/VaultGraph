export class ProjectNotFoundError extends Error {
  constructor() {
    super("Project not found");
    this.name = "ProjectNotFoundError";
  }
}

export class ProjectAccessDeniedError extends Error {
  constructor() {
    super("You do not have access to this project");
    this.name = "ProjectAccessDeniedError";
  }
}

export class ProjectSlugAlreadyExistsError extends Error {
  constructor() {
    super("Project slug already exists in this workspace");
    this.name = "ProjectSlugAlreadyExistsError";
  }
}

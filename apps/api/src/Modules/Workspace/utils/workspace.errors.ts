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

/* ------------------------- Membership + Invitation ------------------------ */

export class WorkspaceMemberNotFoundError extends Error {
  constructor() {
    super("Workspace member not found");
    this.name = "WorkspaceMemberNotFoundError";
  }
}

export class AlreadyWorkspaceMemberError extends Error {
  constructor() {
    super("User is already a member of this workspace.");
    this.name = "AlreadyWorkspaceMemberError";
  }
}

export class InvitationNotFoundError extends Error {
  constructor() {
    super("Invitation not found");
    this.name = "InvitationNotFoundError";
  }
}

export class InvitationAlreadyExistsError extends Error {
  constructor() {
    super("An active invitation already exists for this email.");
    this.name = "InvitationAlreadyExistsError";
  }
}

export class InvitationAlreadyAcceptedError extends Error {
  constructor() {
    super("This invitation has already been accepted.");
    this.name = "InvitationAlreadyAcceptedError";
  }
}

export class InvitationExpiredError extends Error {
  constructor() {
    super("This invitation has expired.");
    this.name = "InvitationExpiredError";
  }
}

export class InvitationRevokedError extends Error {
  constructor(message = "This invitation has been revoked.") {
    super(message);
    this.name = "InvitationRevokedError";
  }
}

export class InvitationRejectedError extends Error {
  constructor() {
    super("This invitation has been rejected.");
    this.name = "InvitationRejectedError";
  }
}

export class InvitationEmailMismatchError extends Error {
  constructor() {
    super(
      "This invitation was sent to a different email address. Please sign in with the invited email."
    );
    this.name = "InvitationEmailMismatchError";
  }
}

export class LastOwnerError extends Error {
  constructor() {
    super(
      "Cannot remove the last owner. Transfer ownership to another member first."
    );
    this.name = "LastOwnerError";
  }
}

export class InvalidInvitationRoleError extends Error {
  constructor() {
    super("Only workspace owners can invite new owners.");
    this.name = "InvalidInvitationRoleError";
  }
}

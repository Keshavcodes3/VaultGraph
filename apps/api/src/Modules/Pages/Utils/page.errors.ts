export class PageNotFoundError extends Error {
  constructor() {
    super("Page not found");
    this.name = "PageNotFoundError";
  }
}

export class PageAccessDeniedError extends Error {
  constructor() {
    super("You do not have access to this page");
    this.name = "PageAccessDeniedError";
  }
}

export class PageHierarchyError extends Error {
  constructor(message = "Invalid page hierarchy") {
    super(message);
    this.name = "PageHierarchyError";
  }
}

export class BlockNotFoundError extends Error {
  constructor() {
    super("Block not found");
    this.name = "BlockNotFoundError";
  }
}

export class BlockAccessDeniedError extends Error {
  constructor() {
    super("You do not have access to this block");
    this.name = "BlockAccessDeniedError";
  }
}

export class BlockHierarchyError extends Error {
  constructor(message = "Invalid block hierarchy") {
    super(message);
    this.name = "BlockHierarchyError";
  }
}

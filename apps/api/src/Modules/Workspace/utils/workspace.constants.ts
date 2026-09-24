export const WORKSPACE_LIMITS = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  SLUG_MIN_LENGTH: 1,
  SLUG_MAX_LENGTH: 100,
} as const;

/** Default invitation lifetime (days) unless a product spec says otherwise. */
export const INVITATION_EXPIRY_DAYS = 7;

/** Minimum time between resends of the same invitation (abuse guard). */
export const INVITATION_RESEND_COOLDOWN_MS = 60_000;

/** Role hierarchy, highest privilege first. */
export const WORKSPACE_ROLE_RANK = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
} as const;

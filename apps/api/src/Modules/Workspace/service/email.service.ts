/**
 * Workspace invitation email delivery.
 *
 * Transport selection (no new dependencies, fetch-based):
 * - `RESEND_API_KEY` set → delivered via the Resend HTTP API.
 * - otherwise → the invitation is logged in a structured format and
 *   reported as unsent, so callers can surface the (real, working) invite
 *   link instead of faking delivery success.
 */

export type InvitationEmailInput = {
  to: string;
  workspaceName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
  expiresAtISO: string | null;
};

export type InvitationEmailContent = {
  subject: string;
  text: string;
  html: string;
};

export type InvitationEmailResult = {
  sent: boolean;
  provider: "resend" | "log";
  error?: string;
};

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

export const buildWorkspaceInvitationEmail = (
  input: InvitationEmailInput
): InvitationEmailContent => {
  const subject = `You're invited to join ${input.workspaceName} on VaultGraph`;
  const expiryLine = input.expiresAtISO
    ? `This invitation expires on ${new Date(input.expiresAtISO).toUTCString()}.`
    : "This invitation expires in 7 days.";

  const text = [
    "VaultGraph",
    "",
    `You've been invited to join ${input.workspaceName}.`,
    "",
    `${input.inviterName} invited you to join ${input.workspaceName} as ${input.role}.`,
    "",
    `Accept invitation: ${input.acceptUrl}`,
    "",
    expiryLine,
    "If you don't have a VaultGraph account yet, register with this email address first, then open the link again.",
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1c1917; line-height: 1.6; max-width: 560px; margin: 0 auto; padding: 24px;">
    <p style="font-weight: 700; font-size: 18px; margin: 0 0 4px;">VaultGraph</p>
    <h1 style="font-size: 22px; margin: 8px 0 12px;">You&rsquo;re invited to join ${escapeHtml(input.workspaceName)}</h1>
    <p>${escapeHtml(input.inviterName)} invited you to join <strong>${escapeHtml(input.workspaceName)}</strong> as <strong>${escapeHtml(input.role)}</strong>.</p>
    <p style="margin: 20px 0;">
      <a href="${escapeHtml(input.acceptUrl)}" style="display: inline-block; background: #1c1917; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 999px; font-weight: 600;">Accept invitation</a>
    </p>
    <p style="color: #78716c; font-size: 14px;">${escapeHtml(expiryLine)}</p>
    <p style="color: #78716c; font-size: 14px;">If you don&rsquo;t have a VaultGraph account yet, register with this email address first, then open the link again.</p>
  </body>
</html>`;

  return { subject, text, html };
};

export const sendWorkspaceInvitationEmail = async (
  input: InvitationEmailInput
): Promise<InvitationEmailResult> => {
  const content = buildWorkspaceInvitationEmail(input);
  const apiKey = process.env["RESEND_API_KEY"];
  const from =
    process.env["EMAIL_FROM"] ?? "VaultGraph <noreply@vaultgraph.app>";

  if (!apiKey) {
    // No email provider configured: log the invitation so operators can
    // see exactly what would have been delivered. Never log raw tokens —
    // the accept URL is the invitee's own single-use link and is only
    // emitted here (server logs), never via API responses after creation.
    console.log(
      JSON.stringify({
        event: "invitation.email.skipped",
        reason: "RESEND_API_KEY is not configured",
        to: input.to,
        subject: content.subject,
        acceptUrl: input.acceptUrl,
      })
    );
    return {
      sent: false,
      provider: "log",
      error: "Email delivery is not configured.",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: content.subject,
        text: content.text,
        html: content.html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        `Invitation email delivery failed (${res.status}): ${detail.slice(0, 300)}`
      );
      return {
        sent: false,
        provider: "resend",
        error: "Email delivery failed.",
      };
    }

    return { sent: true, provider: "resend" };
  } catch (error) {
    console.error(
      "Invitation email delivery failed:",
      error instanceof Error ? error.message : error
    );
    return {
      sent: false,
      provider: "resend",
      error: "Email delivery failed.",
    };
  }
};

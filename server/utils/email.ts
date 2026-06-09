import { Resend } from "resend";

// Transactional email via Resend. When RESEND_API_KEY is unset (local dev), the
// message is logged instead of sent, so verification and reset links are still
// reachable from the server console without configuring a provider.

const FROM = process.env.EMAIL_FROM || "EngineView <onboarding@resend.dev>";

interface Email {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      `[email:dev] RESEND_API_KEY not set, not sending.\n  to: ${email.to}\n  subject: ${email.subject}\n  ${email.text}`,
    );
    return;
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  if (error) throw new Error(`Failed to send email: ${error.message}`);
}

// A small shared template so the emails look consistent.
export function emailLayout(
  heading: string,
  body: string,
  buttonLabel: string,
  url: string,
): string {
  return `
  <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #0b0f14;">
    <h2 style="margin: 0 0 12px;">${heading}</h2>
    <p style="margin: 0 0 20px; color: #444;">${body}</p>
    <a href="${url}" style="display: inline-block; background: #1f6feb; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 8px;">${buttonLabel}</a>
    <p style="margin: 20px 0 0; color: #888; font-size: 13px;">Or paste this link into your browser:<br>${url}</p>
  </div>`;
}

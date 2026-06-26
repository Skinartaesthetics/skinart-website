/* ==========================================================================
   /api/send-contact — secure serverless endpoint (Vercel, Node runtime)

   Handles the "Request a Consultation" form on contact.html. The form used
   to submit as a plain HTML POST to "#", which Vercel's static hosting has
   no way to handle — that's why submitting it produced a blank page. This
   endpoint gives the form an actual destination: it emails the submitted
   details to the studio via Resend, the same email provider already used
   for AI Skin Analysis leads in api/analyze-skin.js.

   Required environment variables (already configured in Vercel for the AI
   Skin Analysis feature — this endpoint reuses the same ones):
     RESEND_API_KEY   — your Resend.com API key (or EMAIL_API_KEY instead)
     LEAD_EMAIL_TO    — defaults to info@skinartaesthetics.com if unset

   Request body (JSON): { first_name, last_name, email, phone, interest,
   message, pageUrl, sessionId }. pageUrl/sessionId are optional and only
   used for the analytics event below.

   Response: { success: true } on success, or
             { success: false, error, details? } on failure.
   ========================================================================== */

import { logEvent } from "./_lib/analytics.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function getEmailApiKey() {
  return process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || null;
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function fmtDate(d) {
  return d.toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function sendContactEmail({ firstName, lastName, email, phone, interest, message, submittedAt }) {
  const apiKey = getEmailApiKey();
  const toEmail = process.env.LEAD_EMAIL_TO || "info@skinartaesthetics.com";
  if (!apiKey) {
    console.warn("No RESEND_API_KEY / EMAIL_API_KEY configured — skipping contact email.");
    return { sent: false, reason: "No email API key configured" };
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const subject = `New Contact Request — ${fullName}`;
  const html = `
    <h2>New Contact Request</h2>
    <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Treatment Interested In:</strong> ${escapeHtml(interest || "Not specified")}</p>
    <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
    <hr>
    <h3>Message</h3>
    <p>${escapeHtml(message || "(No message provided)").replace(/\n/g, "<br>")}</p>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "SkinArt Contact Form <leads@skinartaesthetics.com>",
        to: [toEmail],
        reply_to: isValidEmail(email) ? email : undefined,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Contact email send failed:", errText);
      return { sent: false, reason: "Email provider error" };
    }
    return { sent: true };
  } catch (err) {
    console.error("Contact email send threw:", err);
    return { sent: false, reason: "Unexpected error sending email" };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  const { first_name, last_name, email, phone, interest, message, pageUrl, sessionId } = req.body || {};
  const userAgent = req.headers["user-agent"];

  // ---- Validation (mirrors the required fields already marked * on the form) ----
  const errors = [];
  if (!first_name || !String(first_name).trim()) errors.push("First name is required.");
  if (!last_name || !String(last_name).trim()) errors.push("Last name is required.");
  if (!email || !isValidEmail(email)) errors.push("A valid email address is required.");
  if (!phone || !String(phone).trim()) errors.push("Phone number is required.");
  if (errors.length) {
    res.status(400).json({ success: false, error: "Validation failed", details: errors });
    return;
  }

  const submittedAt = fmtDate(new Date());
  const { sent, reason } = await sendContactEmail({
    firstName: String(first_name).trim(),
    lastName: String(last_name).trim(),
    email: String(email).trim(),
    phone: String(phone).trim(),
    interest: interest ? String(interest).trim() : "",
    message: message ? String(message).trim() : "",
    submittedAt,
  });

  await logEvent({
    eventName: "contact_form_submitted",
    pageUrl,
    sessionId,
    userAgent,
    metadata: { emailSent: sent },
  });

  if (!sent) {
    // The submission itself was valid — only the email delivery failed.
    // Tell the client honestly rather than pretending it worked, so they
    // know to call/email directly instead of assuming we got their request.
    res.status(502).json({ success: false, error: "We couldn't send your request right now. Please call or email us directly.", details: [reason] });
    return;
  }

  res.status(200).json({ success: true });
}

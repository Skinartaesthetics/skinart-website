/* ==========================================================================
   /api/track-schedule-click — lightweight serverless endpoint (Vercel/Netlify)

   Fired (best-effort, non-blocking) when a lead clicks "Schedule Appointment"
   after seeing their AI skin analysis results. Sends a short internal email
   so the front desk knows this lead followed through to booking — this is
   the "Schedule Appointment clicked" tracking referenced in the lead workflow.

   Uses the same environment variables as /api/analyze-skin:
     RESEND_API_KEY (or EMAIL_API_KEY)
     LEAD_EMAIL_TO
   ========================================================================== */

function getEmailApiKey() {
  return process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || null;
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { name, phone, email } = req.body || {};
  const apiKey = getEmailApiKey();
  const toEmail = process.env.LEAD_EMAIL_TO || "info@skinartaesthetics.com";

  if (!apiKey) {
    // Non-blocking — the widget doesn't need this to succeed.
    res.status(200).json({ tracked: false, reason: "No email API key configured" });
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "SkinArt AI Skin Analysis <leads@skinartaesthetics.com>",
        to: [toEmail],
        subject: `Lead clicked Schedule Appointment — ${name || "Unknown"}`,
        html: `
          <p><strong>${escapeHtml(name || "A recent AI skin analysis lead")}</strong> just clicked "Schedule Appointment" after viewing their results.</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone || "-")}<br>
          <strong>Email:</strong> ${escapeHtml(email || "-")}</p>
        `,
      }),
    });
    res.status(200).json({ tracked: true });
  } catch (err) {
    console.error("track-schedule-click email failed:", err);
    res.status(200).json({ tracked: false });
  }
}

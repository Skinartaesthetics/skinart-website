/* ==========================================================================
   /api/analyze-skin — secure serverless endpoint (Vercel / Netlify, Node runtime)

   This is the ONLY place that talks to OpenAI and to the email provider.
   The browser never sees either API key — it only ever calls this same-origin
   endpoint with the lead's form data + selfie, and gets back a clean JSON
   analysis to render in the chat widget.

   Required environment variables (set in your hosting provider's dashboard,
   never in client code):
     OPENAI_API_KEY   — your OpenAI key (used server-side only)
     RESEND_API_KEY   — your Resend.com API key (or set EMAIL_API_KEY instead —
                         either name works, see getEmailApiKey() below)
     LEAD_EMAIL_TO    — defaults to info@skinartaesthetics.com if unset

   See AI-Skin-Analysis-Setup.md for full deployment steps.
   ========================================================================== */

export const config = {
  api: {
    bodyParser: { sizeLimit: "12mb" }, // selfies are base64-encoded; allow headroom
  },
};

const SYSTEM_PROMPT = `
You are a skincare visual-assessment assistant for SkinArt Aesthetics, a boutique skincare studio. You are reviewing a single client-submitted selfie for a PRELIMINARY, NON-MEDICAL visual impression only.

STRICT RULES — never violate these:
- Never diagnose any medical or dermatological condition.
- Never use alarming, scary, or clinical-sounding language.
- Never guarantee or promise results of any treatment.
- Never state an exact "skin age" or numeric score.
- Never claim certainty from a single photo — always frame observations as visual impressions only.
- Never recommend specific prescription products or active ingredient percentages.
- Always make clear this does not replace an in-person professional consultation.
- Use only soft, observational phrasing such as: "appears", "may suggest", "visible signs of", "could benefit from", "based on the image provided".
- Tone: warm, calm, boutique, professional, encouraging — never salesy or robotic.

Respond ONLY with strict JSON in this exact shape (all values short, 1-2 sentences, plain strings):
{
  "overall": "Overall visible skin condition",
  "hydration": "Possible dehydration or dryness",
  "congestion": "Congestion or blackheads, only if visible",
  "texture": "Texture concerns",
  "redness": "Redness or sensitivity signs",
  "pigmentation": "Pigmentation or uneven tone",
  "pores": "Enlarged pores, only if visible",
  "suggestedDirection": "Suggested professional treatment direction",
  "recommendation": "A warm recommendation to schedule an in-person appointment to confirm these visual impressions"
}
`.trim();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function getEmailApiKey() {
  return process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || null;
}

function fmtDate(d) {
  return d.toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function callVisionAPI(imageDataUrl) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, reason: "OPENAI_API_KEY not configured" };

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.4,
        max_tokens: 600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Provide a preliminary visual skin impression for this selfie, following all rules exactly." },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI error:", errText);
      return { ok: false, reason: "Vision analysis failed" };
    }

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    return { ok: true, analysis: JSON.parse(content) };
  } catch (err) {
    console.error("OpenAI call threw:", err);
    return { ok: false, reason: "Unexpected error calling vision API" };
  }
}

function buildAnalysisHtml(analysis) {
  if (!analysis) {
    return "<p><em>AI analysis was not available at submission time — please review the attached selfie manually.</em></p>";
  }
  const rows = [
    ["Overall Visible Condition", analysis.overall],
    ["Hydration / Dryness", analysis.hydration],
    ["Congestion", analysis.congestion],
    ["Texture", analysis.texture],
    ["Redness / Sensitivity", analysis.redness],
    ["Pigmentation / Tone", analysis.pigmentation],
    ["Pores", analysis.pores],
    ["Suggested Treatment Direction", analysis.suggestedDirection],
    ["Recommendation", analysis.recommendation],
  ].filter(([, v]) => v);

  return rows
    .map(([label, v]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(v)}</p>`)
    .join("\n");
}

async function sendLeadEmail({ name, phone, email, submittedAt, analysis, analysisOk, imageDataUrl }) {
  const apiKey = getEmailApiKey();
  const toEmail = process.env.LEAD_EMAIL_TO || "info@skinartaesthetics.com";
  if (!apiKey) {
    console.warn("No RESEND_API_KEY / EMAIL_API_KEY configured — skipping lead email.");
    return { sent: false, reason: "No email API key configured" };
  }

  const subject = `New AI Skin Analysis Lead — ${name}`;
  const html = `
    <h2>New AI Skin Analysis Lead</h2>
    <p><strong>Full Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Phone Number:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Email Address:</strong> ${escapeHtml(email)}</p>
    <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
    <p><strong>Selfie:</strong> attached to this email.</p>
    <hr>
    <h3>AI Preliminary Skin Analysis</h3>
    ${buildAnalysisHtml(analysis)}
    ${!analysisOk ? "<p><em>Note: instant AI analysis was unavailable for this submission — please follow up personally.</em></p>" : ""}
    <hr>
    <p><strong>Recommended follow-up action:</strong> Contact the client to schedule an in-person consultation and confirm visual impressions.</p>
    <p><strong>Schedule Appointment clicked:</strong> Not yet — will follow up separately if/when the client clicks through.</p>
  `;

  let attachments = [];
  if (imageDataUrl && imageDataUrl.startsWith("data:image")) {
    const base64 = imageDataUrl.split(",")[1];
    attachments = [{ filename: "selfie.jpg", content: base64 }];
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "SkinArt AI Skin Analysis <leads@skinartaesthetics.com>",
        to: [toEmail],
        subject,
        html,
        attachments,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Email send failed:", errText);
      return { sent: false, reason: "Email provider error" };
    }
    return { sent: true };
  } catch (err) {
    console.error("Email send threw:", err);
    return { sent: false, reason: "Unexpected error sending email" };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { name, phone, email, consent, image } = req.body || {};

  // ---- Validation (defense in depth — widget validates too) ----
  const errors = [];
  if (!name || !String(name).trim()) errors.push("Full name is required.");
  if (!phone || !String(phone).trim()) errors.push("Phone number is required.");
  if (!email || !isValidEmail(email)) errors.push("A valid email address is required.");
  if (!consent) errors.push("Consent confirmation is required.");
  if (!image || typeof image !== "string" || !image.startsWith("data:image")) {
    errors.push("A selfie image is required.");
  }
  if (errors.length) {
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

  // ---- AI vision analysis (server-side only — key never touches the browser) ----
  const visionResult = await callVisionAPI(image);
  const analysis = visionResult.ok ? visionResult.analysis : null;

  // ---- Lead email (best-effort: still sent even if AI analysis failed, so no lead is lost) ----
  const submittedAt = fmtDate(new Date());
  const emailResult = await sendLeadEmail({
    name: String(name).trim(),
    phone: String(phone).trim(),
    email: String(email).trim(),
    submittedAt,
    analysis,
    analysisOk: visionResult.ok,
    imageDataUrl: image,
  });

  res.status(200).json({
    analysis,
    analysisAvailable: visionResult.ok,
    emailSent: emailResult.sent,
  });
}

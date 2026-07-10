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

   Response shape (the frontend always has `analysis` to fall back on; the
   newer fields are additive and let the widget render a nicer, sectioned
   result — or a photo-retake prompt — but nothing breaks if a caller only
   ever reads `analysis`):
     {
       success: true|false,        // false only for the needsRetake case below
       needsRetake: true|false,    // true if the photo itself wasn't usable
       reason: "Soft, client-facing explanation of why a retake helps" | null,
       analysisAvailable: true|false,
       analysis: "Full AI-generated skin analysis + treatment match report,
                   as one formatted string with labeled sections" | null,
       findings: "Just the 6 visible-skin-finding sections, same text
                   format as analysis" | null,
       treatmentMatch: {
         primaryName: "Exact service name from treatments.html",
         primaryReason: "Why this may be a good fit",
         secondary: [ { name, reason }, ... up to 2 ],
         nextStep: "Standard recommended-next-step line",
         fellBack: true|false   // true if we couldn't confidently match —
                                 // primaryName will be a safe general pick
       } | null,
       emailSent: true|false   // always false when needsRetake is true —
                                // the lead email is only sent once a usable
                                // photo has actually been analyzed
     }

   PHOTO QUALITY CHECK: before any findings/treatment match are built, the
   model's own "imageQuality" field (cross-checked by detectPoorImageQuality()
   below) decides whether the photo is too dark, too blurry, too far away,
   too cropped, too angled, filtered, or obstructed (makeup/sunglasses/mask/
   hair) to give a reliable read. If so, the response short-circuits with
   needsRetake: true and a soft, client-friendly `reason` — never the words
   "bad", "rejected", or "failed" — and the lead email is skipped until a
   usable photo comes through.

   Internally OpenAI is asked for structured JSON (one field per section) so
   the model stays on-topic and every section is guaranteed to be filled in.
   The treatment-match portion of that JSON is then validated server-side
   against the real SkinArt service catalog in ./_lib/treatments.js — the AI
   is never trusted to recommend a treatment that doesn't actually exist on
   treatments.html, and a safety check demotes any aggressive treatment
   (peels, microneedling, BioRePeel) out of the primary slot whenever visible
   redness/sensitivity is detected. See applyCatalogAndSafetyRules() below.

   See SETUP.md for full deployment steps.
   ========================================================================== */

import { logEvent } from "./_lib/analytics.js";
import {
  isAggressiveTreatment,
  exactCatalogName,
  catalogForPrompt,
  FALLBACK_PRIMARY,
  SAFE_HYDRATING_PRIMARY,
  SAFE_CALMING_PRIMARY,
  SAFE_GENERAL_PRIMARY,
} from "./_lib/treatments.js";

export const config = {
  api: {
    bodyParser: { sizeLimit: "12mb" }, // selfies are base64-encoded; allow headroom
  },
};

const SYSTEM_PROMPT = `
You are a skincare visual-assessment assistant for SkinArt Aesthetics, a boutique skincare studio. You are reviewing a single client-submitted selfie for a PRELIMINARY, NON-MEDICAL visual impression only, and matching it to the studio's own real treatment menu.

STRICT RULES — never violate these:
- Never diagnose any medical or dermatological condition, and never use the word "diagnosis" or "diagnose".
- Never use alarming, scary, or clinical-sounding language. Never say "severe acne" — describe it as visible acne-prone congestion instead, without rating severity.
- Never guarantee or promise results of any treatment ("guaranteed results", "cure" are forbidden).
- Never state an exact "skin age" or numeric score.
- Never claim certainty from a single photo — always frame observations as visual impressions only.
- Never recommend specific prescription products, active ingredient percentages, or use the word "prescription".
- Always make clear this does not replace an in-person professional consultation.
- Use only soft, observational phrasing such as: "appears", "may suggest", "visible signs of", "could benefit from", "based on the image provided", "preliminary match", "your esthetician will confirm in person".
- Tone: warm, calm, boutique, professional, encouraging — never salesy or robotic.

IMAGE QUALITY CHECK — assess this first, before forming any skin impression. Consider all of the following: is the face clearly visible; is the image sharp enough (not blurry/out of focus); is the lighting bright enough (not too dark, not overexposed/blown out); is the face too far away or too heavily cropped to see skin detail; was the photo taken at a strong/extreme angle rather than facing the camera; does the photo look filtered or heavily edited; and is makeup, sunglasses, a mask, or hair covering too much of the visible skin to assess it.
- If, taking all of the above into account, you genuinely cannot get a usable read of the visible skin (not just "a little uncertain" — truly not enough visible skin detail to assess), set "imageQuality" to "poor" and "imageQualityReason" to one short, kind, plain-English sentence naming the specific issue and how to fix it. Always use soft, encouraging phrasing — never the words "bad", "rejected", "failed", or "poor quality image". Good examples: "This photo may not show enough visible skin detail in natural light for a reliable read." / "A clearer, closer shot facing the camera directly will help us give you a better preliminary review." / "The photo appears quite dark, so a brighter, more evenly lit shot would help with accuracy." Still fill in every other field as generally and cautiously as possible, and set "confidentMatch" to false.
- Otherwise set "imageQuality" to "good" and "imageQualityReason" to an empty string — even if some individual findings are a little uncertain, use "confidentMatch": false for that milder case instead of flagging the image itself.

TREATMENT MATCHING — you must pick from this exact SkinArt Aesthetics menu only. Never invent, rename, or suggest anything not on this list. Items marked [AGGRESSIVE] are peels or microneedling:
${catalogForPrompt()}

TREATMENT MATCHING RULES:
- If skin appears dehydrated, dull, tight-looking, or shows a compromised-looking barrier: favor hydrating/barrier-supportive options.
- If skin shows visible congestion, blackheads, enlarged pores, or texture concerns: favor deep-cleansing or pore-focused options.
- If skin shows visible acne-prone congestion or inflamed-looking blemishes: favor acne-focused options. Do not rate or name a severity level.
- If skin shows uneven tone, dullness, pigmentation, or sun-damage appearance: favor brightening/renewal options, and mention in-person consultation before any peel.
- If skin shows visible fine lines, loss-of-firmness appearance, or mature-skin concerns: favor anti-aging/collagen-supportive options. Never promise anti-aging results.
- If the skin appears sensitive, red, reactive, or barrier-compromised in any way: set "sensitivityFlag" to true, and do NOT choose an [AGGRESSIVE] treatment (a peel, BioRePeel, or microneedling) as treatmentPrimary. Choose a calming, hydrating, barrier-supportive, or consultation option as the primary match instead. An [AGGRESSIVE] option may still be mentioned in treatmentSecondary, but only if its reason explicitly says it "may be considered after an in-person consultation" — never present it as a confident first pick.
- If the photo's image quality is poor, lighting makes findings unclear, or the visible concerns are genuinely mixed/ambiguous, set "confidentMatch" to false rather than guessing.

Respond ONLY with strict JSON in this exact shape (every text value is 1-3 full sentences, plain strings, written directly to the client — specific to what is visible in THIS photo, never generic boilerplate):
{
  "imageQuality": "good" or "poor",
  "imageQualityReason": "One short, kind sentence if poor (never use the words bad, rejected, or failed), otherwise an empty string",
  "overall": "Overall visible skin impression",
  "hydration": "Hydration / dryness signs",
  "congestion": "Congestion or blackheads, only if visible — otherwise note that none appear visibly apparent",
  "texture": "Texture and visible pore appearance",
  "redness": "Redness or sensitivity signs",
  "pigmentation": "Uneven tone or pigmentation, only if visible — otherwise note tone appears generally even",
  "sensitivityFlag": true or false,
  "confidentMatch": true or false,
  "treatmentPrimary": "The single best-fit treatment name, copied exactly from the menu above",
  "treatmentPrimaryReason": "1-2 sentences on why this may be a good fit, based on the visible findings",
  "treatmentSecondary": [
    { "name": "Another exact menu name", "reason": "Brief reason" },
    { "name": "Another exact menu name", "reason": "Brief reason" }
  ]
}

Every field must reflect a real, specific-sounding observation grounded in the image — never a placeholder sentence like "your skin may benefit from a professional consultation" used as a stand-in for actual content. treatmentSecondary should have 0-2 entries and must never repeat treatmentPrimary.
`.trim();

// Fixed, non-AI-generated closing line — used for every report so this
// safety-critical final sentence can never drift into risky phrasing.
const STANDARD_NEXT_STEP =
  "Schedule an in-person SkinArt consultation so your esthetician can confirm your skin condition, barrier status, sensitivity, and the safest treatment plan.";

const FALLBACK_CONSULT_MESSAGE =
  "Your skin would benefit from a customized SkinArt consultation so we can properly assess your barrier, hydration, congestion, sensitivity, and treatment options in person.";

// Defense-in-depth language scrub — rewrites any banned word/phrase that
// might slip through despite the prompt instructions, before anything is
// ever shown to the client or emailed to the studio.
function scrubBannedLanguage(text) {
  if (!text) return text;
  return String(text)
    .replace(/\bdiagnos(is|e|ed|ing)\b/gi, "assessment")
    .replace(/\bguarantee(d|s)?\s*results?\b/gi, "may help support visible improvement over time")
    .replace(/\bcure[ds]?\b/gi, "support")
    .replace(/\bsevere acne\b/gi, "visible acne-prone congestion")
    .replace(/\bmedical claims?\b/gi, "general skincare guidance")
    .replace(/\bprescription\s*recommendations?\b/gi, "professional in-person guidance")
    .replace(/\bprescription\b/gi, "professional")
    .replace(/\bexact skin age\b/gi, "skin's current appearance")
    // Soft-language scrub for the photo-quality/retake feature — these words
    // are explicitly banned from client-facing copy (too critical/embarrassing
    // for a luxury, client-friendly tone), so rewrite them defensively even
    // though the prompt already instructs the model not to use them.
    .replace(/\bbad\s+photo\b/gi, "photo")
    .replace(/\bpoor\s+quality\s+image\b/gi, "this photo")
    .replace(/\brejected\b/gi, "not quite usable yet")
    .replace(/\bfailed\b/gi, "wasn't quite usable")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Heuristic, server-side sensitivity check — trusts the model's own
// sensitivityFlag if present, but also scans the visible-finding text itself
// as a second layer, since this particular rule was called out twice as
// safety-critical and should not rely on a single signal.
//
// Checked clause-by-clause (split on . ; ,) rather than across the whole
// string, so a clause containing a negation word ("no redness", "does not
// appear sensitive or reactive") is excluded — otherwise a model saying
// "skin tone is even, no redness is visible" would be misread as sensitive
// just because the word "redness" appears in it.
const SENSITIVITY_KEYWORDS_RE = /(sensitiv|reactive|irritat|inflam|barrier[- ]compromis|visibly red|redness)/;
const NEGATION_RE = /\b(no|none|not|without|free of|doesn.?t|does not|isn.?t|aren.?t)\b/;
function detectSensitivity(parsed) {
  if (parsed.sensitivityFlag === true) return true;
  const text = `${parsed.redness || ""} ${parsed.overall || ""}`.toLowerCase();
  const clauses = text.split(/[.;,]/);
  return clauses.some((clause) => SENSITIVITY_KEYWORDS_RE.test(clause) && !NEGATION_RE.test(clause));
}

// Heuristic, server-side image-quality check — same dual-signal pattern as
// detectSensitivity() above: trust the model's own explicit "imageQuality"
// flag when present, but fall back to scanning its "overall" text for a
// plain-language quality complaint if the field is missing or malformed.
// Lenient default — anything other than an explicit "poor" is treated as
// usable, so a missing/garbled field never wrongly triggers a retake.
const IMAGE_QUALITY_KEYWORDS_RE =
  /(too dark|too blurry|blurr|out of focus|low resolution|poor lighting|not clear enough|can.?t be (assessed|determined)|difficult to assess|hard to assess|not enough visible skin|too far away|heavily cropped|strong angle|filtered|heavily edited|obstructed|not (clearly )?visible)/;
function detectPoorImageQuality(parsed) {
  if (parsed.imageQuality === "poor") return true;
  if (parsed.imageQuality === "good") return false;
  const text = String(parsed.overall || "").toLowerCase();
  const clauses = text.split(/[.;,]/);
  return clauses.some(
    (clause) => IMAGE_QUALITY_KEYWORDS_RE.test(clause) && !NEGATION_RE.test(clause)
  );
}

function pickSafePrimary(parsed) {
  const hydrationText = String(parsed.hydration || "").toLowerCase();
  if (/dry|dehydrat|tight|barrier/.test(hydrationText)) return SAFE_HYDRATING_PRIMARY;
  return SAFE_CALMING_PRIMARY;
}

function normalizeSecondary(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === "object" && item.name)
    .slice(0, 2)
    .map((item) => ({
      name: exactCatalogName(item.name),
      reason: scrubBannedLanguage(String(item.reason || "").trim()),
    }))
    .filter((item) => !!item.name); // drop anything not actually on the menu
}

// Validates and, where necessary, overrides the AI's treatment pick against
// the real catalog and the studio's safety rules. This is the server-side
// backstop — the prompt instructs the model correctly, but the client-facing
// result and the lead email are only ever built from THIS function's output,
// never directly from the model's raw JSON.
function applyCatalogAndSafetyRules(parsed) {
  let fellBack = false;
  let primaryName = exactCatalogName(parsed.treatmentPrimary);
  let primaryReason = scrubBannedLanguage(String(parsed.treatmentPrimaryReason || "").trim());
  let secondary = normalizeSecondary(parsed.treatmentSecondary).filter(
    (s) => s.name !== primaryName
  );

  const confident = parsed.confidentMatch !== false; // lenient default — only treat explicit false as low-confidence
  const sensitive = detectSensitivity(parsed);

  // Rule: never recommend a treatment that isn't actually on the menu.
  if (!primaryName) {
    fellBack = true;
    primaryName = FALLBACK_PRIMARY;
    primaryReason = FALLBACK_CONSULT_MESSAGE;
  } else if (!confident) {
    // Rule: unclear photo / mixed findings — recommend a safe general option
    // or a consultation rather than a confident-sounding guess.
    fellBack = true;
    primaryName = SAFE_GENERAL_PRIMARY;
    primaryReason = `Based on the image provided, the visible signs are a little unclear, so a gentle, well-rounded preliminary match is the safest starting point. ${FALLBACK_CONSULT_MESSAGE}`;
  }

  // Rule: aggressive treatments (peels, microneedling, BioRePeel) are never
  // the primary match when redness/sensitivity is visible — demote to a
  // calming/hydrating pick, and keep the original choice only as a
  // cautiously-worded secondary mention.
  if (sensitive && isAggressiveTreatment(primaryName)) {
    const demotedName = primaryName;
    const demotedReason = primaryReason;
    primaryName = pickSafePrimary(parsed);
    primaryReason =
      "Because some visible redness or sensitivity is present, a calming, barrier-supportive approach appears to be the safer starting point, and your esthetician will confirm in person. " +
      `${demotedName} may be considered after an in-person consultation, once your sensitivity and barrier status are confirmed.`;
    secondary = [
      { name: demotedName, reason: `${demotedReason ? demotedReason + " " : ""}May be considered after an in-person consultation.`.trim() },
      ...secondary,
    ]
      .filter((s) => s.name !== primaryName)
      .slice(0, 2);
  }

  // Rule: even as a secondary mention, an aggressive option must carry the
  // cautious "after consultation" framing whenever sensitivity is visible.
  if (sensitive) {
    secondary = secondary.map((s) =>
      isAggressiveTreatment(s.name) && !/after an? in-person consultation/i.test(s.reason)
        ? { ...s, reason: `${s.reason ? s.reason + " " : ""}May be considered after an in-person consultation.`.trim() }
        : s
    );
  }

  return { primaryName, primaryReason, secondary, fellBack, sensitive };
}

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

// Exact label phrasing as specified — used both in the string sent to the
// widget and (via buildAnalysisHtml) in the lead email. These six are the
// "visible findings" — the treatment-match fields are handled separately by
// formatTreatmentMatchAsText() since they need a different (list-style) shape.
const FINDINGS_SECTIONS = [
  ["overall", "Overall visible skin impression"],
  ["hydration", "Hydration / dryness signs"],
  ["congestion", "Congestion / blackheads"],
  ["texture", "Texture / pore appearance"],
  ["redness", "Redness or sensitivity signs"],
  ["pigmentation", "Uneven tone / pigmentation"],
];

// Fields the OpenAI response must include (non-empty) before we call the
// vision result a success. sensitivityFlag/confidentMatch/treatmentSecondary
// are validated separately/leniently inside applyCatalogAndSafetyRules().
const REQUIRED_FIELDS = [
  "overall",
  "hydration",
  "congestion",
  "texture",
  "redness",
  "pigmentation",
  "treatmentPrimary",
  "treatmentPrimaryReason",
];

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
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Provide a preliminary visual skin impression for this selfie, following all rules exactly. Fill in every field with a specific observation about this image." },
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
    const parsed = JSON.parse(content);

    // Make sure every required field is present and non-empty before calling it a success.
    const hasAllFields = REQUIRED_FIELDS.every((key) => parsed[key] && String(parsed[key]).trim());
    if (!hasAllFields) {
      console.error("OpenAI response missing required fields:", parsed);
      return { ok: false, reason: "Incomplete analysis returned" };
    }

    return { ok: true, analysis: parsed };
  } catch (err) {
    console.error("OpenAI call threw:", err);
    return { ok: false, reason: "Unexpected error calling vision API" };
  }
}

// Flatten just the 6 visible-finding fields into ONE plain-text string, with
// each section labeled — this is the "Your Preliminary Skin Findings" block.
function formatFindingsAsText(analysis) {
  if (!analysis) return null;
  return FINDINGS_SECTIONS
    .filter(([key]) => analysis[key])
    .map(([key, label]) => `${label}: ${scrubBannedLanguage(String(analysis[key]))}`)
    .join("\n\n");
}

// Renders the validated/safety-checked treatment match as the exact
// structure requested: primary match + reason, up to 2 secondary options,
// then the standard next-step line.
function formatTreatmentMatchAsText(match) {
  const lines = [
    "Recommended SkinArt Treatment Match:",
    `Primary Match: ${match.primaryName}`,
    `Why this may be a good fit: ${match.primaryReason}`,
  ];
  if (match.secondary.length) {
    lines.push("Secondary Options:");
    match.secondary.forEach((s) => lines.push(`- ${s.name} — ${s.reason}`));
  }
  lines.push(`Best Next Step: ${match.nextStep}`);
  return lines.join("\n");
}

// Combines the findings block and the treatment-match block into the single
// `analysis` string the widget and email both still read for backward
// compatibility, with a blank line separating the two blocks.
function formatAnalysisAsText(findingsText, treatmentText) {
  return [findingsText, treatmentText].filter(Boolean).join("\n\n");
}

function buildAnalysisHtml(analysisText) {
  if (!analysisText) {
    return "<p><em>AI analysis was not available at submission time — please review the attached selfie manually.</em></p>";
  }
  // Each "Label: content" section (separated by a blank line) becomes its own paragraph.
  return analysisText
    .split("\n\n")
    .map((section) => `<p>${escapeHtml(section).replace(/^([^:]+):/, "<strong>$1:</strong>")}</p>`)
    .join("\n");
}

// Step 7's explicit itemized breakout — kept separate from the full
// findings/treatment text so a busy esthetician can scan it in one glance.
function buildTreatmentMatchHtml(match) {
  if (!match) {
    return "<p><em>No treatment match was generated for this submission — please review the attached selfie manually.</em></p>";
  }
  const secondaryHtml = match.secondary.length
    ? `<ul>${match.secondary.map((s) => `<li><strong>${escapeHtml(s.name)}</strong> — ${escapeHtml(s.reason)}</li>`).join("")}</ul>`
    : "<p><em>None suggested.</em></p>";
  return `
    <p><strong>Primary Treatment Match:</strong> ${escapeHtml(match.primaryName)}${match.fellBack ? " <em>(fallback / consultation-first match)</em>" : ""}</p>
    <p><strong>Why it may fit:</strong> ${escapeHtml(match.primaryReason)}</p>
    <p><strong>Secondary Treatment Options:</strong></p>
    ${secondaryHtml}
    <p><strong>Recommended Next Step:</strong> ${escapeHtml(match.nextStep)}</p>
  `;
}

async function sendLeadEmail({ name, phone, email, submittedAt, analysisText, analysisOk, treatmentMatch, imageDataUrl, photoQualityStatus }) {
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
    <p><strong>Photo Quality Status:</strong> ${escapeHtml(photoQualityStatus || "Passed")}</p>
    <hr>
    <h3>AI Skin Analysis</h3>
    ${buildAnalysisHtml(analysisText)}
    ${!analysisOk ? "<p><em>Note: instant AI analysis was unavailable for this submission — please follow up personally.</em></p>" : ""}
    <hr>
    <h3>SkinArt Treatment Match</h3>
    ${buildTreatmentMatchHtml(treatmentMatch)}
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
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  const { name, phone, email, consent, image, sessionId, pageUrl } = req.body || {};
  const userAgent = req.headers["user-agent"];

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
    res.status(400).json({ success: false, error: "Validation failed", details: errors });
    return;
  }

  // ---- AI vision analysis (server-side only — key never touches the browser) ----
  const visionResult = await callVisionAPI(image);

  const leadMeta = { name: String(name).trim(), email: String(email).trim(), phone: String(phone).trim() };

  // ---- Photo quality check — runs before any findings/treatment match are
  // built. If the photo itself isn't usable, we ask for a retake instead of
  // producing a guessed analysis from an unclear image. This check only
  // applies once the vision call actually succeeded (a missing API key or a
  // genuine OpenAI error is a different, unrelated failure mode handled below).
  const poorImageQuality = visionResult.ok && detectPoorImageQuality(visionResult.analysis);

  if (poorImageQuality) {
    const retakeReason =
      scrubBannedLanguage(String(visionResult.analysis.imageQualityReason || "").trim()) ||
      "This photo may not show enough visible skin detail for a reliable preliminary read — a clearer photo in natural light will help us give you a better review.";

    // Per spec: do not send the lead email yet on a retake — the client
    // hasn't completed a usable submission, so there's nothing for the
    // esthetician to review. We still log the attempt for analytics.
    await logEvent({
      eventName: "photo_quality_failed",
      pageUrl,
      sessionId,
      userAgent,
      metadata: { ...leadMeta, reason: "poor_image_quality" },
    });

    res.status(200).json({
      success: false,
      needsRetake: true,
      reason: retakeReason,
      // Additive, backward-compatible fields — older widget code that only
      // reads `analysisAvailable`/`analysis` degrades gracefully to its
      // existing "instant results aren't ready" message instead of breaking.
      analysisAvailable: false,
      analysis: null,
      findings: null,
      treatmentMatch: null,
      emailSent: false,
    });
    return;
  }

  // The AI's raw treatment pick is never trusted directly — it's always run
  // through applyCatalogAndSafetyRules() first, which checks it against the
  // real treatments.html catalog and overrides anything unsafe (off-menu
  // names, or an aggressive peel/microneedling pick when sensitivity is
  // visible) before it can reach the client or the lead email.
  let findingsText = null;
  let treatmentMatch = null;
  let analysisText = null;

  if (visionResult.ok) {
    findingsText = formatFindingsAsText(visionResult.analysis);
    const safe = applyCatalogAndSafetyRules(visionResult.analysis);
    treatmentMatch = {
      primaryName: safe.primaryName,
      primaryReason: safe.primaryReason,
      secondary: safe.secondary,
      nextStep: STANDARD_NEXT_STEP,
      fellBack: safe.fellBack,
    };
    analysisText = formatAnalysisAsText(findingsText, formatTreatmentMatchAsText(treatmentMatch));
  }

  // Normalize to the single `analysis` string field — the original contract
  // the frontend can always fall back on, even if it ignores the new
  // `findings` / `treatmentMatch` fields entirely.
  const analysisOk = visionResult.ok && !!analysisText;

  // ---- Analytics (best-effort, never blocks or alters the response) ----
  // Per spec: record the lead's name/email/phone on AI-funnel events (the
  // form has already been submitted by this point in the flow) — but never
  // the selfie image or the full analysis text.
  // Awaited (with its own internal error handling) so the event reliably
  // reaches the database before this serverless function exits — but a
  // failure here can only ever return ok:false, never throw.
  await logEvent({
    eventName: analysisOk ? "ai_analysis_success" : "ai_analysis_failed",
    pageUrl,
    sessionId,
    userAgent,
    metadata: analysisOk ? leadMeta : { ...leadMeta, reason: visionResult.reason || "unknown" },
  });
  // The photo itself passed the quality check whenever the vision call
  // succeeded and didn't get flagged above — log this distinctly from the
  // broader ai_analysis_* events so the quality-check funnel can be tracked
  // on its own (photo_quality_passed vs. photo_quality_failed).
  if (visionResult.ok) {
    await logEvent({ eventName: "photo_quality_passed", pageUrl, sessionId, userAgent, metadata: leadMeta });
  }

  // ---- Lead email (best-effort: still sent even if AI analysis failed, so no lead is lost) ----
  // Note: this only runs once we're past the photo-quality gate above, so a
  // lead whose photo needs a retake never gets a premature/incomplete email.
  const submittedAt = fmtDate(new Date());
  const emailResult = await sendLeadEmail({
    name: String(name).trim(),
    phone: String(phone).trim(),
    email: String(email).trim(),
    submittedAt,
    analysisText,
    analysisOk,
    treatmentMatch,
    imageDataUrl: image,
    photoQualityStatus: visionResult.ok ? "Passed" : "Not assessed (analysis unavailable)",
  });

  // Email success/failure must never affect what the client sees — the AI
  // report still displays as long as the OpenAI call succeeded above.
  // logEvent() never throws (it catches its own errors and returns ok:false),
  // so awaiting it here only adds a small, predictable delay — it cannot
  // turn an email failure into a broken response.
  await logEvent({
    eventName: emailResult.sent ? "email_sent_success" : "email_sent_failed",
    pageUrl,
    sessionId,
    userAgent,
    metadata: emailResult.sent ? leadMeta : { ...leadMeta, reason: emailResult.reason || "unknown" },
  });

  res.status(200).json({
    success: true,
    needsRetake: false,
    reason: null,
    analysisAvailable: analysisOk,
    analysis: analysisText,
    findings: findingsText,
    treatmentMatch,
    emailSent: emailResult.sent,
  });
}

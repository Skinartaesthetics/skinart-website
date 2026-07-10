/* ==========================================================================
   api/_lib/analytics.js — shared, server-side-only analytics helper.

   This file is never called directly by the browser. It is imported by
   /api/track-event.js, /api/analyze-skin.js, and /api/track-schedule-click.js
   so all three write to the same Supabase table the same safe way.

   Required environment variables (set in Vercel, never in client code):
     SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY   — service role key, server-side only.
                                    Never use the public "anon" key here.

   If these are not configured, logEvent() simply no-ops (logs a warning and
   resolves) so analytics never breaks the actual client experience.
   ========================================================================== */

export const ALLOWED_EVENTS = [
  "page_view",
  "blog_view",
  "ai_widget_opened",
  "ai_analysis_started",
  "contact_info_submitted",
  "selfie_uploaded",
  "consent_accepted",
  "ai_analysis_success",
  "ai_analysis_failed",
  "email_sent_success",
  "email_sent_failed",
  "schedule_appointment_clicked",
  "contact_form_submitted",
  "treatment_page_view",
  "blog_read_more_clicked",
  "photo_quality_passed",
  "photo_quality_failed",
  "photo_retake_clicked",
  "photo_reuploaded",
];

// Keys that should never end up in stored metadata, no matter what the
// caller sends — defense in depth on top of the frontend never sending these.
const BANNED_METADATA_KEYS = /image|selfie|photo|base64|report|analysis_?text|full_?report/i;
const MAX_STRING_LEN = 500; // generous for short text fields, too small for a photo or full report

function sanitizeMetadata(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (BANNED_METADATA_KEYS.test(key)) continue;
    if (typeof value === "string") {
      if (value.startsWith("data:image")) continue; // never store a data URL, whatever it's called
      out[key] = value.length > MAX_STRING_LEN ? value.slice(0, MAX_STRING_LEN) : value;
    } else if (typeof value === "number" || typeof value === "boolean" || value === null) {
      out[key] = value;
    }
    // silently drop nested objects/arrays — keeps metadata flat, predictable, and small
  }
  return out;
}

function detectDevice(userAgent) {
  const ua = String(userAgent || "");
  if (/mobile/i.test(ua) && !/ipad|tablet/i.test(ua)) return "mobile";
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (ua) return "desktop";
  return null;
}

function detectBrowser(userAgent) {
  const ua = String(userAgent || "");
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) return "Chrome";
  if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) return "Safari";
  if (/firefox\//i.test(ua)) return "Firefox";
  return ua ? "Other" : null;
}

/**
 * Insert one analytics event into Supabase. Best-effort and non-blocking by
 * design — a failure here must never break the AI widget, the contact form,
 * or any other part of the client experience.
 */
export async function logEvent({
  eventName,
  pageUrl,
  referrer,
  sessionId,
  userAgent,
  deviceType,
  utmSource,
  utmMedium,
  utmCampaign,
  metadata,
} = {}) {
  if (!ALLOWED_EVENTS.includes(eventName)) {
    return { ok: false, reason: "Unknown event_name" };
  }

  // .trim() guards against trailing newlines/spaces that sneak in when an
  // env var value is copy-pasted from a dashboard "copy" button — a stray
  // \n in a header value makes Node's fetch() throw "TypeError: fetch failed"
  // with no useful message, which is otherwise very hard to diagnose.
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) {
    console.warn("Analytics: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured — skipping event:", eventName);
    return { ok: false, reason: "Analytics not configured" };
  }

  const row = {
    event_name: eventName,
    page_url: pageUrl ? String(pageUrl).slice(0, 1000) : null,
    referrer: referrer ? String(referrer).slice(0, 1000) : null,
    session_id: sessionId ? String(sessionId).slice(0, 200) : null,
    user_agent: userAgent ? String(userAgent).slice(0, 500) : null,
    device_type: deviceType || detectDevice(userAgent),
    browser: detectBrowser(userAgent),
    utm_source: utmSource ? String(utmSource).slice(0, 200) : null,
    utm_medium: utmMedium ? String(utmMedium).slice(0, 200) : null,
    utm_campaign: utmCampaign ? String(utmCampaign).slice(0, 200) : null,
    metadata: sanitizeMetadata(metadata),
    created_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${url}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Analytics insert failed:", errText);
      return { ok: false, reason: "Database error" };
    }
    return { ok: true };
  } catch (err) {
    console.error("Analytics insert threw:", err);
    return { ok: false, reason: "Unexpected error" };
  }
}

/* ==========================================================================
   /api/track-event — lightweight analytics intake endpoint (Vercel, Node runtime)

   Accepts a single analytics event from the frontend, validates it, stamps
   it with a server-side timestamp, and stores it in the Supabase
   `analytics_events` table. Never exposes any environment variable to the
   caller, and never echoes back anything it was sent.

   Required environment variables (set in Vercel, never in client code):
     SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY

   If those are unset, this endpoint still returns 200 (so a missing
   analytics config never shows up as a console error to a visitor) but
   reports ok:false internally.

   Expected POST body (all fields optional except event_name):
     {
       event_name: "ai_widget_opened",
       page_url: "https://skinartaesthetics.com/blog.html",
       referrer: "https://www.google.com/",
       session_id: "a8f1...",
       device_type: "mobile",
       utm_source: "instagram",
       utm_medium: "social",
       utm_campaign: "spring-promo",
       metadata: { source: "floating_chat_bubble" }
     }
   ========================================================================== */

import { logEvent, ALLOWED_EVENTS } from "./_lib/analytics.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  const body = req.body || {};
  const eventName = body.event_name;

  if (!eventName || !ALLOWED_EVENTS.includes(eventName)) {
    res.status(400).json({ success: false, error: "Invalid or missing event_name" });
    return;
  }

  const result = await logEvent({
    eventName,
    pageUrl: body.page_url,
    referrer: body.referrer,
    sessionId: body.session_id,
    userAgent: req.headers["user-agent"],
    deviceType: body.device_type,
    utmSource: body.utm_source,
    utmMedium: body.utm_medium,
    utmCampaign: body.utm_campaign,
    metadata: body.metadata,
  });

  // Always 200 from the client's point of view — analytics should never
  // surface as a broken request in the browser console for a real visitor.
  res.status(200).json({ success: result.ok === true });
}

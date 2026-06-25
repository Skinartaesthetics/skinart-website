/* ==========================================================================
   /api/analytics-summary — protected analytics rollup (Vercel, Node runtime)

   Returns aggregate stats from the analytics_events table: totals, counts by
   event type, a simple AI-widget-open → Schedule-Appointment-click funnel,
   top pages, and the most recent 20 events.

   PROTECTED: requires the ANALYTICS_ADMIN_PASSWORD environment variable to
   match either:
     - a "password" query string param, e.g. /api/analytics-summary?password=...
     - or an "x-admin-password" request header
   If ANALYTICS_ADMIN_PASSWORD is not set, this endpoint refuses all requests
   (fails closed, not open) so it can never be accidentally left public.

   Required environment variables:
     SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY
     ANALYTICS_ADMIN_PASSWORD

   This endpoint never echoes back any environment variable, key, selfie
   image, or full AI analysis text — analytics_events never stores those in
   the first place (see api/_lib/analytics.js).
   ========================================================================== */

const RECENT_WINDOW = 5000; // rows scanned for aggregation — plenty for a boutique studio's volume

function checkAuth(req) {
  const expected = (process.env.ANALYTICS_ADMIN_PASSWORD || "").trim();
  if (!expected) return false; // fail closed if not configured
  const supplied = (req.query && req.query.password) || req.headers["x-admin-password"];
  return supplied && supplied === expected;
}

async function fetchTotalCount(url, key) {
  const res = await fetch(`${url}/rest/v1/analytics_events?select=id`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  const range = res.headers.get("content-range"); // e.g. "0-0/482"
  if (!range) return null;
  const total = range.split("/")[1];
  return total ? parseInt(total, 10) : null;
}

async function fetchRecentEvents(url, key, limit) {
  const res = await fetch(
    `${url}/rest/v1/analytics_events?select=event_name,page_url,referrer,session_id,device_type,utm_source,created_at&order=created_at.desc&limit=${limit}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  if (!res.ok) return [];
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!checkAuth(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // .trim() guards against trailing newlines/spaces from a copy-pasted env
  // var value, which otherwise makes fetch() throw an opaque "fetch failed".
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) {
    res.status(503).json({ error: "Analytics is not configured (missing Supabase environment variables)" });
    return;
  }

  try {
    const [totalEvents, recentEvents] = await Promise.all([
      fetchTotalCount(url, key),
      fetchRecentEvents(url, key, RECENT_WINDOW),
    ]);

    const eventCounts = {};
    const pageCounts = {};
    for (const ev of recentEvents) {
      eventCounts[ev.event_name] = (eventCounts[ev.event_name] || 0) + 1;
      if (ev.page_url) pageCounts[ev.page_url] = (pageCounts[ev.page_url] || 0) + 1;
    }

    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page_url, count]) => ({ page_url, count }));

    const widgetOpens = eventCounts["ai_widget_opened"] || 0;
    const scheduleClicks = eventCounts["schedule_appointment_clicked"] || 0;
    const conversionRate = widgetOpens > 0 ? Math.round((scheduleClicks / widgetOpens) * 1000) / 10 : null; // one decimal %

    res.status(200).json({
      success: true,
      window_note: `Aggregated from the most recent ${recentEvents.length} of ${totalEvents ?? "?"} total events`,
      totals: {
        total_events: totalEvents,
        page_views: eventCounts["page_view"] || 0,
        blog_views: eventCounts["blog_view"] || 0,
        ai_widget_opens: widgetOpens,
        ai_analysis_starts: eventCounts["ai_analysis_started"] || 0,
        ai_analyses_completed: eventCounts["ai_analysis_success"] || 0,
        ai_analyses_failed: eventCounts["ai_analysis_failed"] || 0,
        emails_sent_success: eventCounts["email_sent_success"] || 0,
        emails_sent_failed: eventCounts["email_sent_failed"] || 0,
        schedule_appointment_clicks: scheduleClicks,
      },
      funnel: {
        ai_widget_opened: widgetOpens,
        ai_analysis_started: eventCounts["ai_analysis_started"] || 0,
        ai_analysis_success: eventCounts["ai_analysis_success"] || 0,
        schedule_appointment_clicked: scheduleClicks,
        conversion_rate_widget_to_schedule_pct: conversionRate,
      },
      event_counts: eventCounts,
      top_pages: topPages,
      recent_events: recentEvents.slice(0, 20),
    });
  } catch (err) {
    console.error("analytics-summary error:", err);
    res.status(500).json({ error: "Failed to load analytics summary" });
  }
}

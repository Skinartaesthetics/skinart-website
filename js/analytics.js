/* ==========================================================================
   SkinArt Aesthetics — lightweight frontend analytics
   ==========================================================================
   Sends small, non-sensitive events to /api/track-event (same-origin —
   no API key, no database credential, nothing private ever lives here).

   This file NEVER sends: the selfie image, the full AI skin report text,
   or any API key. It only sends short event names + small metadata
   (e.g. which link was clicked, which page was viewed).

   It does not modify js/skin-analysis.js. The AI Skin Analysis funnel
   events (ai_widget_opened, contact_info_submitted, consent_accepted,
   selfie_uploaded, ai_analysis_started) are detected from the OUTSIDE by
   watching for the widget's own button clicks and step changes — so the
   widget itself is never touched and can't be broken by this file.

   Global helper exposed for use elsewhere: window.trackEvent(name, meta)
   ========================================================================== */

(function () {
  "use strict";

  const ENDPOINT = "/api/track-event";

  /* ---------------- Session id (per browser tab session) ---------------- */
  function getSessionId() {
    try {
      let id = sessionStorage.getItem("skinart_session_id");
      if (!id) {
        id = "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem("skinart_session_id", id);
      }
      return id;
    } catch (e) {
      return null; // private browsing / storage blocked — analytics just degrades gracefully
    }
  }

  /* ---------------- UTM capture (sticky for the session) ---------------- */
  function getUtm() {
    const out = { utm_source: null, utm_medium: null, utm_campaign: null };
    try {
      const params = new URLSearchParams(window.location.search);
      ["utm_source", "utm_medium", "utm_campaign"].forEach((key) => {
        const fromUrl = params.get(key);
        if (fromUrl) {
          sessionStorage.setItem("skinart_" + key, fromUrl);
        }
        out[key] = fromUrl || sessionStorage.getItem("skinart_" + key) || null;
      });
    } catch (e) {
      /* ignore */
    }
    return out;
  }

  /* ---------------- Core sender ---------------- */
  function trackEvent(eventName, metadata) {
    try {
      const utm = getUtm();
      const payload = {
        event_name: eventName,
        page_url: window.location.href,
        referrer: document.referrer || null,
        session_id: getSessionId(),
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        metadata: metadata || {},
      };
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true, // so events survive a click that immediately navigates away
      }).catch(() => {});
    } catch (e) {
      /* analytics must never throw into the page */
    }
  }

  window.trackEvent = trackEvent;

  /* ---------------- Auto: page_view (+ section-specific views) ---------------- */
  function trackPageView() {
    trackEvent("page_view", {});
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith("blog.html") || /\/blog-[^/]+\.html$/.test(path)) {
      trackEvent("blog_view", {});
    }
    if (path.endsWith("treatments.html")) {
      trackEvent("treatment_page_view", {});
    }
  }

  /* ---------------- Delegated click tracking (no widget edits needed) ---------------- */
  function setupClickTracking() {
    document.addEventListener("click", (e) => {
      const bubbleBtn = e.target.closest("#ai-bubble-btn");
      if (bubbleBtn) {
        trackEvent("ai_widget_opened", { source: "floating_chat_bubble" });
        return;
      }

      const readMore = e.target.closest(".read-more");
      if (readMore) {
        trackEvent("blog_read_more_clicked", { href: readMore.getAttribute("href") || "" });
        return;
      }

      // Header / hero "Schedule an Appointment" buttons that link straight to
      // GlossGenius — distinct from the AI widget's own results-page button,
      // which already reports to /api/track-schedule-click on the backend.
      const scheduleLink = e.target.closest('a[href*="glossgenius.com"]');
      if (scheduleLink && scheduleLink.id !== "ai-schedule-btn") {
        trackEvent("schedule_appointment_clicked", { source: "site_cta" });
      }
    });
  }

  /* ---------------- Delegated form tracking ---------------- */
  function setupFormTracking() {
    document.addEventListener("submit", (e) => {
      const form = e.target.closest(".contact-form");
      if (!form) return;
      const get = (name) => {
        const field = form.querySelector(`[name="${name}"]`);
        return field ? String(field.value || "").trim() : "";
      };
      trackEvent("contact_form_submitted", {
        name: `${get("first_name")} ${get("last_name")}`.trim(),
        email: get("email"),
        phone: get("phone"),
        interest: get("interest"),
      });
    });
  }

  /* ---------------- AI Skin Analysis funnel (observed, not modified) ----------------
     The widget swaps its entire step markup via bodyEl.innerHTML on every step
     change. We watch for that and infer which step was just reached — this
     lets us report funnel events without changing a single line of
     skin-analysis.js. */
  function whenElementExists(selector, callback) {
    const existing = document.querySelector(selector);
    if (existing) {
      callback(existing);
      return;
    }
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        callback(el);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function setupAiFunnelTracking() {
    whenElementExists("#ai-chat-body", (bodyEl) => {
      let lastStep = null;
      const stepObserver = new MutationObserver(() => {
        let step = null;
        if (bodyEl.querySelector("#ai-consent-check")) step = "consent";
        else if (bodyEl.querySelector("#ai-selfie-input")) step = "upload";
        else if (bodyEl.querySelector(".ai-loading")) step = "analyzing";
        else if (bodyEl.querySelector("#ai-name")) step = "contact";
        else if (bodyEl.querySelector("#ai-schedule-btn")) step = "results";
        else if (bodyEl.querySelector("#ai-begin-btn")) step = "welcome";

        if (step && step !== lastStep) {
          if (step === "consent") trackEvent("contact_info_submitted", {});
          if (step === "upload") trackEvent("consent_accepted", {});
          if (step === "analyzing") {
            trackEvent("selfie_uploaded", {});
            trackEvent("ai_analysis_started", {});
          }
          lastStep = step;
        }
      });
      stepObserver.observe(bodyEl, { childList: true });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    trackPageView();
    setupClickTracking();
    setupFormTracking();
    setupAiFunnelTracking();
  });
})();

/* ==========================================================================
   SkinArt Aesthetics — GA4 custom event tracking
   ==========================================================================
   Sends custom events to Google Analytics 4 via the global gtag() function
   installed in <head> on every page (Measurement ID set there). This file is
   completely separate from js/analytics.js (the site's own internal
   Supabase-based analytics) — neither file touches the other, so GA4
   tracking can never affect the existing internal analytics, and vice
   versa. It also never modifies js/skin-analysis.js; the AI Skin Analysis
   submit event is detected the same read-only way js/analytics.js already
   detects that funnel's steps (watching the widget's own markup change).

   Key Events (mark these in GA4 Admin → Events → Toggle "Key event"):
     - book_click           any link to the external GlossGenius booking
                            domain (header, body CTAs, and the AI widget's
                            own "Schedule Appointment" button) — sent with
                            transport_type: "beacon" so the hit is queued
                            before the browser follows the link off-site.
     - phone_click          any tel: link, site-wide.
     - email_click          any mailto: link, site-wide.
     - social_click         any link to Instagram or Facebook, site-wide.
     - generate_lead        the on-site contact form submission.

   Additional events (not Key Events, but useful for analysis):
     - directions_click     the "Get Directions" link on the Contact page.
     - treatment_view       each individual treatment row on the Treatments
                            page, the first time it scrolls into view.
     - skin_analysis_submit the moment a client's photo + form is submitted
                            for AI analysis.
   ========================================================================== */
(function () {
  "use strict";

  // Single guarded sender — if gtag isn't available for any reason (ad
  // blocker, GA4 script failed to load, etc.) this just no-ops instead of
  // throwing into the page.
  function ga4(eventName, params) {
    if (typeof window.gtag !== "function") return;
    try {
      // transport_type: "beacon" asks the browser to send the hit via the
      // Beacon API when possible, so events tied to a click that immediately
      // navigates away (book_click, directions_click) still get delivered
      // instead of being cancelled mid-flight by the page unload.
      window.gtag("event", eventName, Object.assign({ transport_type: "beacon" }, params || {}));
    } catch (e) {
      /* GA4 tracking must never throw into the page */
    }
  }

  /* ---------------- Delegated click tracking ---------------- */
  function setupClickTracking() {
    document.addEventListener("click", function (e) {

      // Booking link (GlossGenius domain)
      var bookLink = e.target.closest('a[href*="glossgenius.com"]');
      if (bookLink) {
        ga4("book_click", {
          link_text: (bookLink.textContent || "").trim(),
          link_url: bookLink.href,
        });
        return;
      }

      // Phone link
      var phoneLink = e.target.closest('a[href^="tel:"]');
      if (phoneLink) {
        ga4("phone_click", {
          link_text: (phoneLink.textContent || "").trim(),
        });
        return;
      }

      // Email link
      var emailLink = e.target.closest('a[href^="mailto:"]');
      if (emailLink) {
        ga4("email_click", {
          link_text: (emailLink.textContent || "").trim(),
          link_url: emailLink.href,
        });
        return;
      }

      // Social links (Instagram and Facebook)
      var socialLink = e.target.closest(
        'a[href*="instagram.com"], a[href*="facebook.com"]'
      );
      if (socialLink) {
        ga4("social_click", {
          link_text: (socialLink.getAttribute("aria-label") || socialLink.textContent || "").trim(),
          link_url: socialLink.href,
        });
        return;
      }

      // Directions link (Contact page)
      var directionsLink = e.target.closest("#directions-link");
      if (directionsLink) {
        ga4("directions_click", {});
        return;
      }
    });
  }

  /* ---------------- Contact form submit (generate_lead) ---------------- */
  function setupFormTracking() {
    document.addEventListener("submit", function (e) {
      var form = e.target.closest(".contact-form");
      if (!form) return;
      ga4("generate_lead", {
        form_id: "contact_form",
      });
    });
  }

  /* ---------------- Treatment row views (Treatments page only) ----------------
     Treatments.html lists every service as a single page of .treat-row
     items (no separate URL per treatment), so "viewing a treatment" is
     detected as that row scrolling into view — fired once per row per page
     load, with the treatment's own name as a parameter. */
  function setupTreatmentViewTracking() {
    var rows = document.querySelectorAll(".treat-row");
    if (!rows.length || !("IntersectionObserver" in window)) return;

    var seen = new WeakSet();
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var row = entry.target;
          if (seen.has(row)) return;
          seen.add(row);
          var nameEl = row.querySelector(".info h4");
          ga4("treatment_view", {
            treatment_name: nameEl ? nameEl.textContent.trim() : "",
          });
          obs.unobserve(row);
        });
      },
      { threshold: 0.5 }
    );

    rows.forEach(function (row) {
      obs.observe(row);
    });
  }

  /* ---------------- AI Skin Analysis submission (observed, not modified) ----------------
     Mirrors the same read-only step-detection pattern already used in
     js/analytics.js: the widget swaps #ai-chat-body's markup on every step
     change, so watching for the "analyzing" step's spinner markup tells us
     the exact moment a client's photo + form was submitted for analysis —
     without touching skin-analysis.js at all. Uses a transition check
     (lastStep) rather than a one-time flag, so a second submission after a
     retake is still counted. */
  function whenElementExists(selector, callback) {
    var existing = document.querySelector(selector);
    if (existing) {
      callback(existing);
      return;
    }
    var observer = new MutationObserver(function () {
      var el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        callback(el);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function setupSkinAnalysisSubmitTracking() {
    whenElementExists("#ai-chat-body", function (bodyEl) {
      var lastStep = null;
      var stepObserver = new MutationObserver(function () {
        var step = bodyEl.querySelector(".ai-loading") ? "analyzing" : null;
        if (step === "analyzing" && lastStep !== "analyzing") {
          ga4("skin_analysis_submit", {});
        }
        lastStep = step;
      });
      stepObserver.observe(bodyEl, { childList: true });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupClickTracking();
    setupFormTracking();
    setupTreatmentViewTracking();
    setupSkinAnalysisSubmitTracking();
  });
})();

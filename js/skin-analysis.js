/* ==========================================================================
   AI Skin Analysis — Floating Chat Widget
   SkinArt Aesthetics

   SECURITY NOTE: This widget never talks to OpenAI or any email provider
   directly. It only calls same-origin serverless endpoints (/api/analyze-skin,
   /api/track-schedule-click) — those hold the real API keys server-side.
   See AI-Skin-Analysis-Setup.md for full deployment steps (Vercel/Netlify +
   environment variables: OPENAI_API_KEY, RESEND_API_KEY, LEAD_EMAIL_TO).
   Until the serverless functions are deployed, the widget still gathers the
   lead's info and shows a graceful "our team will review personally"
   message instead of an instant AI summary.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------------- CONFIG ---------------- */
  const CONFIG = {
    BOOKING_URL: "https://skinart.glossgenius.com/services",
    ANALYZE_ENDPOINT: "/api/analyze-skin",
    SCHEDULE_CLICK_ENDPOINT: "/api/track-schedule-click",
  };

  const ICONS = {
    sparkle:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/><circle cx="12" cy="12" r="2.2"/></svg>',
    camera:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="14" r="3.4"/></svg>',
  };

  /* ---------------- State ---------------- */
  const state = {
    step: "welcome",
    name: "",
    phone: "",
    email: "",
    consent: false,
    imageDataUrl: null,
    imageFile: null,
    analysis: null,
    scheduleClicked: false,
  };

  let overlayEl, bodyEl, bubbleWrapEl, tooltipEl;

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  /* ---------------- Build floating bubble ---------------- */
  function buildBubble() {
    bubbleWrapEl = document.createElement("div");
    bubbleWrapEl.className = "ai-bubble-wrap";
    bubbleWrapEl.innerHTML = `
      <div class="ai-bubble-tooltip" id="ai-bubble-tooltip">
        <button class="ai-tooltip-close" aria-label="Dismiss">&times;</button>
        <strong>Not sure what your skin needs?</strong>
        Start with a complimentary AI skin analysis.
      </div>
      <button class="ai-bubble-btn" id="ai-bubble-btn" aria-label="Start Your Skin Analysis">
        ${ICONS.sparkle}
        <span class="ai-bubble-label">Start Your Skin Analysis</span>
      </button>
    `;
    document.body.appendChild(bubbleWrapEl);

    tooltipEl = bubbleWrapEl.querySelector("#ai-bubble-tooltip");
    bubbleWrapEl.querySelector("#ai-bubble-btn").addEventListener("click", openChat);
    bubbleWrapEl.querySelector(".ai-tooltip-close").addEventListener("click", (e) => {
      e.stopPropagation();
      tooltipEl.classList.remove("show");
      sessionStorage.setItem("aiTooltipDismissed", "1");
    });

    if (!sessionStorage.getItem("aiTooltipDismissed") && !sessionStorage.getItem("aiChatOpened")) {
      setTimeout(() => tooltipEl.classList.add("show"), 1800);
    }
  }

  /* ---------------- Build overlay/panel ---------------- */
  function buildOverlay() {
    overlayEl = document.createElement("div");
    overlayEl.className = "ai-chat-overlay";
    overlayEl.id = "ai-chat-overlay";
    overlayEl.hidden = true;
    overlayEl.innerHTML = `
      <div class="ai-chat-panel" role="dialog" aria-modal="true" aria-label="AI Skin Analysis">
        <div class="ai-chat-header">
          <div class="ai-chat-title">SkinArt AI Skin Analysis<small>Complimentary &middot; Preliminary</small></div>
          <button id="ai-chat-close" aria-label="Close">&times;</button>
        </div>
        <div class="ai-chat-body" id="ai-chat-body"></div>
      </div>
    `;
    document.body.appendChild(overlayEl);
    bodyEl = overlayEl.querySelector("#ai-chat-body");

    overlayEl.querySelector("#ai-chat-close").addEventListener("click", closeChat);
    overlayEl.addEventListener("click", (e) => { if (e.target === overlayEl) closeChat(); });
  }

  function openChat() {
    tooltipEl && tooltipEl.classList.remove("show");
    sessionStorage.setItem("aiChatOpened", "1");
    overlayEl.hidden = false;
    requestAnimationFrame(() => overlayEl.classList.add("open"));
    document.body.style.overflow = "hidden";
    if (state.step === "welcome") render();
  }

  function closeChat() {
    overlayEl.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => { overlayEl.hidden = true; }, 250);
  }

  function progressDots(activeIndex, total) {
    let html = '<div class="ai-progress-dots">';
    for (let i = 0; i < total; i++) {
      html += `<span class="${i <= activeIndex ? "active" : ""}"></span>`;
    }
    return html + "</div>";
  }

  /* ---------------- Render router ---------------- */
  function render() {
    const steps = ["welcome", "contact", "consent", "upload", "analyzing", "results"];
    const idx = steps.indexOf(state.step);
    let dots = idx >= 0 && idx < 5 ? progressDots(idx, 5) : "";

    if (state.step === "welcome") return renderWelcome(dots);
    if (state.step === "contact") return renderContact(dots);
    if (state.step === "consent") return renderConsent(dots);
    if (state.step === "upload") return renderUpload(dots);
    if (state.step === "analyzing") return renderAnalyzing();
    if (state.step === "results") return renderResults();
  }

  /* ---------------- Step 1: Welcome ---------------- */
  function renderWelcome(dots) {
    bodyEl.innerHTML = `
      <div class="ai-step">
        ${dots}
        <h3>Welcome to SkinArt Aesthetics</h3>
        <p>Start your complimentary AI skin analysis by uploading a clear selfie. Before we begin, we'll collect your contact information so your esthetician can review your results and follow up with personalized recommendations.</p>
        <button class="ai-btn" id="ai-begin-btn">Begin</button>
      </div>
    `;
    bodyEl.querySelector("#ai-begin-btn").addEventListener("click", () => {
      state.step = "contact";
      render();
    });
  }

  /* ---------------- Step 2: Contact form ---------------- */
  function renderContact(dots) {
    bodyEl.innerHTML = `
      <div class="ai-step">
        ${dots}
        <h3>A little about you</h3>
        <p>So your esthetician can follow up with your results.</p>
        <div class="ai-field" data-field="name">
          <label for="ai-name">Full Name</label>
          <input type="text" id="ai-name" autocomplete="name" value="${escapeHtml(state.name)}">
          <div class="ai-field-error">Please enter your full name.</div>
        </div>
        <div class="ai-field" data-field="phone">
          <label for="ai-phone">Phone Number</label>
          <input type="tel" id="ai-phone" autocomplete="tel" value="${escapeHtml(state.phone)}">
          <div class="ai-field-error">Please enter a valid phone number.</div>
        </div>
        <div class="ai-field" data-field="email">
          <label for="ai-email">Email Address</label>
          <input type="email" id="ai-email" autocomplete="email" value="${escapeHtml(state.email)}">
          <div class="ai-field-error">Please enter a valid email address.</div>
        </div>
        <button class="ai-btn" id="ai-contact-continue">Continue</button>
      </div>
    `;

    const nameEl = bodyEl.querySelector("#ai-name");
    const phoneEl = bodyEl.querySelector("#ai-phone");
    const emailEl = bodyEl.querySelector("#ai-email");

    bodyEl.querySelector("#ai-contact-continue").addEventListener("click", () => {
      let valid = true;

      const nameField = bodyEl.querySelector('[data-field="name"]');
      if (!nameEl.value.trim()) { nameField.classList.add("invalid"); valid = false; }
      else nameField.classList.remove("invalid");

      const phoneDigits = phoneEl.value.replace(/\D/g, "");
      const phoneField = bodyEl.querySelector('[data-field="phone"]');
      if (phoneDigits.length < 7) { phoneField.classList.add("invalid"); valid = false; }
      else phoneField.classList.remove("invalid");

      const emailField = bodyEl.querySelector('[data-field="email"]');
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim());
      if (!emailOk) { emailField.classList.add("invalid"); valid = false; }
      else emailField.classList.remove("invalid");

      if (!valid) return;

      state.name = nameEl.value.trim();
      state.phone = phoneEl.value.trim();
      state.email = emailEl.value.trim();
      state.step = "consent";
      render();
    });
  }

  /* ---------------- Step 3: Consent ---------------- */
  function renderConsent(dots) {
    bodyEl.innerHTML = `
      <div class="ai-step">
        ${dots}
        <h3>Before your photo</h3>
        <div class="ai-disclaimer-box">
          This AI skin analysis is preliminary and does not replace a professional in-person consultation. Your photo will be used only to help SkinArt Aesthetics better understand your visible skin concerns and prepare personalized treatment recommendations. We do not diagnose medical skin conditions or guarantee results.
        </div>
        <label class="ai-consent-row">
          <input type="checkbox" id="ai-consent-check">
          <span>I agree</span>
        </label>
        <button class="ai-btn" id="ai-consent-continue" disabled>Continue</button>
      </div>
    `;
    const checkEl = bodyEl.querySelector("#ai-consent-check");
    const btn = bodyEl.querySelector("#ai-consent-continue");
    checkEl.addEventListener("change", () => { btn.disabled = !checkEl.checked; });
    btn.addEventListener("click", () => {
      state.consent = true;
      state.step = "upload";
      render();
    });
  }

  /* ---------------- Step 4: Selfie upload ---------------- */
  function renderUpload(dots) {
    bodyEl.innerHTML = `
      <div class="ai-step">
        ${dots}
        <h3>Your selfie</h3>
        <p>Please upload or snap a clear, makeup-free selfie in natural light. Face the camera directly, avoid filters, and make sure your skin is fully visible.</p>

        <div id="ai-preview-area"></div>

        <div class="ai-upload-actions">
          <button class="ai-btn ai-btn-ghost" id="ai-camera-btn">${ICONS.camera} Take Photo</button>
          <button class="ai-btn ai-btn-ghost" id="ai-library-btn">Choose from Library</button>
        </div>
        <input type="file" id="ai-selfie-input-camera" accept="image/*" capture="user">
        <input type="file" id="ai-selfie-input" accept="image/*">

        <button class="ai-btn" id="ai-upload-continue" disabled>Analyze My Skin</button>
      </div>
    `;

    const cameraInput = bodyEl.querySelector("#ai-selfie-input-camera");
    const libraryInput = bodyEl.querySelector("#ai-selfie-input");
    const continueBtn = bodyEl.querySelector("#ai-upload-continue");
    const previewArea = bodyEl.querySelector("#ai-preview-area");

    bodyEl.querySelector("#ai-camera-btn").addEventListener("click", () => cameraInput.click());
    bodyEl.querySelector("#ai-library-btn").addEventListener("click", () => libraryInput.click());

    function handleFile(file) {
      if (!file) return;
      state.imageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        state.imageDataUrl = e.target.result;
        previewArea.innerHTML = `
          <div class="ai-preview-wrap">
            <img src="${state.imageDataUrl}" alt="Your uploaded selfie">
            <button class="ai-preview-remove" id="ai-preview-remove">&times;</button>
          </div>
        `;
        previewArea.querySelector("#ai-preview-remove").addEventListener("click", () => {
          state.imageDataUrl = null;
          state.imageFile = null;
          previewArea.innerHTML = "";
          continueBtn.disabled = true;
        });
        continueBtn.disabled = false;
      };
      reader.readAsDataURL(file);
    }

    cameraInput.addEventListener("change", (e) => handleFile(e.target.files[0]));
    libraryInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

    continueBtn.addEventListener("click", () => {
      state.step = "analyzing";
      render();
      runAnalysis();
    });
  }

  /* ---------------- Step 5: Analyzing ---------------- */
  function renderAnalyzing() {
    bodyEl.innerHTML = `
      <div class="ai-step ai-loading">
        <div class="ai-spinner"></div>
        <p>Reviewing your skin's visible characteristics&hellip;</p>
      </div>
    `;
  }

  async function runAnalysis() {
    let analysis = null;
    let analysisFailed = false;

    // Single call to our own serverless endpoint — it validates the lead's
    // info, calls OpenAI server-side, emails the lead to the studio, and
    // hands back the analysis JSON. No API key ever touches this browser.
    try {
      const res = await fetch(CONFIG.ANALYZE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name,
          phone: state.phone,
          email: state.email,
          consent: state.consent,
          image: state.imageDataUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Analyze-skin endpoint returned an error:", data);
        analysisFailed = true;
      } else {
        analysis = data.analysis || null;
        analysisFailed = !data.analysisAvailable;
      }
    } catch (err) {
      analysisFailed = true;
    }

    state.analysis = analysis;
    state.step = "results";
    render(analysisFailed);
  }

  /* ---------------- Step 6: Results ---------------- */
  function renderResults(analysisFailed) {
    const a = state.analysis;

    let body = "";
    if (a) {
      const rows = [
        ["Overall Visible Condition", a.overall],
        ["Hydration", a.hydration],
        ["Visible Congestion", a.congestion],
        ["Texture", a.texture],
        ["Redness / Sensitivity", a.redness],
        ["Pigmentation / Tone", a.pigmentation],
        ["Pores", a.pores],
        ["Suggested Treatment Direction", a.suggestedDirection],
        ["Recommendation", a.recommendation],
      ];
      body = rows
        .filter(([, v]) => v)
        .map(([label, v]) => `
          <div class="ai-result-section">
            <h4>${escapeHtml(label)}</h4>
            <p>${escapeHtml(v)}</p>
          </div>
        `)
        .join("");
    }

    bodyEl.innerHTML = `
      <div class="ai-step">
        <h3>Your Preliminary Results</h3>
        ${
          a
            ? body
            : `<div class="ai-error-box">Instant results aren't quite ready yet on our end — but don't worry, your photo and details have already been sent to our team. An esthetician will personally review your submission and follow up with recommendations.</div>`
        }

        <div class="ai-result-summary">
          Your preliminary AI skin analysis is complete. Based on the selfie provided, your skin may benefit from a customized professional consultation so we can properly assess your barrier, hydration levels, congestion, texture, and treatment options in person.
          <br><br>
          A SkinArt esthetician will review your submission and follow up with personalized recommendations.
        </div>

        <p style="font-size:.85rem;">Ready for a professional skin plan? Schedule your appointment and let's create a treatment protocol designed around your skin.</p>

        <a class="ai-btn" id="ai-schedule-btn" href="${CONFIG.BOOKING_URL}" target="_blank" rel="noopener">Schedule Appointment</a>
        <button class="ai-btn ai-btn-ghost" id="ai-chat-done" style="margin-top:.6em;">Close</button>
      </div>
    `;

    bodyEl.querySelector("#ai-schedule-btn").addEventListener("click", () => {
      state.scheduleClicked = true;
      notifyScheduleClick();
    });
    bodyEl.querySelector("#ai-chat-done").addEventListener("click", closeChat);
  }

  /* ---------------- Schedule-click tracking ----------------
     The lead email itself is already sent server-side by /api/analyze-skin
     (along with the AI analysis). This just notifies the studio, separately,
     when a lead follows through and clicks "Schedule Appointment." */
  function notifyScheduleClick() {
    fetch(CONFIG.SCHEDULE_CLICK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: state.name,
        phone: state.phone,
        email: state.email,
      }),
    }).catch(() => {});
  }

  /* ---------------- Init ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    buildBubble();
    buildOverlay();
  });
})();

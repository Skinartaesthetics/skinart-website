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
    findings: null,
    treatmentMatch: null,
    scheduleClicked: false,
  };

  let overlayEl, bodyEl, bubbleWrapEl, tooltipEl;
  let activeCameraStream = null; // live getUserMedia stream, if one is open

  function stopActiveCamera() {
    if (activeCameraStream) {
      activeCameraStream.getTracks().forEach((t) => t.stop());
      activeCameraStream = null;
    }
  }

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
    stopActiveCamera();
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
    stopActiveCamera();
    bodyEl.innerHTML = `
      <div class="ai-step">
        ${dots}
        <h3>Your selfie</h3>
        <p>Please upload or snap a clear, makeup-free selfie in natural light. Face the camera directly, avoid filters, and make sure your skin is fully visible.</p>

        <div class="ai-camera-live" id="ai-camera-live" hidden>
          <video id="ai-camera-video" autoplay playsinline muted></video>
          <div class="ai-camera-actions">
            <button class="ai-btn" id="ai-camera-capture-btn">Capture</button>
            <button class="ai-btn ai-btn-ghost" id="ai-camera-cancel-btn">Cancel</button>
          </div>
        </div>

        <div id="ai-preview-area"></div>

        <div class="ai-upload-actions" id="ai-upload-actions">
          <button class="ai-btn ai-btn-ghost" id="ai-camera-btn">${ICONS.camera} Take a Photo</button>
          <button class="ai-btn ai-btn-ghost" id="ai-library-btn">Upload from Gallery</button>
        </div>
        <p class="ai-upload-hint">On desktop, you may be prompted to upload a photo instead. For the easiest selfie capture, open this page from your phone.</p>

        <input type="file" id="ai-selfie-input-camera" accept="image/*" capture="user">
        <input type="file" id="ai-selfie-input" accept="image/*">

        <button class="ai-btn" id="ai-upload-continue" disabled>Analyze My Skin</button>
      </div>
    `;

    const cameraInput = bodyEl.querySelector("#ai-selfie-input-camera");
    const libraryInput = bodyEl.querySelector("#ai-selfie-input");
    const continueBtn = bodyEl.querySelector("#ai-upload-continue");
    const previewArea = bodyEl.querySelector("#ai-preview-area");
    const liveArea = bodyEl.querySelector("#ai-camera-live");
    const videoEl = bodyEl.querySelector("#ai-camera-video");
    const uploadActions = bodyEl.querySelector("#ai-upload-actions");

    function stopLiveCamera() {
      stopActiveCamera();
      liveArea.hidden = true;
      uploadActions.hidden = false;
    }

    function setImageFromDataUrl(dataUrl) {
      state.imageDataUrl = dataUrl;
      previewArea.innerHTML = `
        <div class="ai-preview-wrap">
          <img src="${dataUrl}" alt="Your selfie preview">
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
    }

    function handleFile(file) {
      if (!file || !file.type || !file.type.startsWith("image/")) return;
      state.imageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => setImageFromDataUrl(e.target.result);
      reader.readAsDataURL(file);
    }

    // "Take a Photo" — prefer a live in-page camera (getUserMedia) so we can
    // force the front-facing camera and give a real Capture button. If the
    // browser/device doesn't support it, or the user denies permission, fall
    // back to the native file input (capture="user"), which on mobile still
    // opens the camera app, and on desktop falls back to a file picker.
    async function openLiveCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cameraInput.click();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        activeCameraStream = stream;
        videoEl.srcObject = stream;
        liveArea.hidden = false;
        uploadActions.hidden = true;
      } catch (err) {
        cameraInput.click();
      }
    }

    bodyEl.querySelector("#ai-camera-btn").addEventListener("click", openLiveCamera);
    bodyEl.querySelector("#ai-library-btn").addEventListener("click", () => libraryInput.click());

    bodyEl.querySelector("#ai-camera-capture-btn").addEventListener("click", () => {
      const canvas = document.createElement("canvas");
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 640;
      canvas.getContext("2d").drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      stopLiveCamera();
      state.imageFile = null;
      setImageFromDataUrl(dataUrl);
    });

    bodyEl.querySelector("#ai-camera-cancel-btn").addEventListener("click", stopLiveCamera);

    cameraInput.addEventListener("change", (e) => handleFile(e.target.files[0]));
    libraryInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

    continueBtn.addEventListener("click", () => {
      stopActiveCamera();
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
    let findings = null;
    let treatmentMatch = null;

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
      // The backend always normalizes the full report to ONE string field:
      // analysis — that's the fallback this widget can always render from.
      // `findings` and `treatmentMatch` are newer, additive fields that let
      // renderResults() show a nicer, sectioned layout when present; if
      // they're ever missing (e.g. an older deploy), the widget still works
      // off `analysis` alone.
      if (!res.ok || !data.analysisAvailable || !data.analysis || typeof data.analysis !== "string") {
        console.error("Analyze-skin endpoint returned no usable analysis:", data);
      } else {
        analysis = data.analysis;
        findings = typeof data.findings === "string" ? data.findings : null;
        treatmentMatch = data.treatmentMatch && typeof data.treatmentMatch === "object" ? data.treatmentMatch : null;
      }
    } catch (err) {
      console.error("Analyze-skin request failed:", err);
    }

    state.analysis = analysis;
    state.findings = findings;
    state.treatmentMatch = treatmentMatch;
    state.step = "results";
    render();
  }

  /* ---------------- Step 6: Results ---------------- */
  // The backend sends the report as one string, with sections separated by a
  // blank line and each section formatted as "Label: content". Split it back
  // out here purely so each section can keep its own styled heading.
  function parseAnalysisSections(analysisText) {
    if (!analysisText || typeof analysisText !== "string") return [];
    return analysisText
      .split(/\n\s*\n/)
      .map((chunk) => {
        const idx = chunk.indexOf(":");
        if (idx === -1) return null;
        const label = chunk.slice(0, idx).trim();
        const content = chunk.slice(idx + 1).trim();
        if (!label || !content) return null;
        return [label, content];
      })
      .filter(Boolean);
  }

  // Renders the "Your SkinArt Treatment Match" card — primary match, why it
  // may fit, up to 2 secondary options, and the recommended next step. Only
  // called when the backend sent a valid treatmentMatch object.
  function renderTreatmentMatchHtml(match) {
    const secondary = Array.isArray(match.secondary) ? match.secondary : [];
    const secondaryHtml = secondary.length
      ? `
        <div class="ai-treatment-secondary">
          <h4>Secondary Options</h4>
          <ul>
            ${secondary
              .map((s) => `<li><strong>${escapeHtml(s.name)}</strong> — ${escapeHtml(s.reason)}</li>`)
              .join("")}
          </ul>
        </div>
      `
      : "";

    return `
      <div class="ai-treatment-match">
        <h3>Your SkinArt Treatment Match</h3>
        <div class="ai-treatment-primary">
          <div class="ai-treatment-label">${match.fellBack ? "Suggested Starting Point" : "Primary Match"}</div>
          <div class="ai-treatment-name">${escapeHtml(match.primaryName)}</div>
        </div>
        <div class="ai-treatment-why">
          <h4>Why This Treatment May Fit</h4>
          <p>${escapeHtml(match.primaryReason)}</p>
        </div>
        ${secondaryHtml}
        <div class="ai-treatment-next">
          <h4>Recommended Next Step</h4>
          <p>${escapeHtml(match.nextStep)}</p>
        </div>
      </div>
    `;
  }

  function renderResults() {
    const hasTreatmentMatch = !!(state.treatmentMatch && state.treatmentMatch.primaryName);

    let reportHtml;
    if (hasTreatmentMatch) {
      // Newer, sectioned layout: findings grouped under their own heading,
      // then a dedicated treatment-match card.
      const findingsSections = parseAnalysisSections(state.findings || state.analysis);
      const findingsHtml = findingsSections.length
        ? findingsSections
            .map(([label, content]) => `
              <div class="ai-result-section">
                <h4>${escapeHtml(label)}</h4>
                <p>${escapeHtml(content)}</p>
              </div>
            `)
            .join("")
        : "";

      reportHtml = `
        <h3>Your Preliminary Skin Findings</h3>
        ${findingsHtml}
        ${renderTreatmentMatchHtml(state.treatmentMatch)}
      `;
    } else {
      // Fallback: original generic rendering, unchanged — used if the AI
      // analysis wasn't available or the backend didn't send a treatment
      // match for some reason. This path is intentionally identical to the
      // widget's original behavior so nothing breaks.
      const sections = parseAnalysisSections(state.analysis);
      const hasReport = sections.length > 0;
      reportHtml = hasReport
        ? `<h3>Your Preliminary Results</h3>` +
          sections
            .map(([label, content]) => `
              <div class="ai-result-section">
                <h4>${escapeHtml(label)}</h4>
                <p>${escapeHtml(content)}</p>
              </div>
            `)
            .join("")
        : `<h3>Your Preliminary Results</h3><div class="ai-error-box">Instant results aren't quite ready yet on our end — but don't worry, your photo and details have already been sent to our team. An esthetician will personally review your submission and follow up with recommendations.</div>`;
    }

    bodyEl.innerHTML = `
      <div class="ai-step">
        ${reportHtml}

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

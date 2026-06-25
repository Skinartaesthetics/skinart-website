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

  // IMPORTANT — this MUST match the `aspect-ratio` set on .ai-camera-live
  // and .ai-preview-wrap in css/skin-analysis.css (both use object-fit:
  // cover at this same ratio). If this ratio ever changes, update the CSS
  // too, or the live preview and the captured photo will frame the face
  // differently.
  const CAPTURE_ASPECT_RATIO = 4 / 5;
  const CAPTURE_OUTPUT_WIDTH = 960;
  const CAPTURE_OUTPUT_HEIGHT = Math.round(CAPTURE_OUTPUT_WIDTH / CAPTURE_ASPECT_RATIO);

  // Takes the live <video> element and returns a Promise<Blob> containing
  // only the same center-cropped region the client sees on screen (the box
  // is `object-fit: cover` at CAPTURE_ASPECT_RATIO), instead of the full raw
  // camera frame — keeps the captured photo's framing identical to the live
  // preview the client actually saw.
  function captureCroppedFrame(videoEl) {
    const vw = videoEl.videoWidth || 640;
    const vh = videoEl.videoHeight || Math.round(640 / CAPTURE_ASPECT_RATIO);
    const videoAspect = vw / vh;

    let sx, sy, sw, sh;
    if (videoAspect > CAPTURE_ASPECT_RATIO) {
      sh = vh;
      sw = vh * CAPTURE_ASPECT_RATIO;
      sx = (vw - sw) / 2;
      sy = 0;
    } else {
      sw = vw;
      sh = vw / CAPTURE_ASPECT_RATIO;
      sx = 0;
      sy = (vh - sh) / 2;
    }

    // Clamp to the video's actual bounds — floating-point rounding can push
    // a source rect a hair past the real video dimensions on some browsers,
    // and drawImage() throws IndexSizeError rather than tolerating it, which
    // previously surfaced as a silent capture failure.
    sx = Math.max(0, Math.min(sx, vw));
    sy = Math.max(0, Math.min(sy, vh));
    sw = Math.max(1, Math.min(sw, vw - sx));
    sh = Math.max(1, Math.min(sh, vh - sy));

    const canvas = document.createElement("canvas");
    canvas.width = CAPTURE_OUTPUT_WIDTH;
    canvas.height = CAPTURE_OUTPUT_HEIGHT;
    canvas
      .getContext("2d")
      .drawImage(videoEl, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob returned null"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    });
  }

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
    needsRetake: false,
    retakeReason: null,
    scheduleClicked: false,
  };

  let overlayEl, bodyEl, bubbleWrapEl, tooltipEl;
  let activeCameraStream = null; // live getUserMedia stream, if one is open

  function stopActiveCamera() {
    if (activeCameraStream) {
      activeCameraStream.getTracks().forEach((t) => t.stop());
      activeCameraStream = null;
      console.log("[AI Skin Analysis] camera stopped");
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

    // A backend photo-quality flag (needsRetake, set in runAnalysis()) routes
    // back to this same step with contact info intact and only the image
    // cleared — "Take a Photo" / "Upload from Gallery" below already double
    // as "Retake Photo" / "Upload Different Photo", so we just show a
    // one-time soft notice instead of a whole separate screen.
    const retakeNoticeHtml = state.needsRetake
      ? `<div class="ai-disclaimer-box" style="margin-bottom:1em;">${escapeHtml(
          state.retakeReason ||
            "Let's retake this for a clearer analysis. Please take or upload a new selfie in natural light, facing the camera directly."
        )}</div>`
      : "";
    state.needsRetake = false;
    state.retakeReason = null;

    bodyEl.innerHTML = `
      <div class="ai-step">
        ${dots}
        <h3>Your selfie</h3>
        <p>Please upload or snap a clear, makeup-free selfie in natural light. Face the camera directly, avoid filters, and make sure your skin is fully visible.</p>
        ${retakeNoticeHtml}

        <div class="ai-camera-live" id="ai-camera-live" hidden>
          <video id="ai-camera-video" autoplay playsinline muted></video>
          <div class="ai-camera-actions">
            <button type="button" class="ai-btn" id="ai-camera-capture-btn">Capture Photo</button>
            <button type="button" class="ai-btn ai-btn-ghost" id="ai-camera-cancel-btn">Cancel</button>
          </div>
        </div>

        <div id="ai-preview-area"></div>

        <div class="ai-upload-actions" id="ai-upload-actions">
          <button type="button" class="ai-btn ai-btn-ghost" id="ai-camera-btn">${ICONS.camera} Take a Photo</button>
          <button type="button" class="ai-btn ai-btn-ghost" id="ai-library-btn">Upload from Gallery</button>
        </div>
        <p class="ai-upload-hint">On desktop, you may be prompted to upload a photo instead. For the easiest selfie capture, open this page from your phone.</p>

        <input type="file" id="ai-selfie-input-camera" accept="image/*" capture="user">
        <input type="file" id="ai-selfie-input" accept="image/*">

        <button type="button" class="ai-btn" id="ai-upload-continue" disabled>Analyze My Skin</button>
        <p id="ai-no-image-msg" style="display:none; color:#a4453a; font-size:.8rem; margin-top:.5em;">Please take or upload a clear selfie before continuing.</p>
      </div>
    `;

    const cameraInput = bodyEl.querySelector("#ai-selfie-input-camera");
    const libraryInput = bodyEl.querySelector("#ai-selfie-input");
    const continueBtn = bodyEl.querySelector("#ai-upload-continue");
    const noImageMsg = bodyEl.querySelector("#ai-no-image-msg");
    const previewArea = bodyEl.querySelector("#ai-preview-area");
    const liveArea = bodyEl.querySelector("#ai-camera-live");
    const videoEl = bodyEl.querySelector("#ai-camera-video");
    const uploadActions = bodyEl.querySelector("#ai-upload-actions");

    function stopLiveCamera() {
      stopActiveCamera();
      liveArea.hidden = true;
      uploadActions.hidden = false;
    }

    // Single source of truth for clearing the selected image — used by the
    // preview's "x", "Retake Photo", and "Upload Different Photo".
    function clearSelectedImage() {
      state.imageDataUrl = null;
      state.imageFile = null;
      previewArea.innerHTML = "";
      continueBtn.disabled = true;
      uploadActions.hidden = false;
    }

    function renderPlainPreview(dataUrl) {
      previewArea.innerHTML = `
        <div class="ai-preview-wrap">
          <img src="${dataUrl}" alt="Your selfie preview">
          <button type="button" class="ai-preview-remove" id="ai-preview-remove">&times;</button>
        </div>
      `;
      previewArea.querySelector("#ai-preview-remove").addEventListener("click", clearSelectedImage);
      uploadActions.hidden = false;
      console.log("[AI Skin Analysis] preview shown");
    }

    // Shown only right after a live-camera Capture, so the client can
    // confirm the exact frame before moving on. Upload from Gallery stays
    // one tap away the whole time via "Upload Different Photo".
    function renderCapturedConfirm(dataUrl) {
      previewArea.innerHTML = `
        <div class="ai-preview-wrap">
          <img src="${dataUrl}" alt="Captured selfie preview">
        </div>
        <div class="ai-upload-actions">
          <button type="button" class="ai-btn" id="ai-use-photo-btn">Use This Photo</button>
          <button type="button" class="ai-btn ai-btn-ghost" id="ai-retake-capture-btn">Retake Photo</button>
          <button type="button" class="ai-btn ai-btn-ghost" id="ai-upload-different-btn">Upload Different Photo</button>
        </div>
      `;
      console.log("[AI Skin Analysis] preview shown");
      previewArea.querySelector("#ai-use-photo-btn").addEventListener("click", () => {
        renderPlainPreview(dataUrl);
      });
      previewArea.querySelector("#ai-retake-capture-btn").addEventListener("click", () => {
        clearSelectedImage();
        openLiveCamera();
      });
      previewArea.querySelector("#ai-upload-different-btn").addEventListener("click", () => {
        clearSelectedImage();
        libraryInput.click();
      });
    }

    // Single source of truth for STORING a selected image — Upload from
    // Gallery, the native camera-app fallback, and the live in-page Capture
    // button all funnel through here, writing to the exact same
    // state.imageFile / state.imageDataUrl used everywhere downstream
    // (including the /api/analyze-skin submission in runAnalysis()).
    function storeSelectedImage(file, fromLiveCamera) {
      if (!file || !file.type || !file.type.startsWith("image/")) return;
      state.imageFile = file;
      console.log("[AI Skin Analysis] selected image set", file.name, file.size, file.type);
      const reader = new FileReader();
      reader.onload = (e) => {
        state.imageDataUrl = e.target.result;
        continueBtn.disabled = false;
        noImageMsg.style.display = "none";
        if (fromLiveCamera) {
          renderCapturedConfirm(state.imageDataUrl);
        } else {
          renderPlainPreview(state.imageDataUrl);
        }
      };
      reader.readAsDataURL(file);
    }

    function handleFile(file) {
      storeSelectedImage(file, false);
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
          video: { facingMode: "user", aspectRatio: { ideal: CAPTURE_ASPECT_RATIO } },
          audio: false,
        });
        activeCameraStream = stream;
        videoEl.srcObject = stream;
        // Some mobile browsers (notably iOS Safari) don't reliably start
        // decoding frames from the `autoplay` attribute alone when
        // `srcObject` is assigned programmatically — calling play()
        // explicitly (video is muted, so no fresh user gesture is required)
        // helps make sure a real frame is being decoded before Capture is
        // tapped.
        try { await videoEl.play(); } catch (playErr) { /* likely already playing */ }
        previewArea.innerHTML = "";
        liveArea.hidden = false;
        uploadActions.hidden = true;
        console.log("[AI Skin Analysis] camera opened");
      } catch (err) {
        cameraInput.click();
      }
    }

    // Resolves once the live video actually has a decoded frame ready to
    // draw. Without this guard, tapping Capture right as the preview
    // appears can hit a video element that has a stream attached but
    // hasn't decoded its first frame yet — drawImage() on that video
    // produces a blank canvas (or throws), which looks exactly like
    // "Capture does nothing" / "doesn't save the photo."
    function waitForVideoFrame(timeoutMs) {
      return new Promise((resolve) => {
        if (videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
          resolve();
          return;
        }
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          videoEl.removeEventListener("loadeddata", finish);
          clearTimeout(timer);
          resolve();
        };
        videoEl.addEventListener("loadeddata", finish);
        const timer = setTimeout(finish, timeoutMs);
      });
    }

    // Calm inline message inside the live-camera box if Capture can't get a
    // real frame yet, instead of the button silently doing nothing.
    function showCameraCaptureError() {
      let errEl = liveArea.querySelector(".ai-camera-error");
      if (!errEl) {
        errEl = document.createElement("p");
        errEl.className = "ai-camera-error";
        errEl.style.fontSize = ".85rem";
        errEl.style.margin = ".6em 0 0";
        errEl.style.color = "#fff";
        liveArea.insertBefore(errEl, liveArea.querySelector(".ai-camera-actions"));
      }
      errEl.textContent = "We couldn't capture a photo just yet — please make sure the camera preview is visible, then tap Capture Photo again.";
    }

    bodyEl.querySelector("#ai-camera-btn").addEventListener("click", openLiveCamera);
    bodyEl.querySelector("#ai-library-btn").addEventListener("click", () => libraryInput.click());

    const captureBtn = bodyEl.querySelector("#ai-camera-capture-btn");
    const captureBtnDefaultLabel = captureBtn.textContent;
    captureBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      console.log("[AI Skin Analysis] capture clicked");
      if (captureBtn.disabled) return;
      captureBtn.disabled = true;
      captureBtn.textContent = "Capturing…";
      try {
        await waitForVideoFrame(1500);
        if (!videoEl.videoWidth || !videoEl.videoHeight) {
          throw new Error("Camera frame not ready yet");
        }
        // Crop to the same 4:5 region visible in the live preview box (see
        // CAPTURE_ASPECT_RATIO / captureCroppedFrame near the top of this
        // file) so the captured photo always matches the live preview crop.
        const blob = await captureCroppedFrame(videoEl);
        const file = new File([blob], "skinart-selfie.jpg", { type: "image/jpeg" });
        console.log("[AI Skin Analysis] file created", file.name, file.size, file.type);
        stopActiveCamera();
        liveArea.hidden = true;
        storeSelectedImage(file, true);
      } catch (err) {
        console.error("[AI Skin Analysis] Photo capture failed:", err);
        showCameraCaptureError();
      } finally {
        captureBtn.disabled = false;
        captureBtn.textContent = captureBtnDefaultLabel;
      }
    });

    bodyEl.querySelector("#ai-camera-cancel-btn").addEventListener("click", stopLiveCamera);

    cameraInput.addEventListener("change", (e) => handleFile(e.target.files[0]));
    libraryInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

    continueBtn.addEventListener("click", () => {
      if (!state.imageDataUrl) {
        noImageMsg.style.display = "block";
        return;
      }
      noImageMsg.style.display = "none";
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
    console.log("[AI Skin Analysis] submit started", !!state.imageDataUrl);
    let analysis = null;

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

      // The backend's own photo-quality check (run server-side, after the
      // image has already been received and stored for this submission)
      // can ask for a retake. Route back to the upload step with contact
      // info intact and only the image cleared — "Take a Photo" / "Upload
      // from Gallery" there double as "Retake Photo" / "Upload Different
      // Photo".
      if (data && data.needsRetake) {
        state.needsRetake = true;
        state.retakeReason = typeof data.reason === "string" ? data.reason : null;
        state.imageDataUrl = null;
        state.imageFile = null;
        state.step = "upload";
        render();
        return;
      }

      // The backend always normalizes the report to ONE string field: analysis.
      // (Regardless of what it might be called internally — report/result/
      // message/aiAnalysis — the widget only ever reads `data.analysis`.)
      if (!res.ok || !data.analysisAvailable || !data.analysis || typeof data.analysis !== "string") {
        console.error("Analyze-skin endpoint returned no usable analysis:", data);
      } else {
        analysis = data.analysis;
      }
    } catch (err) {
      console.error("Analyze-skin request failed:", err);
    }

    state.analysis = analysis;
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

  function renderResults() {
    const sections = parseAnalysisSections(state.analysis);
    const hasReport = sections.length > 0;

    const reportHtml = hasReport
      ? sections
          .map(([label, content]) => `
            <div class="ai-result-section">
              <h4>${escapeHtml(label)}</h4>
              <p>${escapeHtml(content)}</p>
            </div>
          `)
          .join("")
      : `<div class="ai-error-box">Instant results aren't quite ready yet on our end — but don't worry, your photo and details have already been sent to our team. An esthetician will personally review your submission and follow up with recommendations.</div>`;

    bodyEl.innerHTML = `
      <div class="ai-step">
        <h3>Your Preliminary Results</h3>
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

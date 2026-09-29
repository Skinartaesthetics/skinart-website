/* ==========================================================================
   SkinArt Aesthetics — Contact form submit handler

   Prevents the native submit, gets a reCAPTCHA v3 token (invisible to
   real users), then sends everything to /api/send-contact which verifies
   the token server-side before emailing the studio via Resend.

   Replace YOUR_RECAPTCHA_SITE_KEY below with your actual reCAPTCHA v3
   site key from https://www.google.com/recaptcha/admin
   ========================================================================== */

var RECAPTCHA_SITE_KEY = "6Lf6MNYtAAAAAESn9s14jfLaf6q63zS6bFJ6xhbU";

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector(".contact-form");
    if (!form) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : "";

    // Built once, inserted right after the button, reused for every attempt.
    const statusEl = document.createElement("p");
    statusEl.className = "contact-form-status";
    statusEl.style.marginTop = "1em";
    statusEl.style.fontSize = ".9rem";
    statusEl.setAttribute("role", "status");
    statusEl.hidden = true;
    if (submitBtn) submitBtn.insertAdjacentElement("afterend", statusEl);

    function setStatus(message, isError) {
      statusEl.textContent = message;
      statusEl.style.color = isError ? "#a4453a" : "var(--gold, #6f7a63)";
      statusEl.hidden = false;
    }

    function escName(str) {
      return String(str).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }

    function doSubmit(recaptchaToken) {
      const data = new FormData(form);
      const payload = {
        first_name: data.get("first_name"),
        last_name: data.get("last_name"),
        email: data.get("email"),
        phone: data.get("phone"),
        interest: data.get("interest"),
        message: data.get("message"),
        pageUrl: window.location.href,
        recaptchaToken: recaptchaToken || "",
      };

      // Abort the fetch if the server takes longer than 15 seconds to respond.
      // This guarantees the button always resets regardless of server-side issues.
      var controller = new AbortController();
      var timeoutId = setTimeout(function () {
        controller.abort();
      }, 15000);

      fetch("/api/send-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
        .then(function (res) {
          clearTimeout(timeoutId);
          return res.text().then(function (text) {
            var body;
            try { body = JSON.parse(text); } catch (e) { body = null; }
            return { ok: res.ok, status: res.status, body: body };
          });
        })
        .then(function (result) {
          if (result.ok && result.body && result.body.success) {
            // Replace the entire form section with a full confirmation screen
            var firstName = (new FormData(form)).get("first_name") || "";
            var container = form.closest(".container") || form.parentElement;
            container.innerHTML =
              '<div style="text-align:center;padding:4em 1em 3em;">' +
                '<div style="font-size:3.5rem;color:var(--gold,#6f7a63);margin-bottom:.4em;line-height:1;">✓</div>' +
                '<h2 style="margin-bottom:.6em;">Thank you' + (firstName ? ', ' + escName(firstName) : '') + '!</h2>' +
                '<p style="max-width:460px;margin:0 auto 2em;color:#666;line-height:1.75;">' +
                  'We received your request and will be in touch shortly to find a time that works for you.' +
                '</p>' +
                '<a href="treatments.html" class="btn btn-solid">Explore Treatments</a>' +
              '</div>';
          } else {
            setStatus(
              (result.body && result.body.error) ||
                "Something went wrong sending your request. Please call or email us directly.",
              true
            );
          }
        })
        .catch(function (err) {
          clearTimeout(timeoutId);
          var msg = err && err.name === "AbortError"
            ? "Request timed out. Please call or email us directly."
            : "Something went wrong sending your request. Please call or email us directly.";
          setStatus(msg, true);
        })
        .finally(function () {
          clearTimeout(timeoutId);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }
        });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
      }
      statusEl.hidden = true;

      // Get reCAPTCHA v3 token (invisible — no user interaction needed).
      // grecaptcha.execute() can silently hang if the key has a domain
      // mismatch or reCAPTCHA is slow — guard with a 5-second timeout so
      // we always fall through to doSubmit rather than leaving the button
      // stuck at "Sending..." forever.
      if (typeof grecaptcha !== "undefined" && RECAPTCHA_SITE_KEY !== "YOUR_RECAPTCHA_SITE_KEY") {
        var captchaDone = false;
        var captchaTimer = setTimeout(function () {
          if (!captchaDone) { captchaDone = true; doSubmit(""); }
        }, 5000);

        grecaptcha.ready(function () {
          grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "contact_form" }).then(function (token) {
            if (!captchaDone) { captchaDone = true; clearTimeout(captchaTimer); doSubmit(token); }
          }).catch(function () {
            if (!captchaDone) { captchaDone = true; clearTimeout(captchaTimer); doSubmit(""); }
          });
        });
      } else {
        // reCAPTCHA not loaded — submit without token (server handles gracefully)
        doSubmit("");
      }
    });
  });
})();

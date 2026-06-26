/* ==========================================================================
   SkinArt Aesthetics — Contact form submit handler

   The "Request a Consultation" form on contact.html used to have
   action="#" method="POST" with nothing intercepting submit, so clicking
   "Send Request" did a raw browser POST to the page itself — which Vercel's
   static hosting can't handle, producing a blank page.

   This file prevents the native submit, sends the data to the new
   /api/send-contact serverless endpoint instead, and shows an inline
   success or error message in its place. It does not touch
   js/ga4-events.js's own "submit" listener on .contact-form (GA4 tracking
   keeps working unchanged — both listeners fire independently).
   ========================================================================== */
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

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const data = new FormData(form);
      const payload = {
        first_name: data.get("first_name"),
        last_name: data.get("last_name"),
        email: data.get("email"),
        phone: data.get("phone"),
        interest: data.get("interest"),
        message: data.get("message"),
        pageUrl: window.location.href,
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
      }
      statusEl.hidden = true;

      fetch("/api/send-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(function (body) {
            return { ok: res.ok, body };
          });
        })
        .then(function (result) {
          if (result.ok && result.body && result.body.success) {
            form.reset();
            setStatus("Thank you! Your request has been sent — we'll be in touch shortly.", false);
          } else {
            setStatus(
              (result.body && result.body.error) ||
                "Something went wrong sending your request. Please call or email us directly.",
              true
            );
          }
        })
        .catch(function () {
          setStatus("Something went wrong sending your request. Please call or email us directly.", true);
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }
        });
    });
  });
})();

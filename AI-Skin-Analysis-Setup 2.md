# AI Skin Analysis Chat — Workflow & Setup

Live on all 7 pages as a floating bubble ("Start Your Skin Analysis," bottom-right). No new header button — "Schedule Appointment" remains the only header CTA.

## Architecture — secure by design

The widget (`js/skin-analysis.js`) never calls OpenAI or any email provider directly, and never holds an API key. It only calls two endpoints on your own domain:

- **`/api/analyze-skin`** — validates the lead's info, calls OpenAI's vision model server-side, emails the full lead (with the selfie attached) to the studio, and returns the analysis JSON to display in the widget.
- **`/api/track-schedule-click`** — a lightweight, best-effort ping sent if/when the lead clicks "Schedule Appointment," so the front desk knows they followed through.

All real API keys live only in your hosting provider's environment variables — never in browser-visible code.

## Flow (as built)

1. **Bubble**: "Start Your Skin Analysis." A soft tooltip fades in after ~2s on first visit, dismissible.
2. **Welcome**: "Welcome to SkinArt Aesthetics. Start your complimentary AI skin analysis by uploading a clear selfie..."
3. **Contact form**: Full Name, Phone, Email — required, validated client-side, blocks progress until valid.
4. **Consent**: verbatim disclaimer + required "I agree" checkbox before any upload step is reachable.
5. **Selfie upload**: Take Photo (mobile camera) or Choose from Library/desktop file picker, with preview + remove option.
6. **Analyzing**: spinner while name, phone, email, consent, and the selfie are POSTed to `/api/analyze-skin`.
7. **Results**: soft, ethical-language summary (overall condition, hydration/dryness, congestion, texture, redness/sensitivity, pigmentation, pores, suggested treatment direction, recommendation to book) + "Schedule Appointment" button linking to `https://skinart.glossgenius.com/services`.
8. Every valid submission triggers a lead email to the studio — even if the instant AI summary fails for some reason, the lead and selfie are still emailed for manual follow-up, so no lead is ever lost.

## What you need to set up

### 1. Deploy to Vercel (recommended) or Netlify

**Vercel:**
1. Push this site folder to a GitHub repo (or drag-and-drop deploy) and import it into a new Vercel project. Vercel auto-detects the `/api` folder as serverless functions — no extra config needed.
2. In Project Settings → Environment Variables, add the three variables below.
3. Deploy. Your endpoints become `https://yourdomain.com/api/analyze-skin` and `https://yourdomain.com/api/track-schedule-click` — the widget already calls these as relative paths, so nothing else to change once the site is served from that domain.

**Netlify (alternative):**
- Move `api/analyze-skin.js` → `netlify/functions/analyze-skin.js` and `api/track-schedule-click.js` → `netlify/functions/track-schedule-click.js` (same code, Netlify's Node function format is compatible).
- Update `ANALYZE_ENDPOINT` and `SCHEDULE_CLICK_ENDPOINT` in `js/skin-analysis.js` to `/.netlify/functions/analyze-skin` and `/.netlify/functions/track-schedule-click`.
- Add the same environment variables in Site Settings → Environment Variables.

### 2. Environment variables (set in Vercel/Netlify dashboard — never in code)

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Yes, for instant AI results | Your OpenAI key — used only inside `/api/analyze-skin`, server-side. |
| `RESEND_API_KEY` | Yes, to receive lead emails | API key from a free [Resend.com](https://resend.com) account (recommended — simplest setup, generous free tier, no SDK install needed since the function calls Resend's REST API directly). |
| `EMAIL_API_KEY` | Alternative to `RESEND_API_KEY` | If you'd rather use SendGrid or Mailgun, set their key here instead and swap the `fetch` call in `sendLeadEmail()` for that provider's REST API — the validation/email-building logic stays the same. |
| `LEAD_EMAIL_TO` | Optional | Defaults to `info@skinartaesthetics.com` if not set. |

With Resend specifically: verify your sending domain (or use Resend's shared test domain while testing) and update the `from:` address in `api/analyze-skin.js` / `api/track-schedule-click.js` to match a verified address on your account.

Until `OPENAI_API_KEY` is set, the widget still gathers and emails every lead — it just shows "an esthetician will personally review your submission" instead of an instant AI summary. Until `RESEND_API_KEY`/`EMAIL_API_KEY` is set, no lead email is sent (logged as a warning server-side) — set this one first.

## Files

- `css/skin-analysis.css` — bubble + chat panel styling (uses your existing brand colors/fonts).
- `js/skin-analysis.js` — the whole chat flow: form validation, consent, upload, calls to the two serverless endpoints. No API keys here.
- `api/analyze-skin.js` — validates the lead, calls OpenAI server-side, emails the lead (with selfie attached) via Resend, returns the analysis.
- `api/track-schedule-click.js` — best-effort "lead clicked Schedule Appointment" notification email.
- Linked into all 7 pages: index, about, treatments, contact, postcare, shop, policies.

## Compliance built in

- Consent is mandatory and required before the upload step, both client-side and re-validated server-side.
- The server-side AI prompt is constrained to soft, non-diagnostic phrasing only ("appears," "may suggest," "visible signs of," "could benefit from," "based on the image provided") — no medical claims, no guarantees, no skin-age numbers, no certainty-from-one-photo language, no prescription recommendations.
- Every results screen reiterates that this is preliminary and not a substitute for an in-person consultation, and ends with a recommendation to book one.

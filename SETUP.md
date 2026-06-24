# SkinArt Aesthetics — Setup Guide

## File type confirmation

Both serverless functions are plain **JavaScript** (`.js`), not TypeScript:

- `api/analyze-skin.js`
- `api/track-schedule-click.js`

They use modern ES module syntax (`export default async function handler(...)`). The project's `package.json` sets `"type": "module"` so Node interprets `.js` files as ES modules. **Vercel can deploy these as-is** — no build step, no transpiling, no `tsconfig.json` needed. Vercel auto-detects any file inside `/api` as a serverless function and uses its Node.js runtime (this project requires Node 18+, set via `engines.node` in `package.json`, since the functions rely on the native `fetch` API).

## 1. Deploy on Vercel

1. Push this project folder to a GitHub (or GitLab/Bitbucket) repository, or drag-and-drop the folder into [vercel.com/new](https://vercel.com/new).
2. Import the repo as a new Vercel project. Leave the framework preset as **"Other"** — this is a static site with serverless functions, no framework build step is needed.
3. Before deploying, add the environment variables listed below (Project Settings → Environment Variables).
4. Click **Deploy**. Vercel will serve the HTML/CSS/JS files statically and automatically expose `api/analyze-skin.js` and `api/track-schedule-click.js` at:
   - `https://yourdomain.vercel.app/api/analyze-skin`
   - `https://yourdomain.vercel.app/api/track-schedule-click`
5. The widget already calls these as relative paths (`/api/analyze-skin`, `/api/track-schedule-click`), so nothing in the code needs to change once deployed.

## 2 & 3. Required environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (never commit them to code):

| Variable | Required? | What it means |
|---|---|---|
| `OPENAI_API_KEY` | Required for instant AI results | Your OpenAI API key. Used only inside `api/analyze-skin.js`, server-side, to call the vision model that reads the uploaded selfie. If missing, the widget still works and the lead is still emailed — it just skips the instant AI summary. |
| `RESEND_API_KEY` | Required to receive lead emails | API key from your [Resend.com](https://resend.com) account. Used to send the "New AI Skin Analysis Lead" email (with the selfie attached) to the studio, and the "Schedule Appointment clicked" notification. |
| `EMAIL_API_KEY` | Alternative to `RESEND_API_KEY` | Use this instead of `RESEND_API_KEY` only if you swap in a different provider (SendGrid, Mailgun, etc.) — you'd also need to update the `fetch` call in `sendLeadEmail()` to that provider's API. If you're using Resend, you only need `RESEND_API_KEY`, not this one. |
| `LEAD_EMAIL_TO` | Optional | The inbox that receives lead emails. Defaults to `info@skinartaesthetics.com` if not set. |

## 4. How to test `/api/analyze-skin`

This endpoint expects a `POST` with JSON body: `name`, `phone`, `email`, `consent` (boolean), and `image` (a base64 data URL, e.g. `data:image/jpeg;base64,...`).

**Quickest way — through the live widget:**
Open your deployed site, click "Start Your Skin Analysis," fill in the form, upload a selfie, and submit. Watch the result screen and check your inbox for the lead email.

**Manual test with curl** (replace the image with a real base64 selfie if you want a real AI result — a placeholder image will still test validation and email-sending):

```bash
curl -X POST https://yourdomain.vercel.app/api/analyze-skin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Client",
    "phone": "555-123-4567",
    "email": "test@example.com",
    "consent": true,
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD..."
  }'
```

Expected response on success:
```json
{ "analysis": { "overall": "...", "hydration": "...", ... }, "analysisAvailable": true, "emailSent": true }
```

If you omit a required field (e.g. `consent`), you should get a `400` with `{"error":"Validation failed","details":[...]}` — this confirms server-side validation is working independent of the widget.

## 5. How to test `/api/track-schedule-click`

This endpoint expects a `POST` with JSON body: `name`, `phone`, `email`. It's best-effort and always returns `200`, even on failure, so it never blocks the widget.

```bash
curl -X POST https://yourdomain.vercel.app/api/track-schedule-click \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Client","phone":"555-123-4567","email":"test@example.com"}'
```

Expected response: `{"tracked": true}` if `RESEND_API_KEY`/`EMAIL_API_KEY` is set and the email sends, or `{"tracked": false, ...}` if not — check your inbox for a "Lead clicked Schedule Appointment" email either way.

You can also trigger this naturally by completing a full analysis on the live widget and clicking the "Schedule Appointment" button on the results screen.

## 6. Troubleshooting

**AI analysis isn't showing up (widget shows the "an esthetician will personally review" fallback):**
- Confirm `OPENAI_API_KEY` is set in Vercel and you redeployed after adding it (env var changes require a redeploy to take effect).
- Check Vercel → Project → Deployments → [latest] → Functions → `analyze-skin` logs for `"OpenAI error:"` or `"OpenAI call threw:"` — this will show the exact OpenAI error (e.g. invalid key, rate limit, insufficient credits).
- Make sure the key has access to the `gpt-4o` model and your OpenAI account has billing set up — vision requests fail silently into the fallback if the account has no credit.

**Lead emails aren't arriving (Resend):**
- Confirm `RESEND_API_KEY` (or `EMAIL_API_KEY`) is set and you redeployed after adding it.
- Check Vercel function logs for `"No RESEND_API_KEY / EMAIL_API_KEY configured"` (key missing) or `"Email send failed:"` (Resend rejected the request — the log will include Resend's error text).
- The most common Resend rejection is an unverified `from` address. The functions send from `leads@skinartaesthetics.com` — this domain must be verified in your Resend account (Resend → Domains), or you must change the `from:` address in both `api/analyze-skin.js` and `api/track-schedule-click.js` to a verified address/domain on your account.
- Check your spam folder, and confirm `LEAD_EMAIL_TO` (if set) is spelled correctly.

**Endpoint returns 404 on Vercel:**
- Confirm `api/analyze-skin.js` and `api/track-schedule-click.js` are at the project root inside an `api/` folder (not nested inside another folder), and that the deployed branch actually includes them — check the Vercel deployment's file listing under "Source."

**Endpoint returns 500 or "FUNCTION_INVOCATION_FAILED":**
- Check the function logs in Vercel (Deployments → [latest] → Functions). This usually means malformed JSON in the request body, or an uncaught error — both functions log details (`console.error`) before failing, so the log will point to the cause.

**Validation always fails (400) even with a real submission:**
- Make sure the selfie is sent as a base64 data URL starting with `data:image` (this is how the widget formats it) — a raw file upload or plain URL won't pass validation by design.

# SkinArt Analytics — Setup Guide

This adds lightweight, privacy-conscious analytics to the website and the AI
Skin Analysis funnel. It never exposes API keys to the browser, never stores
selfie images, and never stores the full AI skin report text.

## 1. Create the Supabase project (if you don't already have one)

1. Go to https://supabase.com and create a free project.
2. In your project, go to **Project Settings → API**. You'll need two values
   for step 3 below:
   - **Project URL** → this is `SUPABASE_URL`
   - **service_role key** (NOT the `anon` public key) → this is
     `SUPABASE_SERVICE_ROLE_KEY`

The service role key can bypass Row Level Security and should only ever be
used server-side — which is exactly how it's used here (inside Vercel
serverless functions, never sent to the browser).

## 2. Create the `analytics_events` table

In Supabase, go to **SQL Editor** and run:

```sql
create table if not exists analytics_events (
  id            bigint generated always as identity primary key,
  event_name    text not null,
  page_url      text,
  referrer      text,
  session_id    text,
  user_agent    text,
  device_type   text,
  browser       text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  metadata      jsonb default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists analytics_events_event_name_idx on analytics_events (event_name);
create index if not exists analytics_events_created_at_idx on analytics_events (created_at desc);
```

Because all writes go through the service role key from a trusted server
function (never from the browser), Row Level Security can stay enabled with
no public policies — the table is effectively private. If you'd like, you can
leave RLS enabled and add zero policies; the service role key bypasses RLS
entirely, so writes from `/api/track-event` etc. will still work.

## 3. Add environment variables in Vercel

In your Vercel project: **Settings → Environment Variables**, add:

| Name | Value | Notes |
|---|---|---|
| `SUPABASE_URL` | your Supabase Project URL | safe-ish but still server-only |
| `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role key | **never** put this in any frontend file |
| `ANALYTICS_ADMIN_PASSWORD` | a password you choose | protects `/analytics.html` and `/api/analytics-summary` |

Redeploy after adding these (Vercel only picks up new env vars on a fresh
deployment).

## 4. Using the dashboard

Visit `/analytics.html` on your live site, enter the password you set as
`ANALYTICS_ADMIN_PASSWORD`, and you'll see:

- Page views, AI widget opens, AI analyses started/completed/failed, email
  success/failure counts, schedule-appointment clicks, blog views
- The AI-widget-open → Schedule-Appointment-click funnel and conversion rate
- Top pages
- The most recent 20 events

The password is never stored anywhere on the page — it's only sent (as a
request header) each time you load or refresh the dashboard.

If you'd rather pull the same data programmatically, call
`GET /api/analytics-summary` with header `x-admin-password: <your password>`.

## What gets tracked, and what never does

Tracked: page views, blog views, AI widget opens, funnel step progression
(contact info submitted, consent accepted, selfie uploaded, analysis
started/succeeded/failed, email sent/failed, schedule-appointment clicks),
blog "Read More" clicks, treatment page views, contact form submissions —
plus the lead's name/email/phone *only after they've already submitted that
form* in the AI Skin Analysis flow (so the dashboard can show recent leads).

Never tracked or stored: the selfie image itself, the full AI-generated skin
report text, your OpenAI key, your Resend key, or your Supabase service role
key. Those stay entirely server-side.

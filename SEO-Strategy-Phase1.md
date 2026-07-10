# SkinArt Aesthetics — SEO Strategy & Audit
## Phase 1 Deliverable | July 10, 2026
*Prepared by Claude (your SEO strategist) for Dina Telesh, SkinArt Aesthetics*

---

## TECHNICAL FIXES APPLIED THIS SESSION (No Approval Needed)

These were clear bugs, not content decisions:

| Fix | File | What Changed |
|-----|------|-------------|
| ✅ Sitemap merge conflicts resolved (×2) | sitemap.xml | Removed git conflict markers; kept www URLs; added blog-summer-acne-breakouts.html |
| ✅ robots.txt sitemap URL corrected | robots.txt | Changed non-www → www sitemap reference |

**Next step:** Run `git add -A && git commit -m "Fix sitemap conflicts + robots.txt www URL + add summer acne blog" && git push` in Terminal to deploy all fixes to Vercel.

---

## PRODUCT & DEVICE REFERENCE (Confirmed by Dina)

*Used to write accurate service page copy — do not change without checking with Dina.*

| Category | Details |
|----------|---------|
| **Chemical peels** | BioRePeel, GlyMed+, Circadia, Face Reality, VI Peel |
| **Microneedling device** | SkinPen / Skinact Pen |
| **Microneedling needle depth** | 0.25 mm – 1.00 mm |
| **Microneedling numbing** | Provided at appointment (clients do not bring their own) |
| **Microneedling pre-req** | Consultation required before first session |
| **SWICH™ device brand** | Circadia |
| **Signature Glow modalities** | LED, Zemits Dermlux hydrofacial, oxygen infusion, ultrasonic infusion |
| **LED therapy** | Included in select facials; not offered as standalone add-on |
| **Brow lamination brands** | Elleebana, Brow Code |
| **Lash lift brand** | Elleebana |
| **Brow lamination results** | 4–6 weeks |
| **Lash lift results** | 4–6 weeks |
| **Professional association** | ASCP member |
| **Yelp** | https://www.yelp.com/biz/skinart-aesthetics-huntingdon-valley |
| **Google review link** | https://g.page/r/CcgEiIExJqypEAI/review |
| **Listings** | Apple Maps, Google Maps (Bing Places — not yet verified) |

---

## PART 1 — TEN HIGHEST-PRIORITY SEO PROBLEMS

### 1. No Dedicated Service Landing Pages
This is the single biggest missed opportunity. Everything lives under `/treatments.html`. Google has one page to rank for *microneedling*, *chemical peels*, *acne facials*, *dermaplaning*, *brow lamination*, and *lash lift* combined — meaning it rarely ranks for any of them. Competitors with individual service pages will almost always outrank a single catch-all menu page for specific service searches.

**Impact:** High. Every service search is a ranking opportunity you're currently not entering.

### 2. Homepage H1 Is a Brand Phrase, Not a Keyword Heading
Current H1: *"The SkinArt Way"*
This is a great brand statement but tells Google nothing about what you offer or where you are. Google uses the H1 as one of its strongest on-page signals. A searcher Googling "facials in Huntingdon Valley" cannot be matched to an H1 about your philosophy.

**Impact:** High. This directly suppresses homepage ranking for service + location searches.

### 3. Homepage Title Missing Primary Service Keyword
Current title: *"Skinart Aesthetics | Boutique Skincare Studio in Huntingdon Valley, PA"*
"Skincare studio" is a brand descriptor, not what people search. Searches like "facials Huntingdon Valley" or "esthetician near me" won't match this title well.

**Impact:** High. Title tags are a direct ranking factor.

### 4. Post Care Page Is Image-Only — Zero Crawlable Text
The entire `/postcare.html` page is four image cards. Google cannot read images. This page has no body text, no headings, no searchable content. It is essentially invisible to search engines and to anyone using a screen reader.

**Impact:** Medium-High. Aftercare searches ("microneedling aftercare," "chemical peel aftercare tips") are real queries that could bring in new clients. Currently, this page captures none of them.

### 5. No Structured Data / Schema Markup Anywhere
No `LocalBusiness`, `Service`, `Article`, or `FAQPage` schema exists on any page. Schema helps Google understand your business entity, display rich results (star ratings, FAQs, address in SERPs), and build confidence in the information you're presenting.

**Impact:** Medium-High. Without `LocalBusiness` schema, Google is piecing together your NAP (Name, Address, Phone) from unstructured text instead of clean, verified data.

### 6. Blog Posts Are Thin and Contain Awkward Keyword Phrases
All six blog posts are 400–600 words — well below the 800–1,200 words that tend to rank for informational queries. Worse, several posts contain verbatim awkward phrases:
- *"facial Huntingdon Valley PA"* (blog-customized-facial.html)
- *"facial for congested skin"* (blog-blackheads.html)  
- *"hydrating facial near me"* (blog-dehydrated-vs-dry-skin.html)
- *"professional facial near me"* (blog-next-facial.html)
- *"esthetician Huntingdon Valley PA"* and *"luxury facial Philadelphia suburbs"* (blog-skinart-way.html)

These phrases signal keyword stuffing to Google and read unnaturally to humans. They need to be rewritten.

**Impact:** Medium-High. Blog traffic is a long-term organic asset. Thin, awkward posts waste the investment you've already made in writing them.

### 7. Blog Posts Lack FAQs, Author Schema, and Internal Links to Specific Services
None of the six posts have:
- FAQ sections (missed opportunity for `FAQPage` rich results)
- A proper author bio with Dina's credentials at the bottom
- Links to specific services (they link to generic `/treatments.html` instead of, e.g., the acne facial page or the peel page)
- Images (no visual content, no image alt text opportunities)
- Related post links

**Impact:** Medium.

### 8. GlossGenius About Bio Is Outdated and Brand-Inconsistent
Current GlossGenius About text uses emojis and generic phrases ("Join us as we embark on this beautiful journey together! 💖") that don't match the elevated, professional brand voice of your main site. The meta description only mentions 3 services ("essential reset, the signature glow, and timeless lift") — not the full menu. GlossGenius pages are indexed by Google and appear in brand searches; inconsistent messaging undermines trust.

Additionally, the GlossGenius meta keywords say *"stylist, glossgenius, beauty"* — you are an esthetician, not a stylist.

**Impact:** Medium. GlossGenius often ranks alongside your main site for brand searches. The description a potential client sees matters.

### 9. "Dermaplaning" Misspelled Throughout Site
Both the main site and GlossGenius spell it "Dermaplanning" (double n). The correct professional spelling is "Dermaplaning" (one n, no double n). The misspelling appears in the Treatments page heading and throughout GlossGenius, meaning searches for the correct spelling won't perfectly match your content.

**Impact:** Low-Medium. Misspellings reduce credibility and may cause missed matches.

### 10. No Canonical Tags on Any Page
None of the 14 pages include `<link rel="canonical" ...>` tags. Canonical tags tell Google definitively which version of a URL is the "real" one, preventing duplicate content issues if the page is ever accessed via different URLs (e.g., with/without trailing slash, http vs https, etc.).

**Impact:** Low-Medium. Lower risk now that www redirect is solid, but canonical tags are a best-practice safety net worth adding.

---

## PART 2 — TEN HIGHEST-VALUE FIXES

### Fix 1: Create 10 Dedicated Service Landing Pages
**Effort:** High | **Impact:** Very High | **Timeline:** Phase 4 (Weeks 5–10)

One page per core service, each targeting a high-intent local search:
- `/facials-huntingdon-valley.html` — Customized Facials
- `/acne-facial-huntingdon-valley.html` — Acne Facials
- `/microneedling-huntingdon-valley.html` — Microneedling
- `/chemical-peels-huntingdon-valley.html` — Chemical Peels
- `/biorepeel-huntingdon-valley.html` — BioRePeel
- `/dermaplaning-huntingdon-valley.html` — Dermaplaning
- `/hydrating-facial-huntingdon-valley.html` — Hydrating Facials
- `/anti-aging-facial-huntingdon-valley.html` — Anti-Aging / Timeless Lift
- `/brow-lamination-huntingdon-valley.html` — Brow Lamination
- `/lash-lift-huntingdon-valley.html` — Lash Lift

Each page: 700–1,200 words, full service details, FAQs, internal links, booking CTA.

### Fix 2: Rewrite Homepage Title, H1, and Hero Copy
**Effort:** Low | **Impact:** High | **Timeline:** Phase 3 (Week 3)

Draft provided in Part 5 of this document. Awaiting your APPROVE / REVISE / HOLD.

- **New Title:** `Facials & Advanced Skincare in Huntingdon Valley, PA | SkinArt Aesthetics`
- **New H1:** `Customized Facials & Advanced Skincare in Huntingdon Valley, PA`
- **"The SkinArt Way"** becomes an H2 brand tagline immediately below the H1

### Fix 3: Convert Post Care Page to HTML Text
**Effort:** Medium | **Impact:** Medium-High | **Timeline:** Phase 5 (Week 8)

Convert all four aftercare image cards into full readable HTML sections with headings, bullet points, and booking CTAs. Keep the images as visual aids but add complete text beneath each one. This turns one invisible page into four searchable aftercare guides.

### Fix 4: Add LocalBusiness + Service Schema to All Pages
**Effort:** Medium | **Impact:** Medium-High | **Timeline:** Phase 6 (Weeks 11–12)

Implement `LocalBusiness` JSON-LD on every page with your NAP, hours, geo-coordinates, and service area. Add `Service` schema to the Treatments page and to each new service landing page. Add `Article` + `Person` schema to all blog posts.

### Fix 5: Fix "Dermaplaning" Spelling Everywhere
**Effort:** Low | **Impact:** Low-Medium | **Timeline:** Immediate (Week 1)

Find-and-replace "Dermaplanning" → "Dermaplaning" across:
- `treatments.html` (heading and alt text)
- `css/style.css` (if used as class name)
- GlossGenius service listing (you update directly in GlossGenius dashboard)

### Fix 6: Expand All Six Blog Posts to 800–1,200 Words
**Effort:** High | **Impact:** Medium-High | **Timeline:** Phase 5 (Weeks 7–10)

Each post needs:
- Expanded body content answering the searcher's full question
- Rewritten awkward keyword phrases
- FAQ section (3–5 questions)
- Author bio at the bottom: *"Written by Dina Telesh, Licensed Esthetician, SkinArt Aesthetics, Huntingdon Valley, PA"*
- Publication date and "last updated" date visible on page
- Images with descriptive alt text
- Internal links to the specific service page most relevant to the topic
- Link to 1–2 related blog posts

### Fix 7: Update GlossGenius About Bio and Description
**Effort:** Low | **Impact:** Medium | **Timeline:** Week 2

Update the GlossGenius About section to match the elevated brand voice. Draft provided in Part 8 of this document.

### Fix 8: Add Canonical Tags to All 14 Pages
**Effort:** Low | **Impact:** Low-Medium | **Timeline:** Week 2

Add `<link rel="canonical" href="https://www.skinartaesthetics.com/[page]">` to the `<head>` of all 14 pages. This is a one-time addition to the HTML template.

### Fix 9: Improve Meta Descriptions on Service-Heavy Pages
**Effort:** Low | **Impact:** Medium | **Timeline:** Week 3

Current meta descriptions are good but generic. Updated versions should include:
- Primary service keyword
- Location (Huntingdon Valley, PA)
- A compelling reason to click
- Character count: 140–160 characters

### Fix 10: Build the Internal Link Structure
**Effort:** Medium | **Impact:** Medium-High | **Timeline:** Ongoing from Phase 4

Currently all blog posts link to generic `/treatments.html`. Once service pages are live:
- Acne blog → `/acne-facial-huntingdon-valley.html`
- Blackheads blog → `/acne-facial-huntingdon-valley.html` and `/facials-huntingdon-valley.html`
- Dehydrated skin blog → `/hydrating-facial-huntingdon-valley.html`
- Chemical peel aftercare blog → `/chemical-peels-huntingdon-valley.html`
- How often to get a facial blog → `/facials-huntingdon-valley.html`
- SkinArt Way blog → `/facials-huntingdon-valley.html` + `/treatments.html`

---

## PART 3 — KEYWORD MAP

*Note: Monthly search volume (MSV) estimates are based on professional knowledge of local aesthetics searches. Exact figures should be confirmed in Google Search Console and Google Keyword Planner. Local volumes for Huntingdon Valley are inherently low (the area has ~15K residents) but purchase intent is very high. Targeting nearby city terms (Philadelphia suburbs, Montgomery County) widens the funnel.*

| Page | Primary Keyword | Secondary Keywords | Search Intent | Target Area | MSV (est.) | Competition | Recommended SEO Title | Recommended H1 | Recommended URL | Current Status | Priority |
|------|----------------|-------------------|---------------|-------------|-----------|-------------|----------------------|----------------|-----------------|---------------|----------|
| Homepage | facials Huntingdon Valley PA | esthetician Huntingdon Valley, skincare studio near me, professional facials near Philadelphia, customized facial near me | Local commercial | Huntingdon Valley / suburbs | 50–200/mo local | Low | Facials & Advanced Skincare in Huntingdon Valley, PA \| SkinArt Aesthetics | Customized Facials & Advanced Skincare in Huntingdon Valley, PA | /index.html (existing) | Needs rewrite | ⭐⭐⭐⭐⭐ |
| Treatments | facial menu Huntingdon Valley, skincare treatments near me | full facial menu, facial pricing near me, facials menu Philadelphia suburbs | Informational / commercial | Huntingdon Valley | 50–100/mo | Low | Treatments & Pricing \| SkinArt Aesthetics – Huntingdon Valley, PA | Skin Treatments Tailored to You in Huntingdon Valley, PA | /treatments.html (existing) | Needs H1 + meta update | ⭐⭐⭐ |
| About | Dina Telesh esthetician, esthetician Huntingdon Valley PA | licensed esthetician near me, boutique skincare studio | Informational / brand | Huntingdon Valley | 20–50/mo | Very low | About Dina Telesh, Licensed Esthetician \| SkinArt Aesthetics | Meet Dina Telesh — Licensed Esthetician in Huntingdon Valley, PA | /about.html (existing) | Minor updates needed | ⭐⭐ |
| Contact | book facial Huntingdon Valley, skin consultation near me | book esthetician near me, skincare consultation near Philadelphia | Transactional | Huntingdon Valley | 50–100/mo | Low | Book a Skin Consultation in Huntingdon Valley, PA \| SkinArt Aesthetics | Book Your Skin Consultation at SkinArt Aesthetics | /contact.html (existing) | Minor updates needed | ⭐⭐ |
| Customized Facials | customized facial Huntingdon Valley | personalized facial near me, best facial near me, facial near Philadelphia, professional facial PA | Commercial / local | Huntingdon Valley + Montgomery County | 500–2,000/mo broad | Medium | Customized Facials in Huntingdon Valley, PA \| SkinArt Aesthetics | Customized Facials in Huntingdon Valley, PA | /facials-huntingdon-valley.html (NEW) | Does not exist | ⭐⭐⭐⭐⭐ |
| Acne Facials | acne facial Huntingdon Valley | acne facial near me, facial for acne near me, acne treatment esthetician near me, acne skincare near Philadelphia | Commercial / local | Huntingdon Valley + surrounding areas | 500–2,000/mo broad | Medium | Acne Facial in Huntingdon Valley, PA \| SkinArt Aesthetics | Professional Acne Facial in Huntingdon Valley, PA | /acne-facial-huntingdon-valley.html (NEW) | Does not exist | ⭐⭐⭐⭐⭐ |
| Microneedling | microneedling Huntingdon Valley PA | microneedling near me, collagen induction therapy near me, microneedling for acne scars near me, microneedling near Philadelphia | Commercial / local | Huntingdon Valley + Montgomery County | 1,000–5,000/mo broad | Medium-High | Microneedling in Huntingdon Valley, PA \| SkinArt Aesthetics | Professional Microneedling in Huntingdon Valley, PA | /microneedling-huntingdon-valley.html (NEW) | Does not exist | ⭐⭐⭐⭐⭐ |
| Chemical Peels | chemical peel Huntingdon Valley | chemical peel near me, professional peel near Philadelphia, VI peel near me, chemical peel for acne | Commercial / local | Huntingdon Valley + surrounding areas | 1,000–5,000/mo broad | Medium | Chemical Peels in Huntingdon Valley, PA \| SkinArt Aesthetics | Professional Chemical Peels in Huntingdon Valley, PA | /chemical-peels-huntingdon-valley.html (NEW) | Does not exist | ⭐⭐⭐⭐ |
| BioRePeel | BioRePeel Huntingdon Valley | BioRePeel near me, BioRePeel treatment near Philadelphia, no-peel chemical peel near me | Commercial / local | Huntingdon Valley + surrounding areas | 200–1,000/mo broad | Low-Medium | BioRePeel Treatment in Huntingdon Valley, PA \| SkinArt Aesthetics | BioRePeel® All Season Peel in Huntingdon Valley, PA | /biorepeel-huntingdon-valley.html (NEW) | Does not exist | ⭐⭐⭐⭐ |
| Dermaplaning | dermaplaning Huntingdon Valley | dermaplaning near me, dermaplaning facial near Philadelphia, professional dermaplaning near me | Commercial / local | Huntingdon Valley + surrounding areas | 500–2,000/mo broad | Medium | Dermaplaning in Huntingdon Valley, PA \| SkinArt Aesthetics | Professional Dermaplaning in Huntingdon Valley, PA | /dermaplaning-huntingdon-valley.html (NEW) | Does not exist | ⭐⭐⭐ |
| Hydrating Facial | hydrating facial Huntingdon Valley | hydrating facial near me, facial for dry skin near me, facial for dehydrated skin near Philadelphia | Commercial / local | Huntingdon Valley + surrounding areas | 200–1,000/mo broad | Low-Medium | Hydrating Facial in Huntingdon Valley, PA \| SkinArt Aesthetics | Hydrating Facial for Dry & Dehydrated Skin in Huntingdon Valley, PA | /hydrating-facial-huntingdon-valley.html (NEW) | Does not exist | ⭐⭐⭐ |
| Anti-Aging Facial | anti aging facial Huntingdon Valley | anti aging facial near me, facial for fine lines near me, facial for aging skin Philadelphia | Commercial / local | Huntingdon Valley + surrounding areas | 200–1,000/mo broad | Low-Medium | Anti-Aging Facial in Huntingdon Valley, PA \| SkinArt Aesthetics | Anti-Aging Facial for Firmer, Younger-Looking Skin in Huntingdon Valley, PA | /anti-aging-facial-huntingdon-valley.html (NEW) | Does not exist | ⭐⭐⭐ |
| Brow Lamination | brow lamination Huntingdon Valley | brow lamination near me, brow lamination near Philadelphia, brow tint near me | Commercial / local | Huntingdon Valley + surrounding areas | 1,000–5,000/mo broad | Medium | Brow Lamination in Huntingdon Valley, PA \| SkinArt Aesthetics | Brow Lamination & Tinting in Huntingdon Valley, PA | /brow-lamination-huntingdon-valley.html (NEW) | Does not exist | ⭐⭐⭐ |
| Lash Lift | lash lift Huntingdon Valley | lash lift near me, lash lift tint near Philadelphia, lash tint near me | Commercial / local | Huntingdon Valley + surrounding areas | 2,000–10,000/mo broad | Medium | Lash Lift in Huntingdon Valley, PA \| SkinArt Aesthetics | Lash Lift & Tint in Huntingdon Valley, PA | /lash-lift-huntingdon-valley.html (NEW) | Does not exist | ⭐⭐⭐ |

---

## PART 4 — PROPOSED WEBSITE STRUCTURE

### Current Structure (14 pages)
```
skinartaesthetics.com/
├── index.html            Homepage
├── about.html            About
├── treatments.html       All services on one page
├── postcare.html         Aftercare (image-only)
├── shop.html             Shop
├── blog.html             Blog index
├── blog-skinart-way.html
├── blog-next-facial.html
├── blog-dehydrated-vs-dry-skin.html
├── blog-customized-facial.html
├── blog-chemical-peel-aftercare.html
├── blog-blackheads.html
├── contact.html          Contact & Book
└── policies.html         Policies
```

### Proposed Structure (24+ pages)
```
skinartaesthetics.com/
├── index.html                              Homepage (rewritten)
├── about.html                              About (minor updates)
├── treatments.html                         Treatments overview (updated to hub/nav page)
│
├── — FACIAL SERVICES —
├── facials-huntingdon-valley.html          ⭐ NEW: Customized Facials
├── acne-facial-huntingdon-valley.html      ⭐ NEW: Acne Facials
├── hydrating-facial-huntingdon-valley.html ⭐ NEW: Hydrating Facials
├── anti-aging-facial-huntingdon-valley.html⭐ NEW: Anti-Aging Facials
├── dermaplaning-huntingdon-valley.html     ⭐ NEW: Dermaplaning
│
├── — ADVANCED TREATMENTS —
├── microneedling-huntingdon-valley.html    ⭐ NEW: Microneedling
├── chemical-peels-huntingdon-valley.html   ⭐ NEW: Chemical Peels
├── biorepeel-huntingdon-valley.html        ⭐ NEW: BioRePeel
│
├── — BROWS & LASHES —
├── brow-lamination-huntingdon-valley.html  ⭐ NEW: Brow Lamination
├── lash-lift-huntingdon-valley.html        ⭐ NEW: Lash Lift
│
├── — AFTERCARE —
├── postcare.html                           Updated: Add HTML text content
│
├── shop.html                               Shop (unchanged)
├── contact.html                            Contact & Book (minor SEO updates)
├── policies.html                           Policies (unchanged)
│
└── — BLOG (SkinArt Journal) —
    ├── blog.html                           Blog index (updated)
    ├── blog-skinart-way.html               Updated: expanded, FAQs, internal links
    ├── blog-next-facial.html               Updated: expanded, FAQs
    ├── blog-dehydrated-vs-dry-skin.html    Updated: expanded, FAQs
    ├── blog-customized-facial.html         Updated: expanded, FAQs
    ├── blog-chemical-peel-aftercare.html   Updated: expanded, FAQs
    └── blog-blackheads.html               Updated: expanded, FAQs
```

**Key change:** `treatments.html` becomes a curated hub page that introduces all service categories and links to each dedicated service page. It remains the overview; the service pages become the deep-dive ranking pages.

---

## PART 5 — HOMEPAGE REWRITE DRAFT
**Status: AWAITING YOUR APPROVAL**
Respond with: **APPROVE** / **REVISE** / **HOLD**

---

### SEO Title (changed)
```
Facials & Advanced Skincare in Huntingdon Valley, PA | SkinArt Aesthetics
```
*Current: "Skinart Aesthetics | Boutique Skincare Studio in Huntingdon Valley, PA"*
*Reason: Adds the primary service keyword "Facials" — what people actually search for.*

### Meta Description (changed)
```
SkinArt Aesthetics offers customized facials, microneedling, chemical peels, BioRePeel, dermaplaning, and brow and lash services in Huntingdon Valley, PA. Book a skin consultation today.
```
*Current: "Skinart Aesthetics is a boutique skincare studio in Huntingdon Valley, PA offering facials, peels, microneedling, brows & lashes. Book your consultation today."*
*Reason: More specific services named, stronger for click-through.*

### Hero Section (changed)

**Label (above H1):** SkinArt Aesthetics · Huntingdon Valley, PA
*(Current: "Our Philosophy")*

**H1 (changed):**
> Customized Facials & Advanced Skincare in Huntingdon Valley, PA

**H2 brand tagline (moved from H1 to H2):**
> The SkinArt Way

**Hero body copy (revised):**
> Expert-led, personalized skin treatments designed with intention — not trends. Whether you're dealing with acne, dehydration, congestion, fine lines, or uneven tone, every facial, peel, and protocol at SkinArt is built around what your skin actually needs right now. No guessing. No cookie-cutter facials. Just skincare with purpose.

*(Current text was good but didn't mention specific concerns. Added acne, dehydration, congestion, fine lines, uneven tone — all high-intent search terms searchers identify with.)*

**CTAs (unchanged):** [View Treatments] [Book a Consultation]

---

### "Welcome" Section (minor update)

**H2 (unchanged):** A studio built around your skin

**Body copy (minor revision — add specific service mentions):**
> At SkinArt Aesthetics, every treatment plan begins with a real conversation — about your skin, your goals, your lifestyle, and what your skin truly needs right now.
>
> Through The SkinArt Way, we combine expert skin analysis, professional-grade technology, and carefully selected skincare lines with a calm, unhurried approach. Whether you're coming in for a customized facial, an acne treatment, a chemical peel, or a microneedling session, every protocol is built with intention — so your results feel earned, never rushed.
>
> You'll leave with more than glowing skin. You'll leave with clarity, confidence, and a plan designed to keep your skin healthy, balanced, and beautifully cared for long after you walk out.

*(Current text doesn't mention specific treatments — added facials, acne treatment, chemical peel, microneedling to help match search intent.)*

---

### Client Reviews Section (unchanged — content is good)

---

### "Client Favorites" Section (minor additions)

Beneath each treatment card, add a small "Learn more →" link to the upcoming dedicated service pages:
- The Signature Glow → links to `/facials-huntingdon-valley.html`
- BioRePeel → links to `/biorepeel-huntingdon-valley.html`
- Microneedling → links to `/microneedling-huntingdon-valley.html`

*(These links can be added once the service pages are live.)*

---

### Closing CTA (add location reinforcement)

**Current:** "Ready to start your skin journey? Book a skin consultation and leave with a treatment plan made for you."

**Proposed addition beneath CTA buttons:**
> Located at 2337 Philmont Ave, Suite 203D, Huntingdon Valley, PA 19006 — serving clients from Lower Moreland, Bryn Athyn, Abington, Willow Grove, Southampton, and throughout Montgomery and Bucks County.

*(This is a natural location paragraph, not keyword stuffing. It confirms your service area for local search.)*

---

## PART 6 — CUSTOMIZED FACIALS PAGE DRAFT
**Status: AWAITING YOUR APPROVAL — NEW PAGE**
Respond with: **APPROVE** / **REVISE** / **HOLD**

**URL:** `/facials-huntingdon-valley.html`
**SEO Title:** `Customized Facials in Huntingdon Valley, PA | SkinArt Aesthetics`
**Meta Description:** `SkinArt Aesthetics offers personalized, expert-led facials in Huntingdon Valley, PA. Every facial is built around your skin's current needs — not a fixed menu. Book a consultation today.`

---

**[Page label]:** Signature Facials

# Customized Facials in Huntingdon Valley, PA

There is no such thing as a one-size-fits-all facial — not if you want real results. At SkinArt Aesthetics, every facial begins with a detailed skin assessment and a genuine conversation about what your skin is doing, what it needs, and where you want it to go. From there, we build a protocol designed specifically for you.

That means the right ingredients, the right techniques, and the right pressure — selected for your skin's current condition, not pulled from a standard menu.

---

## What Is a Customized Facial?

A customized facial is a professional skin treatment that adapts to your skin's unique needs at each visit rather than following a fixed protocol. Unlike a set facial that delivers the same steps to every client, a personalized facial begins with a professional assessment and selects products and techniques accordingly.

At SkinArt Aesthetics, customization is not an upgrade — it is the foundation of how every facial is performed. No two visits look exactly alike, because your skin is different every time you sit in the chair.

---

## Our Facial Menu

All of our signature facials are built on a customized foundation. Here's what's available:

**The Essential Reset** — 60 min / $140
A foundational facial that deeply cleanses, exfoliates, and restores balance. Ideal for first-time clients or anyone focused on maintenance and general skin wellness.

**The Signature Glow** — 75 min / $220 *(Most Popular)*
Our most requested treatment. Combines advanced cleansing, targeted exfoliation, extractions, LED therapy, hydrofacial technology, and oxygen and ultrasonic infusion for brighter, smoother, glowing skin. Best for dullness, congestion, and enlarged pores.

**The Hydrasilk Facial** — 75 min / $185
A deeply hydrating treatment that focuses on strengthening the skin barrier and restoring moisture. Best for dry, dehydrated, and sensitized skin.

**The Clear Skin Detox** — 60 min / $160
A corrective acne-focused treatment that uses professional protocols to reduce congestion, calm inflammation, and support long-term clarity. Best for acne-prone skin and active breakouts.

**The Deep Pore Refinement** — 75 min / $185
An intensive deep-cleansing treatment focused on advanced extractions and pore refinement. Best for enlarged pores, blackheads, and texture concerns.

**The Oxygen Facial** — 75 min / $185
A revitalizing oxygen-infusion treatment that promotes circulation, calms inflammation, and restores a healthy glow. Best for dull, stressed, sensitive, and acne-prone skin.

**The Timeless Lift** — 75 min / $185
An anti-aging treatment focused on improving firmness and elasticity through advanced peptides and collagen-supporting technology. Best for fine lines and loss of elasticity.

**The Dermaplaning Facial** — 60 min / $185
A professional exfoliation treatment that removes dead skin cells and vellus hair, leaving skin exceptionally smooth and radiant. Best for texture, dullness, and pre-event skin prep.

---

## Who Is a Good Candidate for a Customized Facial?

Almost anyone can benefit from a professional customized facial. Our clients range from first-timers curious about their skin to experienced clients looking for a consistent maintenance plan.

A personalized facial may be especially beneficial if you:
- Have tried standard facials and found the results inconsistent
- Deal with a combination of concerns — for example, oily in some areas and dry in others
- Have sensitive or reactive skin that doesn't tolerate a one-size-fits-all protocol
- Want to address specific concerns like acne, congestion, dehydration, fine lines, or dullness
- Are looking for a long-term skincare plan, not just a one-time treatment

---

## What to Expect During Your Facial

Every facial at SkinArt Aesthetics begins with a skin consultation — even if you've been coming in for years. Your skin changes, and so does the protocol.

Depending on your skin's needs, your facial may include:
- Professional-grade cleansing to remove surface buildup
- Targeted exfoliation (enzyme-based, chemical, or mechanical, depending on your skin)
- Steam or warmth to open pores and prepare for extractions
- Manual extractions performed with care and precision
- Targeted serums, masks, or modalities chosen for your current concerns
- Hydration and barrier-support to finish and protect

The experience is calm, unhurried, and private — never rushed through to the next appointment.

---

## How Long Is a Facial?

Depending on the treatment you select, sessions range from 60 to 75 minutes. The initial skin consultation adds a few minutes at the start of your first visit.

---

## How Often Should You Get a Facial?

For most clients, a professional facial every four to six weeks aligns with the skin's natural renewal cycle and keeps results consistent. Clients working toward a specific goal — like clearing acne or improving texture — may benefit from a closer interval at the start, particularly when pairing in-studio treatments with a home routine.

We'll always give you a realistic treatment plan based on what your skin needs, not a number pulled from a general guideline.

---

## How to Prepare

- Come with a clean or minimally made-up face if possible
- Let us know about any new products, medications, or skin changes before your appointment
- Avoid retinoids or active exfoliants for 2–3 days before your visit if your skin tends to be sensitive
- Arrive relaxed — appointments are never rushed

---

## Aftercare

After a customized facial, your skin may feel slightly flushed for a few hours. This is normal and typically fades by evening.

In the 24–48 hours following your treatment:
- Avoid active exfoliants, retinoids, and strong acids
- Wear SPF daily and reapply as needed
- Skip heavy workouts or saunas for 24 hours
- Keep makeup minimal to let your skin breathe

Specific aftercare guidance is provided after every appointment based on what was used in your treatment.

---

## What About Results?

Results vary based on your skin's starting point, the specific concerns being addressed, and how consistent your home routine is between appointments. Most clients notice a visible improvement in skin texture, tone, and radiance after a single session. Deeper concerns — like acne scarring, significant congestion, or pigmentation — improve gradually over a series of treatments.

We'll give you honest expectations at your consultation, not promises.

---

## Why Choose SkinArt Aesthetics for a Facial in Huntingdon Valley?

SkinArt Aesthetics was founded by Dina Telesh, a licensed esthetician with a medical background, international training, and advanced certifications in Face Reality acne protocols, Circadia, GlyMed+, and Zemits technologies.

Every appointment at SkinArt is one-on-one, private, and unhurried. There are no cookie-cutter protocols, no unnecessary upsells, and no rushing through a busy schedule. Just a personalized approach built on clinical knowledge and a genuine interest in what your skin needs to thrive.

---

## Serving Clients Throughout Montgomery County and the Philadelphia Region

SkinArt Aesthetics is located at 2337 Philmont Avenue, Suite 203D, Huntingdon Valley, PA 19006. We regularly see clients from Lower Moreland, Bryn Athyn, Abington, Willow Grove, Southampton, Feasterville-Trevose, Northeast Philadelphia, and throughout Bucks County and Montgomery County.

---

## Frequently Asked Questions

**What's the difference between a customized facial and a regular facial?**
A customized facial adapts to your skin's specific condition at each visit — products, techniques, and the order of steps are selected based on what your skin needs that day. A standard facial follows a fixed protocol regardless of who is in the chair. At SkinArt Aesthetics, customization is built into every appointment, not offered as an add-on.

**Will a facial help my acne?**
A facial can be part of an effective acne management plan when the right protocol is used. Our Clear Skin Detox facial is specifically designed for acne-prone skin and uses professional-grade products and techniques to reduce congestion and calm inflammation. For persistent or cystic acne, we may recommend a series of treatments and a consistent homecare routine between visits.

**Can I get a facial if I have sensitive skin?**
Yes — sensitive skin often responds well to professionally customized facials because the products and techniques are selected to match your skin's tolerance level. We work carefully with sensitive and reactive skin types and adjust every step of the treatment accordingly.

**How soon can I wear makeup after a facial?**
We recommend keeping makeup minimal for at least 24 hours after your facial to let your skin breathe and absorb the treatment. If you need to wear makeup the same day, a light mineral SPF is usually fine.

**What should I tell my esthetician before a facial?**
Let us know about any recent changes to your skincare routine, new medications (especially Accutane or retinoids), any known skin sensitivities, recent sun exposure, or active breakouts. This helps us adjust the protocol before we begin.

---

**[Booking CTA]**
## Ready to see what your skin looks like when it's properly cared for?

Book a Skin Consultation at SkinArt Aesthetics — we'll assess your skin, talk through your goals, and build a facial plan made for you.

[Book a Consultation →](https://www.skinartaesthetics.com/contact.html) [See Full Treatment Menu →](https://www.skinartaesthetics.com/treatments.html)

---

## PART 7 — MICRONEEDLING PAGE DRAFT
**Status: AWAITING YOUR APPROVAL — NEW PAGE**
Respond with: **APPROVE** / **REVISE** / **HOLD**

**URL:** `/microneedling-huntingdon-valley.html`
**SEO Title:** `Microneedling in Huntingdon Valley, PA | SkinArt Aesthetics`
**Meta Description:** `Professional microneedling in Huntingdon Valley, PA. Collagen induction therapy for acne scars, fine lines, enlarged pores, and skin texture. Book a consultation at SkinArt Aesthetics.`

---

**[Page label]:** Advanced Skin Treatments

# Professional Microneedling in Huntingdon Valley, PA

Microneedling is one of the most clinically supported treatments for improving acne scarring, fine lines, enlarged pores, and overall skin texture. At SkinArt Aesthetics, every microneedling session is performed with professional-grade equipment, clinical precision, and a careful approach to safety and aftercare.

---

## What Is Microneedling?

Microneedling — also called collagen induction therapy — is a minimally invasive skin treatment that uses a device with fine, sterile needles to create controlled micro-channels in the surface of the skin. These micro-channels trigger the skin's natural wound-healing response, stimulating the production of collagen and elastin to repair and remodel the treated tissue over time.

The result, typically visible over a series of treatments, is skin that may appear firmer, smoother, and more even in tone and texture. Microneedling does not produce dramatic immediate results in the way an injectable or resurfacing laser might — its benefits build gradually as new collagen forms beneath the surface.

---

## What Concerns May Microneedling Help Improve?

Microneedling is designed to support the skin's natural renewal process and may help improve the appearance of:

- Atrophic acne scars (shallow, pitted, or rolling scars)
- Fine lines and superficial wrinkles
- Enlarged or congested pores
- Rough or uneven skin texture
- Mild skin laxity or loss of firmness
- Uneven skin tone or post-inflammatory discoloration

Results vary based on the individual, the depth and extent of the concern being treated, the number of sessions completed, and the consistency of aftercare and sun protection.

**Microneedling is not a treatment for active acne, open breakouts, or raised (hypertrophic or keloid) scarring.** If you have active acne, we typically recommend addressing that first before beginning a microneedling course. Please discuss your full skin history during your consultation.

---

## Who Is a Good Candidate?

Microneedling may be appropriate for adults in generally good skin health who are looking to address the concerns listed above. During your consultation, we'll review your skin history, current medications, and any conditions that may affect how your skin responds to treatment.

Microneedling may not be appropriate if you:
- Have active acne, active cold sores, or open skin infections in the treatment area
- Are pregnant or breastfeeding
- Are currently using isotretinoin (Accutane) or have used it within the past 6–12 months (consult your prescribing provider)
- Have a history of keloid or hypertrophic scarring
- Have certain blood-clotting disorders or are taking blood-thinning medications
- Have had recent laser treatment, chemical peels, or fillers in the treatment area
- Have active eczema, psoriasis, or rosacea in the treatment area

This is not a complete list of contraindications. If you have a medical condition that affects skin healing or immune function, please consult your physician before booking. We are estheticians, not medical providers — for complex medical skin concerns, a dermatologist or physician is the appropriate primary provider.

---

## Our Microneedling Options

SkinArt Aesthetics performs microneedling using the SkinPen, a professional-grade collagen induction device, at needle depths ranging from 0.25 mm to 1.00 mm depending on the treatment area and your skin's needs. Numbing cream is provided and applied at your appointment — you do not need to bring your own. A consultation is required before your first microneedling session.

**Microneedling with Serum** — 75 min / $325
A professional microneedling session followed by infusion of a targeted serum of your choice:
- Hydrate — for barrier repair and moisture restoration
- Firm — for collagen support and anti-aging
- Radiance — for brightening and even tone
- Hair Booster — for scalp and hairline stimulation

**Microneedling with PDRN+ (Salmon DNA)** — 75 min / $395
PDRN (polydeoxyribonucleotide), derived from purified salmon DNA, is a regenerative ingredient studied for its role in supporting skin tissue repair and hydration. This option pairs the collagen induction of microneedling with PDRN infusion for enhanced recovery support.

*All serums and post-treatment products used at SkinArt Aesthetics are selected based on safety and compatibility with professional microneedling protocols. We do not use serums or topicals that are not appropriate for use with controlled skin disruption. Product selection is discussed at your consultation.*

**Buy a course of 4 or more microneedling sessions and receive 15% off.** A series of 3–6 sessions is typically recommended for optimal results, spaced 4–6 weeks apart.

---

## What Happens During a Microneedling Session?

**Before your appointment:** We'll review your skin history, current medications, and treatment goals. On the day of your session, arrive with clean skin — no heavy products or makeup.

**Numbing:** A topical numbing cream is applied and left on for approximately 20–30 minutes before treatment begins. This significantly reduces discomfort during the procedure.

**Treatment:** The microneedling device is moved across the treatment area in a controlled, systematic pattern. Depth and pressure are adjusted based on the area being treated and your skin's tolerance. The sensation during treatment is often described as a mild prickling or vibration.

**Post-treatment application:** Following the microneedling pass, your selected serum is applied while the micro-channels are open to support product infusion and initial recovery.

**Recovery support:** We apply a calming, barrier-supportive finish and review your aftercare instructions before you leave.

**Duration:** Approximately 75 minutes including numbing time.

---

## What Does Microneedling Feel Like?

With proper topical numbing, most clients describe microneedling as tolerable — a mild prickling or heat sensation, particularly over bonier or more sensitive areas like the forehead or around the mouth. Sensitivity varies by individual. Let your provider know at any point if you need a break or adjustment.

---

## What to Expect After Microneedling — Recovery and Downtime

Microneedling creates intentional, controlled micro-injuries to the skin. Recovery is part of the process.

**Immediately after:** Skin will appear red, flushed, and slightly swollen — similar in appearance to a moderate sunburn. Some pinpoint bleeding is normal.

**Day 1–2:** Redness and sensitivity are typically at their most noticeable. Avoid active skincare, makeup (where possible), and sun exposure.

**Day 3–5:** Skin may feel tight, dry, or slightly rough as surface repair begins. Some clients notice mild peeling or flaking.

**Day 5–10:** Most visible redness resolves. Skin may begin to appear smoother and more even.

**Full collagen remodeling** continues for weeks to months beneath the surface — this is where the longer-term improvements in scarring and texture take place.

Plan around any important events: we recommend scheduling your last session at least 10–14 days before a significant occasion.

---

## Microneedling Aftercare

Your skin is more vulnerable after microneedling and requires careful handling:

- **For 24–48 hours:** Avoid active skincare (retinoids, AHAs, BHAs, vitamin C), heavy makeup, excessive sweating, saunas, and direct sun exposure
- **For 1 week:** Wear a broad-spectrum SPF 30 or higher daily — without exception
- **Keep it simple:** Use only the gentle products recommended after your treatment; do not introduce new products during recovery
- **Do not pick or peel** any flaking skin — let it shed naturally
- **If you develop significant pain, blistering, unusual swelling, or signs of infection**, contact your provider or a medical professional

A complete written aftercare guide is provided after every microneedling session.

---

## How Many Treatments Will I Need?

For most clients, a series of 3 to 6 sessions spaced 4 to 6 weeks apart produces the most meaningful improvement in texture and scarring. Maintenance sessions 1–2 times per year can help sustain results.

The right number of sessions for you depends on the depth of your concerns, your skin's response to treatment, and your goals. We'll give you an honest assessment at your consultation — not a number designed to sell you more appointments.

---

## Risks

Microneedling is generally well tolerated when performed by a trained professional with proper protocols. Potential risks include:

- Prolonged redness or irritation beyond the normal recovery window
- Temporary hyperpigmentation, particularly in deeper skin tones (discuss this at your consultation)
- Infection, if post-treatment instructions are not followed carefully
- Rare adverse reactions to topical products applied during or after treatment

To minimize risk, microneedling at SkinArt Aesthetics is performed only with professional-grade equipment on clients who have been screened for appropriate candidacy. We do not offer microneedling as a walk-in or same-day service without prior consultation.

---

## When to Consult a Medical Provider

Estheticians are skin care professionals, not licensed medical providers. Microneedling performed in a licensed esthetics setting is appropriate for cosmetic concerns on healthy skin. However, you should consult a dermatologist or physician before pursuing microneedling if you have:

- An active skin condition being managed medically (eczema, rosacea, psoriasis, lupus)
- A history of herpes simplex (cold sores) in the treatment area — antiviral prophylaxis may be recommended
- Immunocompromising conditions or treatments
- Blood-clotting disorders or anticoagulant therapy
- Uncertain or complex scarring history

If you are under the care of a dermatologist or physician for a skin condition, please let us know — we're happy to coordinate or defer to their guidance.

---

## Why Choose SkinArt Aesthetics for Microneedling?

Microneedling is only as safe and effective as the training and care of the person performing it. At SkinArt Aesthetics, Dina Telesh combines a medical background with advanced esthetics certifications and specialized training in professional skin treatments to approach every session with the clinical attention it requires.

We use professional-grade microneedling equipment, carefully screened topicals, and a thorough consultation process to ensure every session is appropriate, safe, and tailored to your skin's needs. Your results are our priority — not filling a treatment slot.

---

## Located in Huntingdon Valley, PA

SkinArt Aesthetics is at 2337 Philmont Avenue, Suite 203D, Huntingdon Valley, PA 19006, convenient to clients from Lower Moreland, Bryn Athyn, Abington, Willow Grove, Southampton, Feasterville-Trevose, Northeast Philadelphia, and throughout Montgomery and Bucks County.

---

## Frequently Asked Questions About Microneedling

**How is microneedling different from a chemical peel?**
Microneedling creates micro-channels in the skin mechanically to stimulate collagen production, while a chemical peel uses an acid solution to dissolve and exfoliate the outer layers of skin. Both can improve texture and tone, but they work differently and are suited to different concerns. Many clients do both as part of a comprehensive plan — your consultation will help determine which is more appropriate for your skin right now.

**Will microneedling help my acne scars?**
Microneedling may help improve the appearance of atrophic (depressed, pitted) acne scars by stimulating collagen production in the scarred tissue over time. Results vary significantly based on the depth and type of scarring. Shallow, rolling scars often respond better than deep, ice-pick scars. A realistic expectation is gradual improvement over a series of treatments — not complete elimination. We'll give you an honest assessment of what's achievable at your consultation.

**Is microneedling safe for darker skin tones?**
Yes, when performed by a trained professional at appropriate settings, microneedling can be safe for a range of skin tones. However, deeper skin tones carry a higher risk of post-inflammatory hyperpigmentation with any skin-disrupting treatment. We'll discuss your skin tone, sensitivity, and history during your consultation to ensure the treatment is approached safely.

**Can I combine microneedling with other treatments?**
Microneedling is sometimes combined with other treatments as part of a broader skin improvement plan. However, some treatments should not be done in close proximity to a microneedling session. We'll guide you on timing and combinations at your consultation.

**How soon can I wear makeup after microneedling?**
We recommend avoiding makeup for at least 24–48 hours after treatment to minimize infection risk and allow initial healing. Light, non-irritating mineral SPF is typically the exception. Check with your provider after your session.

---

**[Booking CTA]**
## Ready to learn if microneedling is right for your skin?

Start with a Skin Consultation at SkinArt Aesthetics. We'll review your skin history, assess your concerns, and give you an honest treatment plan — no pressure, just clarity.

[Book a Consultation →](https://www.skinartaesthetics.com/contact.html) [See All Treatments →](https://www.skinartaesthetics.com/treatments.html)

---

## PART 8 — BLOG AUDIT

All six posts need updating before Phase 5. Priority order:

### 🔴 Priority 1 — Fix Immediately (Awkward Keyword Phrases)

**blog-customized-facial.html**
- Contains: *"Clients searching for a facial Huntingdon Valley PA often assume…"* — unnatural, needs rewrite
- Word count: ~500 words → expand to 900–1,100 words
- Missing: FAQ section, author bio with credentials, related posts links, images
- Link update: change `treatments.html` link → `/facials-huntingdon-valley.html` (once live)
- Add: Link to `blog-blackheads.html` and `blog-next-facial.html`

**blog-blackheads.html**
- Contains: *"deep cleansing facial"* and *"facial for congested skin"* as awkward anchor phrases in unnatural context — rewrite
- Word count: ~450 words → expand to 800–1,000 words
- Missing: FAQ, author bio, images
- Link update: change `treatments.html` link → `/acne-facial-huntingdon-valley.html` (once live)
- Also link to: `/facials-huntingdon-valley.html` and `blog-customized-facial.html`

**blog-dehydrated-vs-dry-skin.html**
- Contains: *"hydrating facial near me"* literally in body text — rewrite naturally
- Word count: ~500 words → expand to 900–1,100 words
- Missing: FAQ (excellent FAQ opportunity: "Can oily skin be dehydrated?"), images
- Link update: change `treatments.html` link → `/hydrating-facial-huntingdon-valley.html` (once live)

**blog-skinart-way.html**
- Contains: *"esthetician Huntingdon Valley PA"*, *"skincare studio near me"*, *"luxury facial Philadelphia suburbs"* all as awkward inserted phrases — rewrite throughout
- Word count: ~550 words → expand to 900–1,100 words
- Missing: FAQ, images
- Add: More specific service mentions, link to `/facials-huntingdon-valley.html`

### 🟡 Priority 2 — Improve Content Depth

**blog-chemical-peel-aftercare.html**
- Word count: ~450 words → expand to 900–1,200 words
- Add: Day-by-day recovery guide (Day 1, 2, 3, 4, 5+), specific product categories to use/avoid, FAQ
- Contains: *"chemical peel aftercare"* as a header subtext — acceptable but could be more natural in surrounding prose
- Link update: once live, add link to `/chemical-peels-huntingdon-valley.html`
- This post has the most transactional value — clients who already have an appointment may search for this

**blog-next-facial.html**
- Contains: *"professional facial near me"* — rewrite naturally
- Word count: ~450 words → expand to 800–1,000 words
- Add: Specific timing by skin concern (table format works well here), FAQ, link to skin consultation page
- Excellent organic opportunity for "how often should I get a facial" — a high-volume informational search

### All Posts Need:
- [ ] Author bio at bottom: *"Written by Dina Telesh, Licensed Esthetician and founder of SkinArt Aesthetics in Huntingdon Valley, PA. Dina holds advanced certifications in Face Reality, Circadia, GlyMed+, and Zemits technologies."*
- [ ] Updated date format consistent and visible on page
- [ ] 1–2 relevant images per post with descriptive alt text
- [ ] FAQ section (3–5 Q&As)
- [ ] Link to 1 specific service page + 1 related blog post
- [ ] Booking CTA at the bottom: either inline or the existing "Contact Us" block

---

## PART 9 — 90-DAY IMPLEMENTATION PLAN

### Month 1: Foundation (Weeks 1–4)

**Week 1** — Technical Cleanup
- [ ] Deploy sitemap + robots.txt fixes via git push (you do this in Terminal)
- [ ] Fix "Dermaplaning" spelling on treatments.html and in GlossGenius
- [ ] Add canonical tags to all 14 pages
- [ ] Update GlossGenius About bio (you do this in GlossGenius dashboard — draft below)

**Week 2** — Homepage Rewrite
- [ ] APPROVE homepage draft (Part 5 above)
- [ ] Implement homepage H1, title, meta description, hero copy, and closing location paragraph
- [ ] Add "Learn more →" links on homepage Client Favorites cards (placeholders until service pages live)
- [ ] Deploy via git push

**Week 3** — About + Contact + Treatments Updates
- [ ] Update About page title to include Dina's name
- [ ] Update Treatments page H1 and meta description
- [ ] Update Contact page title and meta description with location
- [ ] Review and tighten Treatments page body copy

**Week 4** — Blog Pass 1 (Fix Awkward Keywords)
- [ ] Rewrite unnatural keyword phrases in all 6 blog posts
- [ ] Add author bio to all 6 posts
- [ ] Add visible last-updated dates
- [ ] Deploy all changes

---

### Month 2: Service Pages (Weeks 5–8)

**Week 5** — Approve and build Customized Facials + Acne Facial pages
- [ ] APPROVE Customized Facials draft (Part 6)
- [ ] Build Acne Facial page (draft in Phase 4 document)
- [ ] Add both to sitemap
- [ ] Deploy

**Week 6** — Build Microneedling + Chemical Peels pages
- [ ] APPROVE Microneedling draft (Part 7)
- [ ] Build Chemical Peels page
- [ ] Add both to sitemap
- [ ] Deploy

**Week 7** — Build BioRePeel + Dermaplaning pages
- [ ] Build BioRePeel page
- [ ] Build Dermaplaning page (with corrected spelling)
- [ ] Add to sitemap
- [ ] Deploy

**Week 8** — Post Care page text conversion
- [ ] Convert postcare.html image cards into full HTML text sections
- [ ] Keep images as visual aids; add full written aftercare instructions below each
- [ ] Deploy

---

### Month 3: Blog, Schema, and Local SEO (Weeks 9–12)

**Week 9** — Build Hydrating Facial + Anti-Aging Facial + Brow Lamination + Lash Lift pages
- [ ] Build remaining 4 service pages
- [ ] Update blog internal links to point to live service pages
- [ ] Deploy

**Week 10** — Blog Pass 2 (Expand All Posts)
- [ ] Expand all 6 blog posts to 900–1,200 words
- [ ] Add FAQ sections to all 6 posts
- [ ] Add images with alt text
- [ ] Update internal links to point to live service pages

**Week 11** — Schema Markup
- [ ] Add LocalBusiness JSON-LD to all pages
- [ ] Add Service schema to each service page
- [ ] Add Article + Person schema to all blog posts
- [ ] Add FAQPage schema to blog FAQs

**Week 12** — Local SEO Audit + GSC Review
- [ ] Submit all new service pages to Google Search Console for indexing
- [ ] Update sitemap with all new page URLs
- [ ] Verify GlossGenius consistency (hours, services, prices)
- [ ] Check NAP consistency: main site, GlossGenius, Yelp (if listed), Bing Places, Facebook
- [ ] Review GSC indexing count — should be climbing toward 24+ pages

---

## PART 10 — INFORMATION CHECKLIST

Before building the remaining 8 service pages, I need answers to the following. Please provide whatever you know — I'll fill in the gaps where I can from what's already on the treatments page.

**Services & Treatments**
- [ ] Which chemical peel products/brands do you use? (e.g., Glymed+, Circadia, VI Peel — VI Peel is already on the menu but what are the others?)
- [ ] What specific device do you use for microneedling? (Brand/model, so I can note it accurately)
- [ ] What is the SWICH™ Dermal Rejuvenation device/brand? (For the service page)
- [ ] Do you use any specific modalities in the Signature Glow or other facials? (e.g., galvanic, LED, high-frequency, ultrasound)
- [ ] Can you describe what "infusion technology" means in the context of the Signature Glow?
- [ ] Do you offer any LED therapy as a standalone or add-on?

**Microneedling Specifics**
- [ ] Is numbing cream provided by you at the appointment, or do clients bring their own?
- [ ] What are the needle depth ranges you work with?
- [ ] Do you require a patch test or consultation visit before a first microneedling session?

**Brow & Lash**
- [ ] What lamination products/brands do you use?
- [ ] What lash lift brand/system? (e.g., Yumi, Elleebana, etc.)
- [ ] How long do brow lamination and lash lift results typically last?
- [ ] What are the specific contraindications for brow lamination and lash lift?

**Photos for Service Pages**
- [ ] Do you have before/after photos I can reference for image alt text suggestions? (I won't publish these without permission — just to describe them accurately)
- [ ] Do you have treatment photos I can use as background for each service page hero?

**Business**
- [ ] Do you have a Yelp listing? If so, what's the URL?
- [ ] Are you listed on Bing Places, Apple Maps, or any beauty directories?
- [ ] Do you have any press mentions, features, or local publication coverage?
- [ ] Are you a member of any professional associations (ASCP, NCEA, etc.)?
- [ ] What is your Google Business Profile URL (the short link you'd use for reviews)?
- [ ] Do you want me to draft a Google Business Profile posting schedule?

**GlossGenius**
The following GlossGenius About bio is ready for your review. You update this directly in your GlossGenius dashboard.

**Draft GlossGenius About Bio:**
> SkinArt Aesthetics is a private boutique skincare studio in Huntingdon Valley, PA, specializing in customized facials, professional chemical peels, microneedling, BioRePeel, dermaplaning, and brow and lash services.
>
> Every treatment is designed around your skin's specific needs — not a fixed protocol. Founded by Dina Telesh, a licensed esthetician with a medical background and advanced certifications in Face Reality, Circadia, GlyMed+, and Zemits technologies, SkinArt Aesthetics offers results-driven skincare in a calm, private, one-on-one setting.
>
> No cookie-cutter facials. No unnecessary upsells. Just professional, personalized skincare with purpose.

*Respond with APPROVE / REVISE / HOLD for this bio.*

---

*End of Phase 1 Deliverable*
*Next phase begins upon your approval of the homepage draft, Customized Facials page, and Microneedling page.*

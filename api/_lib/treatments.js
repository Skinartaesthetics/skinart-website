/* ==========================================================================
   api/_lib/treatments.js — SkinArt treatment catalog (source of truth)

   This is the ONLY list of services the AI Skin Analysis is allowed to
   recommend. It is generated from treatments.html (the live Treatments &
   Pricing page) so the AI can never suggest a service that doesn't actually
   exist on the site.

   If you add, rename, or remove a service on treatments.html, update this
   file to match — the exact `name` strings here are what the AI is told to
   use verbatim, and what the safety checks in api/analyze-skin.js compare
   against.

   `aggressive: true` marks treatments that should never be the FIRST
   (primary) match when the visible skin appears sensitive, red, reactive,
   or barrier-compromised. They can still be mentioned as a secondary
   option, but only with cautious "may be considered after an in-person
   consultation" phrasing — never presented as a confident first pick for
   sensitive-looking skin. Brow/lash services are intentionally excluded —
   they aren't relevant to a skin-condition match.
   ========================================================================== */

export const TREATMENT_CATALOG = [
  {
    name: "The Essential Reset",
    tags: ["general", "first-time", "maintenance"],
    aggressive: false,
    blurb: "A foundational facial — deep cleanse, gentle exfoliation, and balance restoration. Best for first-time clients and general skin maintenance.",
  },
  {
    name: "The Signature Glow",
    tags: ["dullness", "congestion", "pores", "radiance", "texture"],
    aggressive: false,
    blurb: "Cleansing, targeted exfoliation, extractions, hydration, and infusion technology for brighter, smoother skin. Best for dullness, congestion, enlarged pores, and anyone wanting immediate radiance.",
  },
  {
    name: "The Hydrasilk Facial",
    tags: ["hydration", "dryness", "barrier", "sensitivity", "calming"],
    aggressive: false,
    blurb: "A deeply hydrating treatment that strengthens the skin barrier and restores moisture. Best for dry, dehydrated, and sensitized skin.",
  },
  {
    name: "The Clear Skin Detox",
    tags: ["acne", "congestion", "inflammation", "breakouts"],
    aggressive: false,
    blurb: "A corrective acne-focused treatment using professional protocols to reduce congestion and calm inflammation. Best for acne-prone skin, breakouts, and congestion.",
  },
  {
    name: "The Deep Pore Refinement",
    tags: ["pores", "blackheads", "texture", "congestion"],
    aggressive: false,
    blurb: "Deep cleansing, advanced extractions, and pore refinement. Best for enlarged pores, blackheads, and texture concerns.",
  },
  {
    name: "The Oxygen Facial",
    tags: ["dullness", "stress", "sensitivity", "acne", "calming"],
    aggressive: false,
    blurb: "An oxygen-infusion treatment that promotes circulation and calms inflammation. Best for dull, stressed, tired, sensitive, and acne-prone skin.",
  },
  {
    name: "The Timeless Lift",
    tags: ["fine-lines", "firmness", "aging", "elasticity"],
    aggressive: false,
    blurb: "Peptide and collagen-supporting technologies to improve the appearance of firmness and elasticity. Best for fine lines, loss of elasticity, and preventative aging care.",
  },
  {
    name: "The Dermaplanning Facial",
    tags: ["texture", "dullness"],
    aggressive: false,
    blurb: "Professional exfoliation that removes dead skin cells and vellus hair for smooth, bright skin. Best for texture concerns and dullness.",
  },
  {
    name: "BioRePeel® All Season Peel",
    tags: ["texture", "pigmentation", "acne", "congestion"],
    aggressive: true,
    blurb: "A biostimulating treatment that may improve texture, pigmentation, acne, and congestion with minimal downtime. Best for all skin types, year-round.",
  },
  {
    name: "SWiCH™ Dermal Rejuvenation",
    tags: ["aging", "pigmentation", "dullness"],
    aggressive: false,
    blurb: "A gentler alternative to traditional chemical peels that supports natural skin rejuvenation without excessive peeling. Best for aging skin, pigmentation, and dullness.",
  },
  {
    name: "Microneedling",
    tags: ["acne-scarring", "fine-lines", "pores", "texture"],
    aggressive: true,
    blurb: "A collagen-induction treatment that may improve the appearance of acne scarring, fine lines, and pores. Best for acne scarring, fine lines, and skin texture.",
  },
  {
    name: "Glow Renewal Peel",
    tags: ["pigmentation", "tone", "dullness"],
    aggressive: true,
    blurb: "A corrective chemical peel that may help even tone and brighten the appearance of the skin.",
  },
  {
    name: "Brightening Complexion Peel",
    tags: ["pigmentation", "tone"],
    aggressive: true,
    blurb: "A corrective chemical peel focused on the visible appearance of uneven tone and pigmentation.",
  },
  {
    name: "Clear Skin Detox Peel",
    tags: ["acne", "congestion"],
    aggressive: true,
    blurb: "A corrective chemical peel that may help with visible acne-prone congestion.",
  },
  {
    name: "Advanced Corrective Peel",
    tags: ["pigmentation", "texture", "aging"],
    aggressive: true,
    blurb: "An advanced corrective chemical peel for visible pigmentation, texture, and signs of aging.",
  },
  {
    name: "VI Peel",
    tags: ["pigmentation", "texture", "aging"],
    aggressive: true,
    blurb: "A professional corrective peel for visible pigmentation, texture, and signs of aging.",
  },
  {
    name: "Skin Consultation",
    tags: ["consultation", "unclear", "fallback", "general"],
    aggressive: false,
    blurb: "A comprehensive in-person skin analysis with personalized treatment recommendations and home-care guidance — the right starting point any time visible findings are unclear or mixed.",
  },
];

export const TREATMENT_NAMES = TREATMENT_CATALOG.map((t) => t.name);
export const AGGRESSIVE_TREATMENT_NAMES = new Set(
  TREATMENT_CATALOG.filter((t) => t.aggressive).map((t) => t.name)
);

// Safe, non-aggressive defaults used whenever the AI's pick is missing,
// invalid, not on the menu, or needs to be overridden for safety.
export const FALLBACK_PRIMARY = "Skin Consultation";
export const SAFE_HYDRATING_PRIMARY = "The Hydrasilk Facial";
export const SAFE_CALMING_PRIMARY = "The Oxygen Facial";
export const SAFE_GENERAL_PRIMARY = "The Signature Glow";

// Normalizes a treatment name for comparison: lowercases, strips trademark
// symbols (® ™ ©) the AI may drop or mangle, and collapses whitespace. This
// prevents "BioRePeel All Season Peel" (no ®) or "SWiCH Dermal Rejuvenation"
// (no ™) from being wrongly treated as off-menu and triggering an
// unnecessary fallback.
function normalizeForMatch(name) {
  return String(name || "")
    .replace(/[®™©]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function isKnownTreatment(name) {
  if (!name || typeof name !== "string") return false;
  const target = normalizeForMatch(name);
  return TREATMENT_NAMES.some((n) => normalizeForMatch(n) === target);
}

// Returns the catalog's exact-cased name for a given (possibly slightly
// mismatched) name string, or null if it's not a real treatment.
export function exactCatalogName(name) {
  if (!name || typeof name !== "string") return null;
  const target = normalizeForMatch(name);
  const match = TREATMENT_CATALOG.find((t) => normalizeForMatch(t.name) === target);
  return match ? match.name : null;
}

export function isAggressiveTreatment(name) {
  const exact = exactCatalogName(name);
  return exact ? AGGRESSIVE_TREATMENT_NAMES.has(exact) : false;
}

// Plain-text catalog listing fed into the OpenAI prompt so the model only
// ever sees, and can only choose from, real services.
export function catalogForPrompt() {
  return TREATMENT_CATALOG.map(
    (t) => `- ${t.name}${t.aggressive ? " [AGGRESSIVE]" : ""} — ${t.blurb}`
  ).join("\n");
}

/* ==========================================================================
   SkinArt Aesthetics — parallax scroll motion

   Adds a subtle Apple.com-style parallax drift to the site's full-width
   banner photos (.page-hero, .cta-band, .img-banner) as the page scrolls.
   Runs on desktop and mobile alike, and is skipped entirely when the
   visitor has "Reduce Motion" turned on.

   Deliberately does NOT hijack/replace native scrolling (no virtual-scroll
   library, no scroll-jacking) — that tends to fight touch-scroll physics
   and hurt battery/perf on phones, which is also why apple.com itself
   relies on native momentum scrolling on mobile rather than recreating it.
   This only nudges background photos with a translateY while you scroll;
   the page itself always scrolls natively.

   .page-hero / .cta-band: the photo lives on a ::before pseudo-element
   (see css/style.css), which JS can't style directly — so this sets a
   --parallax-offset custom property on the real element instead, and the
   pseudo-element's own `transform: translateY(var(--parallax-offset))`
   picks it up.

   .img-banner img: a real <img>, so its transform is set directly.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  var FACTOR = 0.12; // how strongly the photo drifts relative to scroll
  var MAX_OFFSET = 28; // px — stays within the 15% overscan margin on every target

  var cssVarTargets = [];
  var imgTargets = [];
  var ticking = false;
  var enabled = false;

  function collectTargets() {
    cssVarTargets = Array.prototype.slice.call(
      document.querySelectorAll(".page-hero, .cta-band")
    );
    imgTargets = Array.prototype.slice.call(
      document.querySelectorAll(".img-banner > img")
    );
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function offsetFor(el) {
    var rect = el.getBoundingClientRect();
    var viewportCenter = window.innerHeight / 2;
    var elCenter = rect.top + rect.height / 2;
    return clamp((viewportCenter - elCenter) * FACTOR, -MAX_OFFSET, MAX_OFFSET);
  }

  function update() {
    ticking = false;
    if (!enabled) return;
    cssVarTargets.forEach(function (el) {
      el.style.setProperty("--parallax-offset", offsetFor(el) + "px");
    });
    imgTargets.forEach(function (el) {
      el.style.transform = "translateY(" + offsetFor(el) + "px)";
    });
  }

  function onScroll() {
    if (!enabled || ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function resetTransforms() {
    cssVarTargets.forEach(function (el) { el.style.removeProperty("--parallax-offset"); });
    imgTargets.forEach(function (el) { el.style.transform = ""; });
  }

  function setEnabled(next) {
    if (next === enabled) return;
    enabled = next;
    if (enabled) {
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
    } else {
      window.removeEventListener("scroll", onScroll);
      resetTransforms();
    }
  }

  function evaluate() {
    setEnabled(!reduceMotionQuery.matches);
  }

  document.addEventListener("DOMContentLoaded", function () {
    collectTargets();
    evaluate();
  });

  // Re-check if the visitor toggles Reduce Motion mid-session.
  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener("change", evaluate);
  } else if (reduceMotionQuery.addListener) {
    // Older Safari fallback
    reduceMotionQuery.addListener(evaluate);
  }

  window.addEventListener("resize", function () {
    if (enabled) update();
  });
})();

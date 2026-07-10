// js/reviews.js — Google Reviews rotation
// Fetches from /api/reviews and renders a random selection on each page load.

(function () {
  const container = document.getElementById('google-reviews');
  if (!container) return;

  function stars(n) {
    return '<span class="rev-stars" aria-label="' + n + ' out of 5 stars">' +
      '★'.repeat(n) + '☆'.repeat(5 - n) +
      '</span>';
  }

  function truncate(text, max) {
    if (text.length <= max) return text;
    return text.slice(0, text.lastIndexOf(' ', max)) + '&hellip;';
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function render(data) {
    if (!data.reviews || !data.reviews.length) {
      container.style.display = 'none';
      return;
    }

    // Pick up to 3 reviews at random each load
    const picked = shuffle(data.reviews).slice(0, 3);

    container.innerHTML =
      '<div class="rev-header">' +
        '<svg class="rev-google-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
          '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>' +
          '<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>' +
          '<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>' +
          '<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>' +
        '</svg>' +
        '<div class="rev-summary">' +
          '<strong class="rev-score">' + data.rating + '</strong>' +
          stars(Math.round(data.rating)) +
          '<span class="rev-count">' + data.total + ' reviews</span>' +
        '</div>' +
      '</div>' +
      '<div class="rev-grid">' +
        picked.map(function (r) {
          return '<div class="rev-card">' +
            stars(r.rating) +
            '<p class="rev-text">&ldquo;' + truncate(r.text, 220) + '&rdquo;</p>' +
            '<div class="rev-meta">' +
              (r.photo
                ? '<img class="rev-avatar" src="' + r.photo + '" alt="" loading="lazy" width="32" height="32">'
                : '<div class="rev-avatar rev-avatar--initials">' + r.author.charAt(0) + '</div>') +
              '<div>' +
                '<strong class="rev-author">' + r.author + '</strong>' +
                '<span class="rev-time">' + r.time + '</span>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<a class="rev-cta" href="https://www.google.com/search?q=SkinArt+Aesthetics+Huntingdon+Valley+PA+reviews" ' +
        'target="_blank" rel="noopener">See all reviews on Google</a>';
  }

  fetch('/api/reviews')
    .then(function (r) { return r.json(); })
    .then(render)
    .catch(function () { container.style.display = 'none'; });
})();

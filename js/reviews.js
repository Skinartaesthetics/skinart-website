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

  // Real Google reviews from SkinArt Aesthetics listing
  var FALLBACK = {
    rating: 5.0,
    total: '28',
    reviews: [
      {
        author: 'Anastasiia Ostrovska',
        rating: 5,
        text: 'I\'m incredibly happy with my visit! Dina is a wonderful professional who explains everything clearly, thoroughly, and in an easy-to-understand way. She did an amazing job — very professionally, carefully, and with great attention to detail. You can truly feel her expertise and passion for what she does. I loved everything about my experience! I highly recommend Dina and will definitely be coming back!',
        time: '3 weeks ago',
        photo: null
      },
      {
        author: 'Samina',
        rating: 5,
        text: 'This was my first time going here and from the start, I could already tell that this would be a nice and relaxing experience. The inside of the studio is very clean and calming. She makes sure to understand the products you use, your skincare routine, and the amount of water you drink to let you know if any changes are needed for your skin type. I got an explanation of all the things that were going to get put on my face and what they were going to do. Highly recommend.',
        time: '3 weeks ago',
        photo: null
      },
      {
        author: 'Kristina Pakhomova',
        rating: 5,
        text: 'I absolutely love my experience with Dina! I\'ve had several treatments with her, including facials, chemical peels, and PDRN, and I couldn\'t be happier! My skin looks healthier, smoother, and more radiant, and I genuinely trust her with my face! What makes her special is how much she cares about her clients and the results she delivers. Highly recommend her!!!',
        time: '7 weeks ago',
        photo: null
      },
      {
        author: 'emily gindele',
        rating: 5,
        text: 'I had such a great experience at SkinArt! I got a HydraFacial with dermaplaning, and I absolutely loved it. My skin felt so clean, smooth, and refreshed afterward, and I could immediately see a difference in how bright and glowy my skin looked. I get facials to relax, feel pampered, and look amazing afterwards. And that\'s exactly how I left there. I\'ll definitely be going back and would highly recommend SkinArt to anyone looking to treat themselves and give their skin some love!',
        time: '11 weeks ago',
        photo: null
      },
      {
        author: 'Leanna Wieczorek',
        rating: 5,
        text: 'Dina does such an amazing job! My skin has never looked or felt better.',
        time: '12 weeks ago',
        photo: null
      },
      {
        author: 'Anastasiya Piatsevich',
        rating: 5,
        text: 'I can easily say this was the best facial experience I ever had. Dina took such amazing care of my skin, explained every step of the process, and gave me personalized recommendations based on my skin\'s needs. You can truly tell she is passionate and knowledgeable about what she does. And the absolute best part — the massage she performed was incredible. So relaxing, calming, and honestly unforgettable. I left feeling refreshed, glowing, and completely taken care of. Highly recommend.',
        time: '24 weeks ago',
        photo: null
      },
      {
        author: 'Anastasia Adeler',
        rating: 5,
        text: 'I don\'t typically write reviews, but this one felt necessary. I received a gift certificate for my birthday, and honestly, what a gift. From the moment I walked in, every detail had been thought through. There was a care and intentionality to everything that made me forget what time it was. I left with my skin genuinely glowing, that luminous quality that doesn\'t wash off, a sweet little goodie bag, and enough positive energy to last well past the appointment. Highly recommend.',
        time: '26 weeks ago',
        photo: null
      },
      {
        author: 'Darya Martynenka',
        rating: 5,
        text: 'Dina is the best at what she does. My skin has never looked this healthy and glowing. She takes the time to explain everything, customizes treatments to your skin needs, and makes you feel so comfortable the entire time. You can truly tell she\'s passionate about what she does. If you want someone who delivers real results and a luxury experience — she\'s the best aesthetician hands down.',
        time: '29 weeks ago',
        photo: null
      }
    ]
  };

  fetch('/api/reviews')
    .then(function (r) { if (!r.ok) throw new Error('API unavailable'); return r.json(); })
    .then(function (data) {
      if (data && data.reviews && data.reviews.length) {
        render(data);
      } else {
        render(FALLBACK);
      }
    })
    .catch(function () { render(FALLBACK); });
})();

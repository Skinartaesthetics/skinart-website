document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: .15 });
      reveals.forEach(function (el) { obs.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in'); });
    }
  }

  // If the page was opened directly at a #anchor (e.g. a footer link to
  // policies.html#privacy-policy), reveal that section immediately instead
  // of waiting for the scroll-triggered observer above — otherwise a section
  // you land on directly can stay invisible (opacity: 0) forever.
  if (window.location.hash) {
    var target = document.getElementById(window.location.hash.slice(1));
    if (target) {
      target.classList.add('in');
      target.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
      setTimeout(function () {
        target.scrollIntoView({ block: 'start' });
      }, 0);
    }
  }
});

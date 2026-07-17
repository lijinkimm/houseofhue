(() => {
  'use strict';

  if (!location.hash) {
    window.addEventListener('load', () => { if (!location.hash) window.scrollTo(0, 0); });
  }

  const specialEl = document.getElementById('special');
  const specialGroup = document.getElementById('special-group');
  const specialWheel = document.getElementById('special-wheel');
  const specialOrbitNodes = [
    { el: document.querySelector('.special-node--center'), baseAngle: -90 },
    { el: document.querySelector('.special-node--right'), baseAngle: 0 },
    { el: document.querySelector('.special-node--bottom'), baseAngle: 90 },
    { el: document.querySelector('.special-node--left'), baseAngle: 180 },
  ];
  const SPECIAL_NODE_RADIUS = 23;
  const seasonVideos = [
    document.getElementById('season-video'),
    document.getElementById('season-video-mobile'),
  ].filter(Boolean);

  // Returns 0..1 scroll progress through a tall section pinned via position:sticky.
  function progress(el) {
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 800;
    const total = rect.height - vh;
    if (total <= 0) return 1;
    const scrolled = -rect.top;
    return Math.min(1, Math.max(0, scrolled / total));
  }

  // ---------- SECTION D — LOCATION venn zoom ----------

  function updateSpecial(dP) {
    const rotation = dP * 1080;

    if (specialWheel) specialWheel.setAttribute('transform', `rotate(${rotation} 400 400)`);

    specialOrbitNodes.forEach(({ el, baseAngle }) => {
      if (!el) return;
      const angleRad = (baseAngle + rotation) * (Math.PI / 180);
      const x = 50 + SPECIAL_NODE_RADIUS * Math.cos(angleRad);
      const y = 50 + SPECIAL_NODE_RADIUS * Math.sin(angleRad);
      el.style.left = x + '%';
      el.style.top = y + '%';
    });
  }

  // ---------- scroll loop ----------

  function update() {
    updateSpecial(progress(specialEl));
  }

  let lastUpdate = 0;
  let pending = null;
  function onScroll() {
    const now = Date.now();
    if (!lastUpdate || now - lastUpdate > 16) {
      lastUpdate = now;
      update();
    } else if (!pending) {
      pending = setTimeout(() => {
        pending = null;
        lastUpdate = Date.now();
        update();
      }, 16);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);
  update();

  // ---------- video autoplay ----------

  const autoplayVideos = [];

  function keepPlaying(video) {
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    autoplayVideos.push(video);
    const tryPlay = () => {
      const p = video.play();
      if (p && p.catch) {
        p.catch(() => setTimeout(() => { if (video.paused) video.play().catch(() => {}); }, 300));
      }
    };
    tryPlay();
    video.addEventListener('loadeddata', tryPlay);
    video.addEventListener('canplay', tryPlay);
  }

  keepPlaying(document.querySelector('.hero-media video'));
  seasonVideos.forEach(keepPlaying);

  // Some mobile browsers (in-app WebViews especially) block autoplay entirely
  // until a user interaction. Keep retrying on interaction until it sticks.
  function retryOnInteraction() {
    autoplayVideos.forEach((video) => { if (video.paused) video.play().catch(() => {}); });
  }
  ['touchstart', 'touchend', 'pointerdown', 'click', 'scroll'].forEach((evt) => {
    window.addEventListener(evt, retryOnInteraction, { passive: true });
  });

  // Belt-and-suspenders: some browsers allow programmatic play a moment after
  // load without any gesture at all. Poll briefly in case the initial attempt
  // raced the video's readiness.
  let autoplayPollCount = 0;
  const autoplayPoll = setInterval(() => {
    autoplayPollCount += 1;
    let stillPaused = false;
    autoplayVideos.forEach((video) => {
      if (video.paused) {
        video.play().catch(() => {});
        stillPaused = true;
      }
    });
    if (!stillPaused || autoplayPollCount > 20) clearInterval(autoplayPoll);
  }, 500);

  // Pause the season video when it's scrolled far out of view (or hidden by
  // the mobile/desktop media query swap), resume when back in range.
  if (seasonVideos.length) {
    setInterval(() => {
      seasonVideos.forEach((video) => {
        const rect = video.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        const visible = rect.top < vh * 0.75 && rect.bottom > vh * 0.25 && rect.height > 10;
        if (visible && video.paused) {
          video.play().catch(() => {});
        } else if (!visible && !video.paused) {
          video.pause();
        }
      });
    }, 300);
  }

  // ---------- newsletter (front-end only placeholder) ----------

  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      if (input && input.value) {
        input.value = '';
        input.placeholder = 'THANK YOU';
      }
    });
  }
})();

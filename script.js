const photoContainer = document.getElementById('photo-container');

const images = ["media/0427B47D-D99E-4A43-9842-DCC152A46125.JPG", "media/IMG-4091.JPG", "media/IMG-4094.JPG", "media/IMG_0028.JPG", "media/IMG_0061 2.JPG", "media/IMG_0072.JPG", "media/IMG_0155.JPG", "media/IMG_0156.JPG", "media/IMG_0157.JPG", "media/IMG_0158.JPG", "media/IMG_0159.JPG", "media/IMG_0160.JPG", "media/IMG_0161.JPG", "media/IMG_0162.JPG", "media/IMG_0164.JPG", "media/IMG_0165.JPG", "media/IMG_0296.JPG", "media/IMG_0340.JPG", "media/IMG_0354.JPG", "media/IMG_0434.JPG", "media/IMG_0852.jpg", "media/IMG_1155.JPG", "media/IMG_1202.JPG", "media/IMG_1458.jpg", "media/IMG_1498.JPG", "media/IMG_1545.JPG", "media/IMG_1549.JPG", "media/IMG_1569.JPG", "media/IMG_1580.JPG", "media/IMG_1587.JPG", "media/IMG_1589.JPG", "media/IMG_1602.JPG", "media/IMG_1614.JPG", "media/IMG_1624.JPG", "media/IMG_1626.JPG", "media/IMG_1877.JPG", "media/IMG_1901.JPG", "media/IMG_2031.JPG", "media/IMG_2076.jpg", "media/IMG_2092.JPG", "media/IMG_2153.JPG", "media/IMG_2155.jpg", "media/IMG_2379.JPG", "media/IMG_2401.jpg", "media/IMG_2483_1.JPG", "media/IMG_2500.JPG", "media/IMG_2509.JPG", "media/IMG_2704.JPG", "media/IMG_2708.JPG", "media/IMG_2788.JPG", "media/IMG_2789.JPG", "media/IMG_2919.JPG", "media/IMG_2920.JPG", "media/IMG_3047.JPG", "media/IMG_3241.JPG", "media/IMG_3246.JPG", "media/IMG_3249.JPG", "media/IMG_3348.JPG", "media/IMG_3846.JPG", "media/IMG_4082.JPG", "media/IMG_4150.JPG", "media/IMG_4197.JPG", "media/IMG_4198.JPG", "media/IMG_4200.JPG", "media/IMG_4233.JPG", "media/IMG_4246.JPG", "media/IMG_4349.jpg", "media/IMG_4352.jpg", "media/IMG_4757 2.JPG", "media/IMG_4786.jpg", "media/IMG_6410.JPG", "media/IMG_6462.jpg", "media/IMG_6503.jpg", "media/IMG_6742.jpg", "media/IMG_6935.JPG", "media/IMG_6936.JPG", "media/IMG_6938.JPG", "media/IMG_6939.JPG", "media/IMG_6940.JPG", "media/IMG_6941.JPG", "media/IMG_7099.jpg", "media/IMG_7103.jpg", "media/IMG_7151.jpg", "media/IMG_7154.jpg", "media/IMG_8022.JPG", "media/IMG_8038.JPG", "media/IMG_8851.jpg", "media/IMG_9192.jpg", "media/IMG_9548.jpg", "media/IMG_9992.JPG", "media/IMG_9993.JPG", "media/IMG_9994.JPG", "media/IMG_9995.JPG", "media/IMG_9997.JPG", "media/IMG_9998.JPG", "media/IMG_9999.JPG", "media/photo.jpg", "media/photo1.jpg", "media/photo2.jpg", "media/photo3.jpg", "media/photo4.jpg", "media/photo5.jpg", "media/photo6.jpg", "media/photo7.jpg", "media/photo8.jpg"];

const MAX_PHOTOS = 8;
const POINTER_THROTTLE_MS = window.matchMedia('(max-width: 899px)').matches ? 120 : 70;
const PRELOAD_BATCH_SIZE = 6;
const PRELOAD_BATCH_DELAY_MS = 200;

// Cache all gallery images once loaded (no eviction — full random pool)
const imageCache = new Map();
const preloadPromises = new Map();

function setCache(src, img) {
  imageCache.set(src, img);
}

function preloadImage(src) {
  const cached = imageCache.get(src);
  if (cached && cached.complete) return Promise.resolve(cached);

  if (preloadPromises.has(src)) return preloadPromises.get(src);

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      setCache(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  }).finally(() => preloadPromises.delete(src));

  preloadPromises.set(src, promise);
  return promise;
}

let allImagesPreloading = false;

function preloadAllGalleryImages() {
  if (allImagesPreloading) return;
  allImagesPreloading = true;
  const order = images.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  // Batch preload in chunks to avoid saturating the network/main thread
  let batchIndex = 0;
  function loadNextBatch() {
    const start = batchIndex * PRELOAD_BATCH_SIZE;
    const end = Math.min(start + PRELOAD_BATCH_SIZE, order.length);
    if (start >= order.length) return;
    for (let i = start; i < end; i++) {
      preloadImage(images[order[i]]).catch(() => {});
    }
    batchIndex++;
    if (end < order.length) {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => setTimeout(loadNextBatch, PRELOAD_BATCH_DELAY_MS));
      } else {
        setTimeout(loadNextBatch, PRELOAD_BATCH_DELAY_MS);
      }
    }
  }
  // Delay initial batch to let page settle
  setTimeout(loadNextBatch, 300);
}

let lastX = 0;
let lastY = 0;
const minDistance = 100;

let lastMoveTime = Date.now();
let lastSpawned = null;
let lastImageIndex = -1;
let idleCleanupTimer = null;

window.isHomeActive = true;

function clearHomePhotos() {
  photoContainer.querySelectorAll('.photo').forEach((el) => el.remove());
  lastSpawned = null;
}

function scheduleIdleCleanup() {
  if (idleCleanupTimer) clearTimeout(idleCleanupTimer);
  idleCleanupTimer = setTimeout(() => {
    if (Date.now() - lastMoveTime < 500) return;
    const photos = photoContainer.querySelectorAll('.photo');
    photos.forEach((img) => {
      if (img !== lastSpawned) {
        img.style.opacity = '0';
        img.style.willChange = 'auto';
        setTimeout(() => { try { img.remove(); } catch(_) {} }, 400);
      }
    });
  }, 500);
}

function enforcePhotoCap() {
  const photos = [...photoContainer.querySelectorAll('.photo')];
  if (photos.length <= MAX_PHOTOS) return;
  const excess = photos.length - MAX_PHOTOS;
  let removed = 0;
  for (const photo of photos) {
    if (removed >= excess) break;
    if (photo !== lastSpawned) {
      photo.remove();
      removed++;
    }
  }
}

function pickImageIndex() {
  let index;
  do {
    index = Math.floor(Math.random() * images.length);
  } while (index === lastImageIndex && images.length > 1);
  return index;
}

function layoutAndShowPhoto(img, x, y) {
  const isMobile = window.innerWidth < 900;
  const baseScale = isMobile ? 0.28 : 0.6;
  const randomFactor = isMobile ? 0.15 : 0.4;
  const targetScale = baseScale + Math.random() * randomFactor;

  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const ratio = nw / nh;

  const maxW = isMobile ? window.innerWidth * 0.95 : window.innerWidth * 0.4;
  const maxH = isMobile ? window.innerHeight * 0.80 : window.innerHeight * 0.6;

  let w = nw * targetScale;
  let h = nh * targetScale;

  if (w > maxW) {
    w = maxW;
    h = w / ratio;
  }
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }

  img.style.width = `${w}px`;
  img.style.height = `${h}px`;
  img.style.maxWidth = 'none';
  img.style.maxHeight = 'none';
  img.style.left = `${x}px`;
  img.style.top = `${y}px`;
  img.style.transform = 'translate(-50%, -50%) scale(0.8)';
  img.style.opacity = '0';
  img.style.willChange = 'transform, opacity';
  img.style.zIndex = String(Date.now());

  photoContainer.appendChild(img);
  lastSpawned = img;
  enforcePhotoCap();

  requestAnimationFrame(() => {
    img.classList.add('visible');
    img.style.transform = 'translate(-50%, -50%) scale(1)';
    img.style.opacity = '1';
    // Release will-change after transition to free GPU memory
    setTimeout(() => { img.style.willChange = 'auto'; }, 600);
  });
}

function spawnPhoto(x, y, force = false) {
  if (!window.isHomeActive) return;

  // Sanitize coordinates (ensure they are finite numbers within safe viewport boundaries)
  x = Number(x);
  y = Number(y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  
  const maxSafeCoordinate = 30000; // safe upper bound for scrolling/viewport dimensions
  if (Math.abs(x) > maxSafeCoordinate || Math.abs(y) > maxSafeCoordinate) return;

  preloadAllGalleryImages();

  const dx = x - lastX;
  const dy = y - lastY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (!force && distance < minDistance) return;

  lastX = x;
  lastY = y;
  lastMoveTime = Date.now();
  scheduleIdleCleanup();

  const index = pickImageIndex();
  lastImageIndex = index;
  const src = images[index];

  preloadImage(src)
    .then(() => {
      if (!window.isHomeActive) return;
      const img = document.createElement('img');
      img.src = src;
      img.classList.add('photo');
      img.decoding = 'async';
      const show = () => layoutAndShowPhoto(img, x, y);
      if (img.complete && img.naturalWidth) show();
      else img.onload = show;
    })
    .catch(() => {});
}

function throttle(fn, ms) {
  let last = 0;
  let timer = null;
  let pending = null;
  return function throttled(...args) {
    const now = Date.now();
    pending = args;
    const run = () => {
      last = Date.now();
      fn(...pending);
      pending = null;
      timer = null;
    };
    if (now - last >= ms) {
      if (timer) clearTimeout(timer);
      run();
    } else if (!timer) {
      timer = setTimeout(run, ms - (now - last));
    }
  };
}

const onPointerMove = throttle((x, y) => {
  spawnPhoto(x, y);
}, POINTER_THROTTLE_MS);

// Desktop: single mousemove for photos + custom cursor position
const isDesktopPointer = !('ontouchstart' in window) &&
  navigator.maxTouchPoints === 0 &&
  window.innerWidth >= 768;

let cursorMouseX = 0;
let cursorMouseY = 0;
window.cursorMouseX = 0;
window.cursorMouseY = 0;

if (isDesktopPointer) {
  document.addEventListener('mousemove', (e) => {
    cursorMouseX = e.clientX;
    cursorMouseY = e.clientY;
    window.cursorMouseX = cursorMouseX;
    window.cursorMouseY = cursorMouseY;
    onPointerMove(e.pageX, e.pageY);
  }, { passive: true });
} else {
  document.addEventListener('mousemove', (e) => {
    onPointerMove(e.pageX, e.pageY);
  }, { passive: true });
}

document.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  lastX = touch.pageX;
  lastY = touch.pageY;
  preloadAllGalleryImages();
  spawnPhoto(touch.pageX, touch.pageY, true);
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  onPointerMove(touch.pageX, touch.pageY);
}, { passive: true });

window.addEventListener('load', () => {
  setTimeout(preloadAllGalleryImages, 1500);
});

function loadAboutPortrait() {
  const portrait = document.querySelector('.about-image img[data-src]');
  if (!portrait || portrait.src) return;
  portrait.src = portrait.dataset.src;
}

/* Background video + SPA */
(() => {
  const v1 = document.getElementById('bg-video-1');
  const v2 = document.getElementById('bg-video-2');
  if (!v1 || !v2) return;

  const videoSources = [
    'media/bg1.mp4',
    'media/bg2.mp4',
    'media/bg3.mp4',
    'media/bg4.mp4',
    'media/bg5.mp4',
    'media/bg6.mp4',
    'media/bg7.mp4',
    'media/bg8.mp4',
    'media/bg9.mp4',
    'media/bg10.mp4'
  ];

  let activeSourceIndex = Math.floor(Math.random() * videoSources.length);
  let activePlayer = v1;
  let standbyPlayer = v2;
  let isSwapping = false;
  let preparingStandby = false;

  function sourceAt(offset) {
    const idx = (activeSourceIndex + offset + videoSources.length) % videoSources.length;
    return videoSources[idx];
  }

  function configurePlayer(player) {
    player.muted = true;
    player.defaultMuted = true;
    player.playsInline = true;
    player.setAttribute('playsinline', '');
    player.setAttribute('webkit-playsinline', '');
    player.setAttribute('muted', '');
  }

  function showPlayer(player) {
    player.classList.add('active');
  }

  function hidePlayer(player) {
    player.classList.remove('active');
  }

  function resetPlayer(player) {
    player.pause();
    player.classList.remove('active');
    try {
      player.currentTime = 0;
    } catch (_) {}
    player.removeAttribute('src');
    player.load();
    delete player.dataset.loadedSrc;
  }

  async function prepareStandby() {
    if (preparingStandby) return;
    preparingStandby = true;
    const nextSrc = sourceAt(1);
    
    hidePlayer(standbyPlayer);
    standbyPlayer.preload = 'auto';
    standbyPlayer.src = nextSrc;
    standbyPlayer.dataset.loadedSrc = nextSrc;
    standbyPlayer.load();
    
    preparingStandby = false;
  }

  async function startPlayback() {
    configurePlayer(v1);
    configurePlayer(v2);

    activePlayer = v1;
    standbyPlayer = v2;

    showPlayer(activePlayer);

    // If the activePlayer already has a src (from HTML), we use it to allow native browser autoplay
    if (!activePlayer.getAttribute('src')) {
      activeSourceIndex = Math.floor(Math.random() * videoSources.length);
      activePlayer.preload = 'auto';
      activePlayer.src = sourceAt(0);
      activePlayer.dataset.loadedSrc = sourceAt(0);
      activePlayer.load();
    } else {
      const currentSrc = activePlayer.getAttribute('src');
      const foundIndex = videoSources.findIndex(src => currentSrc.includes(src));
      activeSourceIndex = foundIndex !== -1 ? foundIndex : 0;
      activePlayer.dataset.loadedSrc = currentSrc;
    }

    try {
      await activePlayer.play();
      await prepareStandby();
    } catch (err) {
      console.warn('Autoplay failed, waiting for user interaction', err);
      
      const startOnInteraction = async () => {
        try {
          // Re-ensure muted (some mobile browsers reset this)
          activePlayer.muted = true;
          activePlayer.setAttribute('muted', '');
          await activePlayer.play();
          await prepareStandby();
          
          document.removeEventListener('click', startOnInteraction);
          document.removeEventListener('touchstart', startOnInteraction);
          document.removeEventListener('touchend', startOnInteraction);
          document.removeEventListener('scroll', startOnInteraction);
        } catch (_) {}
      };
      
      document.addEventListener('click', startOnInteraction);
      document.addEventListener('touchstart', startOnInteraction);
      document.addEventListener('touchend', startOnInteraction);
      document.addEventListener('scroll', startOnInteraction, { once: true });
    }
  }

  async function swapVideo() {
    if (isSwapping) return;
    isSwapping = true;

    try {
      standbyPlayer.muted = true;
      await standbyPlayer.play();

      const outgoing = activePlayer;
      activePlayer = standbyPlayer;
      standbyPlayer = outgoing;
      activeSourceIndex = (activeSourceIndex + 1) % videoSources.length;

      showPlayer(activePlayer);
      resetPlayer(standbyPlayer);
      prepareStandby();

    } catch (err) {
      console.warn('Video swap failed, retrying', err);
      resetPlayer(standbyPlayer);
      activeSourceIndex = (activeSourceIndex + 1) % videoSources.length;
      prepareStandby();
    } finally {
      isSwapping = false;
    }
  }

  function onActiveEnded(e) {
    if (e.target !== activePlayer || isSwapping) return;
    swapVideo();
  }

  // Videos now keep playing across all views — no pause/resume needed

  window.showView = function (viewName) {
    const homeView = document.getElementById('home-view');
    const aboutView = document.getElementById('about-view');
    const aboutBtn = document.getElementById('about-btn');

    if (viewName === 'home') {
      homeView.classList.remove('hidden');
      homeView.classList.add('active');
      aboutView.classList.remove('active');
      aboutView.classList.add('hidden');
      window.isHomeActive = true;
      if (aboutBtn) aboutBtn.classList.remove('active');
    } else if (viewName === 'about') {
      aboutView.classList.remove('hidden');
      aboutView.classList.add('active');
      homeView.classList.remove('active');
      homeView.classList.add('hidden');
      window.isHomeActive = false;
      if (aboutBtn) aboutBtn.classList.add('active');
      clearHomePhotos();
      loadAboutPortrait();
    }
  };

  const aboutBtn = document.getElementById('about-btn');
  if (aboutBtn) {
    aboutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showView(window.isHomeActive ? 'about' : 'home');
    });
  }

  v1.addEventListener('ended', onActiveEnded);
  v2.addEventListener('ended', onActiveEnded);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (activePlayer.paused) {
      activePlayer.muted = true;
      activePlayer.play().catch(() => {});
    }
  });

  startPlayback();
})();

/* Custom cursor — rAF only while pointer recently moved */
(() => {
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
  if (window.innerWidth < 768) return;

  const dot = document.querySelector('.cursor-dot');
  if (!dot) return;

  let dotX = 0;
  let dotY = 0;
  let isHovering = false;
  let rafId = null;
  let lastPointerTime = 0;

  document.addEventListener('mouseover', (e) => {
    const t = e.target;
    if (
      t.tagName === 'A' || t.tagName === 'BUTTON' ||
      t.closest('a') || t.closest('button') ||
      t.closest('[data-cursor-hover]')
    ) {
      isHovering = true;
      dot.classList.add('hovering');
    }
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    const t = e.target;
    if (
      t.tagName === 'A' || t.tagName === 'BUTTON' ||
      t.closest('a') || t.closest('button') ||
      t.closest('[data-cursor-hover]')
    ) {
      isHovering = false;
      dot.classList.remove('hovering');
    }
  }, { passive: true });

  function animate() {
    const mouseX = window.cursorMouseX || 0;
    const mouseY = window.cursorMouseY || 0;
    dotX += (mouseX - dotX) * 0.15;
    dotY += (mouseY - dotY) * 0.15;
    const offset = isHovering ? 24 : 4;
    dot.style.transform = `translate(${dotX - offset}px, ${dotY - offset}px)`;

    if (Date.now() - lastPointerTime > 2000) {
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(animate);
  }

  document.addEventListener('mousemove', () => {
    lastPointerTime = Date.now();
    if (!rafId) rafId = requestAnimationFrame(animate);
  }, { passive: true });
})();

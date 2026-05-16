const photoContainer = document.getElementById('photo-container');

const images = ["media/0427B47D-D99E-4A43-9842-DCC152A46125.JPG", "media/IMG-4091.JPG", "media/IMG-4094.JPG", "media/IMG_0028.JPG", "media/IMG_0061 2.JPG", "media/IMG_0072.JPG", "media/IMG_0155.JPG", "media/IMG_0156.JPG", "media/IMG_0157.JPG", "media/IMG_0158.JPG", "media/IMG_0159.JPG", "media/IMG_0160.JPG", "media/IMG_0161.JPG", "media/IMG_0162.JPG", "media/IMG_0164.JPG", "media/IMG_0165.JPG", "media/IMG_0296.JPG", "media/IMG_0340.JPG", "media/IMG_0354.JPG", "media/IMG_0434.JPG", "media/IMG_0852.jpg", "media/IMG_1155.JPG", "media/IMG_1202.JPG", "media/IMG_1458.jpg", "media/IMG_1498.JPG", "media/IMG_1545.JPG", "media/IMG_1549.JPG", "media/IMG_1569.JPG", "media/IMG_1580.JPG", "media/IMG_1587.JPG", "media/IMG_1589.JPG", "media/IMG_1602.JPG", "media/IMG_1614.JPG", "media/IMG_1624.JPG", "media/IMG_1626.JPG", "media/IMG_1877.JPG", "media/IMG_1901.JPG", "media/IMG_2031.JPG", "media/IMG_2076.jpg", "media/IMG_2092.JPG", "media/IMG_2153.JPG", "media/IMG_2155.jpg", "media/IMG_2379.JPG", "media/IMG_2401.jpg", "media/IMG_2483_1.JPG", "media/IMG_2500.JPG", "media/IMG_2509.JPG", "media/IMG_2704.JPG", "media/IMG_2708.JPG", "media/IMG_2788.JPG", "media/IMG_2789.JPG", "media/IMG_2919.JPG", "media/IMG_2920.JPG", "media/IMG_3047.JPG", "media/IMG_3241.JPG", "media/IMG_3246.JPG", "media/IMG_3249.JPG", "media/IMG_3348.JPG", "media/IMG_3846.JPG", "media/IMG_4082.JPG", "media/IMG_4150.JPG", "media/IMG_4197.JPG", "media/IMG_4198.JPG", "media/IMG_4200.JPG", "media/IMG_4233.JPG", "media/IMG_4246.JPG", "media/IMG_4349.jpg", "media/IMG_4352.jpg", "media/IMG_4757 2.JPG", "media/IMG_4786.jpg", "media/IMG_6410.JPG", "media/IMG_6462.jpg", "media/IMG_6503.jpg", "media/IMG_6742.jpg", "media/IMG_6935.JPG", "media/IMG_6936.JPG", "media/IMG_6938.JPG", "media/IMG_6939.JPG", "media/IMG_6940.JPG", "media/IMG_6941.JPG", "media/IMG_7099.jpg", "media/IMG_7103.jpg", "media/IMG_7151.jpg", "media/IMG_7154.jpg", "media/IMG_8022.JPG", "media/IMG_8038.JPG", "media/IMG_8851.jpg", "media/IMG_9192.jpg", "media/IMG_9548.jpg", "media/IMG_9992.JPG", "media/IMG_9993.JPG", "media/IMG_9994.JPG", "media/IMG_9995.JPG", "media/IMG_9997.JPG", "media/IMG_9998.JPG", "media/IMG_9999.JPG", "media/photo.jpg", "media/photo1.jpg", "media/photo2.jpg", "media/photo3.jpg", "media/photo4.jpg", "media/photo5.jpg", "media/photo6.jpg", "media/photo7.jpg", "media/photo8.jpg"];

const CACHE_MAX = 16;
const WARM_COUNT = 5;
const MAX_PHOTOS = 10;
const POINTER_THROTTLE_MS = window.matchMedia('(max-width: 899px)').matches ? 80 : 50;
// LRU image cache — avoids loading all 105 images on first visit
const imageCache = new Map();

function touchCache(src) {
  if (imageCache.has(src)) {
    const entry = imageCache.get(src);
    imageCache.delete(src);
    imageCache.set(src, entry);
    return entry;
  }
  return null;
}

function setCache(src, img) {
  if (imageCache.has(src)) imageCache.delete(src);
  imageCache.set(src, img);
  while (imageCache.size > CACHE_MAX) {
    const oldest = imageCache.keys().next().value;
    imageCache.delete(oldest);
  }
}

function preloadImage(src) {
  const existing = touchCache(src);
  if (existing) {
    if (existing.complete) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(existing), { once: true });
      existing.addEventListener('error', reject, { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      setCache(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

function warmRandomImages(count) {
  const indices = new Set();
  while (indices.size < Math.min(count, images.length)) {
    indices.add(Math.floor(Math.random() * images.length));
  }
  indices.forEach((i) => preloadImage(images[i]).catch(() => {}));
}

function getCachedIndices() {
  const indices = [];
  images.forEach((src, i) => {
    const entry = imageCache.get(src);
    if (entry && entry.complete) indices.push(i);
  });
  return indices;
}

let cacheWarmed = false;

function warmCacheOnInteraction() {
  if (cacheWarmed) return;
  cacheWarmed = true;
  warmRandomImages(WARM_COUNT);
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
    photoContainer.querySelectorAll('.photo').forEach((img) => {
      if (img !== lastSpawned) {
        img.style.opacity = '0';
        setTimeout(() => img.remove(), 400);
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
  const cached = getCachedIndices();
  const pool = cached.length > 0 ? cached : null;
  let index;
  let attempts = 0;
  do {
    if (pool && Math.random() < 0.7) {
      index = pool[Math.floor(Math.random() * pool.length)];
    } else {
      index = Math.floor(Math.random() * images.length);
    }
    attempts++;
  } while (index === lastImageIndex && images.length > 1 && attempts < 8);
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
  img.style.zIndex = String(Date.now());

  photoContainer.appendChild(img);
  lastSpawned = img;
  enforcePhotoCap();

  requestAnimationFrame(() => {
    img.classList.add('visible');
    img.style.transform = 'translate(-50%, -50%) scale(1)';
    img.style.opacity = '1';
  });
}

function spawnPhoto(x, y, force = false) {
  if (!window.isHomeActive) return;

  warmCacheOnInteraction();

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
  warmCacheOnInteraction();
  spawnPhoto(touch.pageX, touch.pageY, true);
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  onPointerMove(touch.pageX, touch.pageY);
}, { passive: true });

function loadAboutPortrait() {
  const portrait = document.querySelector('.about-image img[data-src]');
  if (!portrait || portrait.src) return;
  portrait.src = portrait.dataset.src;
}

/* Background video + SPA */
(() => {
  const v1Check = document.getElementById('bg-video-1');
  if (!v1Check) return;

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

  let currentVideoIndex = Math.floor(Math.random() * videoSources.length);

  function getNextSource() {
    currentVideoIndex = (currentVideoIndex + 1) % videoSources.length;
    return videoSources[currentVideoIndex];
  }

  const v1 = document.getElementById('bg-video-1');
  const v2 = document.getElementById('bg-video-2');
  let activePlayer = v1;
  let nextPlayer = v2;

  function pauseVideos() {
    v1.pause();
    v2.pause();
    nextPlayer.removeAttribute('src');
    nextPlayer.load();
  }

  function resumeVideos() {
    activePlayer.play().then(() => {
      makeVisible(activePlayer);
      prepareNextVideo();
    }).catch(() => {});
  }

  function makeVisible(player) {
    player.classList.add('active');
    player.style.zIndex = '1';
  }

  function prepareNextVideo() {
    if (!window.isHomeActive) return;
    const nextSrc = getNextSource();
    nextPlayer.src = nextSrc;
    nextPlayer.load();
    nextPlayer.style.zIndex = '0';
    nextPlayer.classList.remove('active');
  }

  function swapVideo() {
    if (!window.isHomeActive) return;
    nextPlayer.play().then(() => {
      nextPlayer.classList.add('active');
      nextPlayer.style.zIndex = '1';
      activePlayer.classList.remove('active');
      activePlayer.style.zIndex = '0';
      const temp = activePlayer;
      activePlayer = nextPlayer;
      nextPlayer = temp;
      prepareNextVideo();
    }).catch(() => {
      setTimeout(swapVideo, 500);
    });
  }

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
      if (!activePlayer.src) {
        activePlayer.src = videoSources[currentVideoIndex];
        activePlayer.load();
      }
      resumeVideos();
    } else if (viewName === 'about') {
      aboutView.classList.remove('hidden');
      aboutView.classList.add('active');
      homeView.classList.remove('active');
      homeView.classList.add('hidden');
      window.isHomeActive = false;
      if (aboutBtn) aboutBtn.classList.add('active');
      clearHomePhotos();
      pauseVideos();
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

  activePlayer.src = videoSources[currentVideoIndex];
  activePlayer.muted = true;
  activePlayer.defaultMuted = true;
  activePlayer.playsInline = true;
  activePlayer.setAttribute('playsinline', '');
  activePlayer.setAttribute('muted', '');
  activePlayer.load();

  const playPromise = activePlayer.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      makeVisible(activePlayer);
      prepareNextVideo();
    }).catch(() => {
      const startOnInteraction = () => {
        activePlayer.muted = true;
        activePlayer.play().then(() => {
          makeVisible(activePlayer);
          prepareNextVideo();
        });
        document.removeEventListener('click', startOnInteraction);
        document.removeEventListener('touchstart', startOnInteraction);
      };
      document.addEventListener('click', startOnInteraction);
      document.addEventListener('touchstart', startOnInteraction);
    });
  }

  v1.addEventListener('ended', () => {
    if (activePlayer === v1) swapVideo();
  });
  v2.addEventListener('ended', () => {
    if (activePlayer === v2) swapVideo();
  });

  const handleError = (e) => {
    if (activePlayer === v1 || activePlayer === v2) {
      console.warn('Error in active player (buffering or network):', e);
    }
  };
  v1.addEventListener('error', handleError);
  v2.addEventListener('error', handleError);
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

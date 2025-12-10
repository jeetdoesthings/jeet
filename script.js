const photoContainer = document.getElementById('photo-container');

const images = ["media/0427B47D-D99E-4A43-9842-DCC152A46125.JPG", "media/IMG-4091.JPG", "media/IMG-4094.JPG", "media/IMG_0028.JPG", "media/IMG_0061 2.JPG", "media/IMG_0072.JPG", "media/IMG_0155.JPG", "media/IMG_0156.JPG", "media/IMG_0157.JPG", "media/IMG_0158.JPG", "media/IMG_0159.JPG", "media/IMG_0160.JPG", "media/IMG_0161.JPG", "media/IMG_0162.JPG", "media/IMG_0164.JPG", "media/IMG_0165.JPG", "media/IMG_0296.JPG", "media/IMG_0340.JPG", "media/IMG_0354.JPG", "media/IMG_0434.JPG", "media/IMG_0852.jpg", "media/IMG_1155.JPG", "media/IMG_1202.JPG", "media/IMG_1458.jpg", "media/IMG_1498.JPG", "media/IMG_1545.JPG", "media/IMG_1549.JPG", "media/IMG_1569.JPG", "media/IMG_1580.JPG", "media/IMG_1587.JPG", "media/IMG_1589.JPG", "media/IMG_1602.JPG", "media/IMG_1614.JPG", "media/IMG_1624.JPG", "media/IMG_1626.JPG", "media/IMG_1877.JPG", "media/IMG_1901.JPG", "media/IMG_2031.JPG", "media/IMG_2076.jpg", "media/IMG_2092.JPG", "media/IMG_2153.JPG", "media/IMG_2155.jpg", "media/IMG_2379.JPG", "media/IMG_2401.jpg", "media/IMG_2483_1.JPG", "media/IMG_2500.JPG", "media/IMG_2509.JPG", "media/IMG_2704.JPG", "media/IMG_2708.JPG", "media/IMG_2788.JPG", "media/IMG_2789.JPG", "media/IMG_2919.JPG", "media/IMG_2920.JPG", "media/IMG_3047.JPG", "media/IMG_3241.JPG", "media/IMG_3246.JPG", "media/IMG_3249.JPG", "media/IMG_3348.JPG", "media/IMG_3846.JPG", "media/IMG_4082.JPG", "media/IMG_4150.JPG", "media/IMG_4197.JPG", "media/IMG_4198.JPG", "media/IMG_4200.JPG", "media/IMG_4233.JPG", "media/IMG_4246.JPG", "media/IMG_4349.jpg", "media/IMG_4352.jpg", "media/IMG_4757 2.JPG", "media/IMG_4786.jpg", "media/IMG_6410.JPG", "media/IMG_6462.jpg", "media/IMG_6503.jpg", "media/IMG_6742.jpg", "media/IMG_6935.JPG", "media/IMG_6936.JPG", "media/IMG_6938.JPG", "media/IMG_6939.JPG", "media/IMG_6940.JPG", "media/IMG_6941.JPG", "media/IMG_7099.jpg", "media/IMG_7103.jpg", "media/IMG_7151.jpg", "media/IMG_7154.jpg", "media/IMG_8022.JPG", "media/IMG_8038.JPG", "media/IMG_8851.jpg", "media/IMG_9192.jpg", "media/IMG_9548.jpg", "media/IMG_9992.JPG", "media/IMG_9993.JPG", "media/IMG_9994.JPG", "media/IMG_9995.JPG", "media/IMG_9997.JPG", "media/IMG_9998.JPG", "media/IMG_9999.JPG", "media/photo.jpg", "media/photo1.jpg", "media/photo2.jpg", "media/photo3.jpg", "media/photo4.jpg", "media/photo5.jpg", "media/photo6.jpg", "media/photo7.jpg", "media/photo8.jpg"];



let lastX = 0;
let lastY = 0;
const minDistance = 100;

let lastMoveTime = Date.now();
let lastSpawned = null;
let lastImageIndex = -1; // track which image was used last

// Preload all images to prevent lag on GitHub Pages
images.forEach(src => {
  const img = new Image();
  img.src = src;
});

// Core spawn logic extracted
function spawnPhoto(x, y, force = false) {
  if (!window.isHomeActive) return;

  const dx = x - lastX;
  const dy = y - lastY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (!force && distance < minDistance) return;

  lastX = x;
  lastY = y;
  lastMoveTime = Date.now();

  // pick a random index that's not the same as the last one
  let index;
  do {
    index = Math.floor(Math.random() * images.length);
  } while (index === lastImageIndex && images.length > 1);
  lastImageIndex = index;

  const img = document.createElement('img');
  img.src = images[index];
  img.classList.add('photo');

  img.onload = () => {
    const isMobile = window.innerWidth < 900;
    // Increased sizes as requested
    const baseScale = isMobile ? 1.0 : 0.6;
    const randomFactor = isMobile ? 0.3 : 0.4;
    const targetScale = baseScale + Math.random() * randomFactor;

    // Calculate natural dimensions
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const ratio = nw / nh;

    // Define constraints
    const maxW = isMobile ? window.innerWidth * 0.95 : window.innerWidth * 0.4;
    const maxH = isMobile ? window.innerHeight * 0.80 : window.innerHeight * 0.6;

    // Calculate desired dimensions based on scale
    let w = nw * targetScale;
    let h = nh * targetScale;

    // Constrain width
    if (w > maxW) {
      w = maxW;
      h = w / ratio;
    }

    // Constrain height (check again to ensure we don't exceed height after width adjust)
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }

    // Apply final dimensions
    img.style.width = `${w}px`;
    img.style.height = `${h}px`;
    // Explicitly override any CSS max constraints to prevent conflicts,
    // since we already calculated safe bounds.
    img.style.maxWidth = 'none';
    img.style.maxHeight = 'none';

    img.style.left = `${x}px`;
    img.style.top = `${y}px`;

    // Initial state for transition
    img.style.transform = `translate(-50%, -50%) scale(0.8)`;
    img.style.opacity = '0';
    img.style.zIndex = Date.now();

    photoContainer.appendChild(img);
    lastSpawned = img;

    // Trigger reflow to enable transition
    requestAnimationFrame(() => {
      img.classList.add('visible');
      img.style.transform = `translate(-50%, -50%) scale(1)`;
      img.style.opacity = '1';
    });
  };
};

// Mouse Interaction
document.addEventListener('mousemove', (e) => {
  spawnPhoto(e.pageX, e.pageY);
});

// Touch Interaction (Mobile)
document.addEventListener('touchstart', (e) => {
  // Spawn immediately on touch start
  const touch = e.touches[0];
  lastX = touch.pageX; // Reset position to avoid jump
  lastY = touch.pageY;
  spawnPhoto(touch.pageX, touch.pageY, true); // Force spawn
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  spawnPhoto(touch.pageX, touch.pageY);
}, { passive: true });


setInterval(() => {
  const now = Date.now();
  if (now - lastMoveTime > 500) {
    const photos = document.querySelectorAll('.photo');
    photos.forEach((img) => {
      if (img !== lastSpawned) {
        img.style.opacity = '0';
        setTimeout(() => img.remove(), 400); // reduced removal time
      }
    });
  }
}, 200);

/* Background video playback helpers: try autoplay and show a play overlay if blocked */

(() => {
  // Use bg-video-1 as the primary check, or just check the container
  const v1Check = document.getElementById('bg-video-1');
  if (!v1Check) return;

  /* SPA Logic */
  window.showView = function (viewName) {
    const homeView = document.getElementById('home-view');
    const aboutView = document.getElementById('about-view');

    if (viewName === 'home') {
      homeView.classList.remove('hidden');
      homeView.classList.add('active');
      aboutView.classList.remove('active');
      aboutView.classList.add('hidden');
      window.isHomeActive = true;
    } else if (viewName === 'about') {
      aboutView.classList.remove('hidden');
      aboutView.classList.add('active');
      homeView.classList.remove('active');
      homeView.classList.add('hidden');
      window.isHomeActive = false;
    }
  };

  window.isHomeActive = true;

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

  // Random start index
  let currentVideoIndex = Math.floor(Math.random() * videoSources.length);

  function getNextSource() {
    currentVideoIndex = (currentVideoIndex + 1) % videoSources.length;
    return videoSources[currentVideoIndex];
  }

  const v1 = document.getElementById('bg-video-1');
  const v2 = document.getElementById('bg-video-2');
  let activePlayer = v1;
  let nextPlayer = v2;

  // Helper to make video visible only when playing
  function makeVisible(player) {
    player.classList.add('active'); // opacity 1
    player.style.zIndex = '1';
  }

  // Initialize
  // Set the ACTIVE player to the random start video immediately
  // Note: We use the current index for the start, then increment for next.
  activePlayer.src = videoSources[currentVideoIndex];

  // PARANOID ANDROID (and iOS): Enforce muted usage for autoplay
  activePlayer.muted = true;
  activePlayer.defaultMuted = true;
  activePlayer.playsInline = true;
  activePlayer.setAttribute('playsinline', ''); // Explicit attribute
  activePlayer.setAttribute('muted', '');

  activePlayer.load(); // Ensure source is latched

  // Try to play active immediately
  const playPromise = activePlayer.play();

  if (playPromise !== undefined) {
    playPromise.then(() => {
      // It played! Make it visible.
      makeVisible(activePlayer);
      prepareNextVideo();
    }).catch(err => {
      console.warn("Autoplay failed, waiting for interaction", err);
      // It failed. Do NOT make visible yet.

      // Silent fallback: start on first touch/click
      const startOnInteraction = () => {
        activePlayer.muted = true; // Ensure muted again
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

  function prepareNextVideo() {
    const nextSrc = getNextSource();
    nextPlayer.src = nextSrc;
    nextPlayer.load(); // Start buffering
    // Ensure it's reset in case of weird state
    nextPlayer.style.zIndex = '0';
    nextPlayer.classList.remove('active');
  }

  function swapVideo() {
    // Start playing the NEXT player
    nextPlayer.play().then(() => {
      // Instant swap (Hard Cut)

      // Make next visible
      nextPlayer.classList.add('active');
      nextPlayer.style.zIndex = '1';

      // Hide current immediately
      activePlayer.classList.remove('active');
      activePlayer.style.zIndex = '0';

      // Swap references
      const temp = activePlayer;
      activePlayer = nextPlayer;
      nextPlayer = temp;

      // Prepare the NEW next video
      prepareNextVideo();

    }).catch(err => {
      console.error("Next video failed to play", err);
      setTimeout(() => swapVideo(), 500);
    });
  }

  // Listen for 'ended' on BOTH players
  v1.addEventListener('ended', () => {
    if (activePlayer === v1) swapVideo();
  });

  v2.addEventListener('ended', () => {
    if (activePlayer === v2) swapVideo();
  });

  // Error handling: if active player errors, try to swap immediately
  const handleError = () => {
    if (activePlayer === v1 || activePlayer === v2) {
      console.warn("Error in active player, skipping...");
      swapVideo();
    }
  };
  v1.addEventListener('error', handleError);
  v2.addEventListener('error', handleError);

})();

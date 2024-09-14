(function() {
  // Default configuration options
  const defaultOptions = {
    videoSrc: 'cover-bg.mp4',           // Path to the video file
    thumbnailSrc: 'thumbnail.jpg',      // Path to the thumbnail image
    muted: true,                        // Mute the video by default
    autoplay: true,                     // Autoplay the video
    loop: true,                         // Loop the video
    objectFit: 'cover',                 // CSS object-fit property for video and thumbnail
    zIndex: 1,                          // Adjusted z-index to ensure video is over the thumbnail
    transitionDuration: '0.5s',         // Duration for the fade transition
    coverSelector: '.cover.show',       // Selector for the cover page
    maxObserverTime: 10000,             // Maximum time (ms) to wait for cover page detection
    debug: true,                        // Enable debug logging
    titleSelector: '.cover-title',      // Selector for the title to adjust z-index
    titleZIndex: 10,                    // Z-index for the title to appear above the video
  };

  // Logging function based on debug flag
  function log(message, ...args) {
    if (defaultOptions.debug) {
      console.log(`[VideoBackgroundPlugin] ${message}`, ...args);
    }
  }

  /**
   * Applies the video background with a thumbnail placeholder.
   */
  function applyVideoBackground(userOptions = {}) {
    const options = { ...defaultOptions, ...userOptions };
    log('Initializing video background.');

    // Inject CSS for thumbnail and cover positioning
    const overrideStyle = document.createElement('style');
    overrideStyle.innerHTML = `
      ${options.coverSelector} {
        background-image: url('${options.thumbnailSrc}') !important;
        background-color: transparent !important;
        background-repeat: no-repeat !important;
        background-size: cover !important;
        background-position: center !important;
        position: relative !important;
        overflow: hidden; /* Ensures video is contained */
      }
      ${options.titleSelector} {
        z-index: ${options.titleZIndex} !important; /* Ensure title is above the video */
        position: relative; /* Make sure title is on top */
      }
    `;
    document.head.appendChild(overrideStyle);
    log('Injected override CSS for cover page and title.');

    // Create the video element
    const video = document.createElement('video');
    video.src = options.videoSrc;
    video.muted = options.muted;
    video.autoplay = options.autoplay;
    video.loop = options.loop;
    video.style.position = 'absolute';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = options.objectFit;
    video.style.zIndex = options.zIndex;
    video.style.pointerEvents = 'none'; // Ignore interactions
    video.style.opacity = '0'; // Initially hidden
    video.style.transition = `opacity ${options.transitionDuration} ease-in-out`;
    video.playsInline = true; // For mobile devices
    video.preload = 'auto'; // Ensure the video is preloaded

    /**
     * Handles the transition from thumbnail to video.
     */
    function showVideo() {
      log('Video is ready. Transitioning to video background.');
      video.style.opacity = '1'; // Fade in video
      video.play().catch(err => log('Error playing video:', err)); // Ensure video plays
    }

    // Event listener for when the video can play through without buffering
    video.addEventListener('canplaythrough', showVideo);

    // Event listener for video loading errors
    video.addEventListener('error', function(e) {
      console.error('[VideoBackgroundPlugin] Video failed to load:', e);
    });

    /**
     * Inserts the video element into the cover page.
     * @param {HTMLElement} cover - The cover page element.
     */
    function insertVideo(cover) {
      if (cover.querySelector('.video-background-plugin-video')) {
        log('Video element already exists. Skipping insertion.');
        return;
      }

      video.classList.add('video-background-plugin-video');
      cover.appendChild(video);
      log('Video element added to cover page.');
    }

    /**
     * Direct check for cover page in case MutationObserver misses it.
     */
    function checkAndInsertVideo() {
      const cover = document.querySelector(options.coverSelector);
      if (cover) {
        log('Direct check: Cover page found. Applying background.');
        insertVideo(cover);
      }
    }

    /**
     * Uses MutationObserver to detect when the cover page is available in the DOM.
     * Once detected, it inserts the video background.
     */
    const observer = new MutationObserver((mutations, obs) => {
      const cover = document.querySelector(options.coverSelector);
      if (cover) {
        log('Cover page detected. Applying background.');
        insertVideo(cover);
        obs.disconnect(); // Stop observing once done
      }
    });

    // Start observing the DOM for changes
    observer.observe(document.body, { childList: true, subtree: true });
    log('MutationObserver started.');

    // Fallback: Stop observing after maxObserverTime to prevent infinite waiting
    setTimeout(() => {
      if (observer) {
        observer.disconnect();
        log('MutationObserver timeout reached. Cover page not found.');
        checkAndInsertVideo(); // Fallback to direct check
      }
    }, options.maxObserverTime);

    // Fallback: Ensure video shows after 5 seconds even if 'canplaythrough' doesn't fire
    setTimeout(() => {
      if (video.style.opacity === '0') {
        log('Fallback: Showing video after timeout.');
        showVideo();
      }
    }, 5000);
  }

  /**
   * Manages the visibility of the sidebar based on the current page and scroll position.
   */
  function handleSidebarVisibility(userOptions = {}) {
    const options = { ...defaultOptions, ...userOptions };
    const sidebar = document.querySelector('.sidebar');
    const cover = document.querySelector(options.coverSelector);

    if (!sidebar || !cover) {
      log('Sidebar or cover page not found. Skipping sidebar visibility management.');
      return;
    }

    const isCoverPage = window.location.hash === '#/' || window.location.hash === '#';

    if (isCoverPage) {
      if (window.scrollY === 0) {
        sidebar.style.display = 'none';
      } else {
        sidebar.style.display = 'block';
      }
    } else {
      sidebar.style.display = 'block';
    }
  }

  // Debounce utility function to throttle events
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Docsify plugin registration
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = [].concat(function(hook, vm) {
    hook.doneEach(function() {
      log('Page rendered. Applying background and managing sidebar.');
      const userOptions = window.$docsify.coverpageVideo || {};
      applyVideoBackground(userOptions);
      handleSidebarVisibility(userOptions);
    });

    window.addEventListener('hashchange', debounce(function() {
      handleSidebarVisibility(window.$docsify.coverpageVideo || {});
    }, 100));

    window.addEventListener('scroll', debounce(function() {
      handleSidebarVisibility(window.$docsify.coverpageVideo || {});
    }, 100));
  }, window.$docsify.plugins);
})();

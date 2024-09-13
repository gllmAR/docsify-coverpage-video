(function() {
    const defaultOptions = {
      videoSrc: 'cover-bg.mp4',
      muted: true,
      autoplay: true,
      loop: true,
      objectFit: 'cover',
      zIndex: -1,
    };
  
    function applyVideoBackground(userOptions = {}) {
      const options = { ...defaultOptions, ...userOptions };
  
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
      video.style.pointerEvents = 'none'; // Ensure user can interact with coverpage content
  
      // Wait until the cover page is ready
      const checkCoverPage = setInterval(function() {
        const cover = document.querySelector('.cover.show');
        if (cover) {
          cover.style.background = 'none'; // Remove default background
          cover.prepend(video); // Prepend the video element to the cover section
          clearInterval(checkCoverPage); // Stop checking once the video is added
        }
      }, 100); // Check every 100ms until the cover page is available
    }
  
    function handleSidebarVisibility() {
      const sidebar = document.querySelector('.sidebar');
      const cover = document.querySelector('.cover.show');
  
      if (!sidebar || !cover) return;
  
      // Hide sidebar on the cover page
      if (window.location.hash === '#/' || window.location.hash === '#') {
        if (window.scrollY === 0) {
          sidebar.style.display = 'none'; // Hide the sidebar when at the top of the cover page
        } else {
          sidebar.style.display = 'block'; // Show sidebar when scrolled down
        }
      } else {
        sidebar.style.display = 'block'; // Show sidebar when on the main content
      }
    }
  
    // Docsify plugin entry point
    window.$docsify.plugins = [].concat(function(hook, vm) {
      hook.doneEach(function() {
        const userOptions = window.$docsify.coverpageVideo || {};
        applyVideoBackground(userOptions);
        handleSidebarVisibility(); // Handle sidebar visibility after page change
      });
  
      // Listen for hash change events to track page navigation
      window.addEventListener('hashchange', function() {
        handleSidebarVisibility();
      });
  
      // Listen for scroll events to hide sidebar when at the top on the cover page
      window.addEventListener('scroll', function() {
        handleSidebarVisibility();
      });
    }, window.$docsify.plugins);
  })();
  
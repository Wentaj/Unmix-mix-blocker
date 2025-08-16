// Injected script that runs in the page context to intercept navigation
(function() {
  'use strict';

  // Store original methods and track definitive mix clicks only
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  let definiteMixClicks = new Set();

  function isDefinitiveMix(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      const listParam = urlObj.searchParams.get('list');
      
      // Check for definitive mix indicators: RD prefix, RDMM, RDCLAK, etc.
      return listParam && (
        listParam.startsWith('RD') || 
        listParam.startsWith('RDMM') || 
        listParam.startsWith('RDCLAK')
      );
    } catch (e) {
      return false;
    }
  }

  function cleanUrl(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      
      // Only process YouTube watch URLs
      if (urlObj.pathname !== '/watch') {
        return url;
      }

      // Check if it has mix parameters
      if (urlObj.searchParams.has('list') && urlObj.searchParams.has('start_radio')) {
        const videoId = urlObj.searchParams.get('v');
        
        // Only preserve if this video was clicked as a definitive mix
        if (definiteMixClicks.has(videoId)) {
          return url; // Keep mix parameters
        }
        
        // Remove mix parameters for everything else
        if (videoId) {
          return `${urlObj.origin}/watch?v=${videoId}`;
        }
      }

      return url;
    } catch (e) {
      return url;
    }
  }

  // Intercept history API calls
  history.pushState = function(state, title, url) {
    const cleanedUrl = cleanUrl(url);
    return originalPushState.call(this, state, title, cleanedUrl);
  };

  history.replaceState = function(state, title, url) {
    const cleanedUrl = cleanUrl(url);
    return originalReplaceState.call(this, state, title, cleanedUrl);
  };

  // Track only definitive mix clicks
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href*="/watch"]');
    if (link && link.href && isDefinitiveMix(link.href)) {
      try {
        const url = new URL(link.href);
        const videoId = url.searchParams.get('v');
        if (videoId) {
          definiteMixClicks.add(videoId);
          
          // Clean up old entries (keep only last 15)
          if (definiteMixClicks.size > 15) {
            const entries = Array.from(definiteMixClicks);
            definiteMixClicks = new Set(entries.slice(-15));
          }
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    }
  }, true);

  // Intercept window.location changes
  let currentUrl = window.location.href;
  const locationObserver = new MutationObserver(function() {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      
      const url = new URL(window.location.href);
      if (url.pathname === '/watch' && url.searchParams.has('list') && url.searchParams.has('start_radio')) {
        const videoId = url.searchParams.get('v');
        
        // Only preserve if this video was clicked as a definitive mix
        if (!definiteMixClicks.has(videoId)) {
          // This was not a definitive mix click, clean the URL
          if (videoId) {
            const cleanUrl = `${url.origin}/watch?v=${videoId}`;
            if (cleanUrl !== window.location.href) {
              window.history.replaceState(null, '', cleanUrl);
              window.location.reload();
              currentUrl = cleanUrl;
            }
          }
        }
      }
    }
  });

  locationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

})();
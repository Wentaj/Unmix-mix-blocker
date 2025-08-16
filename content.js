// Content script that injects our script into the page
(function() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
})();

// Store only definitive mix clicks (with RD prefix or other mix indicators)
let definiteMixClicks = new Set();
let lastUrl = location.href;

// Track clicks on definitive mix links only
document.addEventListener('click', function(e) {
  const link = e.target.closest('a[href*="/watch"]');
  if (link && link.href) {
    try {
      const url = new URL(link.href);
      const listParam = url.searchParams.get('list');
      
      // Only track clicks that are definitive mixes (RD prefix, RDMM, RDCLAK, etc.)
      if (listParam && (listParam.startsWith('RD') || listParam.startsWith('RDMM') || listParam.startsWith('RDCLAK'))) {
        const videoId = url.searchParams.get('v');
        if (videoId) {
          definiteMixClicks.add(videoId);
          // Clean up old entries (keep only last 10)
          if (definiteMixClicks.size > 10) {
            const entries = Array.from(definiteMixClicks);
            definiteMixClicks = new Set(entries.slice(-10));
          }
        }
      }
    } catch (e) {
      // Ignore invalid URLs
    }
  }
}, true);

function checkUrlChange() {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    handleUrlChange();
  }
}

function handleUrlChange() {
  const url = new URL(location.href);
  
  // Check if this is a watch page with mix parameters
  if (url.pathname === '/watch' && url.searchParams.has('list') && url.searchParams.has('start_radio')) {
    const videoId = url.searchParams.get('v');
    
    // Only preserve if this video was clicked as a definitive mix
    if (!definiteMixClicks.has(videoId)) {
      // This was not a definitive mix click, so remove the mix parameters
      if (videoId) {
        const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
        if (cleanUrl !== location.href) {
          history.replaceState(null, '', cleanUrl);
          location.reload();
        }
      }
    }
  }
}

// Set up observers
new MutationObserver(checkUrlChange).observe(document, { subtree: true, childList: true });
setInterval(checkUrlChange, 1000);

// Handle initial page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handleUrlChange);
} else {
  handleUrlChange();
}
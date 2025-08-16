// Background script to handle web navigation events
// Store only definitive mix navigations
let definiteMixNavigations = new Map();

function isDefinitiveMix(url) {
  try {
    const urlObj = new URL(url);
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

chrome.webNavigation.onBeforeNavigate.addListener(
  function(details) {
    if (details.frameId !== 0) return; // Only handle main frame
    
    const url = new URL(details.url);
    
    // Check if this is a YouTube watch URL with mix parameters
    if (url.hostname.includes('youtube.com') && 
        url.pathname === '/watch' && 
        url.searchParams.has('list') && 
        url.searchParams.has('start_radio')) {
      
      const videoId = url.searchParams.get('v');
      
      // Check if this is a definitive mix
      if (isDefinitiveMix(details.url)) {
        // Store this as a definitive mix navigation
        if (!definiteMixNavigations.has(details.tabId)) {
          definiteMixNavigations.set(details.tabId, new Set());
        }
        definiteMixNavigations.get(details.tabId).add(videoId);
        return; // Allow definitive mixes through
      }
      
      // Check if this video was previously navigated to as a definitive mix
      const tabMixes = definiteMixNavigations.get(details.tabId);
      if (tabMixes && tabMixes.has(videoId)) {
        return; // Allow it to stay as mix
      }
      
      // This is not a definitive mix, redirect to clean URL
      if (videoId) {
        const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
        if (cleanUrl !== details.url) {
          chrome.tabs.update(details.tabId, {
            url: cleanUrl
          });
        }
      }
    }
  },
  {
    url: [
      { hostSuffix: 'youtube.com' },
      { hostSuffix: 'www.youtube.com' }
    ]
  }
);

// Clean up navigation history when tabs are closed
chrome.tabs.onRemoved.addListener(function(tabId) {
  definiteMixNavigations.delete(tabId);
});

// Clean up old entries periodically
setInterval(() => {
  for (const [tabId, videoSet] of definiteMixNavigations.entries()) {
    if (videoSet.size > 10) {
      const videos = Array.from(videoSet);
      definiteMixNavigations.set(tabId, new Set(videos.slice(-10)));
    }
  }
}, 60000); // Clean up every minute
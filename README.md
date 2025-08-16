# Unmix-mix-blocker
Chrome addon that blocks youtube from making every music video a mix without disabling mixes completely

# YouTube UnMix

This Chrome extension prevents YouTube from automatically opening music videos in mixes while not affecting actual mixes

## What it does

- **Blocks automatic mix creation**: When you click on a regular music video, it prevents YouTube from adding mix parameters (`&list=&Smtng&start_radio=1`) to the URL
- **Preserves real mixes**: If you're actually viewing a mix playlist (identified by the "Mix" badge), it leaves the functionality intact
- **Works with navigation**: Handles both direct links and YouTube's single-page app navigation

## Installation

1. Download all the files (`manifest.json`, `content.js`, `injected.js`, `background.js`) to a folder
2. Open Chrome or any chromium browser and go to `chrome://extensions/` in case of different browser it's usually `(BrowserName)://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension will be active immediately

## How it works

The extension uses multiple approaches to ensure comprehensive coverage:

1. **Background script**: Intercepts navigation events before they happen
2. **Content script**: Monitors URL changes and DOM mutations
3. **Injected script**: Intercepts browser APIs and link clicks in the page context
4. **Mix detection**: Looks for the `&list=` and `&start_radio=1`

## Files included

- `manifest.json` - Extension configuration
- `content.js` - Content script that monitors the page
- `injected.js` - Script that runs in page context to intercept navigation
- `background.js` - Service worker for handling navigation events
- `README.md` - This documentation

## Technical details

The extension works by:
1. Detecting when YouTube tries to add mix parameters to video URLs
2. Checking if the page has link to mix
3. If link is not to mix playlist,it removes the mix parameters from the URL
4. Preserving the original video ID so the video still plays normally

This ensures that regular music videos play without being forced into a mix, while actual mix playlists continue to work as expected.

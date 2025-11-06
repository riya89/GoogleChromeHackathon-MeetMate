// Content script for Google Meet - Captures captions from the DOM
console.log("🎯 MeetMate content script loaded on Meet page");

let lastCaptionText = "";
let captionObserver = null;

// Google Meet caption selectors (these may need updating if Meet changes)
const CAPTION_SELECTORS = [
  '[jsname="dsyhDe"]',           
  '.iOzk7',                       
  '.a4cQT',                       
  '[data-unresolved-comms-id]',  
  '.VbkSUe',                      
];

// Find the caption container
function findCaptionContainer() {
  for (const selector of CAPTION_SELECTORS) {
    const element = document.querySelector(selector);
    if (element) {
      console.log("✅ Found caption container:", selector);
      return element;
    }
  }
  console.log("⚠️ Caption container not found. Make sure captions are enabled in Meet.");
  return null;
}

// Extract caption text from element
function extractCaptionText(element) {
  if (!element) return null;

  const text = element.innerText || element.textContent;
  return text ? text.trim() : null;
}

// Send caption to side panel
function sendCaption(captionText) {
  if (!captionText || captionText === lastCaptionText) {
    return; // Skip empty or duplicate captions
  }

  console.log("📝 New caption detected:", captionText);
  lastCaptionText = captionText;

  chrome.runtime.sendMessage({
    action: "newCaption",
    caption: {
      text: captionText,
      timestamp: new Date().toISOString()
    }
  }).catch(err => {
    console.error("Failed to send caption:", err);
  });
}

// Monitor captions using MutationObserver
function startCaptionMonitoring() {
  console.log("👀 Starting caption monitoring...");

  // Find the caption container
  const captionContainer = findCaptionContainer();

  if (!captionContainer) {
    console.log("⏳ Captions not found yet, will retry in 3 seconds...");
    setTimeout(startCaptionMonitoring, 3000);
    return;
  }

  // Set up MutationObserver to watch for caption changes
  captionObserver = new MutationObserver((mutations) => {
    const captionText = extractCaptionText(captionContainer);
    if (captionText) {
      sendCaption(captionText);
    }
  });

  // Start observing
  captionObserver.observe(captionContainer, {
    childList: true,
    subtree: true,
    characterData: true
  });

  console.log("✅ Caption monitoring started!");

  setInterval(() => {
    const captionText = extractCaptionText(captionContainer);
    if (captionText) {
      sendCaption(captionText);
    }
  }, 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startCaptionMonitoring);
} else {
  setTimeout(startCaptionMonitoring, 2000); // Give Meet time to initialize
}

window.addEventListener('beforeunload', () => {
  if (captionObserver) {
    captionObserver.disconnect();
  }
});

console.log("✅ MeetMate content script initialized");

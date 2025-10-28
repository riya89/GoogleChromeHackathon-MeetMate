// MeetMate - AI Meeting Co-Pilot Background Service Worker

// Extension installed event
chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ MeetMate extension installed.");
});

// Detect when user joins a Google Meet
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url?.startsWith("https://meet.google.com/")
  ) {
    console.log("🎥 User joined a Google Meet:", tab.url);

    try {
      // Try to open side panel automatically
      await chrome.sidePanel.setOptions({
        tabId,
        path: "sidepanel/sidepanel.html",
      });
      await chrome.sidePanel.open({ tabId });
      console.log("✅ Side panel opened automatically.");
    } catch (err) {
      console.warn("⚠️ Could not auto-open side panel:", err);

      // Fallback: Inject floating icon if side panel can't open automatically
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: showMeetMateIcon,
        });
      } catch (injectErr) {
        console.error("❌ Icon injection failed:", injectErr);
      }
    }
  }
});

// Function injected into Meet tab to show floating icon
function showMeetMateIcon() {
  if (document.getElementById("meetmate-fab")) return;

  const button = document.createElement("div");
  button.id = "meetmate-fab";
  button.title = "MeetMate — Click to open notes panel";

  Object.assign(button.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "56px",
    height: "56px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "50%",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "26px",
    fontFamily: "sans-serif",
    cursor: "pointer",
    zIndex: 999999,
    transition: "transform 0.2s ease",
  });

  button.textContent = "🧠";

  button.onmouseenter = () => (button.style.transform = "scale(1.1)");
  button.onmouseleave = () => (button.style.transform = "scale(1)");
  button.onclick = () => {
    chrome.runtime.sendMessage({ action: "openSidePanel" });
  };

  document.body.appendChild(button);
}

// Listen for click from floating icon
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "openSidePanel" && sender.tab?.id) {
    chrome.sidePanel.open({ tabId: sender.tab.id });
  }
});

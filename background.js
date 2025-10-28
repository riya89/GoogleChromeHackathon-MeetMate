// chrome.runtime.onInstalled.addListener(({ reason }) => {
//   if (reason === 'install') {
//     chrome.sidePanel
//       .setPanelBehavior({ openPanelOnActionClick: true })
//       .catch((error) => console.error(error));
//   }
// });



// chrome.runtime.onInstalled.addListener(() => {
//   console.log("✅ MeetMate Notes extension installed.");
// });

// chrome.runtime.onInstalled.addListener(() => {
//   console.log("✅ MeetMate Notes extension installed.");
// });

// chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
//   if (
//     changeInfo.status === "complete" &&
//     tab.url?.startsWith("https://meet.google.com/")
//   ) {
//     console.log("🎥 User joined a Google Meet:", tab.url);

//     try {
//       await chrome.sidePanel.setOptions({
//         tabId,
//         path: "sidepanel/sidepanel.html",
//       });
//       await chrome.sidePanel.open({ tabId });
//       console.log("✅ Side panel opened automatically.");
//     } catch (err) {
//       console.warn("⚠️ Could not auto-open side panel:", err);

//       // Inject floating icon if side panel can't open automatically
//       try {
//         await chrome.scripting.executeScript({
//           target: { tabId },
//           func: showMeetMateIcon,
//         });
//       } catch (injectErr) {
//         console.error("Icon injection failed:", injectErr);
//       }
//     }
//   }
// });

// // 🧩 Function runs inside the Meet tab (creates floating icon)
// function showMeetMateIcon() {
//   if (document.getElementById("meetmate-fab")) return;

//   const button = document.createElement("div");
//   button.id = "meetmate-fab";
//   button.title = "MeetMate — Click to open notes panel";

//   Object.assign(button.style, {
//     position: "fixed",
//     bottom: "20px",
//     right: "20px",
//     width: "56px",
//     height: "56px",
//     background: "#1a73e8",
//     borderRadius: "50%",
//     boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     color: "#fff",
//     fontSize: "26px",
//     fontFamily: "sans-serif",
//     cursor: "pointer",
//     zIndex: 999999,
//     transition: "transform 0.2s ease",
//   });

//   button.textContent = "💬";

//   button.onmouseenter = () => (button.style.transform = "scale(1.1)");
//   button.onmouseleave = () => (button.style.transform = "scale(1)");
//   button.onclick = () => {
//     chrome.runtime.sendMessage({ action: "openSidePanel" });
//   };

//   document.body.appendChild(button);
// }

// // Listen for click from floating icon
// chrome.runtime.onMessage.addListener((message, sender) => {
//   if (message.action === "openSidePanel" && sender.tab?.id) {
//     chrome.sidePanel.open({ tabId: sender.tab.id });
//   }
// });
// chrome.runtime.onInstalled.addListener(() => {
//   console.log("✅ MeetMate Notes extension installed.");
// });

// // Function to extract meeting ID from Google Meet URL
// function extractMeetingId(url) {
//   if (!url) return null;
//   const match = url.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
//   return match ? match[1] : null;
// }

// // Store current meeting IDs per tab
// const meetingTabs = new Map(); // tabId -> meetingId

// chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
//   if (
//     changeInfo.status === "complete" &&
//     tab.url?.startsWith("https://meet.google.com/")
//   ) {
//     const meetingId = extractMeetingId(tab.url);
    
//     console.log("🎥 User on Google Meet page:", tab.url);
//     console.log("📋 Meeting ID:", meetingId || "No meeting ID detected");

//     // Store meeting ID for this tab
//     if (meetingId) {
//       meetingTabs.set(tabId, meetingId);
//     } else {
//       meetingTabs.delete(tabId);
//     }

//     try {
//       await chrome.sidePanel.setOptions({
//         tabId,
//         path: "sidepanel/sidepanel.html",
//       });
//       await chrome.sidePanel.open({ tabId });
//       console.log("✅ Side panel opened automatically.");
//     } catch (err) {
//       console.warn("⚠️ Could not auto-open side panel:", err);

//       // Inject floating icon if side panel can't open automatically
//       try {
//         await chrome.scripting.executeScript({
//           target: { tabId },
//           func: showMeetMateIcon,
//         });
//       } catch (injectErr) {
//         console.error("Icon injection failed:", injectErr);
//       }
//     }
//   }
// });

// // Clean up when tab is closed
// chrome.tabs.onRemoved.addListener((tabId) => {
//   meetingTabs.delete(tabId);
// });

// // 🧩 Function runs inside the Meet tab (creates floating icon)
// function showMeetMateIcon() {
//   if (document.getElementById("meetmate-fab")) return;

//   const button = document.createElement("div");
//   button.id = "meetmate-fab";
//   button.title = "MeetMate — Click to open notes panel";

//   Object.assign(button.style, {
//     position: "fixed",
//     bottom: "20px",
//     right: "20px",
//     width: "56px",
//     height: "56px",
//     background: "#1a73e8",
//     borderRadius: "50%",
//     boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     color: "#fff",
//     fontSize: "26px",
//     fontFamily: "sans-serif",
//     cursor: "pointer",
//     zIndex: 999999,
//     transition: "transform 0.2s ease",
//   });

//   button.textContent = "💬";

//   button.onmouseenter = () => (button.style.transform = "scale(1.1)");
//   button.onmouseleave = () => (button.style.transform = "scale(1)");
//   button.onclick = () => {
//     chrome.runtime.sendMessage({ action: "openSidePanel" });
//   };

//   document.body.appendChild(button);
// }

// // Listen for click from floating icon
// chrome.runtime.onMessage.addListener((message, sender) => {
//   if (message.action === "openSidePanel" && sender.tab?.id) {
//     chrome.sidePanel.open({ tabId: sender.tab.id });
//   }
// });

// // Listen for side panel queries about current meeting
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "getMeetingId") {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       if (tabs[0]) {
//         const tabId = tabs[0].id;
//         const storedMeetingId = meetingTabs.get(tabId);
//         const urlMeetingId = extractMeetingId(tabs[0].url);
//         const meetingId = storedMeetingId || urlMeetingId;
        
//         // Update stored ID if found in URL
//         if (urlMeetingId && !storedMeetingId) {
//           meetingTabs.set(tabId, urlMeetingId);
//         }
        
//         sendResponse({ meetingId: meetingId });
//       } else {
//         sendResponse({ meetingId: null });
//       }
//     });
//     return true; // Keep channel open for async response
//   }
// });
chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ MeetMate Notes extension installed.");
});

// Function to extract meeting ID from Google Meet URL
function extractMeetingId(url) {
  if (!url) return null;
  const match = url.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
  return match ? match[1] : null;
}

// Store current meeting IDs per tab
const meetingTabs = new Map(); // tabId -> meetingId

// Track side panel open/closed state per tab
const sidePanelState = new Map(); // tabId -> boolean

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url?.startsWith("https://meet.google.com/")
  ) {
    const meetingId = extractMeetingId(tab.url);

    console.log("🎥 User on Google Meet page:", tab.url);
    console.log("📋 Meeting ID:", meetingId || "No meeting ID detected");

    // Store meeting ID for this tab
    if (meetingId) {
      meetingTabs.set(tabId, meetingId);
    } else {
      meetingTabs.delete(tabId);
    }

    try {
      await chrome.sidePanel.setOptions({
        tabId,
        path: "sidepanel/sidepanel.html",
      });
      await chrome.sidePanel.open({ tabId });
      sidePanelState.set(tabId, true);
      console.log("✅ Side panel opened automatically.");
    } catch (err) {
      console.warn("⚠️ Could not auto-open side panel:", err);

      // Inject floating icon if side panel can't open automatically
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: showMeetMateIcon,
        });
      } catch (injectErr) {
        console.error("Icon injection failed:", injectErr);
      }
    }
  }
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  meetingTabs.delete(tabId);
  sidePanelState.delete(tabId);
});

// 🧩 Function runs inside the Meet tab (creates floating icon)
function showMeetMateIcon() {
  if (document.getElementById("meetmate-fab")) return;

  const button = document.createElement("div");
  button.id = "meetmate-fab";
  button.title = "MeetMate — Click to toggle notes panel";

  Object.assign(button.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "56px",
    height: "56px",
    background: "#1a73e8",
    borderRadius: "50%",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
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

  button.textContent = "💬";

  button.onmouseenter = () => (button.style.transform = "scale(1.1)");
  button.onmouseleave = () => (button.style.transform = "scale(1)");
  button.onclick = () => {
    chrome.runtime.sendMessage({ action: "openSidePanel" });
  };

  document.body.appendChild(button);
}

// Listen for click from floating icon and toggle side panel
chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === "openSidePanel" && sender.tab?.id != null) {
    const tabId = sender.tab.id;
    const isOpen = sidePanelState.get(tabId) || false;

    if (isOpen) {
      // Close side panel
      try {
        await chrome.sidePanel.close({ tabId });
        sidePanelState.set(tabId, false);
        console.log("📉 Side panel closed via icon");
      } catch (err) {
        console.warn("⚠️ Could not close side panel:", err);
      }
    } else {
      // Open side panel
      try {
        await chrome.sidePanel.open({ tabId });
        sidePanelState.set(tabId, true);
        console.log("✅ Side panel opened via icon");
      } catch (err) {
        console.warn("⚠️ Could not open side panel:", err);
      }
    }
  }
});

// Listen for side panel queries about current meeting
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getMeetingId") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const tabId = tabs[0].id;
        const storedMeetingId = meetingTabs.get(tabId);
        const urlMeetingId = extractMeetingId(tabs[0].url);
        const meetingId = storedMeetingId || urlMeetingId;

        // Update stored ID if found in URL
        if (urlMeetingId && !storedMeetingId) {
          meetingTabs.set(tabId, urlMeetingId);
        }

        sendResponse({ meetingId: meetingId });
      } else {
        sendResponse({ meetingId: null });
      }
    });
    return true; // Keep channel open for async response
  }
});

// Track which tabs have side panel open
// const sidePanelState = {};

// chrome.runtime.onInstalled.addListener(() => {
//   console.log("✅ MeetMate Notes extension installed.");
// });

// chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
//   if (
//     changeInfo.status === "complete" &&
//     tab.url?.startsWith("https://meet.google.com/")
//   ) {
//     console.log("🎥 User joined a Google Meet:", tab.url);

//     try {
//       await chrome.sidePanel.setOptions({
//         tabId,
//         path: "sidepanel/sidepanel.html",
//       });
//       await chrome.sidePanel.open({ tabId });
//       sidePanelState[tabId] = true;
//       console.log("✅ Side panel opened automatically.");
//     } catch (err) {
//       console.warn("⚠️ Could not auto-open side panel:", err);

//       try {
//         await chrome.scripting.executeScript({
//           target: { tabId },
//           func: showMeetMateIcon,
//         });
//       } catch (injectErr) {
//         console.error("Icon injection failed:", injectErr);
//       }
//     }
//   }
// });

// // 🧩 Floating icon in the Meet tab
// function showMeetMateIcon() {
//   if (document.getElementById("meetmate-fab")) return;

//   const button = document.createElement("div");
//   button.id = "meetmate-fab";
//   button.title = "MeetMate — Click to toggle notes panel";

//   Object.assign(button.style, {
//     position: "fixed",
//     bottom: "20px",
//     right: "20px",
//     width: "56px",
//     height: "56px",
//     background: "#1a73e8",
//     borderRadius: "50%",
//     boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     color: "#fff",
//     fontSize: "26px",
//     fontFamily: "sans-serif",
//     cursor: "pointer",
//     zIndex: 999999,
//     transition: "transform 0.2s ease",
//   });

//   button.textContent = "💬";

//   button.onmouseenter = () => (button.style.transform = "scale(1.1)");
//   button.onmouseleave = () => (button.style.transform = "scale(1)");
//   button.onclick = () => {
//     chrome.runtime.sendMessage({ action: "toggleSidePanel" });
//   };

//   document.body.appendChild(button);
// }

// // Listen for click from floating icon
// chrome.runtime.onMessage.addListener(async (message, sender) => {
//   if (!sender.tab?.id) return;
//   const tabId = sender.tab.id;

//   if (message.action === "toggleSidePanel") {
//     if (sidePanelState[tabId]) {
//       await chrome.sidePanel.close({ tabId });
//       sidePanelState[tabId] = false;
//     } else {
//       await chrome.sidePanel.open({ tabId });
//       sidePanelState[tabId] = true;
//     }
//   }
// });

// chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
//   if (changeInfo.status === "complete" && tab.url?.startsWith("https://meet.google.com/")) {
//     console.log("🎥 Meet detected:", tab.url);

//     const meetingId = new URL(tab.url).pathname.replace("/", "") || `meet-${Date.now()}`;
//     chrome.storage.local.get("currentMeeting", (data) => {
//       if (!data.currentMeeting || data.currentMeeting.url !== tab.url) {
//         chrome.storage.local.set({
//           currentMeeting: {
//             id: meetingId,
//             url: tab.url,
//             timestamp: Date.now(),
//             notes: "",
//             actionables: [],
//             screenshots: []
//           }
//         });
//       }
//     });

//     await chrome.sidePanel.setOptions({
//       tabId,
//       path: "sidepanel/sidepanel.html",
//     });

//     try {
//       await chrome.sidePanel.open({ tabId });
//     } catch {
//       await chrome.scripting.executeScript({ target: { tabId }, func: showMeetMateIcon });
//     }
//   }
// });


// chrome.runtime.onInstalled.addListener(() => {
//   chrome.sidePanel.setOptions({ path: "sidepanel/sidepanel.html" });
//   chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
//   console.log("✅ MeetMate Notes ready with side panel.");
// });

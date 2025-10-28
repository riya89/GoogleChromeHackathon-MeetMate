// chrome.runtime.onInstalled.addListener(({ reason }) => {
//   if (reason === 'install') {
//     chrome.sidePanel
//       .setPanelBehavior({ openPanelOnActionClick: true })
//       .catch((error) => console.error(error));
//   }
// });



chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ MeetMate Notes extension installed.");
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ MeetMate Notes extension installed.");
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url?.startsWith("https://meet.google.com/")
  ) {
    console.log("🎥 User joined a Google Meet:", tab.url);

    try {
      await chrome.sidePanel.setOptions({
        tabId,
        path: "sidepanel/sidepanel.html",
      });
      await chrome.sidePanel.open({ tabId });
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

// 🧩 Function runs inside the Meet tab (creates floating icon)
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

// Listen for click from floating icon
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "openSidePanel" && sender.tab?.id) {
    chrome.sidePanel.open({ tabId: sender.tab.id });
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

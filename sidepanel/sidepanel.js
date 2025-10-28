// /* global LanguageModel */

// import DOMPurify from 'dompurify';
// import { marked } from 'marked';

// const inputPrompt = document.body.querySelector('#input-prompt');
// const buttonPrompt = document.body.querySelector('#button-prompt');
// const buttonReset = document.body.querySelector('#button-reset');
// const elementResponse = document.body.querySelector('#response');
// const elementLoading = document.body.querySelector('#loading');
// const elementError = document.body.querySelector('#error');
// const sliderTemperature = document.body.querySelector('#temperature');
// const sliderTopK = document.body.querySelector('#top-k');
// const labelTemperature = document.body.querySelector('#label-temperature');
// const labelTopK = document.body.querySelector('#label-top-k');

// let session;

// async function runPrompt(prompt, params) {
//   try {
//     if (!session) {
//       session = await LanguageModel.create(params);
//     }
//     return session.prompt(prompt);
//   } catch (e) {
//     console.log('Prompt failed');
//     console.error(e);
//     console.log('Prompt:', prompt);
//     // Reset session
//     reset();
//     throw e;
//   }
// }

// async function reset() {
//   if (session) {
//     session.destroy();
//   }
//   session = null;
// }

// async function initDefaults() {
//   const defaults = await LanguageModel.params();
//   console.log('Model default:', defaults);
//   if (!('LanguageModel' in self)) {
//     showResponse('Model not available');
//     return;
//   }
//   sliderTemperature.value = defaults.defaultTemperature;
//   // Pending https://issues.chromium.org/issues/367771112.
//   // sliderTemperature.max = defaults.maxTemperature;
//   if (defaults.defaultTopK > 3) {
//     // limit default topK to 3
//     sliderTopK.value = 3;
//     labelTopK.textContent = 3;
//   } else {
//     sliderTopK.value = defaults.defaultTopK;
//     labelTopK.textContent = defaults.defaultTopK;
//   }
//   sliderTopK.max = defaults.maxTopK;
//   labelTemperature.textContent = defaults.defaultTemperature;
// }

// initDefaults();

// buttonReset.addEventListener('click', () => {
//   hide(elementLoading);
//   hide(elementError);
//   hide(elementResponse);
//   reset();
//   buttonReset.setAttribute('disabled', '');
// });

// sliderTemperature.addEventListener('input', (event) => {
//   labelTemperature.textContent = event.target.value;
//   reset();
// });

// sliderTopK.addEventListener('input', (event) => {
//   labelTopK.textContent = event.target.value;
//   reset();
// });

// inputPrompt.addEventListener('input', () => {
//   if (inputPrompt.value.trim()) {
//     buttonPrompt.removeAttribute('disabled');
//   } else {
//     buttonPrompt.setAttribute('disabled', '');
//   }
// });

// buttonPrompt.addEventListener('click', async () => {
//   const prompt = inputPrompt.value.trim();
//   showLoading();
//   try {
//     const params = {
//       initialPrompts: [
//         { role: 'system', content: 'You are a helpful and friendly assistant.' }
//       ],
//       temperature: sliderTemperature.value,
//       topK: sliderTopK.value
//     };
//     const response = await runPrompt(prompt, params);
//     showResponse(response);
//   } catch (e) {
//     showError(e);
//   }
// });

// function showLoading() {
//   buttonReset.removeAttribute('disabled');
//   hide(elementResponse);
//   hide(elementError);
//   show(elementLoading);
// }

// function showResponse(response) {
//   hide(elementLoading);
//   show(elementResponse);
//   elementResponse.innerHTML = DOMPurify.sanitize(marked.parse(response));
// }

// function showError(error) {
//   show(elementError);
//   hide(elementResponse);
//   hide(elementLoading);
//   elementError.textContent = error;
// }

// function show(element) {
//   element.removeAttribute('hidden');
// }

// function hide(element) {
//   element.setAttribute('hidden', '');
// }
/* global LanguageModel */
/* global LanguageModel */
/* global LanguageModel */

// --- UI References ---
// const currentBtn = document.getElementById('currentBtn');
// const pastBtn = document.getElementById('pastBtn');
// const currentSection = document.getElementById('currentSection');
// const pastSection = document.getElementById('pastSection');
// const notesInput = document.getElementById('notesInput');
// const captureBtn = document.getElementById('captureBtn');
// const screenshotsContainer = document.getElementById('screenshotsContainer');
// const pastMeetingsList = document.getElementById('pastMeetingsList');

// // --- Globals ---
// let currentMeetingId = null;
// let meetingData = { notes: '', screenshots: [] };

// // --- Toggle UI ---
// currentBtn.onclick = () => {
//   currentSection.classList.remove('hidden');
//   pastSection.classList.add('hidden');
//   currentBtn.classList.add('active');
//   pastBtn.classList.remove('active');
// };

// pastBtn.onclick = () => {
//   currentSection.classList.add('hidden');
//   pastSection.classList.remove('hidden');
//   currentBtn.classList.remove('active');
//   pastBtn.classList.add('active');
//   loadPastMeetings();
// };

// // --- Generate Meeting ID ---
// function getMeetingId() {
//   return new URL(location.href).hostname === 'meet.google.com'
//     ? location.href.split('/').pop()
//     : `offline_${Date.now()}`;
// }

// // --- Load Current Meeting ---
// function initCurrentMeeting() {
//   currentMeetingId = getMeetingId();
//   const saved = JSON.parse(localStorage.getItem(currentMeetingId)) || {
//     notes: '',
//     screenshots: [],
//   };
//   meetingData = saved;
//   notesInput.value = saved.notes || '';
//   renderScreenshots();
// }

// // --- Save Meeting to Local Storage ---
// function saveMeeting() {
//   localStorage.setItem(currentMeetingId, JSON.stringify(meetingData));
// }

// // --- Notes Auto Save ---
// notesInput.addEventListener('input', () => {
//   meetingData.notes = notesInput.value;
//   saveMeeting();
// });

// // --- Capture Screenshot + Analyze ---
// captureBtn.onclick = async () => {
//   try {
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     const screenshotUrl = await chrome.tabs.captureVisibleTab();

//     const analysis = await analyzeScreenshot(screenshotUrl);

//     const ss = { url: screenshotUrl, analysis };
//     meetingData.screenshots.push(ss);
//     saveMeeting();
//     renderScreenshots();
//   } catch (err) {
//     console.error('Screenshot capture failed:', err);
//   }
// };

// // --- Analyze Screenshot (Gemini Nano Prompt API) ---
// async function analyzeScreenshot(imageUrl) {
//   if (!('ai' in self && 'languageModel' in ai)) {
//     console.warn('Prompt API not supported.');
//     return '⚠️ Analysis unavailable (Prompt API not supported).';
//   }

//   const model = await ai.languageModel.create();
//   const res = await model.prompt([
//     {
//       role: 'user',
//       content: [
//         { type: 'text', value: 'Analyze this meeting screenshot and summarize key points or action items:' },
//         { type: 'image_url', value: imageUrl },
//       ],
//     },
//   ]);
//   return res || 'No analysis available.';
// }

// // --- Render Screenshots ---
// function renderScreenshots() {
//   screenshotsContainer.innerHTML = '';
//   meetingData.screenshots.forEach((ss, idx) => {
//     const div = document.createElement('div');
//     div.className = 'screenshot-card';
//     div.innerHTML = `
//       <img src="${ss.url}" class="thumbnail" data-index="${idx}" />
//       <p>${ss.analysis}</p>
//     `;
//     screenshotsContainer.appendChild(div);
//   });

//   // Expandable image on click
//   document.querySelectorAll('.thumbnail').forEach(img => {
//     img.onclick = () => {
//       const idx = img.dataset.index;
//       const full = window.open('', '_blank');
//       full.document.write(`<img src="${meetingData.screenshots[idx].url}" style="width:100%;height:auto;">`);
//       full.document.title = "Screenshot Preview";
//     };
//   });
// }

// // --- Load Past Meetings ---
// function loadPastMeetings() {
//   pastMeetingsList.innerHTML = '';
//   Object.keys(localStorage).forEach(key => {
//     const data = JSON.parse(localStorage.getItem(key));
//     if (!data || !data.notes) return;
//     const div = document.createElement('div');
//     div.className = 'meeting-item';
//     div.innerHTML = `
//       <h3>${key}</h3>
//       <p>${data.notes.substring(0, 100)}...</p>
//     `;
//     div.onclick = () => openPastMeetingDetail(key, data);
//     pastMeetingsList.appendChild(div);
//   });
// }

// // --- Open Meeting Details ---
// function openPastMeetingDetail(id, data) {
//   const detail = window.open('', '_blank', 'width=600,height=600,scrollbars=yes');
//   detail.document.write(`<h2>Meeting: ${id}</h2>`);
//   detail.document.write(`<p><strong>Notes:</strong><br>${data.notes}</p>`);
//   detail.document.write('<h3>Screenshots</h3>');
//   data.screenshots.forEach(ss => {
//     detail.document.write(`<img src="${ss.url}" width="100%" /><p>${ss.analysis}</p><hr>`);
//   });
// }

// // --- Init ---
// initCurrentMeeting();

// const status = document.getElementById("status");

// // Feature 1 elements
// const extractBtn = document.getElementById("extractBtn");
// const notesField = document.getElementById("notes");
// const outputDiv = document.getElementById("output");

// // Feature 2 elements
// const captureBtn = document.getElementById("captureBtn");
// const gallery = document.getElementById("gallery");
// const modal = document.getElementById("modal");
// const modalImage = document.getElementById("modalImage");
// const modalAnalysis = document.getElementById("modalAnalysis");
// const closeModal = document.getElementById("closeModal");

// let textSession;
// let imageSession;

// // Store screenshot data
// const screenshots = []; // { dataUri, blob, analysis }

// async function initSessions() {
//   try {
//     textSession = await LanguageModel.create({
//       initialPrompts: [
//         {
//           role: "system",
//           content:
//             "You are a meeting assistant who extracts actionable items and follow-up tasks from meeting notes.",
//         },
//       ],
//     });

//     imageSession = await LanguageModel.create({
//       initialPrompts: [
//         {
//           role: "system",
//           content:
//             "You are a meeting analyst who interprets screenshots and extracts important discussion points and follow-up actions.",
//         },
//       ],
//       expectedInputs: [{ type: "image" }],
//     });

//     status.textContent = "✅ Prompt API ready.";
//   } catch (err) {
//     console.error(err);
//     status.textContent =
//       "❌ Prompt API not supported. Enable chrome://flags → #prompt-api-for-gemini-nano";
//   }
// }

// initSessions();

// // === Feature 1: Extract actionable items ===
// extractBtn.addEventListener("click", async () => {
//   if (!textSession) return (status.textContent = "Session not ready.");

//   const text = notesField.value.trim();
//   if (!text) return (outputDiv.textContent = "Please enter meeting notes.");

//   outputDiv.textContent = "⏳ Extracting actionable items...";
//   try {
//     const result = await textSession.prompt(
//       `Extract actionable tasks and follow-up points from these meeting notes:\n\n${text}`
//     );
//     outputDiv.textContent = result;
//   } catch (err) {
//     console.error(err);
//     outputDiv.textContent = "⚠️ Failed to extract items.";
//   }
// });

// // === Feature 2: Capture Screenshot and Store ===
// captureBtn.addEventListener("click", async () => {
//   if (!imageSession)
//     return (status.textContent = "Image analysis session not ready.");

//   try {
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     const imageUri = await chrome.tabs.captureVisibleTab(tab.windowId, {
//       format: "png",
//     });
//     const res = await fetch(imageUri);
//     const blob = await res.blob();

//     const index = screenshots.length;
//     screenshots.push({ dataUri: imageUri, blob, analysis: null });

//     // Create thumbnail
//     const thumb = document.createElement("img");
//     thumb.src = imageUri;
//     thumb.dataset.index = index;
//     gallery.appendChild(thumb);

//     thumb.addEventListener("click", () => openModal(index));
//   } catch (err) {
//     console.error(err);
//     status.textContent = "❌ Failed to capture screenshot.";
//   }
// });

// // === Modal Handling ===
// async function openModal(index) {
//   const shot = screenshots[index];
//   modal.style.display = "flex";
//   modalImage.src = shot.dataUri;

//   if (shot.analysis) {
//     modalAnalysis.textContent = shot.analysis;
//     return;
//   }

//   modalAnalysis.textContent = "⏳ Analyzing screenshot...";

//   try {
//     const response = await imageSession.prompt([
//       {
//         role: "user",
//         content: [
//           {
//             type: "text",
//             value:
//               "Analyze this meeting screenshot and summarize key discussion points and actionable follow-ups.",
//           },
//           { type: "image", value: shot.blob },
//         ],
//       },
//     ]);

//     shot.analysis = response;
//     modalAnalysis.textContent = response;
//   } catch (err) {
//     console.error(err);
//     modalAnalysis.textContent = "⚠️ Failed to analyze this screenshot.";
//   }
// }

// closeModal.addEventListener("click", () => {
//   modal.style.display = "none";
// });
const status = document.getElementById("status");
const meetingIdDisplay = document.getElementById("meetingIdDisplay");
const waitingMessage = document.getElementById("waitingMessage");
const featuresContainer = document.getElementById("featuresContainer");

// Tab elements
const tabs = document.querySelectorAll(".tab");
const currentTab = document.getElementById("currentTab");
const historyTab = document.getElementById("historyTab");
const pastMeetingsList = document.getElementById("pastMeetingsList");
const emptyState = document.getElementById("emptyState");

// Feature 1 elements
const extractBtn = document.getElementById("extractBtn");
const notesField = document.getElementById("notes");
const outputDiv = document.getElementById("output");
const saveIndicator = document.getElementById("saveIndicator");

// Feature 2 elements
const captureBtn = document.getElementById("captureBtn");
const gallery = document.getElementById("gallery");
const modal = document.getElementById("modal");
const modalImage = document.getElementById("modalImage");
const modalAnalysis = document.getElementById("modalAnalysis");
const closeModal = document.getElementById("closeModal");

let textSession;
let imageSession;
let currentMeetingId = null;
let checkInterval = null;
let saveTimeout = null;
let currentMeetingData = null;

// Storage helper functions
async function saveMeetingData(meetingId, data) {
  const key = `meeting-${meetingId}`;
  await chrome.storage.local.set({ [key]: data });
  console.log("💾 Saved meeting data:", meetingId);
}

async function getMeetingData(meetingId) {
  const key = `meeting-${meetingId}`;
  const result = await chrome.storage.local.get(key);
  return result[key] || null;
}

async function getAllMeetings() {
  const allData = await chrome.storage.local.get(null);
  const meetings = [];
  for (const [key, value] of Object.entries(allData)) {
    if (key.startsWith("meeting-")) {
      meetings.push(value);
    }
  }
  // Sort by start time, most recent first
  return meetings.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
}

// Initialize or update current meeting data
async function initCurrentMeeting(meetingId) {
  let data = await getMeetingData(meetingId);
  
  if (!data) {
    // New meeting
    data = {
      meetingId: meetingId,
      startTime: new Date().toISOString(),
      endTime: null,
      notes: "",
      actionables: "",
      screenshots: []
    };
  }
  
  currentMeetingData = data;
  
  // Load existing notes
  if (data.notes) {
    notesField.value = data.notes;
  }
  
  // Load existing actionables
  if (data.actionables) {
    outputDiv.textContent = data.actionables;
  }
  
  // Load existing screenshots
  if (data.screenshots && data.screenshots.length > 0) {
    gallery.innerHTML = "";
    data.screenshots.forEach((screenshot, index) => {
      const thumb = document.createElement("img");
      thumb.src = screenshot.dataUri;
      thumb.dataset.index = index;
      gallery.appendChild(thumb);
      thumb.addEventListener("click", () => openModalFromHistory(screenshot));
    });
  }
  
  return data;
}

// Save current meeting data
async function saveCurrentMeeting() {
  if (!currentMeetingId || !currentMeetingData) return;
  
  currentMeetingData.notes = notesField.value;
  await saveMeetingData(currentMeetingId, currentMeetingData);
  
  // Show save indicator
  saveIndicator.style.display = "inline-block";
  setTimeout(() => {
    saveIndicator.style.display = "none";
  }, 2000);
}

// Auto-save notes as user types
notesField.addEventListener("input", () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveCurrentMeeting, 1000); // Save 1 second after user stops typing
});

// Check for meeting ID on load and periodically
async function checkMeetingStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "getMeetingId" });
    if (response && response.meetingId) {
      if (currentMeetingId !== response.meetingId) {
        activateMeeting(response.meetingId);
      }
    } else {
      if (currentMeetingId !== null) {
        await endCurrentMeeting();
        showWaitingState();
      }
    }
  } catch (err) {
    console.error("Failed to get meeting ID:", err);
  }
}

// Listen for meeting started message from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "meetingStarted" && message.meetingId) {
    activateMeeting(message.meetingId);
  }
});

async function activateMeeting(meetingId) {
  currentMeetingId = meetingId;
  meetingIdDisplay.innerHTML = `📋 Meeting ID: <strong>${meetingId}</strong>`;
  waitingMessage.style.display = "none";
  featuresContainer.style.display = "block";
  
  // Initialize meeting data
  await initCurrentMeeting(meetingId);
  
  console.log("✅ Meeting activated:", meetingId);
}

async function endCurrentMeeting() {
  if (!currentMeetingId || !currentMeetingData) return;
  
  // Mark meeting as ended
  currentMeetingData.endTime = new Date().toISOString();
  await saveMeetingData(currentMeetingId, currentMeetingData);
  
  console.log("🏁 Meeting ended:", currentMeetingId);
  
  // Clear current meeting data
  currentMeetingData = null;
  notesField.value = "";
  outputDiv.textContent = "";
  gallery.innerHTML = "";
}

function showWaitingState() {
  meetingIdDisplay.textContent = "⏳ No active meeting";
  waitingMessage.style.display = "block";
  featuresContainer.style.display = "none";
  currentMeetingId = null;
}

async function initSessions() {
  try {
    textSession = await LanguageModel.create({
      initialPrompts: [
        {
          role: "system",
          content:
            "You are a meeting assistant who extracts actionable items and follow-up tasks from meeting notes.",
        },
      ],
    });

    imageSession = await LanguageModel.create({
      initialPrompts: [
        {
          role: "system",
          content:
            "You are a meeting analyst who interprets screenshots and extracts important discussion points and follow-up actions.",
        },
      ],
      expectedInputs: [{ type: "image" }],
    });

    status.textContent = "✅ Prompt API ready.";
  } catch (err) {
    console.error(err);
    status.textContent =
      "❌ Prompt API not supported. Enable chrome://flags → #prompt-api-for-gemini-nano";
  }
}

// Tab switching
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const tabName = tab.dataset.tab;
    
    // Update active tab
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    
    // Show corresponding content
    if (tabName === "current") {
      currentTab.classList.add("active");
      historyTab.classList.remove("active");
    } else if (tabName === "history") {
      currentTab.classList.remove("active");
      historyTab.classList.add("active");
      loadPastMeetings();
    }
  });
});

// Load and display past meetings
async function loadPastMeetings() {
  const meetings = await getAllMeetings();
  
  if (meetings.length === 0) {
    pastMeetingsList.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }
  
  emptyState.style.display = "none";
  pastMeetingsList.innerHTML = "";
  
  meetings.forEach(meeting => {
    const card = createMeetingCard(meeting);
    pastMeetingsList.appendChild(card);
  });
}

function createMeetingCard(meeting) {
  const card = document.createElement("div");
  card.className = "meeting-card";
  
  const startDate = new Date(meeting.startTime);
  const dateStr = startDate.toLocaleDateString();
  const timeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const duration = meeting.endTime 
    ? Math.round((new Date(meeting.endTime) - new Date(meeting.startTime)) / 60000)
    : "Ongoing";
  
  card.innerHTML = `
    <div class="meeting-card-header">
      <span class="meeting-id-badge">${meeting.meetingId}</span>
      <span class="meeting-time">${dateStr} at ${timeStr}</span>
    </div>
    <div class="meeting-stats">
      <span>⏱️ ${duration !== "Ongoing" ? duration + " min" : duration}</span>
      <span>📝 ${meeting.notes ? "Has notes" : "No notes"}</span>
      <span>📸 ${meeting.screenshots.length} screenshots</span>
    </div>
    <div class="meeting-details">
      ${meeting.notes ? `
        <div class="detail-section">
          <h4>📝 Notes</h4>
          <div class="detail-content">${meeting.notes}</div>
        </div>
      ` : ''}
      
      ${meeting.actionables ? `
        <div class="detail-section">
          <h4>✅ Actionables</h4>
          <div class="detail-content">${meeting.actionables}</div>
        </div>
      ` : ''}
      
      ${meeting.screenshots.length > 0 ? `
        <div class="detail-section">
          <h4>📸 Screenshots (${meeting.screenshots.length})</h4>
          <div>
            ${meeting.screenshots.map((ss, idx) => 
              `<img src="${ss.dataUri}" class="screenshot-thumb" data-index="${idx}">`
            ).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  // Toggle details on click
  card.addEventListener("click", (e) => {
    if (e.target.classList.contains("screenshot-thumb")) {
      const index = parseInt(e.target.dataset.index);
      openModalFromHistory(meeting.screenshots[index]);
      return;
    }
    
    const details = card.querySelector(".meeting-details");
    details.classList.toggle("expanded");
  });
  
  return card;
}

// Initialize on load
checkMeetingStatus();
initSessions();

// Check meeting status every 2 seconds to detect changes
checkInterval = setInterval(checkMeetingStatus, 2000);

// Also check when window gains focus (side panel opened/expanded)
window.addEventListener('focus', () => {
  console.log("🔍 Side panel focused, checking meeting status...");
  checkMeetingStatus();
});

// Check when page becomes visible
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log("👁️ Side panel visible, checking meeting status...");
    checkMeetingStatus();
  }
});

// === Feature 1: Extract actionable items ===
extractBtn.addEventListener("click", async () => {
  if (!currentMeetingId) {
    outputDiv.textContent = "⚠️ No active meeting. Please join a meeting first.";
    return;
  }

  if (!textSession) {
    status.textContent = "Session not ready.";
    return;
  }

  const text = notesField.value.trim();
  if (!text) {
    outputDiv.textContent = "Please enter meeting notes.";
    return;
  }

  outputDiv.textContent = "⏳ Extracting actionable items...";
  try {
    const result = await textSession.prompt(
      `Extract actionable tasks and follow-up points from these meeting notes:\n\n${text}`
    );
    outputDiv.textContent = result;
    
    // Save actionables
    currentMeetingData.actionables = result;
    await saveCurrentMeeting();
    
    console.log("📝 Extracted items for meeting:", currentMeetingId);
  } catch (err) {
    console.error(err);
    outputDiv.textContent = "⚠️ Failed to extract items.";
  }
});

// === Feature 2: Capture Screenshot and Store ===
captureBtn.addEventListener("click", async () => {
  if (!currentMeetingId) {
    status.textContent = "⚠️ No active meeting. Please join a meeting first.";
    return;
  }

  if (!imageSession) {
    status.textContent = "Image analysis session not ready.";
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const imageUri = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "png",
    });
    const res = await fetch(imageUri);
    const blob = await res.blob();

    // Create thumbnail
    const thumb = document.createElement("img");
    thumb.src = imageUri;
    gallery.appendChild(thumb);

    // Store screenshot data
    const screenshotData = {
      dataUri: imageUri,
      timestamp: new Date().toISOString(),
      analysis: null
    };
    
    currentMeetingData.screenshots.push(screenshotData);
    await saveCurrentMeeting();

    const index = currentMeetingData.screenshots.length - 1;
    thumb.dataset.index = index;
    thumb.addEventListener("click", () => openModal(index));

    console.log("📸 Screenshot captured for meeting:", currentMeetingId);
    status.textContent = "✅ Screenshot captured and saved!";
  } catch (err) {
    console.error(err);
    status.textContent = "❌ Failed to capture screenshot.";
  }
});

// === Modal Handling ===
async function openModal(index) {
  if (!currentMeetingData) return;
  
  const shot = currentMeetingData.screenshots[index];
  modal.style.display = "flex";
  modalImage.src = shot.dataUri;

  if (shot.analysis) {
    modalAnalysis.textContent = shot.analysis;
    return;
  }

  modalAnalysis.textContent = "⏳ Analyzing screenshot...";

  try {
    // Convert dataUri to blob for analysis
    const res = await fetch(shot.dataUri);
    const blob = await res.blob();
    
    const response = await imageSession.prompt([
      {
        role: "user",
        content: [
          {
            type: "text",
            value:
              "Analyze this meeting screenshot and summarize key discussion points and actionable follow-ups.",
          },
          { type: "image", value: blob },
        ],
      },
    ]);

    shot.analysis = response;
    modalAnalysis.textContent = response;

    // Save analysis
    await saveCurrentMeeting();
    
    console.log("🔍 Analysis completed for meeting:", currentMeetingId);
  } catch (err) {
    console.error(err);
    modalAnalysis.textContent = "⚠️ Failed to analyze this screenshot.";
  }
}

// Open modal from history (past meetings)
function openModalFromHistory(screenshot) {
  modal.style.display = "flex";
  modalImage.src = screenshot.dataUri;
  modalAnalysis.textContent = screenshot.analysis || "No analysis available";
}

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

// Cleanup interval on unload
window.addEventListener('unload', () => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
});
// const status = document.getElementById("status");

// // === FEATURE 1 ===
// // Actionable items extraction from meeting notes
// const extractBtn = document.getElementById("extractBtn");
// const notesField = document.getElementById("notes");
// const outputDiv = document.getElementById("output");

// // === FEATURE 2 ===
// // Screenshot-based analyzer
// const captureBtn = document.getElementById("captureBtn");
// const gallery = document.getElementById("gallery");

// let textSession;
// let imageSession;

// // ✅ Initialize both sessions
// async function initSessions() {
//   try {
//     // For text-based actionable extraction
//     textSession = await LanguageModel.create({
//       initialPrompts: [
//         {
//           role: "system",
//           content:
//             "You are a meeting assistant who extracts actionable items and follow-up tasks from meeting notes.",
//         },
//       ],
//     });

//     // For screenshot-based analysis
//     imageSession = await LanguageModel.create({
//       initialPrompts: [
//         {
//           role: "system",
//           content:
//             "You are a skilled meeting analyst who understands information from meeting screenshots and highlights key discussion points or next actions.",
//         },
//       ],
//       expectedInputs: [{ type: "image" }],
//     });

//     status.textContent = "✅ Prompt API ready.";
//   } catch (err) {
//     console.error(err);
//     status.textContent =
//       "❌ Prompt API not supported. Enable chrome://flags → #prompt-api-for-gemini-nano";
//   }
// }

// initSessions();


// // === FEATURE 1: Text Extraction ===
// extractBtn.addEventListener("click", async () => {
//   if (!textSession) {
//     status.textContent = "Session not ready.";
//     return;
//   }

//   const text = notesField.value.trim();
//   if (!text) {
//     outputDiv.textContent = "Please enter meeting notes.";
//     return;
//   }

//   outputDiv.textContent = "⏳ Extracting actionable items...";

//   try {
//     const result = await textSession.prompt(
//       `Extract actionable tasks and follow-up points from these meeting notes:\n\n${text}`
//     );
//     outputDiv.textContent = result;
//   } catch (err) {
//     console.error("Error:", err);
//     outputDiv.textContent = "⚠️ Failed to extract items.";
//   }
// });


// // === FEATURE 2: Screenshot Analyzer ===
// captureBtn.addEventListener("click", async () => {
//   if (!imageSession) {
//     status.textContent = "Image analysis session not ready.";
//     return;
//   }

//   try {
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     const imageUri = await chrome.tabs.captureVisibleTab(tab.windowId, {
//       format: "png",
//     });

//     // Convert dataURL to Blob
//     const res = await fetch(imageUri);
//     const blob = await res.blob();

//     // Show thumbnail in gallery
//     const thumb = document.createElement("img");
//     thumb.src = imageUri;
//     thumb.style.width = "160px";
//     thumb.style.margin = "6px";
//     thumb.style.borderRadius = "8px";
//     gallery.appendChild(thumb);

//     // Analyze the screenshot
//     const resultDiv = document.createElement("div");
//     resultDiv.textContent = "Analyzing screenshot...";
//     gallery.appendChild(resultDiv);

//     const response = await imageSession.prompt(
//       [
//         {
//           role: "user",
//           content: [
//             {
//               type: "text",
//               value:
//                 "Analyze this meeting screenshot and summarize the key discussion points and action items.",
//             },
//             { type: "image", value: blob },
//           ],
//         },
//       ]
//     );

//     resultDiv.textContent = "🧾 " + response;
//   } catch (err) {
//     console.error(err);
//     status.textContent = "❌ Failed to capture or analyze screenshot.";
//   }
// });

// import DOMPurify from 'dompurify';
// import { marked } from 'marked';

// // UI references
// const status = document.getElementById("status");
// const notesField = document.getElementById("notes");
// const extractBtn = document.getElementById("extract");
// const outputDiv = document.getElementById("output");

// let session = null;

// // ---- API handling ----
// async function checkSupport() {
//   if (!('LanguageModel' in self)) {
//     status.textContent = "❌ Prompt API not supported. Enable via chrome://flags → #prompt-api-for-gemini-nano";
//     return false;
//   }
//   status.textContent = "✅ Prompt API supported!";
//   return true;
// }

// async function getSession() {
//   if (!session) {
//     session = await LanguageModel.create({
//       initialPrompts: [
//         { role: 'system', content: 'You extract action items and follow-up tasks from meeting notes.' }
//       ],
//       temperature: 0.7,
//       topK: 3
//     });
//   }
//   return session;
// }

// async function runPrompt(promptText) {
//   try {
//     const sess = await getSession();
//     return await sess.prompt(promptText);
//   } catch (err) {
//     console.error("Prompt failed:", err);
//     if (session) {
//       session.destroy();
//       session = null;
//     }
//     throw err;
//   }
// }

// // ---- Main logic ----
// extractBtn.addEventListener("click", async () => {
//   const supported = await checkSupport();
//   if (!supported) return;

//   const text = notesField.value.trim();
//   if (!text) {
//     outputDiv.textContent = "Please enter meeting notes first!";
//     return;
//   }

//   outputDiv.textContent = "⏳ Analyzing notes...";
//   try {
//     const prompt = `Extract clear, actionable items and follow-up tasks from the following meeting notes:\n\n${text}`;
//     const response = await runPrompt(prompt);

//     // sanitize + render markdown
//     const safeHTML = DOMPurify.sanitize(marked.parse(response));
//     outputDiv.innerHTML = safeHTML;
//   } catch (err) {
//     outputDiv.textContent = "⚠️ Error using Prompt API. Check console.";
//   }
// });

// checkSupport();


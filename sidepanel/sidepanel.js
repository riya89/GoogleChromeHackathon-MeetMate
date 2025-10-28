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

const status = document.getElementById("status");

// Feature 1 elements
const extractBtn = document.getElementById("extractBtn");
const notesField = document.getElementById("notes");
const outputDiv = document.getElementById("output");

// Feature 2 elements
const captureBtn = document.getElementById("captureBtn");
const gallery = document.getElementById("gallery");
const modal = document.getElementById("modal");
const modalImage = document.getElementById("modalImage");
const modalAnalysis = document.getElementById("modalAnalysis");
const closeModal = document.getElementById("closeModal");

let textSession;
let imageSession;

// Store screenshot data
const screenshots = []; // { dataUri, blob, analysis }

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

initSessions();

// === Feature 1: Extract actionable items ===
extractBtn.addEventListener("click", async () => {
  if (!textSession) return (status.textContent = "Session not ready.");

  const text = notesField.value.trim();
  if (!text) return (outputDiv.textContent = "Please enter meeting notes.");

  outputDiv.textContent = "⏳ Extracting actionable items...";
  try {
    const result = await textSession.prompt(
      `Extract actionable tasks and follow-up points from these meeting notes:\n\n${text}`
    );
    outputDiv.textContent = result;
  } catch (err) {
    console.error(err);
    outputDiv.textContent = "⚠️ Failed to extract items.";
  }
});

// === Feature 2: Capture Screenshot and Store ===
captureBtn.addEventListener("click", async () => {
  if (!imageSession)
    return (status.textContent = "Image analysis session not ready.");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const imageUri = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "png",
    });
    const res = await fetch(imageUri);
    const blob = await res.blob();

    const index = screenshots.length;
    screenshots.push({ dataUri: imageUri, blob, analysis: null });

    // Create thumbnail
    const thumb = document.createElement("img");
    thumb.src = imageUri;
    thumb.dataset.index = index;
    gallery.appendChild(thumb);

    thumb.addEventListener("click", () => openModal(index));
  } catch (err) {
    console.error(err);
    status.textContent = "❌ Failed to capture screenshot.";
  }
});

// === Modal Handling ===
async function openModal(index) {
  const shot = screenshots[index];
  modal.style.display = "flex";
  modalImage.src = shot.dataUri;

  if (shot.analysis) {
    modalAnalysis.textContent = shot.analysis;
    return;
  }

  modalAnalysis.textContent = "⏳ Analyzing screenshot...";

  try {
    const response = await imageSession.prompt([
      {
        role: "user",
        content: [
          {
            type: "text",
            value:
              "Analyze this meeting screenshot and summarize key discussion points and actionable follow-ups.",
          },
          { type: "image", value: shot.blob },
        ],
      },
    ]);

    shot.analysis = response;
    modalAnalysis.textContent = response;
  } catch (err) {
    console.error(err);
    modalAnalysis.textContent = "⚠️ Failed to analyze this screenshot.";
  }
}

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
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


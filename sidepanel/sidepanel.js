//last updated - SCREENSHOT FIX
console.log("=== 🚀 MEETMATE LOADING ===");
console.log("Script loaded at:", new Date().toLocaleTimeString());
console.log("Current URL:", window.location.href);

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



// Feature 2 elements
const captureBtn = document.getElementById("captureBtn");
const gallery = document.getElementById("gallery");
const modal = document.getElementById("modal");
const modalImage = document.getElementById("modalImage");
const modalAnalysis = document.getElementById("modalAnalysis");
const closeModal = document.getElementById("closeModal");

// Feature 3 elements (Captions)
const startCaptionBtn = document.getElementById("startCaptionBtn");
const stopCaptionBtn = document.getElementById("stopCaptionBtn");
const translateBtn = document.getElementById("translateBtn");
const captionContainer = document.getElementById("captionContainer");
const captionStatus = document.getElementById("captionStatus");
let captionSimplificationEnabled = true; // 🔧 FIXED: Added missing variable

// Caption control elements - UPDATED
const simplifyToggle = document.getElementById("simplifyToggle");
const translateToggle = document.getElementById("translateToggle");
const languageSelect = document.getElementById("languageSelect");
const captionModeStatus = document.getElementById("captionModeStatus");

// Feature 4 elements (Summary)
const generateSummaryBtn = document.getElementById("generateSummaryBtn");
const summaryStatus = document.getElementById("summaryStatus");
const summaryOutput = document.getElementById("summaryOutput");

let textSession;
let imageSession;
let rewriterSession;
let translatorSession;
let summarySession;
let currentMeetingId = null;
let currentMeetTabId = null;
let checkInterval = null;
let saveTimeout = null;
let currentMeetingData = null;
let analysisQueue = [];
let isAnalyzing = false;
let isGeneratingSummary = false;

// Caption-related variables - IMPROVED
let isCaptionsEnabled = false;
let lastCaptionText = ""; // Track last caption to avoid duplicates
let simplificationLevel = "medium"; // low, medium, high
let translationEnabled = false;
let selectedLanguage = "en"; // Default: Hindi

// Storage helper functions
async function saveMeetingData(meetingId, data) {
  const key = `meeting-${meetingId}`;
  try {
    await chrome.storage.local.set({ [key]: data });
    console.log("💾 Saved meeting data:", meetingId);
  } catch (err) {
    if (err.message.includes("QUOTA_BYTES")) {
      console.error("Storage quota exceeded!");
      await handleStorageQuotaExceeded();
      await chrome.storage.local.set({ [key]: data });
    } else {
      throw err;
    }
  }
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
  return meetings.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
}

async function deleteMeeting(meetingId) {
  const key = `meeting-${meetingId}`;
  await chrome.storage.local.remove(key);
  console.log("🗑️ Deleted meeting:", meetingId);
}

async function getStorageUsage() {
  const used = await chrome.storage.local.getBytesInUse();
  const quota = chrome.storage.local.QUOTA_BYTES;
  const percentage = ((used / quota) * 100).toFixed(1);
  return { used, quota, percentage };
}

async function handleStorageQuotaExceeded() {
  status.textContent = "⚠️ Storage full! Cleaning up old meetings...";
  
  const meetings = await getAllMeetings();
  
  if (meetings.length > 5) {
    const toDelete = meetings.slice(5);
    for (const meeting of toDelete) {
      await deleteMeeting(meeting.meetingId);
    }
    status.textContent = `✅ Cleaned up ${toDelete.length} old meetings`;
  } else {
    if (meetings.length > 0) {
      const oldest = meetings[meetings.length - 1];
      await deleteMeeting(oldest.meetingId);
      status.textContent = "✅ Deleted oldest meeting to free space";
    }
  }
  
  setTimeout(() => {
    status.textContent = "💡 Tip: Delete old meetings manually to save space";
  }, 3000);
}

// Initialize or update current meeting data
async function initCurrentMeeting(meetingId) {
  let data = await getMeetingData(meetingId);
  
  if (!data) {
    data = {
      meetingId: meetingId,
      startTime: new Date().toISOString(),
      endTime: null,
      notes: "",
      actionables: "",
      screenshots: [],
      captions: [],
      summary: null
    };
  }
  
  currentMeetingData = data;
  
  if (data.notes) {
    notesField.value = data.notes;
  }
  
  if (data.actionables) {
    outputDiv.textContent = data.actionables;
  }
  
  renderScreenshotGrid();
  renderCaptions();
  renderSummary();
  scheduleAutoAnalysis();

  return data;
}

// Render existing summary
function renderSummary() {
  if (!currentMeetingData || !currentMeetingData.summary) {
    summaryOutput.style.display = "none";
    summaryStatus.textContent = "";
    return;
  }

  const summary = currentMeetingData.summary;
  summaryOutput.textContent = summary.content;
  summaryOutput.style.display = "block";
  summaryStatus.textContent = `✅ ${summary.type.charAt(0).toUpperCase() + summary.type.slice(1)} summary (${summary.captionCount} captions)`;
  summaryStatus.style.color = "#34a853";
}

// Render captions
function renderCaptions() {
  captionContainer.innerHTML = "";
  
  if (!currentMeetingData || currentMeetingData.captions.length === 0) {
    return;
  }
  
  currentMeetingData.captions.forEach(caption => {
    const entry = document.createElement("div");
    entry.className = "caption-entry";
    
    const timestamp = document.createElement("div");
    timestamp.className = "caption-timestamp";
    timestamp.textContent = new Date(caption.timestamp).toLocaleTimeString();
    
    const simplified = document.createElement("div");
    simplified.className = "caption-simplified";
    simplified.textContent = caption.simplified;
    
    entry.appendChild(timestamp);
    
    if (caption.original && caption.original !== caption.simplified) {
      const original = document.createElement("div");
      original.className = "caption-original";
      original.textContent = `Original: ${caption.original}`;
      entry.appendChild(original);
    }
    
    entry.appendChild(simplified);
    captionContainer.appendChild(entry);
  });
  
  captionContainer.scrollTop = captionContainer.scrollHeight;
}
function scheduleAutoAnalysis() {
  if (!currentMeetingData || !currentMeetingData.screenshots) return;
  
  currentMeetingData.screenshots.forEach((screenshot, index) => {
    if (!screenshot.analysis && !analysisQueue.includes(index)) {
      analysisQueue.push(index);
    }
  });
  
  processAnalysisQueue();
}

// Process analysis queue one by one
async function processAnalysisQueue() {
  if (isAnalyzing || analysisQueue.length === 0) return;
  
  isAnalyzing = true;
  
  while (analysisQueue.length > 0) {
    const index = analysisQueue.shift();
    await analyzeScreenshot(index);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  isAnalyzing = false;
}

// Render screenshots in a grid with summaries
function renderScreenshotGrid() {
  gallery.innerHTML = "";
  
  if (!currentMeetingData || currentMeetingData.screenshots.length === 0) {
    return;
  }
  
  currentMeetingData.screenshots.forEach((screenshot, index) => {
    const container = document.createElement("div");
    container.className = "screenshot-grid-item";
    
    const imgContainer = document.createElement("div");
    imgContainer.style.cssText = "flex-shrink: 0; width: 200px;";
    
    const thumb = document.createElement("img");
    thumb.src = screenshot.dataUri;
    thumb.dataset.index = index;
    thumb.addEventListener("click", () => openModal(index));
    
    imgContainer.appendChild(thumb);
    
    const analysisContainer = document.createElement("div");
    analysisContainer.style.cssText = "flex: 1; display: flex; flex-direction: column;";
    
    const timestamp = document.createElement("div");
    timestamp.style.cssText = "font-size: 11px; color: #666; margin-bottom: 6px;";
    timestamp.textContent = new Date(screenshot.timestamp).toLocaleString();
    
    const analysisText = document.createElement("div");
    analysisText.className = `analysis-text-${index}`;
    analysisText.style.cssText = "font-size: 13px; line-height: 1.5; color: #333; white-space: pre-wrap;";
    
    if (screenshot.analysis) {
      analysisText.textContent = screenshot.analysis;
    } else if (analysisQueue.includes(index) || isAnalyzing) {
      analysisText.innerHTML = `<span style="color: #1a73e8;">⏳ Analyzing...</span>`;
    } else {
      analysisText.innerHTML = `<span style="color: #999;">⏳ Queued for analysis</span>`;
    }
    
    analysisContainer.appendChild(timestamp);
    analysisContainer.appendChild(analysisText);
    
    container.appendChild(imgContainer);
    container.appendChild(analysisContainer);
    
    gallery.appendChild(container);
  });
}

// 🔧 FIXED: Analyze screenshot using append-then-prompt pattern (correct Chrome AI format)
async function analyzeScreenshot(index) {
  if (!currentMeetingData) {
    console.error("❌ Cannot analyze - missing meeting data");
    return;
  }
  
  const shot = currentMeetingData.screenshots[index];
  if (shot.analysis) {
    console.log("✅ Screenshot already analyzed:", index);
    return;
  }
  
  const analysisElement = document.querySelector(`.analysis-text-${index}`);
  
  console.log(`🔍 [ANALYZE] Starting analysis for screenshot ${index + 1}...`);
  
  if (analysisElement) {
    analysisElement.innerHTML = `<span style="color: #1a73e8;">⏳ Analyzing screenshot ${index + 1}...</span>`;
  }
  
  // Check if image session is ready
  if (!imageSession) {
    console.error("❌ Image session not available");
    if (analysisElement) {
      analysisElement.innerHTML = `<span style="color: #d93025;">⚠️ Image analysis not ready. Please wait for AI to initialize.</span>`;
    }
    return;
  }
  
  try {
    // Convert data URI to Blob/File
    const res = await fetch(shot.dataUri);
    const blob = await res.blob();
    const file = new File([blob], "screenshot.png", { type: "image/png" });
    
    console.log(`📸 [ANALYZE] File created, size: ${file.size} bytes`);
    console.log(`🤖 [ANALYZE] Using append-then-prompt pattern...`);
    
    // 🔧 CORRECT APPROACH: Use append() to add the image, then prompt() for the question
    // This matches the Chrome AI documentation pattern
    await imageSession.append([
      {
        role: "user",
        content: [
          {
            type: "text",
            value: "Here's a meeting screenshot to analyze."
          },
          {
            type: "image",
            value: file
          }
        ]
      }
    ]);
    
    console.log(`✅ [ANALYZE] Image appended to session`);
    
    // Now ask the question
    const response = await imageSession.prompt(
      "Summarize the content of this meeting screenshot. Focus on the main topic and any action items."
    );
    
    console.log(`✅ [ANALYZE] Analysis received for screenshot ${index + 1}`);
    console.log("Response length:", response.length);
    console.log("Response preview:", response.substring(0, 150));
    
    // Check if response makes sense
    if (response.toLowerCase().includes("paste the screenshot") || 
        response.toLowerCase().includes("not yet pasted") ||
        response.toLowerCase().includes("unable to analyze") ||
        response.length < 20) {
      throw new Error("AI did not receive the image properly - response indicates no image was seen");
    }
    
    shot.analysis = response;
    
    if (analysisElement) {
      analysisElement.textContent = response;
      analysisElement.style.color = "#333";
    }
    
    await saveCurrentMeeting();
    console.log(`✅ Analysis completed and saved for screenshot ${index + 1}`);
    
    status.textContent = `✅ Screenshot ${index + 1} analyzed successfully`;
    setTimeout(() => status.textContent = "", 2000);
    
  } catch (err) {
    console.error("❌ Analysis error:", err);
    console.error("Error details:", err.message, err.stack);
    
    if (analysisElement) {
      analysisElement.innerHTML = `<span style="color: #d93025;">⚠️ Analysis failed: ${err.message}<br><small>Multimodal API might not be enabled. Check chrome://flags</small></span>`;
    }
    
    status.textContent = `❌ Failed to analyze screenshot ${index + 1}`;
    
    if (err.message.includes("QUOTA_BYTES")) {
      await handleStorageQuotaExceeded();
    }
  }
}

// Save current meeting data
async function saveCurrentMeeting() {
  if (!currentMeetingId || !currentMeetingData) return;
  
  currentMeetingData.notes = notesField.value;
  await saveMeetingData(currentMeetingId, currentMeetingData);
}

// Auto-save notes
notesField.addEventListener("input", () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveCurrentMeeting, 1000);
});

function enableCaptions() {
  console.log("📝 [CAPTION] Enabling caption capture");

  if (isCaptionsEnabled) {
    console.log("⚠️ [CAPTION] Already enabled");
    return;
  }

  isCaptionsEnabled = true;
  startCaptionBtn.disabled = true;
  stopCaptionBtn.disabled = false;
  simplifyToggle.disabled = false;
  translateToggle.disabled = false;
  languageSelect.disabled = false;
  startCaptionBtn.classList.add("recording");

  updateSimplificationButtonUI(); // Add this line
  updateCaptionModeStatus();

  console.log("✅ [CAPTION] Caption capture enabled");
}

function disableCaptions() {
  console.log("📝 [CAPTION] Disabling caption capture");

  isCaptionsEnabled = false;
  startCaptionBtn.disabled = false;
  stopCaptionBtn.disabled = true;
  simplifyToggle.disabled = true;
  translateToggle.disabled = true;
  languageSelect.disabled = true;
  startCaptionBtn.classList.remove("recording");

  captionStatus.textContent = "Caption capture stopped";

  console.log("✅ [CAPTION] Caption capture disabled");
}

// 🔧 NEW: Toggle simplification
function toggleSimplification() {
  captionSimplificationEnabled = !captionSimplificationEnabled;
  updateSimplificationButtonUI(); // Call the new function
  updateCaptionModeStatus();
}

function updateSimplificationButtonUI() {
  if (captionSimplificationEnabled) {
    simplifyToggle.style.background = "#34a853";
    simplifyToggle.textContent = "✨ Simplifying ON";
  } else {
    simplifyToggle.style.background = "#5f6368";
    simplifyToggle.textContent = "✨ Simplify OFF";
  }
}

// 🔧 NEW: Toggle translation
function toggleTranslation() {
  translationEnabled = !translationEnabled;

  if (translationEnabled) {
    translateToggle.style.background = "#34a853";
    translateToggle.textContent = "🌐 Translating ON";
    console.log("✅ [CAPTION] Translation enabled");
  } else {
    translateToggle.style.background = "#5f6368";
    translateToggle.textContent = "🌐 Translate OFF";
    console.log("⚠️ [CAPTION] Translation disabled");
  }

  updateCaptionModeStatus();
}

// 🔧 NEW: Change translation language
// async function changeLanguage(langCode) {
//   selectedLanguage = langCode;
//   console.log("🌐 [CAPTION] Language changed to:", langCode);

//   // Recreate translator with new language
//   if (translationEnabled) {
//     try {
//       if (typeof Translator !== 'undefined') {
//         translatorSession = await Translator.create({
//           sourceLanguage: 'en',
//           targetLanguage: langCode
//         });
//         console.log("✅ Translator updated for:", langCode);
//         status.textContent = `✅ Translation language changed to ${langCode}`;
//         setTimeout(() => status.textContent = "", 2000);
//       }
//     } catch (err) {
//       console.error("❌ Failed to change language:", err);
//       status.textContent = "⚠️ Failed to change language";
//     }
//   }

//   updateCaptionModeStatus();
// }
async function changeLanguage(langCode) {
  // Fallback to previously selected language or 'en'
  const newLang = langCode || selectedLanguage || 'en';
  selectedLanguage = newLang;
  console.log("🌐 [CAPTION] Language changed to:", selectedLanguage);

  // Only try to recreate translator if translation is enabled and Translator API exists
  if (translationEnabled) {
    try {
      if (typeof Translator !== 'undefined') {
        translatorSession = await Translator.create({
          sourceLanguage: 'en',
          targetLanguage: selectedLanguage
        });
        console.log("✅ Translator updated for:", selectedLanguage);
        status.textContent = `✅ Translation language changed to ${selectedLanguage}`;
        setTimeout(() => status.textContent = "", 2000);
      } else {
        console.warn("⚠️ Translator API not available (Translator undefined)");
        translatorSession = null;
        status.textContent = "⚠️ Translator API not available";
        setTimeout(() => status.textContent = "", 2000);
      }
    } catch (err) {
      console.error("❌ Failed to change language:", err);
      status.textContent = "⚠️ Failed to change language";
      translatorSession = null;
    }
  }

  updateCaptionModeStatus();
}
// 🔧 NEW: Update caption mode status display
function updateCaptionModeStatus() {
  const modes = [];
  
  if (captionSimplificationEnabled) {
    modes.push("✨ Simplified");
  }
  
  if (translationEnabled) {
    const langNames = {
      'hi': 'Hindi',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'pt': 'Portuguese'
    };
    modes.push(`🌐 ${langNames[selectedLanguage] || selectedLanguage}`);
  }

  if (modes.length > 0) {
    captionModeStatus.textContent = `Active: ${modes.join(' + ')}`;
    captionModeStatus.style.color = "#34a853";
  } else {
    captionModeStatus.textContent = "Raw captions only";
    captionModeStatus.style.color = "#666";
  }
}

// 🔧 UPDATED: Process caption with simplification and translation
async function processCaptionFromMeet(captionText) {
  if (!isCaptionsEnabled || !currentMeetingData) {
    console.log("⚠️ [CAPTION] Ignoring caption (disabled or no meeting)");
    return;
  }

  // Avoid duplicates
  if (captionText === lastCaptionText) {
    console.log("⚠️ [CAPTION] Duplicate caption ignored");
    return;
  }
  lastCaptionText = captionText;

  console.log("📝 [CAPTION] Processing caption:", captionText);

  let simplifiedText = captionText;
  let translatedText = null;

  // Step 1: Simplify if enabled
  if (captionSimplificationEnabled && rewriterSession) {
    try {
      console.log("✨ [CAPTION] Simplifying with Rewriter API...");

      // Use Rewriter API for simplification
      simplifiedText = await rewriterSession.rewrite(captionText, {
        context: "Make this meeting caption clearer and more concise while keeping all important information.",
        tone: "more-casual"
      });

      console.log("✅ [CAPTION] Simplified:", simplifiedText);
    } catch (err) {
      console.error("❌ [CAPTION] Simplification failed:", err);
      simplifiedText = captionText;
    }
  }

  // Step 2: Translate if enabled
  // if (translationEnabled && translatorSession) {
  //   try {
  //     console.log("🌐 [CAPTION] Translating to", selectedLanguage, "...");

  //     // Translate the simplified text (or original if not simplified)
  //     translatedText = await translatorSession.translate(simplifiedText);

  //     console.log("✅ [CAPTION] Translated:", translatedText);
  //   } catch (err) {
  //     console.error("❌ [CAPTION] Translation failed:", err);
  //     translatedText = null;
  //   }
  // }
  if (translationEnabled) {
  if (!selectedLanguage) {
    console.warn("🌐 [CAPTION] No target language selected - skipping translation");
    translatedText = null;
  } else if (translatorSession && typeof translatorSession.translate === 'function') {
    try {
      console.log("🌐 [CAPTION] Translating to", selectedLanguage, "...");
      // Prefer explicit target language if API accepts options
      translatedText = await translatorSession.translate(simplifiedText, { targetLanguage: selectedLanguage });
      // If the translator API doesn't accept options, fall back to single-arg call
      if (!translatedText) {
        translatedText = await translatorSession.translate(simplifiedText);
      }
      console.log("✅ [CAPTION] Translated:", translatedText);
    } catch (err) {
      console.error("❌ [CAPTION] Translation failed:", err);
      translatedText = null;
    }
  } else {
    console.warn("⚠️ [CAPTION] Translator session unavailable - skipping translation");
    translatedText = null;
  }
}

  // Add to UI and storage
  await addCaption(captionText, simplifiedText, translatedText);
}

// 🔧 UPDATED: Add caption with translation support
async function addCaption(originalText, simplifiedText, translatedText = null) {
  if (!currentMeetingData) return;
  
  const caption = {
    timestamp: new Date().toISOString(),
    original: originalText,
    simplified: simplifiedText,
    translated: translatedText
  };
  
  currentMeetingData.captions.push(caption);
  await saveCurrentMeeting();
  
  const entry = document.createElement("div");
  entry.className = "caption-entry";
  
  const timestamp = document.createElement("div");
  timestamp.className = "caption-timestamp";
  timestamp.textContent = new Date(caption.timestamp).toLocaleTimeString();
  
  entry.appendChild(timestamp);
  
  // Show original if different from simplified
  if (originalText && originalText !== simplifiedText) {
    const original = document.createElement("div");
    original.className = "caption-original";
    original.textContent = `Original: ${originalText}`;
    entry.appendChild(original);
  }
  
  // Show simplified version
  const simplified = document.createElement("div");
  simplified.className = "caption-simplified";
  simplified.textContent = simplifiedText;
  entry.appendChild(simplified);
  
  // Show translation if available
  if (translatedText) {
    const translated = document.createElement("div");
    translated.className = "caption-translated";
    translated.textContent = `🌐 ${translatedText}`;
    entry.appendChild(translated);
  }
  
  captionContainer.appendChild(entry);
  captionContainer.scrollTop = captionContainer.scrollHeight;
}

// Meeting Summary Generation
async function generateMeetingSummary() { // Removed 'type' parameter
  if (!currentMeetingData || !summarySession) {
    return { success: false, error: "Meeting data or summary session not available" };
  }

  const captions = currentMeetingData.captions || [];
  const notes = currentMeetingData.notes || "";
  const screenshots = currentMeetingData.screenshots || [];

  if (captions.length === 0 && notes === "" && screenshots.length === 0) {
    return { success: false, error: "No meeting data (captions, notes, or screenshots) available to summarize." };
  }

  isGeneratingSummary = true;

  try {
    let fullContext = "Generate a comprehensive meeting summary based on the following information:\n\n";

    if (notes) {
      fullContext += "--- Meeting Notes ---\n" + notes + "\n\n";
    }

    if (captions.length > 0) {
      const transcript = captions
        .map(c => c.simplified || c.original)
        .join(' ');
      fullContext += "--- Meeting Transcript (from captions) ---\n" + transcript + "\n\n";
    }

    if (screenshots.length > 0) {
      fullContext += "--- Screenshot Analyses ---\n";
      screenshots.forEach((ss, index) => {
        if (ss.analysis) {
          fullContext += `Screenshot ${index + 1} Analysis: ${ss.analysis}\n`;
        }
      });
      fullContext += "\n";
    }

    fullContext += `Please provide a well-formatted summary with the following sections:\n`;
    fullContext += `1. **Overview**: A brief description of the meeting.\n`;
    fullContext += `2. **Key Discussion Points**: Main topics discussed (bullet points).\n`;
    fullContext += `3. **Decisions Made**: Any conclusions or agreements reached.\n`;
    fullContext += `4. **Action Items**: Tasks and follow-ups identified.\n`;
    fullContext += `5. **Important Mentions**: Any other notable concerns or highlights.\n\n`;
    fullContext += `Ensure the summary is clear, concise, and easy to read.`;


    const summaryText = await summarySession.prompt(fullContext);

    const summaryData = {
      type: 'comprehensive', // Always comprehensive now
      content: summaryText,
      generatedAt: new Date().toISOString(),
      captionCount: captions.length,
      transcriptLength: captions.map(c => c.simplified || c.original).join(' ').length
    };

    currentMeetingData.summary = summaryData;
    await saveCurrentMeeting();

    isGeneratingSummary = false;
    return { success: true, summary: summaryData };

  } catch (err) {
    console.error("Summary generation error:", err);
    isGeneratingSummary = false;
    return { success: false, error: err.message };
  }
}

// Handle summary button click
async function handleSummaryGeneration() {
  console.log(`📊 [SUMMARY] ${type} summary requested`);

  if (!currentMeetingId) {
    console.error("❌ [SUMMARY] No active meeting");
    summaryStatus.textContent = "⚠️ No active meeting";
    summaryStatus.style.color = "#d93025";
    return;
  }

  if (!summarySession) {
    console.error("❌ [SUMMARY] Summary session not ready");
    summaryStatus.textContent = "⚠️ Summary session not ready. Please wait...";
    summaryStatus.style.color = "#d93025";
    return;
  }

  if (isGeneratingSummary) {
    console.log("⚠️ [SUMMARY] Already generating");
    summaryStatus.textContent = "⏳ Already generating summary...";
    summaryStatus.style.color = "#666";
    return;
  }

  const allSummaryBtns = [generateSummaryBtn];
  allSummaryBtns.forEach(btn => btn.disabled = true);

  summaryStatus.textContent = `⏳ Generating ${type} summary...`;
  summaryStatus.style.color = "#1a73e8";
  summaryOutput.style.display = "none";

  const result = await generateMeetingSummary();

  allSummaryBtns.forEach(btn => btn.disabled = false);

  if (result.success) {
    summaryStatus.textContent = `✅ Summary generated (${result.summary.captionCount} captions analyzed)`;
    summaryStatus.style.color = "#34a853";

    summaryOutput.textContent = result.summary.content;
    summaryOutput.style.display = "block";

    console.log(`📊 Generated ${type} summary for meeting:`, currentMeetingId);
  } else {
    summaryStatus.textContent = `⚠️ Failed: ${result.error}`;
    summaryStatus.style.color = "#d93025";
  }
}

// Check for meeting ID
async function checkMeetingStatus() {
  console.log("🔍 [CHECK] Checking meeting status...");
  try {
    const response = await chrome.runtime.sendMessage({ action: "getMeetingId" });
    console.log("🔍 [CHECK] Response:", response);

    if (response && response.meetingId) {
      console.log("✅ [CHECK] Meeting detected:", response.meetingId);

      if (currentMeetingId !== response.meetingId) {
        console.log("🆕 [CHECK] New meeting, activating...");
        activateMeeting(response.meetingId, response.tabId);
      } else if (response.tabId !== currentMeetTabId) {
        console.log("🔄 [CHECK] Tab ID changed:", response.tabId);
        currentMeetTabId = response.tabId;
      }
    } else {
      console.log("⚠️ [CHECK] No meeting detected");
      if (currentMeetingId !== null) {
        console.log("🏁 [CHECK] Ending current meeting");
        await endCurrentMeeting();
        showWaitingState();
      }
    }
  } catch (err) {
    console.error("❌ [CHECK] Failed to get meeting ID:", err);
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "meetingStarted" && message.meetingId) {
    activateMeeting(message.meetingId, message.tabId);
  }

  if (message.action === "captionFromMeet" && message.caption) {
    console.log("📥 [CAPTION] Received from Meet:", message.caption.text);
    processCaptionFromMeet(message.caption.text);
  }
});

// async function activateMeeting(meetingId, tabId) {
//   console.log("🎯 [ACTIVATE] Activating meeting:", meetingId);

//   currentMeetingId = meetingId;
//   currentMeetTabId = tabId;

//   meetingIdDisplay.innerHTML = `📋 Meeting ID: <strong>${meetingId}</strong>`;
//   waitingMessage.style.display = "none";
//   featuresContainer.style.display = "flex";

//   await initCurrentMeeting(meetingId);

//   const storageInfo = await getStorageUsage();
//   console.log(`💾 [ACTIVATE] Storage: ${storageInfo.percentage}% used`);

//   console.log("✅ [ACTIVATE] Meeting activated successfully!");
// }
async function activateMeeting(meetingId, tabId) {
  console.log("🎯 [ACTIVATE] Activating meeting:", meetingId);

  currentMeetingId = meetingId;
  currentMeetTabId = tabId;

  meetingIdDisplay.innerHTML = `📋 Meeting ID: <strong>${meetingId}</strong>`;
  waitingMessage.style.display = "none";
  featuresContainer.style.display = "flex";

  await initCurrentMeeting(meetingId);

  // Ensure the segmented feature bar is wired after featuresContainer becomes visible
  try {
    setupFeatureToggleBar();
  } catch (err) {
    console.warn("⚠️ Failed to setup feature toggle bar:", err);
  }

  const storageInfo = await getStorageUsage();
  console.log(`💾 [ACTIVATE] Storage: ${storageInfo.percentage}% used`);

  console.log("✅ [ACTIVATE] Meeting activated successfully!");
}
function setupFeatureToggleBar() {
  const bar = document.getElementById('featureToggleBar');
  if (!bar) return;
  if (bar.__segWired) return; // avoid double-wiring
  const sections = ['notesSection', 'captionsSection', 'screenshotsSection', 'summarySection'];

  function showOnly(targetId) {
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = id === targetId ? 'block' : 'none';
    });
    const segButtons = bar.querySelectorAll('.seg-btn');
    segButtons.forEach(btn => btn.setAttribute('aria-pressed', btn.dataset.target === targetId ? 'true' : 'false'));
  }

  const segButtons = Array.from(bar.querySelectorAll('.seg-btn'));
  segButtons.forEach(btn => {
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.type = 'button';
    btn.addEventListener('click', () => {
      const t = btn.dataset.target;
      if (t) showOnly(t);
    });
    btn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        const t = btn.dataset.target;
        if (t) showOnly(t);
      }
    });
  });

  // default: prefer aria-pressed="true", fallback to first button
  const active = segButtons.find(b => b.getAttribute('aria-pressed') === 'true') || segButtons[0];
  if (active) showOnly(active.dataset.target);

  bar.__segWired = true;
}
async function endCurrentMeeting() {
  if (!currentMeetingId || !currentMeetingData) return;

  if (isCaptionsEnabled) {
    disableCaptions();
  }

  if (currentMeetingData.captions && currentMeetingData.captions.length > 0 && !currentMeetingData.summary) {
    console.log("📊 Auto-generating meeting summary...");
    status.textContent = "📊 Generating meeting summary...";

    try {
      const result = await generateMeetingSummary('comprehensive');
      if (result.success) {
        console.log("✅ Auto-summary generated successfully");
      }
    } catch (err) {
      console.error("Auto-summary failed:", err);
    }
  }

  currentMeetingData.endTime = new Date().toISOString();
  await saveMeetingData(currentMeetingId, currentMeetingData);

  console.log("🏁 Meeting ended:", currentMeetingId);

  currentMeetingData = null;
  notesField.value = "";
  outputDiv.textContent = "";
  gallery.innerHTML = "";
  captionContainer.innerHTML = "";
  summaryOutput.style.display = "none";
  summaryStatus.textContent = "";
  analysisQueue = [];
}

function showWaitingState() {
  meetingIdDisplay.textContent = "⏳ No active meeting";
  waitingMessage.style.display = "block";
  featuresContainer.style.display = "none";
  currentMeetingId = null;
  currentMeetTabId = null;
}

// REPLACE the entire initSessions() function with this updated version:
async function initSessions() {
  try {
    console.log("🤖 [INIT] Starting AI session initialization...");
    
    if (typeof LanguageModel === 'undefined') {
      throw new Error("LanguageModel API not available");
    }

    // Text session
    console.log("📝 [INIT] Creating text session...");
    textSession = await LanguageModel.create({
      initialPrompts: [
        {
          role: "system",
          content: "You are a meeting assistant who extracts actionable items and follow-up tasks from meeting notes."
        }
      ]
    });
    console.log("✅ Text session ready");

    // Image session
    console.log("📸 [INIT] Creating image session (multimodal)...");
    try {
      imageSession = await LanguageModel.create({
        initialPrompts: [
          {
            role: "system",
            content: "You are a meeting analyst who interprets screenshots and extracts important discussion points and follow-up actions. Provide clear, structured analysis."
          }
        ],
        expectedInputs: [{ type: "image" }]
      });
      console.log("✅ Image session created with multimodal support");
    } catch (imgErr) {
      console.error("❌ Failed to create image session:", imgErr);
      imageSession = null;
      status.textContent = "⚠️ Screenshot analysis unavailable";
    }

    // Summary session
    console.log("📊 [INIT] Creating summary session...");
    summarySession = await LanguageModel.create({
      initialPrompts: [
        {
          role: "system",
          content: "You are an expert meeting summarizer. You analyze meeting transcripts and create clear, concise, and well-structured summaries."
        }
      ]
    });
    console.log("✅ Summary session ready");

    // 🔧 NEW: Rewriter API for caption simplification
    try {
      console.log("✨ [INIT] Creating Rewriter session...");
      if (typeof ai !== 'undefined' && ai.rewriter) {
        rewriterSession = await ai.rewriter.create({
          sharedContext: "Live meeting captions that need to be simplified for better understanding"
        });
        console.log("✅ Rewriter API ready");
      } else {
        console.warn("⚠️ Rewriter API not available (ai.rewriter undefined)");
      }
    } catch (err) {
      console.warn("⚠️ Rewriter API not available:", err);
      rewriterSession = null;
    }

    // 🔧 NEW: Translator API
    try {
      console.log("🌐 [INIT] Creating Translator session...");
      if (typeof Translator !== 'undefined') {
        translatorSession = await Translator.create({
          sourceLanguage: 'en',
          targetLanguage: selectedLanguage
        });
        console.log("✅ Translator API ready");
      } else {
        console.warn("⚠️ Translator API not available (Translator undefined)");
      }
    } catch (err) {
      console.warn("⚠️ Translator API not available:", err);
      translatorSession = null;
    }

    status.textContent = "✅ All AI features ready";
    console.log("✅ [INIT] Sessions initialized successfully");
  } catch (err) {
    console.error("❌ [INIT] Session initialization error:", err);
    status.textContent = "❌ Prompt API not supported. Enable chrome://flags → #prompt-api-for-gemini-nano";
  }
}
// startCaptionBtn.addEventListener("click", enableCaptions);
// stopCaptionBtn.addEventListener("click", disableCaptions);
// simplifyToggle.addEventListener("click", toggleSimplification);
// translateToggle.addEventListener("click", toggleTranslation);
// languageSelect.addEventListener("change", (e) => changeLanguage(e.target.value));
if (startCaptionBtn) startCaptionBtn.addEventListener("click", enableCaptions);
if (stopCaptionBtn) stopCaptionBtn.addEventListener("click", disableCaptions);
if (simplifyToggle) simplifyToggle.addEventListener("click", toggleSimplification);
if (translateToggle) translateToggle.addEventListener("click", toggleTranslation);
if (languageSelect) languageSelect.addEventListener("change", (e) => changeLanguage(e.target.value));
// Tab switching
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const tabName = tab.dataset.tab;
    
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    
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

// Load past meetings
async function loadPastMeetings() {
  const meetings = await getAllMeetings();
  
  const storageInfo = await getStorageUsage();
  const storageWarning = document.createElement("div");
  storageWarning.style.cssText = `
    padding: 12px;
    margin: 12px 16px;
    background: ${storageInfo.percentage > 80 ? '#fef7e0' : '#e8f0fe'};
    border-radius: 8px;
    font-size: 13px;
    color: ${storageInfo.percentage > 80 ? '#b45309' : '#1a73e8'};
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  
  const usedMB = (storageInfo.used / (1024 * 1024)).toFixed(2);
  const quotaMB = (storageInfo.quota / (1024 * 1024)).toFixed(2);
  
  storageWarning.innerHTML = `
    <span>💾 Storage: ${usedMB} MB / ${quotaMB} MB (${storageInfo.percentage}%)</span>
    ${storageInfo.percentage > 80 ? '<span style="font-weight: bold;">⚠️ Running low!</span>' : ''}
  `;
  
  if (meetings.length === 0) {
    pastMeetingsList.innerHTML = "";
    pastMeetingsList.appendChild(storageWarning);
    emptyState.style.display = "block";
    return;
  }
  
  emptyState.style.display = "none";
  pastMeetingsList.innerHTML = "";
  pastMeetingsList.appendChild(storageWarning);
  
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
      <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <span class="meeting-time">${dateStr} at ${timeStr}</span>
        <button class="export-markdown-btn" data-meeting-id="${meeting.meetingId}"
          style="background: #34a853; padding: 4px 10px; font-size: 12px; border-radius: 4px;"
          title="Copy as Markdown">
          📋 Markdown
        </button>
        <button class="export-pdf-btn" data-meeting-id="${meeting.meetingId}"
          style="background: #ea4335; padding: 4px 10px; font-size: 12px; border-radius: 4px;"
          title="Export as PDF">
          📄 PDF
        </button>
        <button class="delete-meeting-btn" data-meeting-id="${meeting.meetingId}"
          style="background: #d93025; padding: 4px 10px; font-size: 12px; border-radius: 4px;">
          🗑️ Delete
        </button>
      </div>
    </div>
    <div class="meeting-stats">
      <span>⏱️ ${duration !== "Ongoing" ? duration + " min" : duration}</span>
      <span>📝 ${meeting.notes ? "Has notes" : "No notes"}</span>
      <span>📸 ${meeting.screenshots.length} screenshots</span>
      <span>🎤 ${meeting.captions ? meeting.captions.length : 0} captions</span>
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

      ${meeting.summary ? `
        <div class="detail-section">
          <h4>📊 Meeting Summary</h4>
          <div class="detail-content" style="white-space: pre-wrap;">${meeting.summary.content}</div>
          <div style="font-size: 11px; color: #666; margin-top: 8px;">
            Generated: ${new Date(meeting.summary.generatedAt).toLocaleString()} |
            Based on ${meeting.summary.captionCount} captions
          </div>
        </div>
      ` : ''}

      ${meeting.captions && meeting.captions.length > 0 ? `
        <div class="detail-section">
          <h4>🎤 Live Captions (${meeting.captions.length})</h4>
          <div class="detail-content">
            ${meeting.captions.map(c => `
              <div style="margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0;">
                <div style="font-size: 10px; color: #999; margin-bottom: 6px; font-weight: 600;">${new Date(c.timestamp).toLocaleTimeString()}</div>
                ${c.original && c.original !== c.simplified ? `
                  <div style="font-size: 11px; color: #999; margin-bottom: 6px; font-style: italic;">${c.original}</div>
                ` : ''}
                <div style="font-size: 13px; color: #333; line-height: 1.5; font-weight: 500;">${c.simplified}</div>
                ${c.translated ? `
                  <div style="font-size: 13px; color: #1a73e8; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e8f0fe;">
                    🌐 ${c.translated}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${meeting.screenshots.length > 0 ? `
        <div class="detail-section">
          <h4>📸 Screenshots & Analysis (${meeting.screenshots.length})</h4>
          <div>
            ${meeting.screenshots.map((ss, idx) => `
              <div style="display: flex; gap: 12px; margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 6px;">
                <img src="${ss.dataUri}" class="screenshot-thumb" data-index="${idx}" style="width: 150px; height: 100px; object-fit: cover;">
                <div style="flex: 1;">
                  <div style="font-size: 11px; color: #666; margin-bottom: 4px;">${new Date(ss.timestamp).toLocaleString()}</div>
                  <div style="font-size: 13px; line-height: 1.4;">${ss.analysis || 'No analysis available'}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  const markdownBtn = card.querySelector(".export-markdown-btn");
  markdownBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    await exportMeetingAsMarkdown(meeting);
  });

  const pdfBtn = card.querySelector(".export-pdf-btn");
  pdfBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    exportMeetingAsPDF(meeting);
  });

  const deleteBtn = card.querySelector(".delete-meeting-btn");
  deleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();

    if (confirm(`Delete meeting ${meeting.meetingId}? This cannot be undone.`)) {
      await deleteMeeting(meeting.meetingId);
      card.remove();
      await loadPastMeetings();

      status.textContent = `✅ Deleted meeting ${meeting.meetingId}`;
      setTimeout(() => status.textContent = "", 3000);
    }
  });
  
  card.addEventListener("click", (e) => {
    if (e.target.classList.contains("screenshot-thumb")) {
      const index = parseInt(e.target.dataset.index);
      openModalFromHistory(meeting.screenshots[index]);
      return;
    }
    
    if (e.target.classList.contains("delete-meeting-btn") || 
        e.target.classList.contains("export-markdown-btn") ||
        e.target.classList.contains("export-pdf-btn")) {
      return;
    }
    
    const details = card.querySelector(".meeting-details");
    details.classList.toggle("expanded");
  });
  
  return card;
}

// Export meeting as Markdown
async function exportMeetingAsMarkdown(meeting) {
  console.log("📋 [EXPORT] Exporting as Markdown:", meeting.meetingId);

  const startDate = new Date(meeting.startTime);
  const endDate = meeting.endTime ? new Date(meeting.endTime) : null;
  const duration = endDate
    ? Math.round((endDate - startDate) / 60000) + " minutes"
    : "Ongoing";

  let markdown = `# Meeting: ${meeting.meetingId}

`;
  markdown += `**Date:** ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}
`;
  markdown += `**Duration:** ${duration}
`;
  markdown += `**Status:** ${endDate ? "Completed" : "Ongoing"}

`;
  markdown += `---

`;

  if (meeting.notes) {
    markdown += `## 📝 Meeting Notes

`;
    markdown += `${meeting.notes}

`;
  }

  if (meeting.actionables) {
    markdown += `## ✅ Actionable Items

`;
    markdown += `${meeting.actionables}

`;
  }

  if (meeting.summary) {
    markdown += `## 📊 Meeting Summary (${meeting.summary.type})

`;
    markdown += `${meeting.summary.content}

`;
    markdown += `*Generated: ${new Date(meeting.summary.generatedAt).toLocaleString()}*
`;
    markdown += `*Based on ${meeting.summary.captionCount} captions*

`;
  }

  if (meeting.captions && meeting.captions.length > 0) {
    markdown += `## 💬 Live Captions (${meeting.captions.length})

`;
    meeting.captions.forEach(caption => {
      const time = new Date(caption.timestamp).toLocaleTimeString();
      markdown += `**[${time}]** ${caption.simplified || caption.original}

`;
    });
  }

  if (meeting.screenshots && meeting.screenshots.length > 0) {
    markdown += `## 📸 Screenshots & Analysis (${meeting.screenshots.length})

`;
    meeting.screenshots.forEach((ss, idx) => {
      const time = new Date(ss.timestamp).toLocaleString();
      markdown += `### Screenshot ${idx + 1}
`;
      markdown += `**Time:** ${time}

`;
      if (ss.analysis) {
        markdown += `**Analysis:**
${ss.analysis}

`;
      }
      markdown += `---

`;
    });
  }

  markdown += `

---
`;
  markdown += `*Exported from MeetMate on ${new Date().toLocaleString()}*
`;

  try {
    await navigator.clipboard.writeText(markdown);
    status.textContent = `✅ Markdown copied to clipboard!`;
    status.style.background = "#e8f5e9";
    status.style.color = "#2e7d32";
    console.log("✅ [EXPORT] Markdown copied to clipboard");

    setTimeout(() => {
      status.textContent = "";
      status.style.background = "#e8f0fe";
      status.style.color = "#1a73e8";
    }, 3000);

  } catch (err) {
    console.error("❌ [EXPORT] Failed to copy:", err);
    status.textContent = `❌ Failed to copy: ${err.message}`;
    status.style.background = "#fce8e6";
    status.style.color = "#d93025";
  }
}

// Export meeting as PDF
function exportMeetingAsPDF(meeting) {
  console.log("📄 [EXPORT] Exporting as PDF:", meeting.meetingId);

  const startDate = new Date(meeting.startTime);
  const endDate = meeting.endTime ? new Date(meeting.endTime) : null;
  const duration = endDate
    ? Math.round((endDate - startDate) / 60000) + " minutes"
    : "Ongoing";

  const printWindow = window.open('', '_blank');

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Meeting ${meeting.meetingId} - ${startDate.toLocaleDateString()}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      color: #1a73e8;
      border-bottom: 3px solid #1a73e8;
      padding-bottom: 10px;
    }
    h2 {
      color: #0d47a1;
      margin-top: 30px;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 5px;
    }
    h3 {
      color: #666;
      margin-top: 20px;
    }
    .meta {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .meta strong {
      color: #1a73e8;
    }
    .caption {
      background: #f9f9f9;
      padding: 10px;
      margin: 10px 0;
      border-left: 3px solid #1a73e8;
    }
    .timestamp {
      color: #666;
      font-size: 0.9em;
      font-weight: bold;
    }
    .screenshot-analysis {
      background: #f5f5f5;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #999;
      font-size: 0.9em;
    }
    @media print {
      body {
        margin: 0;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <h1>🧠 Meeting: ${meeting.meetingId}</h1>

  <div class="meta">
    <p><strong>Date:</strong> ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}</p>
    <p><strong>Duration:</strong> ${duration}</p>
    <p><strong>Status:</strong> ${endDate ? "Completed" : "Ongoing"}</p>
  </div>
`;

  if (meeting.notes) {
    html += `
  <h2>📝 Meeting Notes</h2>
            <p>${meeting.notes.replace(/\n/g, '<br>')}</p>/g, '<br>')}</p>
`;
  }

  if (meeting.actionables) {
    html += `
  <h2>✅ Actionable Items</h2>
            <p>${meeting.actionables.replace(/\n/g, '<br>')}</p>/g, '<br>')}</p>
`;
  }

  if (meeting.summary) {
    html += `
  <h2>📊 Meeting Summary (${meeting.summary.type})</h2>
            <p>${meeting.summary.content.replace(/\n/g, '<br>')}</p>/g, '<br>')}</p>
  <p style="color: #666; font-size: 0.9em; font-style: italic;">
    Generated: ${new Date(meeting.summary.generatedAt).toLocaleString()} |
    Based on ${meeting.summary.captionCount} captions
  </p>
`;
  }

  if (meeting.captions && meeting.captions.length > 0) {
    html += `
  <h2>💬 Live Captions (${meeting.captions.length})</h2>
`;
    meeting.captions.forEach(caption => {
      const time = new Date(caption.timestamp).toLocaleTimeString();
      html += `
  <div class="caption">
    <span class="timestamp">[${time}]</span> ${caption.simplified || caption.original}
  </div>
`;
    });
  }

  if (meeting.screenshots && meeting.screenshots.length > 0) {
    html += `
  <h2>📸 Screenshots & Analysis (${meeting.screenshots.length})</h2>
`;
    meeting.screenshots.forEach((ss, idx) => {
      const time = new Date(ss.timestamp).toLocaleString();
      html += `
  <div class="screenshot-analysis">
    <h3>Screenshot ${idx + 1}</h3>
    <p><strong>Time:</strong> ${time}</p>
    ${ss.analysis ? `<p><strong>Analysis:</strong><br>${ss.analysis.replace(/\n/g, '<br>')}</p>` : ''}
  </div>
`;
    });
  }

  html += `
  <div class="footer">
    <p>Exported from MeetMate on ${new Date().toLocaleString()}</p>
    <p>Generated with MeetMate - AI Meeting Assistant</p>
  </div>
</body>
</html>
`;

  printWindow.document.write(html);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
    console.log("✅ [EXPORT] PDF print dialog opened");
  }, 250);

  status.textContent = `📄 PDF export ready - Use browser print dialog to save as PDF`;
  status.style.background = "#e8f0fe";
  status.style.color = "#1a73e8";

  setTimeout(() => {
    status.textContent = "";
  }, 5000);
}

// Initialize
console.log("=== 🎬 INITIALIZATION START ===");
console.log("🔄 [INIT] Starting meeting status check...");
checkMeetingStatus();

console.log("🤖 [INIT] Starting AI sessions...");
initSessions();

console.log("⏰ [INIT] Setting up polling interval (2s)...");
checkInterval = setInterval(checkMeetingStatus, 2000);

console.log("=== ✅ INITIALIZATION COMPLETE ===");

window.addEventListener('focus', checkMeetingStatus);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkMeetingStatus();
});



// Feature 2: Capture Screenshot
captureBtn.addEventListener("click", async () => {
  if (!currentMeetingId) {
    status.textContent = "⚠️ No active meeting. Please join a meeting first.";
    return;
  }

  try {
    status.textContent = "📸 Capturing screenshot...";
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const imageUri = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "png",
    });

    const screenshotData = {
      dataUri: imageUri,
      timestamp: new Date().toISOString(),
      analysis: null
    };
    
    currentMeetingData.screenshots.push(screenshotData);
    await saveCurrentMeeting();

    const newIndex = currentMeetingData.screenshots.length - 1;
    analysisQueue.push(newIndex);

    renderScreenshotGrid();
    processAnalysisQueue();

    console.log("📸 Screenshot captured for meeting:", currentMeetingId);
    status.textContent = "✅ Screenshot captured! Auto-analyzing...";
    
  } catch (err) {
    console.error(err);
    status.textContent = `❌ Failed to capture: ${err.message}`;
    
    if (err.message.includes("QUOTA_BYTES")) {
      await handleStorageQuotaExceeded();
    }
  }
});

// Feature 3: Caption controls
startCaptionBtn.addEventListener("click", enableCaptions);
stopCaptionBtn.addEventListener("click", disableCaptions);
translateBtn.addEventListener("click", toggleTranslation);

// Add event listeners for simplification level buttons (will be added in HTML)
document.addEventListener('DOMContentLoaded', () => {
  const levelButtons = document.querySelectorAll('.simplification-level-btn');
  levelButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      changeSimplificationLevel(btn.dataset.level);
    });
  });
  
  const langSelect = document.getElementById('languageSelect');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      changeLanguage(e.target.value);
    });
  }

  // Add this line to set initial UI state for simplification button
  if (simplifyToggle) {
    updateSimplificationButtonUI();
  }
});

// Feature 4: Summary controls
generateSummaryBtn.addEventListener("click", () => handleSummaryGeneration('comprehensive'));

// Modal handling
async function openModal(index) {
  if (!currentMeetingData) return;
  
  const shot = currentMeetingData.screenshots[index];
  modal.style.display = "flex";
  modalImage.src = shot.dataUri;
  
  if (shot.analysis) {
    modalAnalysis.textContent = shot.analysis;
  } else {
    modalAnalysis.textContent = "⏳ Analysis in progress...";
    
    // 🔧 NEW: Trigger manual analysis if not already analyzing
    if (!analysisQueue.includes(index) && !isAnalyzing) {
      console.log("🔍 [MODAL] Triggering manual analysis for screenshot", index);
      analysisQueue.push(index);
      processAnalysisQueue();
    }
  }
}

function openModalFromHistory(screenshot) {
  modal.style.display = "flex";
  modalImage.src = screenshot.dataUri;
  modalAnalysis.textContent = screenshot.analysis || "No analysis available";
}

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener('unload', () => {
  if (checkInterval) clearInterval(checkInterval);
  if (isCaptionsEnabled) disableCaptions();
});
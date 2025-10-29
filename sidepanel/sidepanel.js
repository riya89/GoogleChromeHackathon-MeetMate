//last updated
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

// Feature 3 elements (Captions)
const startCaptionBtn = document.getElementById("startCaptionBtn");
const stopCaptionBtn = document.getElementById("stopCaptionBtn");
const translateBtn = document.getElementById("translateBtn");
const captionContainer = document.getElementById("captionContainer");
const captionStatus = document.getElementById("captionStatus");

// Feature 4 elements (Summary)
const summaryQuickBtn = document.getElementById("summaryQuickBtn");
const summaryComprehensiveBtn = document.getElementById("summaryComprehensiveBtn");
const summaryActionsBtn = document.getElementById("summaryActionsBtn");
const summaryDecisionsBtn = document.getElementById("summaryDecisionsBtn");
const summaryTopicsBtn = document.getElementById("summaryTopicsBtn");
const summaryStatus = document.getElementById("summaryStatus");
const summaryOutput = document.getElementById("summaryOutput");

let textSession;
let imageSession;
let rewriterSession;
let translatorSession;
let summarySession; // New: for meeting summarization
let currentMeetingId = null;
let currentMeetTabId = null; // Track the Meet tab ID for audio capture
let checkInterval = null;
let saveTimeout = null;
let currentMeetingData = null;
let analysisQueue = [];
let isAnalyzing = false;
let isGeneratingSummary = false; // Track summary generation state

// Caption-related variables
let isCaptionsEnabled = false;
let captionSimplificationEnabled = true; // Auto-simplify captions by default

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
      summary: null // New: for meeting summary
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

// Add new caption
async function addCaption(originalText, simplifiedText) {
  if (!currentMeetingData) return;
  
  const caption = {
    timestamp: new Date().toISOString(),
    original: originalText,
    simplified: simplifiedText
  };
  
  currentMeetingData.captions.push(caption);
  await saveCurrentMeeting();
  
  // Add to UI
  const entry = document.createElement("div");
  entry.className = "caption-entry";
  
  const timestamp = document.createElement("div");
  timestamp.className = "caption-timestamp";
  timestamp.textContent = new Date(caption.timestamp).toLocaleTimeString();
  
  const simplified = document.createElement("div");
  simplified.className = "caption-simplified";
  simplified.textContent = simplifiedText;
  
  entry.appendChild(timestamp);
  
  if (originalText && originalText !== simplifiedText) {
    const original = document.createElement("div");
    original.className = "caption-original";
    original.textContent = `Original: ${originalText}`;
    entry.appendChild(original);
  }
  
  entry.appendChild(simplified);
  captionContainer.appendChild(entry);
  captionContainer.scrollTop = captionContainer.scrollHeight;
}

// Schedule auto-analysis for screenshots without analysis
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

// Analyze screenshot
async function analyzeScreenshot(index) {
  if (!currentMeetingData || !imageSession) {
    console.error("Cannot analyze - missing data or session");
    return;
  }
  
  const shot = currentMeetingData.screenshots[index];
  if (shot.analysis) return;
  
  const analysisElement = document.querySelector(`.analysis-text-${index}`);
  
  if (analysisElement) {
    analysisElement.innerHTML = `<span style="color: #1a73e8;">⏳ Analyzing screenshot ${index + 1}...</span>`;
  }
  
  try {
    const res = await fetch(shot.dataUri);
    const blob = await res.blob();
    
    const response = await imageSession.prompt([
      {
        role: "user",
        content: [
          {
            type: "text",
            value: "Analyze this meeting screenshot and provide: 1) Key discussion points visible, 2) Important visual elements (charts, diagrams, shared content), 3) Any action items mentioned. Be concise but thorough."
          },
          { type: "image", value: blob }
        ]
      }
    ]);
    
    shot.analysis = response;
    
    if (analysisElement) {
      analysisElement.textContent = response;
      analysisElement.style.color = "#333";
    }
    
    await saveCurrentMeeting();
    console.log(`🔍 Analysis completed for screenshot ${index + 1}`);
    
  } catch (err) {
    console.error("Analysis error:", err);
    if (analysisElement) {
      analysisElement.innerHTML = `<span style="color: #d93025;">⚠️ Failed: ${err.message}</span>`;
    }
    
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

// Caption functionality - NEW APPROACH: Scrape from Meet's built-in captions
function enableCaptions() {
  console.log("📝 [CAPTION] Enabling caption capture");

  if (isCaptionsEnabled) {
    console.log("⚠️ [CAPTION] Already enabled");
    return;
  }

  isCaptionsEnabled = true;
  startCaptionBtn.disabled = true;
  stopCaptionBtn.disabled = false;
  startCaptionBtn.classList.add("recording");

  captionStatus.innerHTML = `
    ✅ Listening for captions<br>
    <small style="color: #666;">Enable captions in Meet (CC button) if not visible</small>
  `;

  console.log("✅ [CAPTION] Caption capture enabled. Waiting for captions from Meet...");
}

function disableCaptions() {
  console.log("📝 [CAPTION] Disabling caption capture");

  isCaptionsEnabled = false;
  startCaptionBtn.disabled = false;
  stopCaptionBtn.disabled = true;
  startCaptionBtn.classList.remove("recording");

  captionStatus.textContent = "Caption capture stopped";

  console.log("✅ [CAPTION] Caption capture disabled");
}

function toggleSimplification() {
  captionSimplificationEnabled = !captionSimplificationEnabled;

  if (captionSimplificationEnabled) {
    translateBtn.style.background = "#34a853";
    translateBtn.textContent = "✨ Simplifying";
    console.log("✅ [CAPTION] Caption simplification enabled");
  } else {
    translateBtn.style.background = "#1a73e8";
    translateBtn.textContent = "✨ Simplify";
    console.log("⚠️ [CAPTION] Caption simplification disabled");
  }
}

// Process caption from Meet
async function processCaptionFromMeet(captionText) {
  if (!isCaptionsEnabled || !currentMeetingData) {
    console.log("⚠️ [CAPTION] Ignoring caption (disabled or no meeting)");
    return;
  }

  console.log("📝 [CAPTION] Processing caption:", captionText);

  let simplifiedText = captionText;

  // Simplify using AI if enabled
  if (captionSimplificationEnabled && textSession) {
    try {
      console.log("✨ [CAPTION] Simplifying with AI...");

      const prompt = `Simplify this meeting caption to be clearer and easier to understand. Keep it concise (1-2 sentences max). Original: "${captionText}"`;

      simplifiedText = await textSession.prompt(prompt);
      console.log("✅ [CAPTION] Simplified:", simplifiedText);

    } catch (err) {
      console.error("❌ [CAPTION] Simplification failed:", err);
      // Use original if simplification fails
      simplifiedText = captionText;
    }
  }

  // Add to meeting data
  await addCaption(captionText, simplifiedText);
}

// Meeting Summary Generation
async function generateMeetingSummary(type = 'comprehensive') {
  if (!currentMeetingData || !summarySession) {
    return { success: false, error: "Meeting data or summary session not available" };
  }

  const captions = currentMeetingData.captions || [];

  if (captions.length === 0) {
    return { success: false, error: "No captions available. Please record some captions first." };
  }

  isGeneratingSummary = true;

  try {
    // Combine all captions into a full transcript
    const transcript = captions
      .map(c => c.simplified || c.original)
      .join(' ');

    // Different prompts for different summary types
    const prompts = {
      quick: `Provide a brief 3-5 bullet point summary of the key points from this meeting transcript:\n\n${transcript}`,

      comprehensive: `Create a comprehensive meeting summary with the following sections:
1. **Overview**: Brief description of the meeting
2. **Key Discussion Points**: Main topics discussed (bullet points)
3. **Decisions Made**: Any decisions or conclusions reached
4. **Action Items**: Tasks and follow-ups identified
5. **Important Mentions**: Notable concerns or highlights

Meeting transcript:\n${transcript}`,

      actions: `Extract and list ONLY the action items, tasks, and follow-ups from this meeting. Format as a checklist.

Meeting transcript:\n${transcript}`,

      decisions: `List ONLY the key decisions, conclusions, and agreements made during this meeting. Be specific and concise.

Meeting transcript:\n${transcript}`,

      topics: `Identify and list the main topics and themes discussed in this meeting, with a brief description of each.

Meeting transcript:\n${transcript}`
    };

    const prompt = prompts[type] || prompts.comprehensive;

    const summaryText = await summarySession.prompt(prompt);

    const summaryData = {
      type: type,
      content: summaryText,
      generatedAt: new Date().toISOString(),
      captionCount: captions.length,
      transcriptLength: transcript.length
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
async function handleSummaryGeneration(type) {
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

  console.log("📊 [SUMMARY] All checks passed, generating...");

  // Disable all summary buttons
  const allSummaryBtns = [summaryQuickBtn, summaryComprehensiveBtn, summaryActionsBtn, summaryDecisionsBtn, summaryTopicsBtn];
  allSummaryBtns.forEach(btn => btn.disabled = true);

  summaryStatus.textContent = `⏳ Generating ${type} summary...`;
  summaryStatus.style.color = "#1a73e8";
  summaryOutput.style.display = "none";

  const result = await generateMeetingSummary(type);

  // Re-enable all buttons
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
      console.log("✅ [CHECK] Meeting detected:", response.meetingId, "Tab:", response.tabId);

      if (currentMeetingId !== response.meetingId) {
        console.log("🆕 [CHECK] New meeting, activating...");
        activateMeeting(response.meetingId, response.tabId);
      } else if (response.tabId !== currentMeetTabId) {
        console.log("🔄 [CHECK] Tab ID changed:", response.tabId);
        currentMeetTabId = response.tabId;
      } else {
        console.log("✅ [CHECK] Meeting already active");
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

  // Receive captions from content script (via background)
  if (message.action === "captionFromMeet" && message.caption) {
    console.log("📥 [CAPTION] Received from Meet:", message.caption.text);
    processCaptionFromMeet(message.caption.text);
  }
});

async function activateMeeting(meetingId, tabId) {
  console.log("🎯 [ACTIVATE] Activating meeting:", meetingId, "Tab:", tabId);

  currentMeetingId = meetingId;
  currentMeetTabId = tabId; // Store the tab ID

  console.log("🎯 [ACTIVATE] Setting UI...");
  meetingIdDisplay.innerHTML = `📋 Meeting ID: <strong>${meetingId}</strong>`;
  waitingMessage.style.display = "none";
  featuresContainer.style.display = "flex";

  console.log("🎯 [ACTIVATE] Initializing meeting data...");
  await initCurrentMeeting(meetingId);

  const storageInfo = await getStorageUsage();
  console.log(`💾 [ACTIVATE] Storage: ${storageInfo.percentage}% used`);

  console.log("✅ [ACTIVATE] Meeting activated successfully!");
}

async function endCurrentMeeting() {
  if (!currentMeetingId || !currentMeetingData) return;

  // Stop captions if enabled
  if (isCaptionsEnabled) {
    disableCaptions();
  }

  // Auto-generate comprehensive summary if captions exist and no summary yet
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

async function initSessions() {
  try {
    // Check if LanguageModel API is available
    if (typeof LanguageModel === 'undefined') {
      throw new Error("LanguageModel API not available");
    }

    console.log("Creating text session...");
    textSession = await LanguageModel.create({
      initialPrompts: [
        {
          role: "system",
          content: "You are a meeting assistant who extracts actionable items and follow-up tasks from meeting notes."
        }
      ]
    });
    console.log("✅ Text session ready");

    console.log("Creating image session (multimodal)...");
    imageSession = await LanguageModel.create({
      initialPrompts: [
        {
          role: "system",
          content: "You are a meeting analyst who interprets screenshots and extracts important discussion points and follow-up actions."
        }
      ],
      multimodal: true
    });
    console.log("✅ Image session ready");

    // Initialize Summary Session for meeting summarization
    console.log("Creating summary session...");
    summarySession = await LanguageModel.create({
      initialPrompts: [
        {
          role: "system",
          content: "You are an expert meeting summarizer. You analyze meeting transcripts and create clear, concise, and well-structured summaries that highlight key discussion points, decisions, action items, and important topics. Format your summaries with proper structure using markdown when appropriate."
        }
      ]
    });
    console.log("✅ Summary session ready");

    // Initialize Rewriter API
    try {
      if (typeof ai !== 'undefined' && ai.rewriter) {
        rewriterSession = await ai.rewriter.create({
          sharedContext: "Meeting conversation transcript"
        });
        console.log("✅ Rewriter API ready");
      } else {
        console.warn("⚠️ Rewriter API not available (ai.rewriter not found)");
      }
    } catch (err) {
      console.warn("⚠️ Rewriter API error:", err);
    }

    // Initialize Translator API (example for Hindi)
    try {
      if (typeof translation !== 'undefined' && translation.createTranslator) {
        translatorSession = await translation.createTranslator({
          sourceLanguage: 'en',
          targetLanguage: 'hi'
        });
        console.log("✅ Translator API ready");
      } else {
        console.warn("⚠️ Translator API not available (translation not found)");
      }
    } catch (err) {
      console.warn("⚠️ Translator API error:", err);
    }

    status.textContent = "✅ Prompt API ready.";
    console.log("✅ Sessions initialized");
  } catch (err) {
    console.error(err);
    status.textContent = "❌ Prompt API not supported. Enable chrome://flags → #prompt-api-for-gemini-nano";
  }
}

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
          <h4>📊 Meeting Summary (${meeting.summary.type})</h4>
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
              <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">
                <div style="font-size: 11px; color: #666; margin-bottom: 4px;">${new Date(c.timestamp).toLocaleTimeString()}</div>
                <div>${c.simplified}</div>
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
  
  // Export as Markdown button
  const markdownBtn = card.querySelector(".export-markdown-btn");
  markdownBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    await exportMeetingAsMarkdown(meeting);
  });

  // Export as PDF button
  const pdfBtn = card.querySelector(".export-pdf-btn");
  pdfBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    exportMeetingAsPDF(meeting);
  });

  // Delete button
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
    
    if (e.target.classList.contains("delete-meeting-btn")) {
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

  // Build Markdown content
  let markdown = `# Meeting: ${meeting.meetingId}\n\n`;
  markdown += `**Date:** ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}\n`;
  markdown += `**Duration:** ${duration}\n`;
  markdown += `**Status:** ${endDate ? "Completed" : "Ongoing"}\n\n`;

  markdown += `---\n\n`;

  // Notes
  if (meeting.notes) {
    markdown += `## 📝 Meeting Notes\n\n`;
    markdown += `${meeting.notes}\n\n`;
  }

  // Actionables
  if (meeting.actionables) {
    markdown += `## ✅ Actionable Items\n\n`;
    markdown += `${meeting.actionables}\n\n`;
  }

  // Summary
  if (meeting.summary) {
    markdown += `## 📊 Meeting Summary (${meeting.summary.type})\n\n`;
    markdown += `${meeting.summary.content}\n\n`;
    markdown += `*Generated: ${new Date(meeting.summary.generatedAt).toLocaleString()}*\n`;
    markdown += `*Based on ${meeting.summary.captionCount} captions*\n\n`;
  }

  // Captions
  if (meeting.captions && meeting.captions.length > 0) {
    markdown += `## 💬 Live Captions (${meeting.captions.length})\n\n`;
    meeting.captions.forEach(caption => {
      const time = new Date(caption.timestamp).toLocaleTimeString();
      markdown += `**[${time}]** ${caption.simplified || caption.original}\n\n`;
    });
  }

  // Screenshots
  if (meeting.screenshots && meeting.screenshots.length > 0) {
    markdown += `## 📸 Screenshots & Analysis (${meeting.screenshots.length})\n\n`;
    meeting.screenshots.forEach((ss, idx) => {
      const time = new Date(ss.timestamp).toLocaleString();
      markdown += `### Screenshot ${idx + 1}\n`;
      markdown += `**Time:** ${time}\n\n`;
      if (ss.analysis) {
        markdown += `**Analysis:**\n${ss.analysis}\n\n`;
      }
      markdown += `---\n\n`;
    });
  }

  markdown += `\n\n---\n`;
  markdown += `*Exported from MeetMate on ${new Date().toLocaleString()}*\n`;

  // Copy to clipboard
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

  // Create a printable HTML document
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

  // Notes
  if (meeting.notes) {
    html += `
  <h2>📝 Meeting Notes</h2>
  <p>${meeting.notes.replace(/\n/g, '<br>')}</p>
`;
  }

  // Actionables
  if (meeting.actionables) {
    html += `
  <h2>✅ Actionable Items</h2>
  <p>${meeting.actionables.replace(/\n/g, '<br>')}</p>
`;
  }

  // Summary
  if (meeting.summary) {
    html += `
  <h2>📊 Meeting Summary (${meeting.summary.type})</h2>
  <p>${meeting.summary.content.replace(/\n/g, '<br>')}</p>
  <p style="color: #666; font-size: 0.9em; font-style: italic;">
    Generated: ${new Date(meeting.summary.generatedAt).toLocaleString()} |
    Based on ${meeting.summary.captionCount} captions
  </p>
`;
  }

  // Captions
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

  // Screenshots
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

  // Wait for content to load, then trigger print dialog
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

// Feature 1: Extract actionable items
extractBtn.addEventListener("click", async () => {
  if (!currentMeetingId) {
    outputDiv.textContent = "⚠️ No active meeting. Please join a meeting first.";
    return;
  }

  if (!textSession) {
    outputDiv.textContent = "⚠️ Session not ready. Please wait...";
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
    
    currentMeetingData.actionables = result;
    await saveCurrentMeeting();
    
    console.log("📝 Extracted items for meeting:", currentMeetingId);
  } catch (err) {
    console.error(err);
    outputDiv.textContent = `⚠️ Failed to extract items: ${err.message}`;
    
    if (err.message.includes("QUOTA_BYTES")) {
      await handleStorageQuotaExceeded();
    }
  }
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
translateBtn.addEventListener("click", toggleSimplification);

// Feature 4: Summary controls
summaryQuickBtn.addEventListener("click", () => handleSummaryGeneration('quick'));
summaryComprehensiveBtn.addEventListener("click", () => handleSummaryGeneration('comprehensive'));
summaryActionsBtn.addEventListener("click", () => handleSummaryGeneration('actions'));
summaryDecisionsBtn.addEventListener("click", () => handleSummaryGeneration('decisions'));
summaryTopicsBtn.addEventListener("click", () => handleSummaryGeneration('topics'));

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
//last updated
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
let checkInterval = null;
let saveTimeout = null;
let currentMeetingData = null;
let analysisQueue = [];
let isAnalyzing = false;
let isGeneratingSummary = false; // Track summary generation state

// Caption-related variables
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let isTranslating = false;
let captionInterval = null;

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

// Caption functionality
async function startCaptions() {
  if (isRecording) return;
  
  try {
    captionStatus.textContent = "🎤 Requesting microphone...";
    
    // Request tab audio from the active Meet tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes("meet.google.com")) {
      captionStatus.textContent = "⚠️ Please open Google Meet first";
      return;
    }
    
    // Get tab audio stream
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tab.id
    });
    
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      }
    });
    
    isRecording = true;
    startCaptionBtn.disabled = true;
    stopCaptionBtn.disabled = false;
    translateBtn.disabled = false;
    captionStatus.textContent = "🎤 Recording...";
    startCaptionBtn.classList.add("recording");
    
    // Process audio in chunks every 5 seconds
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm'
    });
    
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = async () => {
      if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await processAudioChunk(audioBlob);
        audioChunks = [];
      }
    };
    
    mediaRecorder.start();
    
    // Process every 5 seconds
    captionInterval = setInterval(async () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        setTimeout(() => {
          if (isRecording) {
            audioChunks = [];
            mediaRecorder.start();
          }
        }, 100);
      }
    }, 5000);
    
  } catch (err) {
    console.error("Caption error:", err);
    captionStatus.textContent = `⚠️ Failed: ${err.message}`;
    resetCaptionUI();
  }
}

async function processAudioChunk(audioBlob) {
  try {
    // Note: Chrome's Prompt API with audio is experimental
    // For now, we'll use Web Speech API as a fallback
    // In production, you'd use the Prompt API when available
    
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("📝 Transcript:", transcript);
      
      // Simplify using Rewriter API
      let simplified = transcript;
      
      if (rewriterSession) {
        try {
          simplified = await rewriterSession.rewrite(transcript, {
            tone: "more-casual",
            length: "shorter"
          });
        } catch (err) {
          console.error("Rewriter error:", err);
        }
      }
      
      // Translate if enabled
      if (isTranslating && translatorSession) {
        try {
          simplified = await translatorSession.translate(simplified);
        } catch (err) {
          console.error("Translation error:", err);
        }
      }
      
      await addCaption(transcript, simplified);
    };
    
    recognition.onerror = (event) => {
      console.error("Recognition error:", event.error);
    };
    
    // Convert blob to audio for recognition
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    recognition.start();
    audio.play();
    
    setTimeout(() => {
      recognition.stop();
      URL.revokeObjectURL(audioUrl);
    }, 5000);
    
  } catch (err) {
    console.error("Audio processing error:", err);
  }
}

function stopCaptions() {
  isRecording = false;
  
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
  
  if (captionInterval) {
    clearInterval(captionInterval);
    captionInterval = null;
  }
  
  resetCaptionUI();
  captionStatus.textContent = "✅ Recording stopped";
}

function resetCaptionUI() {
  startCaptionBtn.disabled = false;
  stopCaptionBtn.disabled = true;
  translateBtn.disabled = true;
  startCaptionBtn.classList.remove("recording");
  isRecording = false;
}

function toggleTranslation() {
  isTranslating = !isTranslating;

  if (isTranslating) {
    translateBtn.style.background = "#34a853";
    translateBtn.textContent = "🌐 Translating...";
    captionStatus.textContent = "🌐 Translation enabled";
  } else {
    translateBtn.style.background = "#1a73e8";
    translateBtn.textContent = "🌐 Translate";
    captionStatus.textContent = "🎤 Recording...";
  }
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
  if (!currentMeetingId) {
    summaryStatus.textContent = "⚠️ No active meeting";
    summaryStatus.style.color = "#d93025";
    return;
  }

  if (!summarySession) {
    summaryStatus.textContent = "⚠️ Summary session not ready. Please wait...";
    summaryStatus.style.color = "#d93025";
    return;
  }

  if (isGeneratingSummary) {
    summaryStatus.textContent = "⏳ Already generating summary...";
    summaryStatus.style.color = "#666";
    return;
  }

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

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "meetingStarted" && message.meetingId) {
    activateMeeting(message.meetingId);
  }
});

async function activateMeeting(meetingId) {
  currentMeetingId = meetingId;
  meetingIdDisplay.innerHTML = `📋 Meeting ID: <strong>${meetingId}</strong>`;
  waitingMessage.style.display = "none";
  featuresContainer.style.display = "flex";
  
  await initCurrentMeeting(meetingId);
  
  const storageInfo = await getStorageUsage();
  console.log(`💾 Storage: ${storageInfo.percentage}% used`);
  
  console.log("✅ Meeting activated:", meetingId);
}

async function endCurrentMeeting() {
  if (!currentMeetingId || !currentMeetingData) return;

  // Stop captions if recording
  if (isRecording) {
    stopCaptions();
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
}

async function initSessions() {
  try {
    textSession = await LanguageModel.create({
      initialPrompts: [
        {
          role: "system",
          content: "You are a meeting assistant who extracts actionable items and follow-up tasks from meeting notes."
        }
      ]
    });

    imageSession = await LanguageModel.create({
      initialPrompts: [
        {
          role: "system",
          content: "You are a meeting analyst who interprets screenshots and extracts important discussion points and follow-up actions."
        }
      ],
      expectedInputs: [{ type: "image" }]
    });

    // Initialize Summary Session for meeting summarization
    try {
      summarySession = await LanguageModel.create({
        initialPrompts: [
          {
            role: "system",
            content: "You are an expert meeting summarizer. You analyze meeting transcripts and create clear, concise, and well-structured summaries that highlight key discussion points, decisions, action items, and important topics. Format your summaries with proper structure using markdown when appropriate."
          }
        ]
      });
      console.log("✅ Summary session ready");
    } catch (err) {
      console.warn("⚠️ Summary session not available:", err);
    }

    // Initialize Rewriter API
    try {
      rewriterSession = await ai.rewriter.create({
        sharedContext: "Meeting conversation transcript"
      });
      console.log("✅ Rewriter API ready");
    } catch (err) {
      console.warn("⚠️ Rewriter API not available:", err);
    }

    // Initialize Translator API (example for Hindi)
    try {
      translatorSession = await translation.createTranslator({
        sourceLanguage: 'en',
        targetLanguage: 'hi'
      });
      console.log("✅ Translator API ready");
    } catch (err) {
      console.warn("⚠️ Translator API not available:", err);
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
      <div style="display: flex; gap: 8px; align-items: center;">
        <span class="meeting-time">${dateStr} at ${timeStr}</span>
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

// Initialize
checkMeetingStatus();
initSessions();
checkInterval = setInterval(checkMeetingStatus, 2000);

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
startCaptionBtn.addEventListener("click", startCaptions);
stopCaptionBtn.addEventListener("click", stopCaptions);
translateBtn.addEventListener("click", toggleTranslation);

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
  if (isRecording) stopCaptions();
});
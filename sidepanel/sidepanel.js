/* global chrome */

// ===== DOM ELEMENTS =====
const status = document.getElementById("status");

// Tab navigation
const tabNotes = document.getElementById("tabNotes");
const tabScreenshots = document.getElementById("tabScreenshots");
const tabSummary = document.getElementById("tabSummary");

const contentNotes = document.getElementById("contentNotes");
const contentScreenshots = document.getElementById("contentScreenshots");
const contentSummary = document.getElementById("contentSummary");

// Feature 1: Notes & Action Items
const notesField = document.getElementById("notes");
const extractBtn = document.getElementById("extractBtn");
const outputDiv = document.getElementById("output");

// Feature 2: Screenshot Capture
const captureBtn = document.getElementById("captureBtn");
const gallery = document.getElementById("gallery");
const modal = document.getElementById("modal");
const modalImage = document.getElementById("modalImage");
const modalAnalysis = document.getElementById("modalAnalysis");
const closeModal = document.getElementById("closeModal");

// Feature 3: Meeting Summary
const generateSummaryBtn = document.getElementById("generateSummaryBtn");
const summaryOutput = document.getElementById("summaryOutput");
const emailDraftBtn = document.getElementById("emailDraftBtn");
const emailOutput = document.getElementById("emailOutput");

// ===== STATE =====
let textSession;
let imageSession;
let summarizerSession;
let writerSession;
const screenshots = []; // { dataUri, blob, analysis }
let meetingNotes = "";

// ===== TAB NAVIGATION =====
function switchTab(activeTab, activeContent) {
  // Remove active from all
  [tabNotes, tabScreenshots, tabSummary].forEach((tab) =>
    tab.classList.remove("active")
  );
  [contentNotes, contentScreenshots, contentSummary].forEach((content) =>
    content.classList.remove("active")
  );

  // Add active to selected
  activeTab.classList.add("active");
  activeContent.classList.add("active");
}

tabNotes.addEventListener("click", () => switchTab(tabNotes, contentNotes));
tabScreenshots.addEventListener("click", () =>
  switchTab(tabScreenshots, contentScreenshots)
);
tabSummary.addEventListener("click", () =>
  switchTab(tabSummary, contentSummary)
);

// ===== INITIALIZATION =====
async function initSessions() {
  try {
    // Check if AI APIs are available
    if (!self.ai || !self.ai.languageModel) {
      throw new Error("Prompt API not available");
    }

    // Text-based session for action item extraction
    textSession = await self.ai.languageModel.create({
      systemPrompt:
        "You are a meeting assistant who extracts actionable items and follow-up tasks from meeting notes. Format the output as a clear list with tasks, assignees (if mentioned), and deadlines (if mentioned).",
    });

    // Image-based session for screenshot analysis
    imageSession = await self.ai.languageModel.create({
      systemPrompt:
        "You are a meeting analyst who interprets screenshots from presentations and meetings. Extract key points, important information, and action items from the visual content.",
    });

    // Summarizer for meeting summaries
    if (self.ai.summarizer) {
      summarizerSession = await self.ai.summarizer.create({
        type: "key-points",
        format: "markdown",
        length: "medium",
      });
    }

    // Writer for email drafts
    if (self.ai.writer) {
      writerSession = await self.ai.writer.create({
        tone: "formal",
        format: "markdown",
        length: "medium",
      });
    }

    updateStatus("✅ AI ready! Start taking notes or capturing slides.", "success");
  } catch (err) {
    console.error("Initialization error:", err);
    updateStatus(
      "❌ AI not available. Enable chrome://flags/#prompt-api-for-gemini-nano",
      "error"
    );
  }
}

function updateStatus(message, type = "") {
  status.textContent = message;
  status.className = "status-bar";
  if (type) status.classList.add(type);
}

// ===== FEATURE 1: ACTION ITEM EXTRACTION =====
extractBtn.addEventListener("click", async () => {
  if (!textSession) {
    updateStatus("⚠️ Text session not ready", "error");
    return;
  }

  const text = notesField.value.trim();
  if (!text) {
    outputDiv.textContent = "Please enter meeting notes first.";
    return;
  }

  meetingNotes = text;
  outputDiv.innerHTML = '<span class="loading"></span> Extracting action items...';

  try {
    const result = await textSession.prompt(
      `Extract actionable tasks and follow-up points from these meeting notes:\n\n${text}`
    );
    outputDiv.textContent = result;
    updateStatus("✅ Action items extracted", "success");
  } catch (err) {
    console.error(err);
    outputDiv.textContent = "⚠️ Failed to extract items. Try again.";
    updateStatus("❌ Extraction failed", "error");
  }
});

// Auto-save notes
notesField.addEventListener("input", () => {
  meetingNotes = notesField.value;
  chrome.storage.local.set({ meetingNotes });
});

// Load saved notes on startup
chrome.storage.local.get(["meetingNotes"], (result) => {
  if (result.meetingNotes) {
    notesField.value = result.meetingNotes;
    meetingNotes = result.meetingNotes;
  }
});

// ===== FEATURE 2: SCREENSHOT CAPTURE & ANALYSIS =====
captureBtn.addEventListener("click", async () => {
  if (!imageSession) {
    updateStatus("⚠️ Image analysis not ready", "error");
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
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
    thumb.title = "Click to analyze";
    gallery.appendChild(thumb);

    thumb.addEventListener("click", () => openModal(index));

    updateStatus(`✅ Screenshot ${index + 1} captured`, "success");

    // Save to storage
    saveScreenshots();
  } catch (err) {
    console.error(err);
    updateStatus("❌ Failed to capture screenshot", "error");
  }
});

// Save screenshots to storage
function saveScreenshots() {
  const screenshotData = screenshots.map(s => ({
    dataUri: s.dataUri,
    analysis: s.analysis
  }));
  chrome.storage.local.set({ screenshots: screenshotData });
}

// Load saved screenshots
chrome.storage.local.get(["screenshots"], (result) => {
  if (result.screenshots && result.screenshots.length > 0) {
    result.screenshots.forEach(async (saved, index) => {
      const res = await fetch(saved.dataUri);
      const blob = await res.blob();
      screenshots.push({ dataUri: saved.dataUri, blob, analysis: saved.analysis });

      const thumb = document.createElement("img");
      thumb.src = saved.dataUri;
      thumb.dataset.index = index;
      thumb.title = "Click to analyze";
      gallery.appendChild(thumb);

      thumb.addEventListener("click", () => openModal(index));
    });
  }
});

// ===== MODAL FOR SCREENSHOT ANALYSIS =====
async function openModal(index) {
  const shot = screenshots[index];
  modal.style.display = "flex";
  modalImage.src = shot.dataUri;

  // If already analyzed, show it
  if (shot.analysis) {
    modalAnalysis.textContent = shot.analysis;
    return;
  }

  // Otherwise, analyze now
  modalAnalysis.innerHTML = '<span class="loading"></span> Analyzing screenshot...';

  try {
    const response = await imageSession.prompt([
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this meeting screenshot. Extract key discussion points, important information, and any action items visible.",
          },
          { type: "image", image: shot.blob },
        ],
      },
    ]);

    shot.analysis = response;
    modalAnalysis.textContent = response;

    // Save updated screenshots
    saveScreenshots();
  } catch (err) {
    console.error(err);
    modalAnalysis.textContent =
      "⚠️ Failed to analyze this screenshot. The Prompt API might not support image input yet.";
  }
}

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

// Close modal on outside click
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// ===== FEATURE 3: MEETING SUMMARY =====
generateSummaryBtn.addEventListener("click", async () => {
  const notes = notesField.value.trim();
  const capturedSlides = screenshots.filter((s) => s.analysis).length;

  if (!notes && capturedSlides === 0) {
    summaryOutput.textContent = "No notes or slides to summarize. Add some content first!";
    return;
  }

  summaryOutput.innerHTML = '<span class="loading"></span> Generating meeting summary...';

  try {
    let summaryText = "";

    // Combine notes and screenshot analyses
    if (notes) {
      summaryText += `Meeting Notes:\n${notes}\n\n`;
    }

    if (capturedSlides > 0) {
      summaryText += `Captured Slides (${capturedSlides}):\n`;
      screenshots
        .filter((s) => s.analysis)
        .forEach((s, i) => {
          summaryText += `\nSlide ${i + 1}: ${s.analysis}\n`;
        });
    }

    // Generate summary using Summarizer API or Prompt API fallback
    let summary;
    if (summarizerSession) {
      summary = await summarizerSession.summarize(summaryText);
    } else if (textSession) {
      summary = await textSession.prompt(
        `Provide a comprehensive meeting summary of the following content:\n\n${summaryText}`
      );
    } else {
      throw new Error("No summarization capability available");
    }

    summaryOutput.textContent = summary;
    updateStatus("✅ Summary generated", "success");

    // Show email draft button
    emailDraftBtn.style.display = "inline-block";
  } catch (err) {
    console.error(err);
    summaryOutput.textContent = "⚠️ Failed to generate summary. Try again.";
    updateStatus("❌ Summary generation failed", "error");
  }
});

// ===== FEATURE 4: EMAIL DRAFT =====
emailDraftBtn.addEventListener("click", async () => {
  const summary = summaryOutput.textContent.trim();
  const actionItems = outputDiv.textContent.trim();

  if (!summary) {
    emailOutput.textContent = "Generate a summary first!";
    return;
  }

  emailOutput.innerHTML = '<span class="loading"></span> Drafting follow-up email...';

  try {
    const emailPrompt = `Write a professional follow-up email for a meeting with the following summary and action items:

Summary:
${summary}

${actionItems ? `Action Items:\n${actionItems}` : ""}

The email should include:
- A brief thank you
- Key points discussed
- Action items (if any)
- Next steps
- Professional closing`;

    let emailDraft;
    if (writerSession) {
      emailDraft = await writerSession.write(emailPrompt);
    } else if (textSession) {
      emailDraft = await textSession.prompt(emailPrompt);
    } else {
      throw new Error("No writer capability available");
    }

    emailOutput.textContent = emailDraft;
    updateStatus("✅ Email draft ready", "success");
  } catch (err) {
    console.error(err);
    emailOutput.textContent = "⚠️ Failed to draft email. Try again.";
    updateStatus("❌ Email draft failed", "error");
  }
});

// ===== START APP =====
initSessions();

# 🧠 MeetMate - AI Meeting Co-Pilot

> **Never miss a detail, action item, or slide again**

MeetMate is a Chrome extension that lives inside Google Meet, providing real-time AI assistance during meetings using Chrome's Built-in AI APIs. All processing happens locally on your device for maximum privacy and zero API costs.

**Built for:** [Google Chrome Built-in AI Challenge 2025](https://googlechromeai.devpost.com/)

---

## ✨ Features

### 📝 Smart Note-Taking & Action Item Detection
- Type meeting notes directly in the side panel
- AI automatically extracts actionable tasks and follow-up items
- Notes are auto-saved locally

### 📸 Screenshot Capture & Analysis (Multimodal AI)
- One-click capture of shared presentations and slides
- AI analyzes images to extract key points and action items
- Click thumbnails to view full-size with AI analysis
- All captures persist across meetings

### 📋 Meeting Summary Generator
- Combines your notes + captured slides
- Generates comprehensive meeting summary
- Multiple format options

### 📧 Follow-Up Email Drafter
- Auto-generates professional follow-up emails
- Includes summary, action items, and next steps
- Ready to copy and send

---

## 🚀 Demo

[Demo video coming soon]

**Screenshots:**

*Side panel with notes and action items*

*Screenshot gallery with AI analysis*

*Meeting summary and email draft*

---

## 🛠️ Tech Stack

### Chrome Built-in AI APIs Used:
- **Prompt API (text)** - Action item extraction, meeting summaries
- **Prompt API (multimodal - images)** - Screenshot analysis, slide content extraction
- **Summarizer API** - Condensing meeting notes into summaries
- **Writer API** - Generating professional follow-up emails

### Browser APIs:
- `chrome.sidePanel` - Side panel UI
- `chrome.tabs.captureVisibleTab` - Screenshot capture
- `chrome.storage.local` - Local data persistence
- `chrome.scripting` - Content script injection

### Technologies:
- Vanilla JavaScript (ES6+)
- CSS3 with modern gradients and animations
- Rollup for bundling
- Manifest V3

---

## 📋 Requirements

### System Requirements:
- **Chrome/Brave:** Version 138+ (141+ recommended)
- **Storage:** At least 22 GB free space (for Gemini Nano model)
- **Hardware:** Either >4GB VRAM OR 16GB+ RAM with 4+ cores
- **Connection:** Unmetered internet for initial model download

### Chrome Flags to Enable:
1. Go to `chrome://flags/`
2. Enable these flags:
   - `#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**
   - `#prompt-api-for-gemini-nano` → **Enabled**
   - `#summarization-api-for-gemini-nano` → **Enabled**
   - `#writer-api-for-gemini-nano` → **Enabled**
3. Restart Chrome

---

## 🔧 Installation

### Option 1: Install from Release (Recommended)
1. Download the latest release from [Releases](../../releases)
2. Extract the ZIP file
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer mode** (toggle in top-right)
5. Click **Load unpacked**
6. Select the extracted `dist` folder
7. Join a Google Meet to start using MeetMate!

### Option 2: Build from Source
```bash
# Clone the repository
git clone https://github.com/yourusername/MeetMate.git
cd MeetMate

# Install dependencies
npm install

# Build the extension
npm run build

# The built extension will be in the 'dist' folder
```

Then follow steps 3-7 from Option 1, selecting the `dist` folder.

---

## 📖 Usage Guide

### Getting Started
1. **Join a Google Meet**
   - The MeetMate side panel will open automatically
   - Or click the MeetMate extension icon if it doesn't

2. **Take Notes**
   - Switch to the "📝 Notes" tab
   - Type your meeting notes
   - Click "🤖 Extract Action Items" to get AI-extracted tasks

3. **Capture Slides**
   - Switch to the "📸 Captures" tab
   - Click "📸 Capture Screenshot" when important slides appear
   - Click thumbnails to view AI analysis

4. **Generate Summary**
   - Switch to the "📋 Summary" tab
   - Click "✨ Generate Summary"
   - Optionally click "📧 Draft Follow-up Email"

### Tips & Tricks
- **Auto-save:** Your notes are automatically saved
- **Persistent captures:** Screenshots remain available across sessions
- **Privacy-first:** All processing happens locally on your device
- **Works offline:** Once the AI model is downloaded, MeetMate works offline

---

## 🎯 Chrome AI Challenge - Prize Categories

MeetMate targets these prize categories:

### 🏆 Most Helpful Extension ($14,000)
- Solves real meeting pain points (information overload, missed action items)
- Broad appeal to remote workers, students, managers
- Daily utility for millions of users

### 🎨 Best Multimodal AI Application ($9,000)
- Screenshot analysis using Prompt API with image input
- Visual content extraction from slides and whiteboards
- Text extraction (OCR) from shared screens

### 🔄 Best Hybrid AI Application ($9,000)
- Showcases local AI processing (privacy mode)
- Demonstrates cost savings (zero API costs)
- Falls back gracefully when APIs unavailable

---

## 🏗️ Architecture

```
meetmate/
├── manifest.json              # Extension configuration
├── background.js              # Service worker (Meet detection)
├── sidepanel/
│   ├── sidepanel.html        # Side panel UI
│   ├── sidepanel.css         # Modern styling
│   └── sidepanel.js          # AI logic & features
├── images/                   # Extension icons
└── dist/                     # Built extension (after npm run build)
```

### Data Flow:
```
User joins Google Meet
    ↓
Content script detects meeting URL
    ↓
Side panel opens automatically
    ↓
User types notes or captures screenshots
    ↓
AI processes locally using Chrome APIs
    ↓
Results displayed in side panel
    ↓
Data saved to chrome.storage.local
```

---

## 🔒 Privacy & Security

- ✅ **100% Local Processing** - All AI runs on your device
- ✅ **No Cloud APIs** - Zero data sent to external servers
- ✅ **No Telemetry** - We don't track your usage
- ✅ **Secure Storage** - Data saved only to chrome.storage.local
- ✅ **Open Source** - Audit the code yourself

---

## 🐛 Troubleshooting

### "AI not available" Error
1. Verify you're on Chrome 138+ (check `chrome://version/`)
2. Enable all required flags (see Requirements section)
3. Restart Chrome completely
4. Check storage space (need 22+ GB free)
5. Try creating a session manually in DevTools:
   ```javascript
   await ai.languageModel.availability()
   ```

### Side Panel Won't Open
- Click the MeetMate extension icon manually
- Look for floating 🧠 button in bottom-right of Meet window
- Check `chrome://extensions/` - ensure MeetMate is enabled

### Screenshot Capture Fails
- Grant tab capture permissions when prompted
- Ensure you're on a Google Meet page
- Try refreshing the Meet page

### Image Analysis Not Working
- Multimodal Prompt API is experimental
- Ensure flag `#prompt-api-for-gemini-nano` is enabled
- Update to Chrome 141+ for better multimodal support

---

## 🛣️ Roadmap

### v1.1 (Post-Hackathon)
- [ ] Zoom support
- [ ] Real-time caption simplification (accessibility)
- [ ] Pre-meeting prep assistant
- [ ] Export to Google Docs, Notion
- [ ] Meeting templates

### v2.0 (Future)
- [ ] Hybrid mode (local + cloud Gemini API option)
- [ ] Team collaboration features
- [ ] Custom AI prompts
- [ ] Multi-language support
- [ ] Voice commands

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

### Development Setup
```bash
# Install dependencies
npm install

# Make your changes to source files

# Build extension
npm run build

# Test in Chrome by loading the 'dist' folder
```

### Code Style
- ES6+ JavaScript
- Functional programming preferred
- Clear comments for complex logic
- Keep it simple and readable

---

## 📜 License

[MIT License](LICENSE) - feel free to use this project for learning or commercial purposes.

---

## 🙏 Acknowledgments

- **Chrome Team** - For building amazing Built-in AI APIs
- **Google Chrome AI Challenge** - For the hackathon opportunity
- **Devpost** - For hosting the challenge

---

## 📬 Contact

**Developer:** [Your Name]

**Email:** your.email@example.com

**GitHub:** [@yourusername](https://github.com/yourusername)

**Project Link:** [https://github.com/yourusername/MeetMate](https://github.com/yourusername/MeetMate)

**Devpost:** [MeetMate Submission](https://devpost.com/your-submission)

---

## 🌟 Star History

If you find MeetMate helpful, please give it a ⭐ on GitHub!

---

**Built with ❤️ for the Google Chrome Built-in AI Challenge 2025**

*Tagline: "Never miss a detail, action item, or slide again"*

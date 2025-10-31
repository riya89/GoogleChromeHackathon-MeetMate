# MeetMate - AI Meeting Co-Pilot

MeetMate is a Chrome extension that lives inside Google Meet, providing real-time AI assistance during meetings using Chrome's Built-in AI APIs. All processing happens locally on your device for maximum privacy and zero API costs.

**Built for:** [Google Chrome Built-in AI Challenge 2025](https://googlechromeai.devpost.com/)
---

## Features

### Smart Note-Taking & Action Item Detection

### Screenshot Capture & Analysis (Multimodal AI)

### Meeting Summary Generator

### Real-time simplified/translated captions

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
- Manifest V3

---

## Requirements

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
   - `#translation-api` → **Enabled**
   - `#prompt-api-for-gemini-nano-multimodal-input` → **Enabled**
3. Restart Chrome

---

## Installation

```bash
# Clone the repository
https://github.com/riya89/GoogleChromeHackathon-MeetMate.git
cd MeetMate

# Install dependencies
npm install

# Build the extension
npm run build

# The built extension will be in the 'dist' folder
```
Then,
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the extracted `dist` folder
5. Join a Google Meet to start using MeetMate!

---

## 📖 Usage Guide

### Getting Started
1. **Join a Google Meet**
   - The MeetMate side panel will open automatically
   - Or click the MeetMate extension icon if it doesn't

2. **Take Notes**
   - Switch to the "📝 Notes" tab
   - Type your meeting notes

3. **Capture Slides**
   - Switch to the "Captures" tab
   - Click "Capture Screenshot" when important slides appear

3. **Caption**
   - Switch to the either "simplified" or "translated" for the respective caption

4. **Generate Summary**
   - Switch to the "Past Meeting" tab
   - Click on the meeting you want to see summary
   - Optionally click of PDF/Markdown option to export the summary

### Tips & Tricks
- **Auto-save:** Your notes are automatically saved
- **Persistent captures:** Screenshots remain available across sessions
- **Privacy-first:** All processing happens locally on your device
- **Works offline:** Once the AI model is downloaded, MeetMate works offline

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
- Look for floating 💬 button in bottom-right of Meet window
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

### Code Style
- ES6+ JavaScript
- Functional programming preferred
- Clear comments for complex logic
- Keep it simple and readable

---

## 📜 License

Feel free to use this project for learning or commercial purposes.

---

## 🙏 Acknowledgments

- **Chrome Team** - For building amazing Built-in AI APIs
- **Google Chrome AI Challenge** - For the hackathon opportunity
- **Devpost** - For hosting the challenge

---

## 📬 Contact

**Developer:** Riya Banik

**Email:** riyabanik523@gmail.com

**GitHub:** [@Riya89](https://github.com/riya89)


---

## 🌟 Star History

If you find MeetMate helpful, please give it a ⭐ on GitHub!

---

**Built with ❤️ for the Google Chrome Built-in AI Challenge 2025**

*Tagline: "Never miss a detail, action item, or slide again"*

<div align="center">

# 🧵 Threads Unfollow Assistant (Semi-Auto)

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-6366f1?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Edge Compatible](https://img.shields.io/badge/Microsoft_Edge-Supported-0078d7?style=for-the-badge&logo=microsoftedge&logoColor=white)](https://microsoft.com/edge)
[![Chrome Compatible](https://img.shields.io/badge/Google_Chrome-Supported-4285f4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://google.com/chrome)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg?style=for-the-badge)](LICENSE)

**A sleek, modern, zero-touch Chrome & Edge browser extension to detect non-followers on Threads (threads.com) and perform semi-automated unfollows with humanized delay pacing.**

[Key Features](#-key-features) • [Installation](#-installation-guide) • [Usage](#-how-to-use) • [Architecture](#-architecture)

</div>

---

## ✨ Key Features

- **⚡ 1-Click Zero-Touch Auto-Scan**: Auto-navigates to your Threads profile, opens the Followers modal, and harvests all followers and following accounts automatically.
- **📜 Infinite Scroll Harvester**: Automatically scrolls the modal and triggers loading spinners until 100% of followers and following accounts are collected.
- **🎯 Dynamic Non-Followers Detection**: Instantly compares your followers vs. following lists and displays users who don't follow back.
- **🚀 Mode Fast (Instant Unfollow)**: Toggle between instant unfollows or humanized randomized safety delays (e.g., 8–18 seconds).
- **🛡️ Whitelist Protection**: Mark favorite or important accounts to prevent accidental unfollows.
- **🔄 Live UI & DevTools Console Sync**: Unfollowed accounts immediately vanish from the list in real-time. Detailed logs are printed directly to Edge/Chrome DevTools console (`F12`).
- **🌐 Background Processing**: Works continuously even when you switch to other browser tabs.

---

## 🎨 UI Preview

Designed with a clean, dark-zinc aesthetic inspired by **Linear** and **Vercel**:

- **Segmented Controls**: Switch seamlessly between **Overview**, **Accounts List**, and **Settings**.
- **Real-Time Progress Metrics**: Active handle progress, progress bar, and instant action triggers.

---

## 🚀 Installation Guide

### Option 1: Load Unpacked (Developer Mode)

1. **Clone or Download** this repository:
   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/threads-unfollow-assistant.git
   ```
2. Open your browser extensions page:
   - **Microsoft Edge**: `edge://extensions`
   - **Google Chrome**: `chrome://extensions`
3. Turn on **Developer mode** toggle (top right/left corner).
4. Click **Load unpacked** (Muat yang tidak dikemas).
5. Select the `EXTENSION` folder.
6. The **Threads Unfollow Assistant** icon will appear in your extensions toolbar!

---

## 📖 How to Use

1. Open **[threads.com](https://www.threads.com)** in your browser and log in.
2. Click the **Threads Unfollow Assistant** icon in your extension toolbar.
3. Click **Pindai** (Scan). The extension will automatically:
   - Navigate to your profile page.
   - Open the Followers modal.
   - Harvest all Followers & Following accounts via continuous auto-scroll.
   - Compute non-followers.
4. Click **Unfollow Semi-Auto** directly on the dashboard card to start processing non-followers!

---

## 🏗️ Architecture

Built using **Manifest V3** web extension standards:

```
EXTENSION/
├── manifest.json              # Manifest V3 specification
├── popup/
│   ├── popup.html             # Clean Vercel/Linear-inspired dashboard
│   ├── popup.css              # Dark mode design system & variables
│   └── popup.js               # UI controller & runtime storage sync
├── content/
│   └── content_script.js      # DOM scanner, modal auto-scroll & unfollow simulator
├── background/
│   └── service_worker.js      # Background queue manager & state persistence
└── assets/
    ├── icon16.png             # 16x16 toolbar icon
    ├── icon48.png             # 48x48 extensions page icon
    └── icon128.png            # 128x128 high-res app icon
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

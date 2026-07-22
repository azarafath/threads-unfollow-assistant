<div align="center">

# 🧵 Threads Unfollow Assistant (Semi-Auto)

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-6366f1?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Edge Compatible](https://img.shields.io/badge/Microsoft_Edge-Supported-0078d7?style=for-the-badge&logo=microsoftedge&logoColor=white)](https://microsoft.com/edge)
[![Chrome Compatible](https://img.shields.io/badge/Google_Chrome-Supported-4285f4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://google.com/chrome)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg?style=for-the-badge)](LICENSE)

**A sleek, modern, zero-touch Chrome & Edge browser extension to detect non-followers on Threads (threads.com) and perform semi-automated unfollows with humanized pacing.**

*Ekstensi browser Chrome & Edge modern untuk mendeteksi akun tak-follback di Threads (threads.com) dan menjalankan unfollow semi-otomatis.*

[English Guide](#-english-guide) • [Panduan Bahasa Indonesia](#-panduan-bahasa-indonesia) • [Disclaimer](#-disclaimer--limitation-of-liability-dyor)

</div>

---

## 🇬🇧 English Guide

### ✨ Key Features
- **⚡ 1-Click Zero-Touch Auto-Scan**: Automatically navigates to your Threads profile, opens the Followers modal, and harvests all followers and following accounts.
- **📜 Infinite Scroll Harvester**: Scrolls the modal continuously to capture 100% of your Followers & Following lists.
- **🎯 Dynamic Non-Followers Detection**: Instantly compares your lists and highlights accounts that don't follow back.
- **🚀 Mode Fast (Instant Unfollow)**: Toggle between instant unfollows or custom randomized delay timers.
- **🛡️ Whitelist Protection**: Save important accounts to prevent accidental unfollows.
- **🌐 Background Tab Independence**: Runs continuously even when you switch to other browser tabs.

### 🚀 Installation (Load Unpacked)
1. **Clone or Download** this repository:
   ```bash
   git clone https://github.com/azarafath/threads-unfollow-assistant.git
   ```
2. Open your browser extensions page:
   - **Microsoft Edge**: `edge://extensions`
   - **Google Chrome**: `chrome://extensions`
3. Enable **Developer mode** toggle (top right/left corner).
4. Click **Load unpacked** (Muat yang tidak dikemas).
5. Select the `EXTENSION` folder.
6. The extension icon will appear in your toolbar!

### 📖 Usage Tutorial
1. Open **[threads.com](https://www.threads.com)** and log in to your account.
2. Click the **Threads Unfollow Assistant** toolbar icon.
3. Click **Pindai** (Scan). The extension will automatically handle profile navigation, modal scrolling, and data harvesting.
4. Click **Unfollow Semi-Auto** on the dashboard card to begin unfollowing non-followers automatically!

---

## 🇮🇩 Panduan Bahasa Indonesia

### ✨ Fitur Utama
- **⚡ 1-Klik Pindaian Otomatis (Zero-Touch)**: Otomatis membuka profil Threads Anda, membuka modal Followers, dan memanen seluruh akun followers & following.
- **📜 Infinite Scroll Harvester**: Menggulirkan (scroll) modal secara otomatis hingga 100% data akun terambil.
- **🎯 Deteksi Akun Tak Follback**: Membandingkan daftar followers vs following secara instan dan menampilkan siapa yang tidak followback.
- **🚀 Mode Fast (Tanpa Jeda)**: Pilihan mode unfollow instant beruntun atau jeda waktu acak yang dapat disesuaikan.
- **🛡️ Fitur Whitelist**: Simpan akun favorit agar terhindar dari unfollow yang tidak disengaja.
- **🌐 Berjalan di Background**: Proses tetap berjalan lancar meskipun Anda membuka atau berpindah ke tab browser lain.

### 🚀 Panduan Instalasi
1. **Download / Clone** repositori ini:
   ```bash
   git clone https://github.com/azarafath/threads-unfollow-assistant.git
   ```
2. Buka halaman ekstensi browser Anda:
   - **Microsoft Edge**: `edge://extensions`
   - **Google Chrome**: `chrome://extensions`
3. Aktifkan **Developer mode** (Mode pengembang) di pojok atas.
4. Klik **Load unpacked** (Muat yang tidak dikemas).
5. Pilih folder `EXTENSION`.
6. Ekstensi **Threads Unfollow Assistant** siap digunakan di toolbar browser Anda!

### 📖 Panduan Penggunaan
1. Buka halaman **[threads.com](https://www.threads.com)** di browser dan pastikan sudah login.
2. Buka popup ekstensi **Threads Unfollow Assistant** dari toolbar.
3. Klik **Pindai**. Ekstensi akan otomatis berpindah ke profil, membuka modal, dan memanen seluruh daftar akun.
4. Klik **Unfollow Semi-Auto** langsung di kartu Ringkasan utama untuk mengeksekusi unfollow secara otomatis!

---

## 🏗️ Architecture

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

## ⚠️ Disclaimer & Limitation of Liability (DYOR)

> [!CAUTION]
> **USE AT YOUR OWN RISK / DO YOUR OWN RESEARCH (DYOR)**
>
> - **Educational & Personal Use Only**: This extension is an open-source automation utility intended strictly for personal account management and educational purposes.
> - **No Official Affiliation**: This tool is **NOT** affiliated, associated, authorized, endorsed by, or in any way officially connected with **Threads**, **Meta Platforms, Inc.**, or any of their subsidiaries.
> - **Limitation of Liability**: Social media platforms maintain strict rate limits and automated behavior detection algorithms. The developer (**Ahmad Fathoni / @azarafath**) assumes **NO RESPONSIBILITY OR LIABILITY** for any account restrictions, suspensions, shadowbans, temporary blocks, or consequences resulting from the use or misuse of this extension.
> - **User Responsibility**: Users are solely responsible for complying with Threads' Terms of Service and applying reasonable delays when managing their social accounts.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

# Vibe Messenger

<p align="center">
  <img src="build/icon.png" alt="Vibe Messenger Logo" width="128" height="128">
</p>

<p align="center">
  <strong>A beautiful native desktop client for Facebook Messenger</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#development">Development</a> •
  <a href="#build">Build</a> •
  <a href="#disclaimer">Disclaimer</a>
</p>

---

## Features

✨ **Native Desktop Experience**
- Dedicated desktop application for macOS (Windows coming soon)
- No more lost browser tabs or accidental closes

🔔 **Native Notifications**
- Receive system notifications for new messages
- Fully integrated with macOS Notification Center
- Click notifications to jump directly to the conversation

⚡ **Lightning Fast**
- Built with Electron v28 for optimal performance
- Lighter than a Chrome tab
- Reduced memory footprint

🔒 **Privacy First**
- No third-party tracking or analytics
- Direct connection to Meta servers only
- Your data stays between you and Meta

🔄 **Automatic Cache Cleanup**
- Service Worker cache is automatically cleaned on startup
- Prevents corruption errors and ensures stability

💾 **Persistent Sessions**
- Stay logged in between app restarts
- No need to reconnect every time you open the app

🚀 **Launch at Startup**
- Optional auto-launch when your computer starts
- Never miss an important message

## Installation

### macOS

1. Download the latest `.dmg` file from the [releases page](https://github.com/your-repo/vibe-messenger/releases)
2. Open the DMG and drag Vibe Messenger to your Applications folder
3. Launch Vibe Messenger from your Applications

### Windows

Coming soon! 🪟

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/your-repo/vibe-messenger.git
cd vibe-messenger

# Install dependencies
npm install

# Start the app in development mode
npm start
```

### Project Structure

```
vibe-messenger/
├── main.js          # Electron main process
├── preload.js       # Preload script for IPC and notifications
├── package.json     # Project configuration
├── build/           # Build resources (icons)
└── dist/            # Distribution files (after build)
```

## Build

### Build for macOS

```bash
npm run build
```

This will create:
- `.dmg` installer for macOS
- `.zip` archive for macOS

Build artifacts will be in the `dist/` folder.

### Build Configuration

The build is configured in `package.json` under the `build` key:

```json
{
  "build": {
    "appId": "com.vibemessenger.app",
    "productName": "Vibe Messenger",
    "mac": {
      "category": "public.app-category.social-networking"
    }
  }
}
```

## Technical Details

| Component | Version/Details |
|-----------|-----------------|
| Electron | v28.0.0 |
| Platform | macOS 11+ (Apple Silicon) |
| Architecture | arm64 |
| Node Integration | Disabled (security) |
| Context Isolation | Enabled (security) |

## Changelog

### Version 1.0.0 (January 17, 2026)

🎉 **Initial Release**

- Native desktop application for macOS
- Native OS notifications with click-to-open
- Persistent session storage
- Automatic Service Worker cache cleanup
- Optional launch at startup
- Facebook OAuth login support

## Disclaimer

> **⚠️ Important Notice**
>
> Vibe Messenger is an independent, open-source project. It is **not** affiliated with, authorized, maintained, sponsored, or endorsed by Meta Platforms, Inc. or any of its affiliates or subsidiaries.
>
> The name "Messenger" and related names, marks, emblems, and images are registered trademarks of their respective owners. This software is simply a wrapper for the public web version of Messenger.
>
> **Use of this application is at your own risk.**

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ for Mac users who deserve better.
</p>

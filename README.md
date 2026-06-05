[![CI](https://github.com/parithosh-varma/openclaw-browser-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/parithosh-varma/openclaw-browser-extension/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/parithosh-varma/openclaw-browser-extension)](https://github.com/parithosh-varma/openclaw-browser-extension/releases)
[![License](https://img.shields.io/github/license/parithosh-varma/openclaw-browser-extension)](https://github.com/parithosh-varma/openclaw-browser-extension/blob/main/LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/)
[![Node](https://img.shields.io/badge/Node-24%2B-green)](https://nodejs.org/)

# 🦞 OpenClaw Browser Control

**A Chrome extension that enables OpenClaw AI to interact with webpages through a secure WebSocket interface.**

[Website](https://openclaw.ai) · [OpenClaw Docs](https://docs.openclaw.ai) · [Main Repo](https://github.com/openclaw/openclaw) · [Discord](https://discord.gg/clawd)

---

OpenClaw Browser Control extends your OpenClaw assistant with the ability to **navigate, inspect, extract, and automate** any webpage — all controlled via a local WebSocket connection. No cloud, no external dependencies, just your browser and your assistant.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌐 **Navigation** | Go to URLs, wait for load, manage tabs |
| 📄 **Content Reading** | Extract text, HTML, links, images, forms |
| 🔍 **DOM Inspection** | Query elements with CSS, XPath, or text selectors — get position, styles, attributes, XPath, unique selector |
| 🖱️ **User Actions** | Click, fill, scroll, hover, select, check, submit, type character-by-character |
| 📸 **Screenshots** | Capture visible tab as base64 PNG/JPEG |
| ⏱️ **Smart Waiting** | Wait for elements to appear/become visible with timeout |
| 🎯 **Structured Extraction** | Declare a schema, get typed JSON back |
| 🔒 **Secure by Default** | Localhost-only WebSocket, no external calls, user-approved install |

## 📦 Installation

### From Chrome Web Store (Recommended)
*Coming soon — packaging for Chrome Web Store is in progress.*

### From Source (Developer Mode)

```bash
# Clone the repo
git clone https://github.com/parithosh-varma/openclaw-browser-extension.git
cd openclaw-browser-extension

# Open Chrome → chrome://extensions/
# Enable "Developer mode" (top right)
# Click "Load unpacked" → select this directory
```

### Configuration

1. Click the 🦞 OpenClaw extension icon in the Chrome toolbar
2. Configure WebSocket server:
   - **Host:** `localhost` (default)
   - **Port:** `8765` (default)
3. Enable **Auto-connect on startup** if desired
4. Click **Save Settings** → **Connect**

The badge on the extension icon shows connection status:
- 🟢 **Green dot** = Connected
- 🔴 **Red dot** = Disconnected

## 🚀 Quick Start

### 1. Start a WebSocket Server

You need a local WebSocket server that the extension connects to. Here's a minimal Python example:

```python
# server.py
import asyncio
import websockets
import json

async def handle_client(websocket):
    print("🦞 Extension connected")
    try:
        # Example: navigate to a page
        await websocket.send(json.dumps({
            "id": "cmd-001",
            "action": "navigate",
            "params": {"url": "https://example.com"}
        }))
        response = await websocket.recv()
        print("Result:", json.loads(response))

        # Example: extract structured data
        await websocket.send(json.dumps({
            "id": "cmd-002",
            "action": "extractData",
            "params": {
                "schema": {
                    "title": "h1",
                    "description": "p",
                    "links": {
                        "type": "list",
                        "selector": "a",
                        "fields": {"text": ".", "href": "@href"}
                    }
                }
            }
        }))
        response = await websocket.recv()
        print("Extracted:", json.loads(response))

    except websockets.exceptions.ConnectionClosed:
        print("Extension disconnected")

async def main():
    async with websockets.serve(handle_client, "localhost", 8765):
        print("🦞 WebSocket server running on ws://localhost:8765")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
```

```bash
pip install websockets
python server.py
```

### 2. Send Commands

All commands follow this format:

```json
{
  "id": "unique-command-id",
  "action": "commandName",
  "params": { /* action-specific params */ }
}
```

Responses:

```json
// Success
{ "id": "unique-command-id", "success": true, "result": { ... } }

// Error
{ "id": "unique-command-id", "success": false, "error": { "message": "...", "stack": "..." } }
```

## 📋 Command Reference

### `navigate` — Go to a URL
```json
{ "action": "navigate", "params": { "url": "https://example.com" } }
```
Waits for `document.readyState === 'complete'`.

---

### `getContent` — Read page content
```json
{
  "action": "getContent",
  "params": {
    "includeText": true,
    "includeHtml": false,
    "includeLinks": true,
    "includeImages": true,
    "includeForms": true,
    "selector": ".main-content"
  }
}
```
Returns `{ url, title, timestamp, text?, html?, links?, images?, forms?, elements? }`.

---

### `click` — Click an element
```json
{
  "action": "click",
  "params": {
    "selector": "button.submit",
    "options": { "scrollIntoView": true }
  }
}
```

---

### `fill` — Fill an input/textarea
```json
{
  "action": "fill",
  "params": {
    "selector": "input[name='email']",
    "value": "user@example.com",
    "options": { "clear": true, "type": false, "typeDelay": 50, "blur": true }
  }
}
```
Set `"type": true` to simulate keystrokes (triggers `keydown`/`keypress`/`input`/`keyup` per character).

---

### `scroll` — Scroll page or element
```json
{ "action": "scroll", "params": { "x": 0, "y": 500, "behavior": "smooth" } }
```
Add `"selector": ".scroll-container"` to scroll a specific element.

---

### `screenshot` — Capture visible tab
```json
{ "action": "screenshot", "params": { "format": "png", "quality": 90 } }
```
Returns `{ screenshot: "data:image/png;base64,...", format: "png" }`.

---

### `inspect` — Get detailed element info
```json
{
  "action": "inspect",
  "params": {
    "selector": "#main-header",
    "details": true,
    "highlight": true
  }
}
```
Returns tag, id, class, text, value, attributes, position, computed styles, visibility, interactivity, XPath, unique CSS selector. `highlight: true` adds a green overlay for 3s.

---

### `waitFor` — Wait for element to appear
```json
{
  "action": "waitFor",
  "params": { "selector": ".loading-complete", "timeout": 10000, "visible": true }
}
```
Resolves when element exists (and is visible if `visible: true`).

---

### `extractData` — Structured data extraction
```json
{
  "action": "extractData",
  "params": {
    "schema": {
      "title": "h1.page-title",
      "description": "p.description",
      "items": {
        "type": "list",
        "selector": ".product",
        "fields": {
          "name": ".product-name",
          "price": ".product-price",
          "link": { "xpath": ".//a/@href" }
        }
      }
    }
  }
}
```
**Selector types:**
- **String** → CSS selector: `"h1.title"`
- **Object (XPath)** → `{ "xpath": "//h1[contains(@class,'title')]" }`
- **Object (Text)** → `{ "text": "Click me", "tag": "button" }`
- **List** → `{ "type": "list", "selector": ".item", "fields": { ... } }`

---

### `evaluate` — Run arbitrary JavaScript
```json
{
  "action": "evaluate",
  "params": {
    "script": "return document.querySelectorAll('a').length",
    "args": []
  }
}
```
Executed via `chrome.scripting.executeScript` in isolated world.

---

### `select` — Select dropdown option
```json
{ "action": "select", "params": { "selector": "select#country", "value": "US" } }
```

---

### `check` — Check/uncheck checkbox
```json
{ "action": "check", "params": { "selector": "input#terms", "checked": true } }
```

---

### `submit` — Submit a form
```json
{ "action": "submit", "params": { "selector": "form#login" } }
```

---

### `hover` — Hover over element
```json
{ "action": "hover", "params": { "selector": ".dropdown-trigger" } }
```

## 🏗️ Architecture

```
openclaw-browser-extension/
├── manifest.json                 # Manifest V3
├── background/
│   ├── service-worker.js         # Entry point, command routing, WebSocket lifecycle
│   └── websocket-client.js       # Reconnecting WebSocket client (event emitter)
├── content/
│   ├── content-script.js         # Message router, content/extraction logic
│   ├── dom-inspector.js          # Element querying, inspection, highlighting
│   └── action-executor.js        # Click, fill, scroll, select, check, hover, submit
├── popup/
│   ├── popup.html                # Connection UI, settings, activity log
│   ├── popup.js                  # Popup logic, status, config persistence
│   └── popup.css                 # Styles
├── utils/
│   ├── logger.js                 # Leveled console logging
│   └── message-handler.js        # Action→handler registry
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

**Communication Flow:**
```
Your Server (WS) ↔ Background (Service Worker) ↔ Content Script (Page Context)
                                    ↓
                              chrome.tabs.sendMessage / scripting.executeScript
```

## 🛠️ Development

### Prerequisites
- Node.js 24+ (recommended) or 22.19+
- Chrome 120+ (Manifest V3 support)

### No Build Step Required
This extension loads as-is in Developer Mode. For packaging:

```bash
cd openclaw-browser-extension
zip -r openclaw-extension.zip . -x "*.git*" "*.md" "*.log"
```

### Debugging

| Target | How |
|--------|-----|
| **Background (Service Worker)** | `chrome://extensions/` → "Inspect views: service worker" |
| **Content Script** | Open DevTools on any page → Console (filter `[ContentScript]`) |
| **Popup** | Right-click extension icon → "Inspect popup" |

### Testing Commands Manually

In the background service worker console:
```javascript
// Simulate a command from WebSocket
chrome.runtime.sendMessage({
  action: 'getContent',
  params: { includeText: true }
}, console.log);
```

## 🔒 Security

- **Localhost-only** — WebSocket connects to `ws://localhost:8765` only
- **No external dependencies** — No CDNs, no analytics, no tracking
- **User consent required** — Extension must be installed explicitly
- **Isolated world** — Content scripts run in isolated JS world, cannot be detected by page scripts
- **Command validation** — All actions validated before execution
- **Manifest V3** — No background pages, service worker lifecycle, CSP enforced

## ⚠️ Limitations

- Service workers may sleep after 30s inactivity (extension reconnects on command)
- Cross-origin iframes have restricted access (same-origin policy)
- Some anti-bot systems may detect synthetic events
- Screenshots require visible, active tab
- No support for `file://` URLs without explicit permission

## 🧪 CI / Release

*GitHub Actions workflow coming soon — will include:*
- Lint (ESLint)
- Type-check (TypeScript — optional, currently plain JS)
- Package extension as `.zip` for Chrome Web Store
- Auto-draft release on tag push

## 🤝 Contributing

Contributions welcome! Please:
- Follow existing code style (ES6 modules, async/await, JSDoc for public APIs)
- Add error handling for all async operations
- Update README for new commands/options
- Test on multiple sites (SPA, static, iframe-heavy)

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License — see [LICENSE](LICENSE).

## 🦞 Credits

Part of the **OpenClaw** ecosystem — your personal AI assistant. Any OS. Any Platform. The lobster way.

- [OpenClaw Main Repo](https://github.com/openclaw/openclaw)
- [OpenClaw Website](https://openclaw.ai)
- [Documentation](https://docs.openclaw.ai)
- [Discord Community](https://discord.gg/clawd)

Maintained by Parithosh Varma 🦞
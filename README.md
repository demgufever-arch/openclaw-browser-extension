# OpenClaw Browser Control Chrome Extension

A powerful Chrome extension that enables OpenClaw AI to interact with webpages through a secure WebSocket interface.

## Features

- 🌐 **Page Navigation** - Navigate to URLs and manage browser tabs
- 📄 **Content Reading** - Extract text, HTML, links, images, and forms
- 🔍 **DOM Inspection** - Query and inspect elements with detailed information
- 🖱️ **User Actions** - Click, fill forms, scroll, hover, and more
- 📸 **Screenshots** - Capture visible tab screenshots
- ⏱️ **Smart Waiting** - Wait for elements to appear or conditions to be met
- 🎯 **Data Extraction** - Extract structured data using custom schemas
- 🔒 **Secure** - WebSocket communication with localhost only

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `openclaw-browser-extension` directory

### Configuration

1. Click the OpenClaw extension icon in Chrome toolbar
2. Configure WebSocket server settings:
   - **Host**: localhost (default)
   - **Port**: 8765 (default)
3. Enable auto-connect if desired
4. Click "Save Settings"

## Usage

### Starting the WebSocket Server

You'll need a WebSocket server running on your machine that OpenClaw can connect to. Here's a simple Python example:

```python
import asyncio
import websockets
import json

async def handle_client(websocket, path):
    print("Client connected")

    try:
        # Send a command to the extension
        command = {
            "id": "cmd-001",
            "action": "navigate",
            "params": {
                "url": "https://example.com"
            }
        }

        await websocket.send(json.dumps(command))

        # Receive result
        response = await websocket.recv()
        result = json.loads(response)

        print("Result:", result)

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")

async def main():
    async with websockets.serve(handle_client, "localhost", 8765):
        print("WebSocket server started on ws://localhost:8765")
        await asyncio.Future() # run forever

if __name__ == "__main__":
    asyncio.run(main())
```

### Available Commands

#### Navigate
```json
{
  "id": "unique-id",
  "action": "navigate",
  "params": {
    "url": "https://example.com"
  }
}
```

#### Get Page Content
```json
{
  "id": "unique-id",
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

#### Click Element
```json
{
  "id": "unique-id",
  "action": "click",
  "params": {
    "selector": "button.submit",
    "options": {
      "scrollIntoView": true
    }
  }
}
```

#### Fill Input
```json
{
  "id": "unique-id",
  "action": "fill",
  "params": {
    "selector": "input[name='email']",
    "value": "user@example.com",
    "options": {
      "clear": true,
      "type": false,
      "blur": true
    }
  }
}
```

#### Scroll Page
```json
{
  "id": "unique-id",
  "action": "scroll",
  "params": {
    "x": 0,
    "y": 500,
    "behavior": "smooth"
  }
}
```

#### Take Screenshot
```json
{
  "id": "unique-id",
  "action": "screenshot",
  "params": {
    "format": "png",
    "quality": 90
  }
}
```

#### Inspect Element
```json
{
  "id": "unique-id",
  "action": "inspect",
  "params": {
    "selector": "#main-header",
    "details": true,
    "highlight": true
  }
}
```

#### Wait for Element
```json
{
  "id": "unique-id",
  "action": "waitFor",
  "params": {
    "selector": ".loading-complete",
    "timeout": 10000,
    "visible": true
  }
}
```

#### Extract Data
```json
{
  "id": "unique-id",
  "action": "extractData",
  "params": {
    "schema": {
      "title": "h1.page-title",
      "description": "p.description",
      "items": {
        "type": "list",
        "selector": ".item",
        "fields": {
          "name": ".item-name",
          "price": ".item-price"
        }
      }
    }
  }
}
```

### Selector Types

The extension supports multiple selector types:

```javascript
// CSS Selector (string)
"selector": "button.submit"

// XPath
"selector": {
  "xpath": "//button[contains(text(), 'Submit')]"
}

// Text Content
"selector": {
  "text": "Click me",
  "tag": "button"
}
```

### Response Format

All commands receive a response in this format:

```json
{
  "id": "unique-id",
  "success": true,
  "result": {
    // Command-specific result data
  }
}
```

Error responses:

```json
{
  "id": "unique-id",
  "success": false,
  "error": {
    "message": "Error description",
    "stack": "Error stack trace"
  }
}
```

## Development

### Project Structure

```
openclaw-browser-extension/
├── manifest.json              # Extension manifest (V3)
├── background/
│   ├── service-worker.js      # Main background script
│   └── websocket-client.js    # WebSocket client implementation
├── content/
│   ├── content-script.js      # Content script coordinator
│   ├── dom-inspector.js       # DOM inspection utilities
│   └── action-executor.js     # Action execution (click, fill, etc.)
├── popup/
│   ├── popup.html             # Extension popup UI
│   ├── popup.js               # Popup logic
│   └── popup.css              # Popup styles
├── utils/
│   ├── logger.js              # Logging utility
│   └── message-handler.js     # Message routing
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Building

This extension doesn't require a build step. However, if you want to package it:

```bash
cd openclaw-browser-extension
zip -r openclaw-extension.zip . -x "*.git*" "README.md"
```

### Debugging

1. **Background Script**:
   - Go to `chrome://extensions/`
   - Click "Inspect views: service worker"

2. **Content Script**:
   - Open DevTools on any webpage
   - Check Console for logs prefixed with `[ContentScript]`

3. **Popup**:
   - Right-click extension icon
   - Select "Inspect popup"

## Security Considerations

- Only connects to `localhost` WebSocket servers
- Requires user approval for extension installation
- All commands are validated before execution
- Content scripts run in isolated world
- No external dependencies or CDNs

## Limitations

- Manifest V3 service workers have lifecycle limitations
- Some dynamic content may require waiting/polling
- Cross-origin iframes may have restricted access
- Some anti-bot protections may detect automation

## Troubleshooting

### Extension won't connect
- Verify WebSocket server is running on specified port
- Check firewall settings
- Review console logs in service worker

### Commands not executing
- Ensure content script is loaded (check console)
- Verify selectors are correct
- Check for JavaScript errors in page

### Screenshots are blank
- Ensure tab is visible and active
- Some pages may block screenshot capture

## Contributing

Contributions are welcome! Please ensure:
- Code follows existing style
- All features are documented
- Error handling is comprehensive
- Security best practices are followed

## License

MIT License - See LICENSE file for details

## Credits

Created for OpenClaw AI browser automation project.
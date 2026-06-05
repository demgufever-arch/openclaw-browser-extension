# Contributing to OpenClaw Browser Control

Thank you for contributing! 🦞

## Getting Started

1. Fork the repo
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/openclaw-browser-extension.git`
3. Create a branch: `git checkout -b feature/your-feature`
4. Make changes
5. Test in Chrome (Developer Mode → Load unpacked)
6. Push and open a PR

## Code Style

- **ES6 Modules** — Use `import`/`export`
- **Async/Await** — Prefer over promises/callbacks
- **JSDoc** — Document public functions/classes
- **Logger** — Use `Logger` class (`debug`/`info`/`warn`/`error`)
- **Error Handling** — Every async operation wrapped in try/catch
- **No external deps** — Keep it zero-dependency (except WebSocket API)

## Project Structure

```
background/          # Service worker + WebSocket client
  service-worker.js  # Command routing, tab management, lifecycle
  websocket-client.js# Reconnecting WS client (EventEmitter pattern)

content/             # Runs in page context (isolated world)
  content-script.js  # Message router, content/extract logic
  dom-inspector.js   # Element querying, inspection, highlighting
  action-executor.js # All user actions (click, fill, scroll, etc.)

popup/               # Extension popup UI
  popup.html/js/css  # Connection status, settings, activity log

utils/               # Shared utilities
  logger.js          # Leveled console logging
  message-handler.js # Action→handler registry
```

## Adding a New Command

1. **Background** (`service-worker.js`):
   - Add case in `executeCommand()` switch
   - Create handler function (async, returns result)
   - Use `chrome.tabs.sendMessage()` for content script actions
   - Use `chrome.scripting.executeScript()` for isolated world JS

2. **Content Script** (`content-script.js`):
   - Add case in `handleMessage()` switch
   - Delegate to `DOMInspector` or `ActionExecutor`

3. **DOM Inspector / Action Executor**:
   - Add method if new DOM query or action type needed

4. **README** — Document the command with JSON example

## Testing Checklist

- [ ] Fresh install in Chrome Developer Mode
- [ ] Connect/disconnect via popup
- [ ] Auto-reconnect after server restart
- [ ] All commands work on:
  - [ ] Static site (example.com)
  - [ ] SPA (React/Vue app)
  - [ ] Site with iframes
  - [ ] Site with Shadow DOM
- [ ] Error handling: invalid selectors, timeouts, disconnected state
- [ ] Popup shows correct status and logs

## PR Guidelines

- One feature/fix per PR
- Clear title: `feat: add waitForElement command` / `fix: handle shadow DOM in inspector`
- Description: what, why, how tested
- No unrelated formatting changes
- Update README if user-facing

## Code Review

Maintainers will review for:
- Security (no eval, no external calls, proper validation)
- Correctness (handles edge cases, cleans up listeners)
- Style consistency
- Performance (no memory leaks in content scripts)

## Community

- Discord: https://discord.gg/clawd
- Issues: GitHub Issues for bugs/features
- Discussions: GitHub Discussions for questions

---

Part of the **OpenClaw** ecosystem. The lobster way. 🦞
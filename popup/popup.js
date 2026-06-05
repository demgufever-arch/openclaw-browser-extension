// Popup script for OpenClaw Browser Control

let isConnected = false;
const logs = [];

// DOM elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const serverAddress = document.getElementById('serverAddress');
const serverPort = document.getElementById('serverPort');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const hostInput = document.getElementById('hostInput');
const portInput = document.getElementById('portInput');
const autoConnectCheckbox = document.getElementById('autoConnectCheckbox');
const autoReconnectCheckbox = document.getElementById('autoReconnectCheckbox');
const saveBtn = document.getElementById('saveBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const logContainer = document.getElementById('logContainer');

// Initialize popup
async function initialize() {
  // Load current status
  const status = await sendMessage({ action: 'getStatus' });
  updateStatus(status);

  // Load saved configuration
  const config = await loadConfig();
  hostInput.value = config.host;
  portInput.value = config.port;
  autoConnectCheckbox.checked = config.autoConnect || false;
  autoReconnectCheckbox.checked = config.autoReconnect !== false;

  serverAddress.textContent = config.host;
  serverPort.textContent = config.port;

  addLog('Popup initialized', 'info');
}

// Update status display
function updateStatus(status) {
  isConnected = status.connected;

  if (isConnected) {
    statusDot.className = 'dot connected';
    statusText.textContent = 'Connected';
    connectBtn.disabled = true;
    disconnectBtn.disabled = false;
    addLog('Connected to OpenClaw server', 'success');
  } else {
    statusDot.className = 'dot disconnected';
    statusText.textContent = 'Disconnected';
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
    addLog('Disconnected from OpenClaw server', 'info');
  }
}

// Send message to background script
function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response);
    });
  });
}

// Load configuration
async function loadConfig() {
  const result = await chrome.storage.local.get('config');
  return result.config || { host: 'localhost', port: 8765 };
}

// Save configuration
async function saveConfig() {
  const config = {
    host: hostInput.value,
    port: parseInt(portInput.value),
    autoConnect: autoConnectCheckbox.checked,
    autoReconnect: autoReconnectCheckbox.checked
  };

  await chrome.storage.local.set({ config });

  serverAddress.textContent = config.host;
  serverPort.textContent = config.port;

  // Update background script
  await sendMessage({ action: 'updateConfig', config });

  addLog('Configuration saved', 'success');
}

// Add log entry
function addLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const entry = { timestamp, message, type };

  logs.push(entry);

  // Keep only last 50 logs
  if (logs.length > 50) {
    logs.shift();
  }

  renderLogs();
}

// Render logs
function renderLogs() {
  logContainer.innerHTML = logs.map(log => `
    <div class="log-entry ${log.type}">
      <span class="timestamp">${log.timestamp}</span>
      <span class="message">${log.message}</span>
    </div>
  `).join('');

  // Scroll to bottom
  logContainer.scrollTop = logContainer.scrollHeight;
}

// Event listeners
connectBtn.addEventListener('click', async () => {
  addLog('Connecting...', 'info');
  const result = await sendMessage({ action: 'connect' });

  if (result.success) {
    updateStatus({ connected: true });
  } else {
    addLog(`Connection failed: ${result.error}`, 'error');
  }
});

disconnectBtn.addEventListener('click', async () => {
  addLog('Disconnecting...', 'info');
  const result = await sendMessage({ action: 'disconnect' });

  if (result.success) {
    updateStatus({ connected: false });
  }
});

saveBtn.addEventListener('click', saveConfig);

clearLogsBtn.addEventListener('click', () => {
  logs.length = 0;
  renderLogs();
});

// Initialize on load
initialize();
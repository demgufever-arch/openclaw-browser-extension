import { WebSocketClient } from './websocket-client.js';
import { MessageHandler } from '../utils/message-handler.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('ServiceWorker');
let wsClient = null;
let isConnected = false;

// Default WebSocket configuration
const DEFAULT_CONFIG = {
  host: 'localhost',
  port: 8765,
  autoReconnect: true,
  reconnectInterval: 5000,
  autoConnect: true
};

// Initialize extension
async function initialize() {
  logger.info('Initializing OpenClaw Browser Control...');

  // Load saved configuration
  const config = await loadConfig();

  // Initialize WebSocket client
  wsClient = new WebSocketClient(config);

  // Set up event handlers
  wsClient.on('connected', handleConnected);
  wsClient.on('disconnected', handleDisconnected);
  wsClient.on('message', handleMessage);
  wsClient.on('error', handleError);

  // Connect to WebSocket server
  if (config.autoConnect) {
    await wsClient.connect();
  }

  logger.info('Initialization complete');
}

// Handle WebSocket connection
function handleConnected() {
  isConnected = true;
  logger.info('Connected to OpenClaw server');
  updateBadge('connected');
  broadcastStatus({ connected: true });
}

// Handle WebSocket disconnection
function handleDisconnected() {
  isConnected = false;
  logger.warn('Disconnected from OpenClaw server');
  updateBadge('disconnected');
  broadcastStatus({ connected: false });
}

// Handle incoming WebSocket messages
async function handleMessage(message) {
  logger.debug('Received message:', message);

  try {
    const command = JSON.parse(message);
    const result = await executeCommand(command);

    // Send result back to OpenClaw
    wsClient.send(JSON.stringify({
      id: command.id,
      success: true,
      result: result
    }));
  } catch (error) {
    logger.error('Error handling message:', error);

    wsClient.send(JSON.stringify({
      id: command?.id,
      success: false,
      error: {
        message: error.message,
        stack: error.stack
      }
    }));
  }
}

// Handle WebSocket errors
function handleError(error) {
  logger.error('WebSocket error:', error);
}

// Execute commands from OpenClaw
async function executeCommand(command) {
  const { action, params } = command;

  logger.info(`Executing command: ${action}`);

  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    throw new Error('No active tab found');
  }

  // Route command to appropriate handler
  switch (action) {
    case 'navigate':
      return await navigateTo(tab.id, params.url);

    case 'getContent':
      return await getPageContent(tab.id, params);

    case 'click':
      return await clickElement(tab.id, params);

    case 'fill':
      return await fillInput(tab.id, params);

    case 'scroll':
      return await scrollPage(tab.id, params);

    case 'screenshot':
      return await captureScreenshot(tab.id, params);

    case 'inspect':
      return await inspectElement(tab.id, params);

    case 'evaluate':
      return await evaluateScript(tab.id, params);

    case 'waitFor':
      return await waitForElement(tab.id, params);

    case 'extractData':
      return await extractData(tab.id, params);

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// Navigate to URL
async function navigateTo(tabId, url) {
  await chrome.tabs.update(tabId, { url });

  // Wait for page to load
  return new Promise((resolve) => {
    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve({ url, loaded: true });
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

// Get page content
async function getPageContent(tabId, params = {}) {
  const result = await chrome.tabs.sendMessage(tabId, {
    action: 'getContent',
    params
  });

  return result;
}

// Click element
async function clickElement(tabId, params) {
  const result = await chrome.tabs.sendMessage(tabId, {
    action: 'click',
    params
  });

  return result;
}

// Fill input field
async function fillInput(tabId, params) {
  const result = await chrome.tabs.sendMessage(tabId, {
    action: 'fill',
    params
  });

  return result;
}

// Scroll page
async function scrollPage(tabId, params) {
  const result = await chrome.tabs.sendMessage(tabId, {
    action: 'scroll',
    params
  });

  return result;
}

// Capture screenshot
async function captureScreenshot(tabId, params = {}) {
  const dataUrl = await chrome.tabs.captureVisibleTab(null, {
    format: params.format || 'png',
    quality: params.quality || 90
  });

  return {
    screenshot: dataUrl,
    format: params.format || 'png'
  };
}

// Inspect element
async function inspectElement(tabId, params) {
  const result = await chrome.tabs.sendMessage(tabId, {
    action: 'inspect',
    params
  });

  return result;
}

// Evaluate JavaScript
async function evaluateScript(tabId, params) {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func: new Function(params.script),
    args: params.args || []
  });

  return result[0]?.result;
}

// Wait for element
async function waitForElement(tabId, params) {
  const result = await chrome.tabs.sendMessage(tabId, {
    action: 'waitFor',
    params
  });

  return result;
}

// Extract structured data
async function extractData(tabId, params) {
  const result = await chrome.tabs.sendMessage(tabId, {
    action: 'extractData',
    params
  });

  return result;
}

// Update extension badge
function updateBadge(status) {
  const badges = {
    connected: { text: '●', color: '#00FF00' },
    disconnected: { text: '●', color: '#FF0000' },
    error: { text: '!', color: '#FFA500' }
  };

  const badge = badges[status] || badges.disconnected;

  chrome.action.setBadgeText({ text: badge.text });
  chrome.action.setBadgeBackgroundColor({ color: badge.color });
}

// Broadcast status to all tabs
async function broadcastStatus(status) {
  const tabs = await chrome.tabs.query({});

  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, {
      action: 'statusUpdate',
      status
    }).catch(() => {
      // Ignore errors for tabs without content script
    });
  });
}

// Load configuration from storage
async function loadConfig() {
  const stored = await chrome.storage.local.get('config');
  return { ...DEFAULT_CONFIG, ...stored.config };
}

// Save configuration to storage
async function saveConfig(config) {
  await chrome.storage.local.set({ config });
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'getStatus':
          sendResponse({ connected: isConnected });
          break;

        case 'connect':
          await wsClient.connect();
          sendResponse({ success: true });
          break;

        case 'disconnect':
          await wsClient.disconnect();
          sendResponse({ success: true });
          break;

        case 'updateConfig':
          await saveConfig(message.config);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      sendResponse({ error: error.message });
    }
  })();

  return true; // Keep message channel open for async response
});

// Initialize on installation
chrome.runtime.onInstalled.addListener(() => {
  logger.info('Extension installed');
  initialize();
});

// Initialize on startup
chrome.runtime.onStartup.addListener(() => {
  logger.info('Extension started');
  initialize();
});

// Start initialization
initialize();
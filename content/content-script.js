// Content script for OpenClaw Browser Control
(function() {
  'use strict';

  const logger = new Logger('ContentScript');
  const domInspector = new DOMInspector();
  const actionExecutor = new ActionExecutor();

  logger.info('OpenClaw content script loaded');

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
      try {
        const result = await handleMessage(message);
        sendResponse({ success: true, result });
      } catch (error) {
        logger.error('Error handling message:', error);
        sendResponse({
          success: false,
          error: {
            message: error.message,
            stack: error.stack
          }
        });
      }
    })();

    return true; // Keep message channel open for async response
  });

  // Handle incoming messages
  async function handleMessage(message) {
    const { action, params } = message;

    logger.debug(`Handling action: ${action}`, params);

    switch (action) {
      case 'getContent':
        return await getContent(params);

      case 'click':
        return await actionExecutor.click(params);

      case 'fill':
        return await actionExecutor.fill(params);

      case 'scroll':
        return await actionExecutor.scroll(params);

      case 'inspect':
        return await domInspector.inspect(params);

      case 'waitFor':
        return await waitForElement(params);

      case 'extractData':
        return await extractData(params);

      case 'statusUpdate':
        handleStatusUpdate(message.status);
        return { received: true };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  // Get page content
  async function getContent(params = {}) {
    const content = {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    };

    if (params.includeText !== false) {
      content.text = document.body.innerText;
    }

    if (params.includeHtml) {
      content.html = document.body.innerHTML;
    }

    if (params.includeLinks) {
      content.links = Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.innerText.trim(),
        href: a.href,
        title: a.title
      }));
    }

    if (params.includeImages) {
      content.images = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt,
        title: img.title
      }));
    }

    if (params.includeForms) {
      content.forms = Array.from(document.querySelectorAll('form')).map(form => ({
        action: form.action,
        method: form.method,
        fields: Array.from(form.elements).map(el => ({
          name: el.name,
          type: el.type,
          value: el.value
        }))
      }));
    }

    if (params.selector) {
      const elements = domInspector.queryElements(params.selector);
      content.elements = elements;
    }

    return content;
  }

  // Wait for element to appear
  async function waitForElement(params) {
    const { selector, timeout = 10000, visible = true } = params;

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkElement = () => {
        const element = document.querySelector(selector);

        if (element) {
          if (!visible || isVisible(element)) {
            resolve({
              found: true,
              element: domInspector.getElementInfo(element),
              waitTime: Date.now() - startTime
            });
            return;
          }
        }

        if (Date.now() - startTime >= timeout) {
          reject(new Error(`Element not found: ${selector} (timeout: ${timeout}ms)`));
          return;
        }

        setTimeout(checkElement, 100);
      };

      checkElement();
    });
  }

  // Check if element is visible
  function isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0';
  }

  // Extract structured data from page
  async function extractData(params) {
    const { schema } = params;
    const data = {};

    for (const [key, selector] of Object.entries(schema)) {
      if (typeof selector === 'string') {
        const element = document.querySelector(selector);
        data[key] = element ? element.innerText.trim() : null;
      } else if (selector.type === 'list') {
        data[key] = Array.from(document.querySelectorAll(selector.selector)).map(el => {
          if (selector.fields) {
            const item = {};
            for (const [fieldKey, fieldSelector] of Object.entries(selector.fields)) {
              const fieldEl = el.querySelector(fieldSelector);
              item[fieldKey] = fieldEl ? fieldEl.innerText.trim() : null;
            }
            return item;
          }
          return el.innerText.trim();
        });
      }
    }

    return data;
  }

  // Handle status updates
  function handleStatusUpdate(status) {
    logger.debug('Status update:', status);

    // You can add visual indicators here
    if (status.connected) {
      logger.info('Connected to OpenClaw');
    } else {
      logger.warn('Disconnected from OpenClaw');
    }
  }

})();
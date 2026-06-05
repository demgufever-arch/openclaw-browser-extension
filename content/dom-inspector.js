class DOMInspector {
  constructor() {
    this.highlightedElement = null;
  }

  // Inspect element by selector
  inspect(params) {
    const { selector, details = true } = params;

    const element = this.findElement(selector);

    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    const info = this.getElementInfo(element, details);

    // Highlight element if requested
    if (params.highlight) {
      this.highlightElement(element);
    }

    return info;
  }

  // Find element by various selector types
  findElement(selector) {
    if (typeof selector === 'string') {
      return document.querySelector(selector);
    }

    if (selector.xpath) {
      return this.findByXPath(selector.xpath);
    }

    if (selector.text) {
      return this.findByText(selector.text, selector.tag);
    }

    return null;
  }

  // Find element by XPath
  findByXPath(xpath) {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );

    return result.singleNodeValue;
  }

  // Find element by text content
  findByText(text, tag = '*') {
    const elements = document.querySelectorAll(tag);

    for (const element of elements) {
      if (element.innerText.trim().includes(text)) {
        return element;
      }
    }

    return null;
  }

  // Get detailed element information
  getElementInfo(element, detailed = true) {
    const info = {
      tagName: element.tagName.toLowerCase(),
      id: element.id,
      className: element.className,
      text: element.innerText?.trim() || '',
      value: element.value,
      attributes: this.getAttributes(element)
    };

    if (detailed) {
      const rect = element.getBoundingClientRect();

      info.position = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right
      };

      info.computed = this.getComputedStyles(element);
      info.visible = this.isVisible(element);
      info.interactive = this.isInteractive(element);
      info.xpath = this.getXPath(element);
      info.selector = this.getUniqueSelector(element);
    }

    return info;
  }

  // Get element attributes
  getAttributes(element) {
    const attributes = {};

    for (const attr of element.attributes) {
      attributes[attr.name] = attr.value;
    }

    return attributes;
  }

  // Get computed styles
  getComputedStyles(element) {
    const computed = window.getComputedStyle(element);

    return {
      display: computed.display,
      visibility: computed.visibility,
      opacity: computed.opacity,
      position: computed.position,
      zIndex: computed.zIndex,
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      fontSize: computed.fontSize,
      fontFamily: computed.fontFamily
    };
  }

  // Check if element is visible
  isVisible(element) {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0;
  }

  // Check if element is interactive
  isInteractive(element) {
    const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    const hasClickHandler = element.onclick !== null;
    const hasTabIndex = element.tabIndex >= 0;

    return interactiveTags.includes(element.tagName) ||
      hasClickHandler ||
      hasTabIndex;
  }

  // Get XPath for element
  getXPath(element) {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    const parts = [];

    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling = element.previousSibling;

      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE &&
          sibling.tagName === element.tagName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }

      const tagName = element.tagName.toLowerCase();
      const pathIndex = index ? `[${index + 1}]` : '';
      parts.unshift(`${tagName}${pathIndex}`);

      element = element.parentNode;
    }

    return parts.length ? `/${parts.join('/')}` : '';
  }

  // Get unique CSS selector for element
  getUniqueSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    const path = [];

    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.tagName.toLowerCase();

      if (element.className) {
        const classes = element.className.split(' ')
          .filter(c => c.trim())
          .map(c => `.${c}`)
          .join('');
        selector += classes;
      }

      path.unshift(selector);

      if (element.id) {
        path[0] = `#${element.id}`;
        break;
      }

      element = element.parentElement;
    }

    return path.join(' > ');
  }

  // Query multiple elements
  queryElements(selector) {
    const elements = document.querySelectorAll(selector);

    return Array.from(elements).map(el => this.getElementInfo(el, false));
  }

  // Highlight element visually
  highlightElement(element) {
    // Remove previous highlight
    this.removeHighlight();

    const overlay = document.createElement('div');
    overlay.id = 'openclaw-highlight';

    const rect = element.getBoundingClientRect();

    overlay.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 2px solid #00FF00;
      background: rgba(0, 255, 0, 0.1);
      pointer-events: none;
      z-index: 999999;
      box-sizing: border-box;
    `;

    document.body.appendChild(overlay);
    this.highlightedElement = overlay;

    // Auto-remove after 3 seconds
    setTimeout(() => this.removeHighlight(), 3000);
  }

  // Remove highlight
  removeHighlight() {
    if (this.highlightedElement) {
      this.highlightedElement.remove();
      this.highlightedElement = null;
    }
  }
}
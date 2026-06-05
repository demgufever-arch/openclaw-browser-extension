class ActionExecutor {
  constructor() {
    this.domInspector = new DOMInspector();
  }

  // Click element
  async click(params) {
    const { selector, options = {} } = params;

    const element = this.domInspector.findElement(selector);

    if (!element) {
      throw new Error(`Element not found: ${JSON.stringify(selector)}`);
    }

    // Scroll element into view if needed
    if (options.scrollIntoView !== false) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Wait for scroll to complete
      await this.sleep(300);
    }

    // Check if element is visible and clickable
    if (!this.domInspector.isVisible(element)) {
      throw new Error('Element is not visible');
    }

    // Perform click
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });

    element.dispatchEvent(clickEvent);

    // Also trigger native click for some elements
    if (element.click) {
      element.click();
    }

    return {
      clicked: true,
      element: this.domInspector.getElementInfo(element, false)
    };
  }

  // Fill input field
  async fill(params) {
    const { selector, value, options = {} } = params;

    const element = this.domInspector.findElement(selector);

    if (!element) {
      throw new Error(`Element not found: ${JSON.stringify(selector)}`);
    }

    // Scroll into view
    if (options.scrollIntoView !== false) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      await this.sleep(200);
    }

    // Focus element
    element.focus();

    // Clear existing value if requested
    if (options.clear !== false) {
      element.value = '';

      // Trigger input event
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Type value character by character if requested
    if (options.type) {
      for (const char of value) {
        element.value += char;

        // Dispatch events
        element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true }));
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

        await this.sleep(options.typeDelay || 50);
      }
    } else {
      // Set value directly
      element.value = value;

      // Trigger events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Blur if requested
    if (options.blur) {
      element.blur();
    }

    return {
      filled: true,
      value: element.value,
      element: this.domInspector.getElementInfo(element, false)
    };
  }

  // Scroll page or element
  async scroll(params) {
    const {
      x = 0,
      y = 0,
      behavior = 'smooth',
      selector
    } = params;

    if (selector) {
      // Scroll specific element
      const element = this.domInspector.findElement(selector);

      if (!element) {
        throw new Error(`Element not found: ${JSON.stringify(selector)}`);
      }

      element.scrollBy({ left: x, top: y, behavior });

      return {
        scrolled: true,
        element: this.domInspector.getElementInfo(element, false),
        scrollPosition: {
          x: element.scrollLeft,
          y: element.scrollTop
        }
      };
    } else {
      // Scroll window
      window.scrollBy({ left: x, top: y, behavior });

      return {
        scrolled: true,
        scrollPosition: {
          x: window.scrollX,
          y: window.scrollY
        }
      };
    }
  }

  // Utility: Sleep function
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Select option from dropdown
  async select(params) {
    const { selector, value, options = {} } = params;

    const element = this.domInspector.findElement(selector);

    if (!element || element.tagName !== 'SELECT') {
      throw new Error(`Select element not found: ${JSON.stringify(selector)}`);
    }

    // Scroll into view
    if (options.scrollIntoView !== false) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.sleep(200);
    }

    // Set value
    element.value = value;

    // Trigger events
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));

    return {
      selected: true,
      value: element.value,
      element: this.domInspector.getElementInfo(element, false)
    };
  }

  // Check/uncheck checkbox
  async check(params) {
    const { selector, checked = true, options = {} } = params;

    const element = this.domInspector.findElement(selector);

    if (!element || element.type !== 'checkbox') {
      throw new Error(`Checkbox not found: ${JSON.stringify(selector)}`);
    }

    // Scroll into view
    if (options.scrollIntoView !== false) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.sleep(200);
    }

    // Set checked state
    element.checked = checked;

    // Trigger events
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));

    return {
      checked: element.checked,
      element: this.domInspector.getElementInfo(element, false)
    };
  }

  // Submit form
  async submit(params) {
    const { selector } = params;

    const element = this.domInspector.findElement(selector);

    if (!element) {
      throw new Error(`Form not found: ${JSON.stringify(selector)}`);
    }

    const form = element.tagName === 'FORM' ? element : element.closest('form');

    if (!form) {
      throw new Error('No form found');
    }

    // Submit form
    form.submit();

    return {
      submitted: true,
      action: form.action,
      method: form.method
    };
  }

  // Hover over element
  async hover(params) {
    const { selector, options = {} } = params;

    const element = this.domInspector.findElement(selector);

    if (!element) {
      throw new Error(`Element not found: ${JSON.stringify(selector)}`);
    }

    // Scroll into view
    if (options.scrollIntoView !== false) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.sleep(200);
    }

    // Dispatch mouse events
    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    element.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));

    return {
      hovered: true,
      element: this.domInspector.getElementInfo(element, false)
    };
  }
}
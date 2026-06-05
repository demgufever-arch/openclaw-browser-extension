class Logger {
  constructor(context = 'OpenClaw') {
    this.context = context;
    this.logLevel = 'info'; // debug, info, warn, error
  }

  debug(...args) {
    if (this.shouldLog('debug')) {
      console.debug(`[${this.context}]`, ...args);
    }
  }

  info(...args) {
    if (this.shouldLog('info')) {
      console.info(`[${this.context}]`, ...args);
    }
  }

  warn(...args) {
    if (this.shouldLog('warn')) {
      console.warn(`[${this.context}]`, ...args);
    }
  }

  error(...args) {
    if (this.shouldLog('error')) {
      console.error(`[${this.context}]`, ...args);
    }
  }

  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  setLevel(level) {
    this.logLevel = level;
  }
}
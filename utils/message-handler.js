export class MessageHandler {
  constructor() {
    this.handlers = new Map();
  }

  register(action, handler) {
    this.handlers.set(action, handler);
  }

  async handle(message) {
    const { action, params } = message;

    const handler = this.handlers.get(action);

    if (!handler) {
      throw new Error(`No handler registered for action: ${action}`);
    }

    return await handler(params);
  }
}
/**
 * 历史记录管理
 */
import { Message } from '../core/message.js';

export class HistoryManager {
  private messages: Message[];
  private max_messages: number;

  constructor(max_messages: number = 100) {
    this.messages = [];
    this.max_messages = max_messages;
  }

  addMessage(message: Message): void {
    this.messages.push(message);
    // 限制消息数量
    if (this.messages.length > this.max_messages) {
      this.messages = this.messages.slice(-this.max_messages);
    }
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  getLastMessage(): Message | undefined {
    return this.messages[this.messages.length - 1];
  }

  clear(): void {
    this.messages = [];
  }

  getLength(): number {
    return this.messages.length;
  }
}

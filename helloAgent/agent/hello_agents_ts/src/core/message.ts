/**
 * 消息类
 */
export interface Message {
  role: string;
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

export class Message {
  role: string;
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;

  constructor(role: string, content: string, tool_calls?: any[], tool_call_id?: string) {
    this.role = role;
    this.content = content;
    this.tool_calls = tool_calls;
    this.tool_call_id = tool_call_id;
  }

  static fromDict(data: any): Message {
    return new Message(
      data.role,
      data.content,
      data.tool_calls,
      data.tool_call_id
    );
  }

  toDict(): any {
    return {
      role: this.role,
      content: this.content,
      tool_calls: this.tool_calls,
      tool_call_id: this.tool_call_id
    };
  }
}

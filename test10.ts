import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { BaseChatMessageHistory } from '@langchain/core/chat_history';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

/**
 * FileChatMessageHistory - 基于文件的聊天消息历史存储
 * 
 * 将聊天消息持久化到文件系统中，每个会话对应一个文件
 */
export class FileChatMessageHistory extends BaseChatMessageHistory {
  lc_namespace = ["langchain_core", "chat_history"];
  static lc_namespace = ["langchain_core", "chat_history"];

  static lc_name() {
    return "FileChatMessageHistory";
  }

  private sessionId: string;
  private storagePath: string;
  private filePath: string;

  constructor(sessionId: string, storagePath: string) {
    super();
    this.sessionId = sessionId;
    this.storagePath = storagePath;
    // 完整的文件路径
    this.filePath = join(this.storagePath, this.sessionId);
  }

  /**
   * 添加单条消息到历史记录
   * @param message 要添加的消息
   */
  async addMessage(message: BaseMessage): Promise<void> {
    return this.addMessages([message]);
  }

  /**
   * 添加用户消息到历史记录
   * @param message 用户消息内容
   */
  async addUserMessage(message: string): Promise<void> {
    return this.addMessages([new HumanMessage(message)]);
  }

  /**
   * 添加AI消息到历史记录
   * @param message AI消息内容
   */
  async addAIMessage(message: string): Promise<void> {
    return this.addMessages([new AIMessage(message)]);
  }

  /**
   * 添加消息到历史记录
   * @param messages 要添加的消息数组
   */
  async addMessages(messages: BaseMessage[]): Promise<void> {
    // 获取已有的消息列表
    const allMessages = await this.getMessages();
    // 将新消息添加到已有消息列表
    allMessages.push(...messages);

    // 将消息序列化为JSON格式
    const newMessages = allMessages.map(message => message.toJSON());
    
    // 确保文件夹存在
    await fs.mkdir(dirname(this.filePath), { recursive: true });
    
    // 将数据写入文件
    await fs.writeFile(this.filePath, JSON.stringify(newMessages, null, 2), 'utf-8');
  }

  /**
   * 获取所有历史消息
   * @returns 消息数组
   */
  async getMessages(): Promise<BaseMessage[]> {
    try {
      // 读取文件内容
      const fileContent = await fs.readFile(this.filePath, 'utf-8');
      const messagesData = JSON.parse(fileContent);
      
      // 将JSON数据反序列化为消息对象
      return messagesData.map((data: any) => this.messageFromJSON(data));
    } catch (error) {
      // 如果文件不存在，返回空数组
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * 清空历史消息
   */
  async clear(): Promise<void> {
    // 确保文件夹存在
    await fs.mkdir(dirname(this.filePath), { recursive: true });
    
    // 写入空数组
    await fs.writeFile(this.filePath, JSON.stringify([], null, 2), 'utf-8');
  }

  /**
   * 从JSON对象创建消息实例
   * @param data 消息的JSON数据
   * @returns 消息实例
   */
  private messageFromJSON(data: any): BaseMessage {
    // LangChain使用特殊的序列化格式
    // data.id数组的最后一个元素是消息类型
    // data.kwargs包含构造函数参数
    
    if (!data.id || !Array.isArray(data.id) || data.id.length === 0) {
      throw new Error(`Invalid message data structure`);
    }
    
    const messageType = data.id[data.id.length - 1]; // 获取消息类型
    const kwargs = data.kwargs || {};
    const content = kwargs.content;
    
    switch (messageType) {
      case 'HumanMessage':
        return new HumanMessage(content);
      case 'AIMessage':
        return new AIMessage(content);
      case 'SystemMessage':
        return new SystemMessage(content);
      default:
        throw new Error(`Unknown message type: ${messageType}`);
    }
  }
}

// 测试代码
async function testFileChatMessageHistory() {
  // 创建存储目录
  const storagePath = './chat_history';
  
  // 创建FileChatMessageHistory实例
  const history = new FileChatMessageHistory('test_session', storagePath);
  
  // 清空历史记录
  await history.clear();
  console.log('历史记录已清空');
  
  // 添加一些消息
  await history.addMessages([
    new HumanMessage('你好，我是小明'),
    new AIMessage('你好小明，很高兴认识你！'),
    new HumanMessage('我有2只猫'),
    new AIMessage('好的，我知道你有2只猫'),
  ]);
  console.log('已添加4条消息');
  
  // 获取并打印所有消息
  const messages = await history.getMessages();
  console.log('\n当前历史消息：');
  messages.forEach((msg, index) => {
    console.log(`${index + 1}. [${msg.constructor.name}]: ${msg.content}`);
  });
  
  // 添加更多消息
  await history.addMessages([
    new HumanMessage('小刚有1只狗'),
    new AIMessage('明白了，小刚有1只狗'),
  ]);
  console.log('\n已添加2条新消息');
  
  // 再次获取并打印所有消息
  const allMessages = await history.getMessages();
  console.log('\n所有历史消息：');
  allMessages.forEach((msg, index) => {
    console.log(`${index + 1}. [${msg.constructor.name}]: ${msg.content}`);
  });
}

// 运行测试
testFileChatMessageHistory().catch(console.error);
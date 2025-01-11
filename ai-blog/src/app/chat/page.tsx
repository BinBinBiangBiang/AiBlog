'use client';
import { useState } from 'react';
import { Input, Button, Avatar, Spin, Menu, message } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, HistoryOutlined } from '@ant-design/icons';
import axios from 'axios';
import styles from './page.module.css';

interface Message {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface HistoryItem {
  id: number;
  title: string;
  messages: Message[];
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

  const handleSend = async () => {
    if (!inputValue.trim()) {
      message.warning('请输入内容');
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // 调用 DeepSeek API
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions', // DeepSeek API 地址
        {
          model: 'deepseek-chat', // 使用的模型
          messages: [{ role: 'user', content: inputValue }],
        },
        {
          headers: {
            Authorization: `Bearer sk-5f862c8d00534bfd819ba100c6b93f68`, // 你的 API Key
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data.choices[0].message.content;

      const aiMessage: Message = {
        id: Date.now() + 1,
        content: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // 如果当前没有选中历史记录，则创建新的历史记录
      if (!selectedHistoryId) {
        const newHistoryItem: HistoryItem = {
          id: Date.now(),
          title: inputValue.substring(0, 20) + '...', // 截取前20个字符作为标题
          messages: [userMessage, aiMessage],
        };
        setHistory(prev => [...prev, newHistoryItem]);
      }
    } catch (error) {
      message.error('请求失败');
      console.error('API 请求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (id: number) => {
    const selectedHistory = history.find(item => item.id === id);
    if (selectedHistory) {
      setMessages(selectedHistory.messages);
      setSelectedHistoryId(id);
    }
  };

  return (
    <div className={styles.container}>
      {/* 左侧菜单栏 */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <HistoryOutlined />
          <span>历史记录</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedHistoryId ? [selectedHistoryId.toString()] : []}
          className={styles.menu}
        >
          {history.map(item => (
            <Menu.Item key={item.id} onClick={() => handleHistoryClick(item.id)}>
              {item.title}
            </Menu.Item>
          ))}
        </Menu>
      </div>

      {/* 聊天区域 */}
      <div className={styles.chatContainer}>
        <div className={styles.chatWindow}>
          {messages.map(item => (
            <div
              key={item.id}
              className={`${styles.message} ${item.isUser ? styles.userMessage : styles.aiMessage}`}
            >
              <div className={styles.avatar}>
                <Avatar
                  icon={item.isUser ? <UserOutlined /> : <RobotOutlined />}
                  style={{ backgroundColor: item.isUser ? '#87d068' : '#1890ff' }}
                />
              </div>
              <div className={styles.content}>
                <div className={styles.text}>{item.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className={styles.loading}>
              <Spin size="small" />
            </div>
          )}
        </div>

        {/* 输入框区域 */}
        <div className={styles.inputContainer}>
          <div className={styles.inputWrapper}>
            <Input.TextArea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onPressEnter={handleSend}
              rows={1}
              placeholder="输入你的问题..."
              autoSize={{ minRows: 1, maxRows: 6 }}
              className={styles.textArea}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
              className={styles.sendButton}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, Input, Button, List, Spin } from 'antd'; // 使用 Ant Design 组件库
import { UserOutlined, RobotOutlined } from '@ant-design/icons'; // 用户和 AI 头像
import http from '@/lib/http'; // 假设你使用 axios 封装了 http 请求
import styles from './page.module.css';
const ChatPage = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null); // 会话 ID
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 获取或创建 conversationId
  useEffect(() => {
    const fetchConversationId = async () => {
      try {
        const response = await http.post('/api/conversations', {
          user_id: 1, // 假设 user_id 为 1
          title: 'New Conversation',
        });
        setConversationId(response.data.conversation_id);
      } catch (error) {
        console.error('Failed to fetch conversation ID:', error);
      }
    };

    fetchConversationId();
  }, []);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    setLoading(true);
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      let aiResponse = '';
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: input, conversation_id: conversationId, user_id: 1 }),
      });

      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          aiResponse += chunk;

          // 更新 AI 回复
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.role === 'assistant') {
              return [...prev.slice(0, -1), { role: 'assistant', content: aiResponse }];
            } else {
              return [...prev, { role: 'assistant', content: aiResponse }];
            }
          });

          scrollToBottom(); // 每次更新消息后滚动到底部
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={styles.container}>
      {/* 侧边栏 */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span>Chat History</span>
        </div>
        <div className={styles.menu}>{/* 这里可以放置聊天历史记录 */}</div>
      </div>

      {/* 聊天窗口 */}
      <div className={styles.chatContainer}>
        <div className={styles.chatWindow}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${styles.message} ${
                message.role === 'user' ? styles.userMessage : styles.aiMessage
              }`}
            >
              <div className={styles.avatar}>
                {message.role === 'user' ? (
                  <Avatar icon={<UserOutlined />} />
                ) : (
                  <Avatar icon={<RobotOutlined />} />
                )}
              </div>
              <div className={styles.content}>
                <div className={styles.text}>{message.content}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <div className={styles.inputContainer}>
          <div className={styles.inputWrapper}>
            <Input.TextArea
              className={styles.textArea}
              value={input}
              onChange={e => setInput(e.target.value)}
              onPressEnter={sendMessage}
              placeholder="Type your message..."
              disabled={loading || !conversationId}
              autoSize={{ minRows: 1, maxRows: 4 }}
            />
            <Button
              className={styles.sendButton}
              type="primary"
              onClick={sendMessage}
              loading={loading}
              disabled={!conversationId}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

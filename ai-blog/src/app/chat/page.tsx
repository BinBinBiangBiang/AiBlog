'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, Input, Button, List, Spin, Tooltip } from 'antd'; // 使用 Ant Design 组件库
import { UserOutlined, RobotOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'; // 用户和 AI 头像
import http from '@/lib/http'; // 假设你使用 axios 封装了 http 请求
import styles from './page.module.css';

interface Conversation {
  conversation_id: string;
  title: string;
  created_at: string;
}

const ChatPage = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 获取所有会话历史
  const fetchConversations = async () => {
    try {
      const response = await http.get('/api/conversations?user_id=1');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  // 初始加载所有会话
  useEffect(() => {
    fetchConversations();
  }, []);

  // 创建新会话
  const createNewConversation = async () => {
    try {
      setLoading(true);
      const response = await http.post('/api/conversations', {
        user_id: 1,
        title: '新对话',
      });

      setConversationId(response.data.conversation_id || response.conversation_id);
      setMessages([]);

      // 刷新会话列表
      fetchConversations();
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  // 选择历史会话
  const selectConversation = async (id: string) => {
    if (id === conversationId) return;

    try {
      setFetchingHistory(true);
      setConversationId(id);

      // 获取该会话的所有消息
      const response = await http.get(`/api/conversations/${id}/messages`);
      setMessages(
        response.data.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        }))
      );
    } catch (error) {
      console.error('Failed to fetch conversation messages:', error);
    } finally {
      setFetchingHistory(false);
    }
  };

  // 删除会话
  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await http.delete(`/api/conversations/${id}`);

      // 如果删除的是当前会话，清空消息
      if (id === conversationId) {
        setConversationId(null);
        setMessages([]);
      }

      // 刷新会话列表
      fetchConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim()) return;

    // 如果没有会话ID，先创建一个
    if (!conversationId) {
      await createNewConversation();
      return;
    }

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

      if (!response.ok) {
        console.error('Failed to send message:', response.statusText);
        return;
      }

      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          aiResponse += chunk;

          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.role === 'assistant') {
              return [...prev.slice(0, -1), { role: 'assistant', content: aiResponse }];
            } else {
              return [...prev, { role: 'assistant', content: aiResponse }];
            }
          });

          scrollToBottom();
        }
      }

      // 更新会话列表（可能标题已更新）
      fetchConversations();
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

  // 处理Enter键发送消息
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.container}>
      {/* 侧边栏 - 历史记录 */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span>历史记录</span>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={createNewConversation}
            disabled={loading}
            className={styles.newChatButton}
          >
            新对话
          </Button>
        </div>

        <div className={styles.menu}>
          {conversations?.length === 0 ? (
            <div className={styles.emptyHistory}>暂无历史记录</div>
          ) : (
            <List
              dataSource={conversations}
              loading={fetchingHistory}
              renderItem={item => (
                <List.Item
                  className={`${styles.conversationItem} ${
                    item.conversation_id === conversationId ? styles.active : ''
                  }`}
                  onClick={() => selectConversation(item.conversation_id)}
                >
                  <div className={styles.conversationTitle}>{item.title}</div>
                  <Tooltip title="删除此对话">
                    <DeleteOutlined
                      className={styles.deleteIcon}
                      onClick={e => deleteConversation(item.conversation_id, e)}
                    />
                  </Tooltip>
                </List.Item>
              )}
            />
          )}
        </div>
      </div>

      {/* 聊天窗口 */}
      <div className={styles.chatContainer}>
        {fetchingHistory ? (
          <div className={styles.loadingContainer}>
            <Spin tip="加载对话历史..." />
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyChat}>
            <div className={styles.emptyChatContent}>
              <RobotOutlined className={styles.emptyChatIcon} />
              <h2>开始一个新对话</h2>
              <p>输入消息开始和AI助手对话</p>
            </div>
          </div>
        ) : (
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
        )}

        {/* 输入框 */}
        <div className={styles.inputContainer}>
          <div className={styles.inputWrapper}>
            <Input.TextArea
              className={styles.textArea}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              disabled={loading || fetchingHistory}
              autoSize={{ minRows: 1, maxRows: 4 }}
            />
            <Button
              className={styles.sendButton}
              type="primary"
              onClick={sendMessage}
              loading={loading}
              disabled={fetchingHistory}
            >
              发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

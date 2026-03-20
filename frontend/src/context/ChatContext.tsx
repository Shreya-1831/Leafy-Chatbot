import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Message, PredictionResult, ChatContextType } from '../types';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const WELCOME: Message = {
  id: '1',
  content: "Hello, I'm Leafy! 🌿 Upload a photo of your plant or ask me a question about gardening. I'm here to help!",
  sender: 'bot',
  timestamp: new Date(),
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const addMessage = (content: string, sender: 'user' | 'bot', imageUrl?: string): string => {
    const id = crypto.randomUUID();
    setMessages(prev => [...prev, { id, content, sender, timestamp: new Date(), imageUrl }]);
    return id;
  };

  const updateMessage = (id: string, content: string) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, content } : msg));
  };

  // ✅ Clears messages only — does NOT reset currentSessionId
  const clearMessages = () => {
    setMessages([{ ...WELCOME, id: Date.now().toString(), timestamp: new Date() }]);
    setPredictionResult(null);
    setError(null);
  };

  // ✅ Full reset — clears everything including session
  const clearChat = () => {
    clearMessages();
    setCurrentSessionId(null);
  };

  return (
    <ChatContext.Provider value={{
      messages,
      isLoading,
      error,
      predictionResult,
      currentSessionId,
      addMessage,
      updateMessage,
      setIsLoading,
      setError,
      setPredictionResult,
      setCurrentSessionId,
      clearChat,
      clearMessages,  // ✅ exposed
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, Plus, Trash2, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import ChatMessage from './ChatMessage';
import { sendChatStream, fetchSessions, deleteSession, ChatSession } from '../services/api';
import toast from 'react-hot-toast';

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const {
    messages, isLoading, addMessage, updateMessage, clearChat, clearMessages,
    predictionResult, setPredictionResult, setIsLoading, currentSessionId, setCurrentSessionId,
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { loadSessions(); }, []);
  useEffect(() => { if (currentSessionId) loadSessions(); }, [currentSessionId]);

  const loadSessions = async () => {
    try {
      const data = await fetchSessions();
      setSessions(data);
    } catch {
      toast.error('Could not load chat history');
    }
  };

  const handleNewChat = () => clearChat();

  const handleLoadSession = async (sessionId: string) => {
    if (sessionId === currentSessionId) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/chat/sessions/${sessionId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (!res.ok) throw new Error('Failed to fetch session');
      const data = await res.json();
      const msgs = data.messages ?? [];
      const prediction = data.prediction ?? null;

      setCurrentSessionId(sessionId);
      clearMessages();

      if (prediction) {
        setPredictionResult({
          predicted_class: prediction.predicted_class,
          confidence: prediction.confidence,
          severity: prediction.severity,
          plant_chatbot_response: '',
          success: true,
        });
      } else {
        setPredictionResult(null);
      }

      msgs.forEach((m: any) => addMessage(
        m.content,
        m.role as 'user' | 'bot',
        m.image_data_url ?? undefined,
      ));
    } catch {
      toast.error('Could not load this chat');
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    await deleteSession(sessionId);
    setSessions(s => s.filter(x => x._id !== sessionId));
    if (currentSessionId === sessionId) handleNewChat();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    addMessage(userMessage, 'user');
    setInput('');
    setIsLoading(true);

    const botMsgId = addMessage('', 'bot');
    let accumulated = '';

    try {
      for await (const chunk of sendChatStream(
        userMessage,
        predictionResult?.predicted_class,
        predictionResult?.confidence,
        currentSessionId,
      )) {
        if ('session_id' in chunk && chunk.session_id) {
          setCurrentSessionId(chunk.session_id);
          setSessions(prev => {
            const exists = prev.find(s => s._id === chunk.session_id);
            if (exists) return prev;
            return [{
              _id: chunk.session_id!,
              title: userMessage.slice(0, 40),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, ...prev];
          });
        }
        if (chunk.chunk) {
          accumulated += chunk.chunk;
          updateMessage(botMsgId, accumulated);
        }
        if (chunk.done) break;
      }

      if (!accumulated) {
        updateMessage(botMsgId, "I'm having trouble connecting right now. Please try again.");
      }
    } catch (err) {
      console.error('Chat stream error:', err);
      toast.error('Failed to send message');
      updateMessage(botMsgId, "I'm having trouble connecting. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full relative overflow-hidden">

      {/* ── Sidebar ── */}
      <div className={`
        flex-shrink-0 flex flex-col
        bg-gray-50 dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out overflow-hidden
        ${sidebarOpen ? 'w-56' : 'w-0'}
      `}>
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Chats</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewChat}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-leaf-600 transition-colors"
              title="New Chat"
            >
              <Plus size={15} />
            </button>
            <button
              onClick={loadSessions}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-leaf-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-600 whitespace-nowrap">No chats yet</p>
              <p className="text-[11px] text-gray-300 dark:text-gray-700 mt-1 whitespace-nowrap">Start a conversation</p>
            </div>
          ) : (
            sessions.map(s => (
              <div
                key={s._id}
                onClick={() => handleLoadSession(s._id)}
                className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 ${
                  currentSessionId === s._id
                    ? 'bg-leaf-50 dark:bg-leaf-900/20 text-leaf-700 dark:text-leaf-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    currentSessionId === s._id ? 'bg-leaf-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                  <span className="text-xs truncate">{s.title || 'Untitled Chat'}</span>
                </div>
                <button
                  onClick={e => handleDeleteSession(e, s._id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-1 flex-shrink-0 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* ── Top bar with toggle ── */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-leaf-600 transition-colors"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-leaf-600 transition-colors"
            title="New Chat"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-leaf-50 to-white dark:from-gray-800 dark:to-gray-900">
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
          {isLoading && messages[messages.length - 1]?.content === '' && (
            <div className="flex justify-start my-2 ml-10">
              <div className="flex space-x-1.5 items-center bg-white dark:bg-gray-700 px-4 py-2.5 rounded-full shadow-sm">
                <div className="w-2 h-2 bg-leaf-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-leaf-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-leaf-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">Leafy is thinking…</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Input ── */}
        <form onSubmit={handleSendMessage} className="bg-white dark:bg-gray-800 p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Ask about your plants..."
              className="flex-1 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-leaf-500 border-0"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`bg-leaf-600 text-white rounded-xl px-4 flex items-center justify-center transition-colors ${
                isLoading || !input.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-leaf-700'
              }`}
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
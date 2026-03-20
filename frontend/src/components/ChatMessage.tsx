import React, { useState } from 'react';
import { CircleUser as UserCircle2, Copy, Check } from 'lucide-react';
import { Message } from '../types';
import toast from 'react-hot-toast';

interface ChatMessageProps {
  message: Message;
}

const normalizeContent = (text: string): string => {
  return text
    .split('\n')
    .map(line => {
      const stripped = line.trim();

      // ✅ Remove horizontal lines
      if (/^[-—=]{2,}$/.test(stripped)) return '';

      // ✅ Convert • bullets to - (remove the • so no double bullet)
      if (stripped.startsWith('•')) {
        return '- ' + stripped.slice(1).trim();
      }

      // ✅ Fix lines that start with "- •" (double bullet from post-processor)
      if (stripped.startsWith('- •')) {
        return '- ' + stripped.slice(3).trim();
      }

      return line;
    })
    .join('\n');
};

const renderInline = (text: string): React.ReactNode => {
  // ✅ Remove wrapping * for italic (poetic line comes as *"text"*)
  const cleaned = text.replace(/^\*(.+)\*$/, '$1');

  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

const BotMessageContent: React.FC<{ content: string }> = ({ content }) => {
  const lines = normalizeContent(content).split('\n');

  return (
    <div className="text-sm space-y-1">
      {lines.map((line, i) => {
        const stripped = line.trim();
        if (!stripped) return <div key={i} className="h-1" />;

        // ✅ Bullet line
        if (stripped.startsWith('- ')) {
          return (
            <div key={i} className="flex items-start gap-2 py-0.5 pl-5">
              <span className="text-leaf-500 dark:text-leaf-400 mt-[3px] flex-shrink-0 text-base leading-none">●</span>
              <span className="leading-relaxed text-leaf-900 dark:text-leaf-100">
                {renderInline(stripped.slice(2))}
              </span>
            </div>
          );
        }

        // ✅ Section heading — **emoji Text:**
        if (stripped.startsWith('**') && stripped.endsWith('**')) {
          return (
            <p key={i} className="font-semibold text-leaf-800 dark:text-leaf-200 mt-2 mb-0.5">
              {renderInline(stripped.slice(2, -2))}
            </p>
          );
        }

        // ✅ Mixed line with bold inline (e.g. **💧 What You Should Do:**)
        if (stripped.startsWith('**') && stripped.includes('**')) {
          return (
            <p key={i} className="font-semibold text-leaf-800 dark:text-leaf-200 mt-2 mb-0.5">
              {renderInline(stripped)}
            </p>
          );
        }

        // ✅ Normal paragraph
        return (
          <p key={i} className="leading-relaxed text-leaf-900 dark:text-leaf-100">
            {renderInline(stripped)}
          </p>
        );
      })}
    </div>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Message copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4 animate-grow group`}
      style={{ animationDelay: '0.1s' }}
    >
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-t-lg relative ${
          isBot
            ? 'bg-leaf-100 dark:bg-leaf-900/30 text-leaf-900 dark:text-leaf-100 rounded-br-lg rounded-bl-none border-l-4 border-leaf-400 dark:border-leaf-600'
            : 'bg-soil-600 text-white dark:bg-soil-800 dark:text-white rounded-bl-lg rounded-br-none border-r-4 border-soil-400 dark:border-soil-600'
        } p-3 shadow-sm`}
      >
        <div className="flex items-start">
          {isBot && (
            <div className="mr-2 mt-1 flex-shrink-0">
              <div className="w-8 h-8 bg-leaf-600 rounded-full flex items-center justify-center text-white">
                🌿
              </div>
            </div>
          )}

          <div className="flex-1">
            {/* Header */}
            <div className="mb-1 flex justify-between items-center">
              <span className={`text-xs font-medium ${isBot ? 'text-leaf-700 dark:text-leaf-400' : 'text-soil-700 dark:text-soil-400'}`}>
                {isBot ? 'Leafy' : 'You'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Plant image for user uploads */}
            {!isBot && message.imageUrl && (
              <img
                src={message.imageUrl}
                alt="uploaded plant"
                className="rounded-lg mb-2 max-h-48 w-full object-cover"
              />
            )}

            {/* Message content */}
            {isBot ? (
              <BotMessageContent content={message.content} />
            ) : (
              <p className="text-sm text-white whitespace-pre-line">
                {message.content}
              </p>
            )}
          </div>

          {!isBot && (
            <div className="ml-2 mt-1 flex-shrink-0">
              <UserCircle2 className="w-8 h-8 text-soil-600 dark:text-soil-400" />
            </div>
          )}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-md hover:bg-gray-50 dark:hover:bg-gray-600"
          aria-label="Copy message"
        >
          {copied ? (
            <Check size={14} className="text-leaf-600" />
          ) : (
            <Copy size={14} className="text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatMessage;
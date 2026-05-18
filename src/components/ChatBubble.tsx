import React from 'react';
import { Brain } from 'lucide-react';

interface ChatBubbleProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  };
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex items-start space-x-3 ${isAssistant ? '' : 'flex-row-reverse space-x-reverse'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isAssistant
          ? 'bg-gradient-to-br from-blue-500 to-purple-600'
          : 'bg-gray-200'
      }`}>
        {isAssistant ? (
          <Brain className="w-5 h-5 text-white" />
        ) : (
          <span className="text-gray-600">👤</span>
        )}
      </div>
      <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
        isAssistant
          ? 'bg-white border border-gray-200 rounded-tl-none'
          : 'bg-blue-500 text-white rounded-tr-none'
      }`}>
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        <p className={`text-xs mt-2 ${isAssistant ? 'text-gray-400' : 'text-blue-100'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default ChatBubble;

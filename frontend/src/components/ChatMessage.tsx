import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  index: number;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, index }) => {
  const messageVariants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      scale: 0.8 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        delay: index * 0.1,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      className={`flex items-start space-x-3 mb-4 ${
        message.isUser ? 'flex-row-reverse space-x-reverse' : ''
      }`}
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
    >
      {/* Avatar */}
      <motion.div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          message.isUser
            ? 'bg-gradient-to-br from-cyan-400 to-cyan-600'
            : 'bg-gradient-to-br from-gray-700 to-gray-900 border border-cyan-400/30'
        }`}
        whileHover={{ scale: 1.1 }}
      >
        {message.isUser ? (
          <User className="w-4 h-4 text-black" />
        ) : (
          <Bot className="w-4 h-4 text-cyan-400" />
        )}
      </motion.div>

      {/* Message Bubble */}
      <motion.div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl relative ${
          message.isUser
            ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-black ml-auto'
            : 'bg-gradient-to-br from-gray-900 to-black border border-cyan-400/20 text-white'
        }`}
        whileHover={{ 
          boxShadow: message.isUser 
            ? "0 0 20px rgba(0, 255, 255, 0.4)" 
            : "0 0 20px rgba(0, 255, 255, 0.2)" 
        }}
      >
        {/* Message tail */}
        <div
          className={`absolute top-3 w-3 h-3 transform rotate-45 ${
            message.isUser
              ? 'right-[-6px] bg-gradient-to-br from-cyan-400 to-cyan-600'
              : 'left-[-6px] bg-gradient-to-br from-gray-900 to-black border-l border-t border-cyan-400/20'
          }`}
        />
        
        {/* Message content with basic formatting */}
        <div 
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ 
            __html: message.text
              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-cyan-300">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
              .replace(/^### (.*$)/gm, '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>')
              .replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
              .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
              .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
              .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
              .replace(/`([^`]+)`/g, '<code class="bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>')
              .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 p-3 rounded-md overflow-x-auto my-3"><code class="text-sm">$1</code></pre>')
              .replace(/\n\n/g, '</p><p class="mb-2 last:mb-0">')
              .replace(/^<p/m, '<p class="mb-2 last:mb-0"')
          }}
        />
        
        {/* Timestamp */}
        <div
          className={`text-xs mt-1 opacity-70 ${
            message.isUser ? 'text-black/70' : 'text-gray-400'
          }`}
        >
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChatMessage;
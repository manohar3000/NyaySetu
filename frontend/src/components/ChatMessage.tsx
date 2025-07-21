import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

interface Message {
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
        
        {/* Message content */}
        <p className="text-sm leading-relaxed">{message.text}</p>
        
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
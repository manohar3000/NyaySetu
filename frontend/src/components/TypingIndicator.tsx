import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

const TypingIndicator: React.FC = () => {
  return (
    <motion.div
      className="flex items-start space-x-3 mb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-cyan-400/30 flex items-center justify-center">
        <Bot className="w-4 h-4 text-cyan-400" />
      </div>

      {/* Typing bubble */}
      <motion.div
        className="bg-gradient-to-br from-gray-900 to-black border border-cyan-400/20 px-4 py-3 rounded-2xl relative"
        animate={{ 
          boxShadow: [
            "0 0 0 rgba(0, 255, 255, 0)",
            "0 0 20px rgba(0, 255, 255, 0.2)",
            "0 0 0 rgba(0, 255, 255, 0)"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Message tail */}
        <div className="absolute left-[-6px] top-3 w-3 h-3 bg-gradient-to-br from-gray-900 to-black border-l border-t border-cyan-400/20 transform rotate-45" />
        
        {/* Typing dots */}
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-400 mr-2">Vaanee is typing</span>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-cyan-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TypingIndicator;
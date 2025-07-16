import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Sparkles } from 'lucide-react';

interface ChatLauncherButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

const ChatLauncherButton: React.FC<ChatLauncherButtonProps> = ({ onClick, isOpen }) => {
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.5, delay: 1 }}
    >
      <motion.button
        onClick={onClick}
        className="relative w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full shadow-lg shadow-cyan-400/30 flex items-center justify-center group overflow-hidden"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
      >
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full opacity-0 group-hover:opacity-100"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Sparkle effects */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="absolute top-1 right-1 w-3 h-3 text-white opacity-60" />
          <Sparkles className="absolute bottom-1 left-1 w-2 h-2 text-white opacity-40" />
        </motion.div>
        
        {/* Main icon */}
        <motion.div
          animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-black"
            >
              ✕
            </motion.div>
          ) : (
            <MessageCircle className="w-8 h-8 text-black" />
          )}
        </motion.div>
        
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 border-2 border-cyan-400 rounded-full opacity-30"
          animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>
      
      {/* Tooltip */}
      <motion.div
        className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black/80 text-cyan-400 text-sm rounded-lg backdrop-blur-sm border border-cyan-400/30 whitespace-nowrap"
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        Talk to Vaanee
      </motion.div>
    </motion.div>
  );
};

export default ChatLauncherButton;
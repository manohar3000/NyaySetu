import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import Lottie from 'lottie-react'; // Uncomment if you have a Lottie waveform
// import waveformAnim from '../assets/waveform.json';

const avatarUrl = 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=128&h=128&q=80';

interface FloatingChatbotProps {
  open: boolean;
  onClose: () => void;
}

const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ open, onClose }) => {
  // Remove internal open state, use props instead
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            className="mb-4 w-80 max-w-[90vw] glassmorphism rounded-2xl p-4 border border-cyan-400/30 shadow-2xl bg-black/80"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          >
            <div className="flex items-center mb-2">
              <img src={avatarUrl} alt="Vaanee" className="w-10 h-10 rounded-full border-2 border-cyan-400 shadow-md mr-2" />
              <span className="font-orbitron text-cyan-200 font-bold text-lg">Vaanee</span>
              {/* {isTyping && <Lottie animationData={waveformAnim} loop className="w-10 h-6 ml-2" />} */}
              <span className="ml-2 animate-pulse text-cyan-400">●</span>
              <button onClick={onClose} className="ml-auto p-1 rounded-full bg-gray-800 text-cyan-400 hover:bg-gray-700 transition-all">
                ×
              </button>
            </div>
            <div className="h-40 overflow-y-auto text-cyan-100 font-poppins mb-2">
              <div className="mb-2">Hi! I’m Vaanee, your AI legal assistant. How can I help you today?</div>
              {/* Chat messages would go here */}
            </div>
            <input
              className="w-full px-4 py-2 rounded-xl bg-cyan-900/30 border border-cyan-400/20 text-cyan-100 font-poppins focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              placeholder="Type your message..."
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Floating bubble removed, as chatbot is now only opened via dashboard quick action */}
    </div>
  );
};

export default FloatingChatbot; 
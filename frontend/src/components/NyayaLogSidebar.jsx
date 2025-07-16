import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Scale, ScrollText } from 'lucide-react';

const mockChats = [
  { id: 1, title: 'Property Dispute', icon: <Scale className="w-6 h-6" /> },
  { id: 2, title: 'Court Summons Help', icon: <ScrollText className="w-6 h-6" /> },
  { id: 3, title: 'Find a Lawyer', icon: <Brain className="w-6 h-6" /> },
];

const sidebarVariants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.2 } },
};

const NyayaLogSidebar = ({ isOpen, onClose, onSelectChat, activeChatId }) => {
  const [search, setSearch] = useState('');
  const filteredChats = mockChats.filter(chat =>
    chat.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="nyaya-sidebar"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={sidebarVariants}
          className="fixed md:static top-0 left-0 h-full w-72 max-w-full z-40 bg-black/30 backdrop-blur-md border-r border-cyan-400/20 flex flex-col p-4 md:min-h-full min-h-32 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-cyan-400 font-orbitron text-2xl font-bold tracking-wide">NyayaLog</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-cyan-400/10 text-cyan-300 focus:outline-none"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mb-4 px-3 py-2 rounded-lg bg-gray-900/60 border border-cyan-400/20 text-white placeholder-cyan-300 focus:outline-none focus:border-cyan-400 font-poppins"
          />
          <nav className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-cyan-400/20 scrollbar-track-transparent">
            {filteredChats.map(chat => (
              <motion.button
                key={chat.id}
                onClick={() => onSelectChat && onSelectChat(chat.id)}
                className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl bg-black/40 border border-transparent transition-all text-left group focus:outline-none font-poppins shadow-md
                  ${activeChatId === chat.id ? 'border-cyan-400 bg-cyan-400/10' : 'hover:border-cyan-400 hover:bg-cyan-400/10'}`}
                whileHover={{ scale: 1.04, boxShadow: '0 0 16px #00ffff' }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-2xl group-hover:animate-pulse drop-shadow-cyan">{chat.icon}</span>
                <span className="font-poppins text-white group-hover:text-cyan-300 transition-colors">{chat.title}</span>
              </motion.button>
            ))}
          </nav>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default NyayaLogSidebar; 
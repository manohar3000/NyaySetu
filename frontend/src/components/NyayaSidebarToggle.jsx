import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Scale, ScrollText } from 'lucide-react'; // Lucide icons, pick one or allow prop

const iconMap = {
  brain: <Brain className="w-7 h-7" />,
  scale: <Scale className="w-7 h-7" />,
  scroll: <ScrollText className="w-7 h-7" />,
};

const NyayaSidebarToggle = ({ onClick, icon = 'scale', isOpen }) => (
  <motion.button
    onClick={onClick}
    aria-label="Open NyayaLog Sidebar"
    initial={false}
    animate={isOpen ? { rotate: 90, scale: 1.1, boxShadow: '0 0 24px #00ffff' } : { rotate: 0, scale: 1, boxShadow: '0 0 12px #00ffff' }}
    whileHover={{ scale: 1.15, boxShadow: '0 0 32px #00ffff', filter: 'brightness(1.2)' }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    className={
      `fixed z-50 top-4 left-4 md:top-8 md:left-6
      md:sticky md:left-0 md:top-1/2 md:transform md:-translate-y-1/2
      bg-black/60 border-2 border-cyan-400/70 shadow-xl
      rounded-full p-3 flex items-center justify-center
      neon-glow focus:outline-none
      transition-all duration-300
      hover:border-cyan-300 hover:bg-black/80
      `
    }
    style={{
      boxShadow: '0 0 16px #00ffff, 0 0 2px #00ffff',
      borderColor: '#00ffff',
    }}
  >
    <span className="text-cyan-300">
      {iconMap[icon]}
    </span>
  </motion.button>
);

export default NyayaSidebarToggle; 
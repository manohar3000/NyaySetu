import React from 'react';
import { motion } from 'framer-motion';

const SocialAuthButtons: React.FC = () => {
  return (
    <div className="flex flex-col w-full space-y-4 mb-2">
      <motion.button
        type="button"
        whileHover={{ scale: 1.04, boxShadow: '0 0 16px #00fff7, 0 0 32px #1e90ff' }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-center gap-3 py-3 w-full rounded-xl border-2 border-cyan-400/60 bg-black/40 text-white font-semibold text-base shadow-lg neon-glow transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 relative overflow-hidden"
        aria-label="Sign in with Google"
      >
        <motion.img
          src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
          alt="Google"
          className="w-6 h-6 drop-shadow-glow"
          initial={{ rotate: 0 }}
          whileHover={{ rotate: 12 }}
          transition={{ type: 'spring', stiffness: 300 }}
        />
        <span className="font-orbitron tracking-wide text-cyan-100 text-base md:text-lg drop-shadow-glow">Sign in with Google</span>
        {/* Neon animated border effect */}
        <span className="absolute inset-0 pointer-events-none animate-neon-border" />
      </motion.button>
      <motion.button
        type="button"
        whileHover={{ scale: 1.04, boxShadow: '0 0 16px #00fff7, 0 0 32px #1e90ff' }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-center gap-3 py-3 w-full rounded-xl border-2 border-cyan-400/40 bg-black/40 text-white font-semibold text-base shadow-lg neon-glow transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 relative overflow-hidden"
        aria-label="Sign in with Microsoft"
      >
        <motion.span
          className="text-xl drop-shadow-glow"
          initial={{ rotate: 0 }}
          whileHover={{ rotate: -12 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          &#xE70F;
        </motion.span>
        <span className="font-orbitron tracking-wide text-cyan-100 text-base md:text-lg drop-shadow-glow">Sign in with Microsoft</span>
        <span className="absolute inset-0 pointer-events-none animate-neon-border" />
      </motion.button>
    </div>
  );
};

export default SocialAuthButtons; 
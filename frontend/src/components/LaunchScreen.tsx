import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import Lottie from 'lottie-react'; // Uncomment if using Lottie
// import aiFaceAnimation from '../assets/ai-face.json'; // Placeholder for Lottie JSON

interface LaunchScreenProps {
  onFinish: () => void;
}

const LaunchScreen: React.FC<LaunchScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg">
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1.1, opacity: 1, filter: 'drop-shadow(0 0 40px #00ffff)' }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          {/* Neon Logo */}
          <motion.div
            className="rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 w-24 h-24 flex items-center justify-center mb-6 shadow-lg"
            animate={{ boxShadow: '0 0 60px #00ffff, 0 0 10px #00ffff' }}
            transition={{ repeat: Infinity, repeatType: 'mirror', duration: 1.5 }}
          >
            <span className="text-black text-5xl font-extrabold font-orbitron">V</span>
          </motion.div>
          {/* Lottie Animation Placeholder */}
          {/* <Lottie animationData={aiFaceAnimation} loop className="w-20 h-20 mb-4" /> */}
          <motion.h1
            className="text-4xl md:text-5xl font-bold font-orbitron text-cyan-400 drop-shadow-lg mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            Vaanee
          </motion.h1>
          <motion.p
            className="text-cyan-200 text-lg font-poppins mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            Your AI Legal Assistant
          </motion.p>
          <motion.button
            onClick={onFinish}
            className="mt-4 px-8 py-3 bg-cyan-400 text-black font-bold rounded-full shadow-lg hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 transition-all text-lg font-poppins"
            whileHover={{ scale: 1.08, boxShadow: '0 0 30px #00ffff' }}
            whileTap={{ scale: 0.95 }}
          >
            Enter
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LaunchScreen; 
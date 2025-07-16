import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
// You can replace this with a Lottie animation if available

interface WelcomeScreenProps {
  name: string;
  role: 'user' | 'lawyer';
  firstLogin: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ name, role, firstLogin }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (role === 'lawyer') navigate('/dashboard/lawyer');
      else navigate('/dashboard/user');
    }, 2500);
    return () => clearTimeout(timer);
  }, [role, navigate]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0F0F0F] to-[#101F2F] overflow-hidden">
      {/* Animated background particles */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ pointerEvents: 'none' }}
      >
        {/* Soft gradient pulse */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-cyan-900/30 to-cyan-400/10 animate-pulse"
          style={{ filter: 'blur(60px)' }}
        />
        {/* Floating particles */}
        {[...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-cyan-400/30"
            style={{
              width: `${16 + Math.random() * 32}px`,
              height: `${16 + Math.random() * 32}px`,
              top: `${Math.random() * 90}%`,
              left: `${Math.random() * 90}%`,
              filter: 'blur(2px)',
            }}
            animate={{
              y: [0, Math.random() * 40 - 20, 0],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2.5 + Math.random(),
              repeat: Infinity,
              repeatType: 'loop',
              delay: Math.random(),
            }}
          />
        ))}
      </motion.div>
      {/* Neon glowing ring (SVG + Framer Motion) */}
      <motion.div
        className="relative flex items-center justify-center mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 10 }}
      >
        <motion.svg
          width="220"
          height="220"
          viewBox="0 0 220 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_40px_#00FFFF]"
        >
          <motion.circle
            cx="110"
            cy="110"
            r="100"
            stroke="#00FFFF"
            strokeWidth="8"
            initial={{ strokeDasharray: 628, strokeDashoffset: 628 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 0 32px #00FFFF)' }}
          />
          <motion.circle
            cx="110"
            cy="110"
            r="90"
            stroke="#00FFFF"
            strokeWidth="2"
            strokeDasharray="12 12"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            style={{ filter: 'drop-shadow(0 0 16px #00FFFF)' }}
          />
        </motion.svg>
        {/* Animated AI avatar/logo (SVG) */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        >
          {/* Replace with Lottie or SVG as needed */}
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" fill="#101F2F" stroke="#00FFFF" strokeWidth="2" />
            <ellipse cx="40" cy="48" rx="18" ry="10" fill="#00FFFF" fillOpacity="0.12" />
            <ellipse cx="40" cy="32" rx="16" ry="16" fill="#00FFFF" fillOpacity="0.18" />
            <ellipse cx="40" cy="36" rx="8" ry="8" fill="#00FFFF" fillOpacity="0.5" />
            <ellipse cx="40" cy="36" rx="3" ry="3" fill="#fff" />
          </svg>
        </motion.div>
      </motion.div>
      {/* Welcome Text */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7 }}
      >
        <div className="text-3xl md:text-4xl font-orbitron font-bold text-cyan-300 drop-shadow-lg mb-2">
          {firstLogin ? `👋 Welcome, ${name}!` : `🎯 Welcome back, ${name}.`}
        </div>
        <div className="text-lg md:text-xl font-poppins text-cyan-100/80">
          {firstLogin ? `Let's get started.` : `Ready to continue your journey?`}
        </div>
      </motion.div>
      {/* Optional: Vaanee typing indicator */}
      <motion.div
        className="mt-8 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <span className="w-2 h-2 bg-cyan-400 rounded-full mx-1 animate-bounce" style={{ animationDelay: '0s' }} />
        <span className="w-2 h-2 bg-cyan-400 rounded-full mx-1 animate-bounce" style={{ animationDelay: '0.2s' }} />
        <span className="w-2 h-2 bg-cyan-400 rounded-full mx-1 animate-bounce" style={{ animationDelay: '0.4s' }} />
      </motion.div>
      {/* Optional: Soft chime audio */}
      {/* <audio autoPlay src="/sounds/chime.mp3" /> */}
    </div>
  );
};

export default WelcomeScreen; 
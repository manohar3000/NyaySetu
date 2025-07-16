import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import Lottie from 'lottie-react'; // Uncomment if you have a Lottie JSON
// import justiceScaleAnim from '../assets/justice-scale.json'; // Placeholder

interface SplashScreenProps {
  name: string;
  isNewUser: boolean;
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ name, isNewUser, onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-gradient-to-br from-[#0e0e0e] to-[#101F2F] overflow-hidden"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.8 }}
      >
        {/* Animated background particles */}
        <motion.div className="absolute inset-0 w-full h-full pointer-events-none">
          {[...Array(18)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-cyan-400/20"
              style={{
                width: `${18 + Math.random() * 32}px`,
                height: `${18 + Math.random() * 32}px`,
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
        {/* Neon justice scale + logo (Lottie placeholder + SVG) */}
        <motion.div
          className="relative flex items-center justify-center mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 10 }}
        >
          {/* Lottie animation placeholder */}
          {/* <Lottie animationData={justiceScaleAnim} loop className="w-44 h-44" /> */}
          {/* SVG fallback: Neon justice scale with logo */}
          <motion.svg
            width="180"
            height="180"
            viewBox="0 0 180 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_40px_#00FFE7]"
          >
            {/* Neon ring */}
            <motion.circle
              cx="90"
              cy="90"
              r="80"
              stroke="#00FFE7"
              strokeWidth="7"
              initial={{ strokeDasharray: 502, strokeDashoffset: 502 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              style={{ filter: 'drop-shadow(0 0 32px #00FFE7)' }}
            />
            {/* Justice scale arms */}
            <motion.line x1="40" y1="90" x2="140" y2="90" stroke="#00FFE7" strokeWidth="4" />
            <motion.line x1="90" y1="40" x2="90" y2="130" stroke="#00FFE7" strokeWidth="4" />
            {/* Scale pans */}
            <motion.ellipse cx="50" cy="120" rx="16" ry="7" fill="#00FFE7" fillOpacity="0.18" />
            <motion.ellipse cx="130" cy="120" rx="16" ry="7" fill="#00FFE7" fillOpacity="0.18" />
            {/* Center logo: NyayaSetu N */}
            <motion.text
              x="90"
              y="105"
              textAnchor="middle"
              fontSize="56"
              fontFamily="Orbitron, Montserrat, sans-serif"
              fill="#00FFE7"
              fontWeight="bold"
              style={{ filter: 'drop-shadow(0 0 12px #00FFE7)' }}
            >
              N
            </motion.text>
          </motion.svg>
        </motion.div>
        {/* Welcome Text */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7 }}
        >
          <div className="text-2xl md:text-3xl font-orbitron font-bold text-cyan-300 drop-shadow-lg mb-2">
            {isNewUser
              ? 'Welcome to NyayaSetu, your bridge to justice! ⚖️'
              : `Welcome back, ${name} 👋 Justice awaits.`}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen; 
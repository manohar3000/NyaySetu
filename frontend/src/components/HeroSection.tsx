import React from 'react';
import { motion } from 'framer-motion';
// import Lottie from 'lottie-react'; // Uncomment if you have a Lottie animation
// import aiAvatarAnim from '../assets/ai-avatar.json';

interface HeroSectionProps {
  name: string;
  subtitle?: string;
  quote?: string;
  avatarUrl?: string; // fallback to SVG/AI if not provided
}

const defaultAvatar =
  'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=256&h=256&facepad=2&q=80';

const blobSvg = (
  <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-16 -left-16 w-[420px] h-[420px] opacity-60 -z-10">
    <defs>
      <radialGradient id="blobGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stopColor="#00ffe7" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#0e0e0e" stopOpacity="0.1" />
      </radialGradient>
    </defs>
    <path d="M320,180Q340,220,300,260Q260,300,200,320Q140,340,100,300Q60,260,80,200Q100,140,140,100Q180,60,240,80Q300,100,320,180Z" fill="url(#blobGradient)" />
  </svg>
);

const HeroSection: React.FC<HeroSectionProps> = ({ name, subtitle, quote, avatarUrl }) => {
  return (
    <motion.section
      className="relative w-full max-w-3xl mx-auto mb-8 glassmorphism rounded-2xl p-8 border border-cyan-400/30 shadow-2xl flex flex-col md:flex-row items-center justify-between overflow-hidden"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.7 }}
    >
      {/* Animated SVG blob background */}
      {blobSvg}
      {/* Avatar (Lottie or image) */}
      <motion.div
        className="relative flex-shrink-0 mb-4 md:mb-0 md:mr-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
      >
        {/* <Lottie animationData={aiAvatarAnim} loop className="w-28 h-28 md:w-32 md:h-32" /> */}
        <img
          src={avatarUrl || defaultAvatar}
          alt="AI Avatar"
          className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-cyan-400 shadow-xl bg-black/30"
        />
        <span className="absolute bottom-2 right-2 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
      </motion.div>
      {/* Greeting and quote */}
      <div className="flex-1 text-center md:text-left">
        <motion.h1
          className="text-3xl md:text-4xl font-orbitron font-bold text-cyan-300 mb-2 drop-shadow-lg tracking-wide"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          <span className="block">Good Morning,</span>
          <span className="block text-4xl md:text-5xl text-white font-extrabold animate-gradient bg-gradient-to-r from-cyan-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            {name}!
          </span>
        </motion.h1>
        {subtitle && (
          <motion.p
            className="text-cyan-100/80 font-poppins mb-2 text-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            {subtitle}
          </motion.p>
        )}
        {quote && (
          <motion.blockquote
            className="italic text-cyan-200/80 font-poppins mt-2 text-base border-l-4 border-cyan-400 pl-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7 }}
          >
            “{quote}”
          </motion.blockquote>
        )}
      </div>
    </motion.section>
  );
};

export default HeroSection; 
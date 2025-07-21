import React from 'react';
import { motion } from 'framer-motion';
// import Lottie from 'lottie-react'; // Uncomment if you have a Lottie animation
// import journeyAnim from '../assets/journey.json';

const stages = [
  { label: 'Sign Up', icon: '📝' },
  { label: 'Find Lawyer', icon: '🧑‍⚖️' },
  { label: 'Upload Docs', icon: '📤' },
  { label: 'Case Started', icon: '⚖️' },
  { label: 'Hearing', icon: '🎤' },
  { label: 'Resolution', icon: '🏆' },
];

interface JusticeJourneyProps {
  currentStage: number; // 0-based index
}

const JusticeJourney: React.FC<JusticeJourneyProps> = ({ currentStage }) => {
  return (
    <motion.div
      className="w-full max-w-3xl mx-auto mb-8 glassmorphism rounded-2xl p-6 border border-cyan-400/30 shadow-2xl flex flex-col items-center overflow-x-auto"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.7 }}
    >
      <h2 className="text-xl font-orbitron text-cyan-300 mb-4 tracking-wide">Justice Journey</h2>
      {/* Animated SVG progress bar */}
      <div className="flex items-center w-full justify-between relative">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex flex-col items-center flex-1 min-w-[70px]">
            <motion.div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 border-4 ${i <= currentStage ? 'border-cyan-400 bg-cyan-900/80 shadow-cyan-400/40 shadow-lg' : 'border-cyan-900 bg-cyan-900/40'}`}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1, type: 'spring' }}
            >
              <span className="text-2xl md:text-3xl">
                {stage.icon}
              </span>
            </motion.div>
            <span className={`text-xs md:text-sm font-poppins ${i <= currentStage ? 'text-cyan-200' : 'text-cyan-400/50'}`}>{stage.label}</span>
            {/* Animated badge for completed */}
            {i < currentStage && (
              <motion.span
                className="mt-1 px-2 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-pink-400 text-black text-xs font-bold shadow-md border border-cyan-200 animate-bounce"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
              >
                ✓
              </motion.span>
            )}
          </div>
        ))}
        {/* Connecting lines */}
        <svg className="absolute left-0 top-6 w-full h-6 pointer-events-none" height="24">
          {stages.slice(1).map((_, i) => (
            <motion.line
              key={i}
              x1={`${(i / (stages.length - 1)) * 100}%`}
              y1="12"
              x2={`${((i + 1) / (stages.length - 1)) * 100}%`}
              y2="12"
              stroke={i < currentStage ? '#00FFE7' : '#1e293b'}
              strokeWidth="4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5, type: 'spring' }}
            />
          ))}
        </svg>
      </div>
    </motion.div>
  );
};

export default JusticeJourney; 
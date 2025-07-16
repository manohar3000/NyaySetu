import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface VaaneeAvatarProps {
  isListening: boolean;
  isSpeaking: boolean;
  isVoiceMode: boolean;
  onToggleListening: () => void;
}

const VaaneeAvatar: React.FC<VaaneeAvatarProps> = ({
  isListening,
  isSpeaking,
  isVoiceMode,
  onToggleListening
}) => {
  return (
    <motion.div
      className="flex flex-col items-center space-y-4 py-6"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Avatar Container */}
      <div className="relative">
        {/* Outer glow rings */}
        <motion.div
          className="absolute inset-0 w-32 h-32 rounded-full border-2 border-cyan-400/30"
          animate={isSpeaking ? { scale: [1, 1.3, 1] } : { scale: 1 }}
          transition={{ duration: 1.5, repeat: isSpeaking ? Infinity : 0 }}
        />
        <motion.div
          className="absolute inset-2 w-28 h-28 rounded-full border border-cyan-400/20"
          animate={isSpeaking ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 1.2, repeat: isSpeaking ? Infinity : 0, delay: 0.2 }}
        />
        
        {/* Main Avatar */}
        <motion.div
          className="relative w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 rounded-full backdrop-blur-sm border border-cyan-400/40 flex items-center justify-center overflow-hidden"
          animate={isListening ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 0.8, repeat: isListening ? Infinity : 0 }}
        >
          {/* Animated background pattern */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Central icon */}
          <motion.div
            className="relative z-10"
            animate={isSpeaking ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.6, repeat: isSpeaking ? Infinity : 0 }}
          >
            {isSpeaking ? (
              <Volume2 className="w-12 h-12 text-cyan-400" />
            ) : isListening ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Mic className="w-12 h-12 text-cyan-400" />
              </motion.div>
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-xl">V</span>
              </div>
            )}
          </motion.div>
          
          {/* Particle effects */}
          {(isListening || isSpeaking) && (
            <div className="absolute inset-0">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Status Text */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-cyan-400 mb-1">Vaanee</h3>
        <p className="text-sm text-gray-400">
          {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Your AI Legal Voice'}
        </p>
      </motion.div>
      
      {/* Voice Controls */}
      {isVoiceMode && (
        <motion.div
          className="flex items-center space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={onToggleListening}
            className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
              isListening
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-cyan-400 text-black hover:bg-cyan-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 inline mr-2" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 inline mr-2" />
                Start Listening
              </>
            )}
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VaaneeAvatar;
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertMessageProps {
  message: string | null;
}

const AlertMessage: React.FC<AlertMessageProps> = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.5 }}
          className="mb-4 p-3 rounded-xl bg-red-500/80 text-white text-center font-semibold shadow-lg"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlertMessage; 
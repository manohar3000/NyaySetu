import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../../contexts/SessionContext';
import { useNavigate } from 'react-router-dom';

interface SignoutModalProps {
  open: boolean;
  onClose: () => void;
}

const SignoutModal: React.FC<SignoutModalProps> = ({ open, onClose }) => {
  const { logout } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      // Perform logout when modal opens
      logout();
      
      // Redirect after a short delay
      const timer = setTimeout(() => {
        onClose();
        navigate('/auth?tab=signin');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [open, logout, navigate, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-black/80 rounded-2xl p-8 flex flex-col items-center shadow-2xl border border-cyan-400/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.5 }}
          >
            {/* Success Tick Animation */}
            <motion.div
              className="w-16 h-16 rounded-full bg-cyan-400 flex items-center justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', bounce: 0.6 }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <motion.path
                  d="M10 18l6 6 10-12"
                  stroke="#111"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                />
              </svg>
            </motion.div>
            <div className="text-cyan-200 text-lg font-bold mb-2">Signed out successfully!</div>
            <div className="text-cyan-400/60 text-sm">Redirecting to login...</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SignoutModal; 
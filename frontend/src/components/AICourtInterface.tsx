import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface AICourtInterfaceProps {
  onClose: () => void;
}

const AICourtInterface: React.FC<AICourtInterfaceProps> = ({ onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Get the backend URL from environment variables or use default
  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const aiCourtUrl = `${backendUrl}/ai-court`;

  const handleIframeError = () => {
    console.error('Failed to load AI Court iframe');
    if (retryCount < 2) {
      // Auto-retry a couple of times
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setError(null);
        setIsLoading(true);
      }, 1000);
    } else {
      setError('Failed to load AI Court interface. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  const handleIframeLoad = () => {
    console.log('AI Court iframe loaded successfully');
    setIsLoading(false);
    setError(null);
  };

  // Add event listener for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle messages from the iframe if needed
      console.log('Message from AI Court iframe:', event.data);
      
      // You can add specific message handling here if needed
      // For example, to handle authentication or navigation events
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  // Add a heartbeat check to verify backend is reachable
  useEffect(() => {
    const checkBackend = async () => {
      try {
        // We don't need the response, just checking if we can connect
        await fetch(backendUrl, { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store' 
        });
        // If we get here, the backend is reachable
        setError(null);
      } catch (err) {
        console.error('Backend connection error:', err);
        setError('Cannot connect to the AI Court server. Please make sure the backend is running.');
        setIsLoading(false);
      }
    };
    
    checkBackend();
    
    // Cleanup function
    return () => {
      // Any cleanup if needed
    };
  }, [backendUrl, retryCount]); // Add retryCount to dependencies to retry on error

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between p-4 bg-gray-900/80 border-b border-cyan-400/30">
        <h2 className="text-xl font-bold text-white">AI Court</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          aria-label="Close AI Court"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 w-full h-full relative bg-black">
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-10"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
              <p className="text-gray-300">Loading AI Court...</p>
              {retryCount > 0 && (
                <p className="text-gray-400 text-sm mt-2">
                  Attempt {retryCount + 1} of 3
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {error ? (
            <motion.div 
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-900/90 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Unable to load AI Court</h3>
              <p className="text-gray-300 mb-6 max-w-md">{error}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2"
                >
                  <span>Try Again</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <iframe
                ref={iframeRef}
                src={aiCourtUrl}
                title="AI Court Interface"
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                allow="microphone; camera; display-capture"
                onError={handleIframeError}
                onLoad={handleIframeLoad}
                style={{ visibility: isLoading ? 'hidden' : 'visible' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AICourtInterface;

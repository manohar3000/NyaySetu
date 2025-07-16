import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import VaaneeAvatar from './VaaneeAvatar';
import LaunchScreen from './LaunchScreen';
import NyayaLogSidebar from './NyayaLogSidebar';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Vaanee, your AI legal assistant. I can help you with legal questions, document analysis, and finding the right lawyer. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showLaunch, setShowLaunch] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting to the server. Please try again later.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    if (isListening) {
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    // In a real implementation, this would start/stop speech recognition
    if (!isListening) {
      // Simulate listening for 3 seconds
      setTimeout(() => {
        setIsListening(false);
        handleSendMessage("This is a voice message converted to text");
      }, 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-Screen Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex text-white md:flex-row flex-col overflow-hidden font-poppins"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Launch Screen */}
            {showLaunch ? (
              <LaunchScreen onFinish={() => setShowLaunch(false)} />
            ) : (
              <>
                {/* Sidebar */}
                <NyayaLogSidebar />
                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-lg relative">
            {/* Header */}
            <motion.div
              className="flex items-center justify-between p-4 border-b border-cyan-400/20 bg-gradient-to-r from-black to-gray-900"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <span className="text-black font-bold font-orbitron text-2xl">V</span>
                </div>
                <div>
                        <h3 className="font-semibold text-white font-orbitron text-lg">Vaanee</h3>
                        <p className="text-xs text-cyan-400 font-poppins">AI Legal Assistant</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={toggleVoiceMode}
                        className={`p-2 rounded-full transition-all duration-300 shadow-lg border border-cyan-400/30 ${isVoiceMode ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-cyan-400 hover:bg-gray-700'}`}
                        whileHover={{ scale: 1.1, boxShadow: '0 0 16px #00ffff' }}
                  whileTap={{ scale: 0.9 }}
                  title="Toggle Voice Mode"
                >
                  {isVoiceMode ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </motion.button>
                <motion.button
                  onClick={onClose}
                        className="p-2 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all duration-300 shadow-lg"
                        whileHover={{ scale: 1.1, rotate: 90, boxShadow: '0 0 16px #00ffff' }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
            {/* Voice Mode Avatar */}
            {isVoiceMode && (
              <VaaneeAvatar
                isListening={isListening}
                isSpeaking={isSpeaking}
                isVoiceMode={isVoiceMode}
                onToggleListening={toggleListening}
              />
            )}
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cyan-400/20 scrollbar-track-transparent">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    index={index}
                  />
                ))}
                {isTyping && <TypingIndicator />}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
            {/* Input Area */}
            {!isVoiceMode && (
              <motion.div
                className="p-4 border-t border-cyan-400/20 bg-gradient-to-r from-black to-gray-900"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Ask Vaanee anything about law..."
                            className="w-full px-4 py-3 bg-gray-900/50 border border-cyan-400/30 rounded-xl text-white placeholder-cyan-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all duration-300 font-poppins shadow-lg"
                      disabled={isTyping}
                    />
                  </div>
                  <motion.button
                    type="button"
                    onClick={toggleListening}
                          className={`p-3 rounded-xl transition-all duration-300 shadow-lg border border-cyan-400/30 ${isListening ? 'bg-red-500 text-white' : 'bg-gray-800 text-cyan-400 hover:bg-gray-700'}`}
                          whileHover={{ scale: 1.05, boxShadow: '0 0 16px #00ffff' }}
                    whileTap={{ scale: 0.95 }}
                    title="Voice Input"
                  >
                          {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={!inputText.trim() || isTyping}
                          className="p-3 bg-gradient-to-r from-cyan-400 to-cyan-600 text-black rounded-xl hover:from-cyan-300 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-orbitron shadow-lg border border-cyan-400/30"
                          whileHover={{ scale: 1.05, boxShadow: '0 0 16px #00ffff' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </form>
              </motion.div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Chatbot;
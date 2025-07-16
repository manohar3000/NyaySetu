import React, { useState, useRef, useEffect } from 'react';
import { Globe, ArrowRight, Users, FileText, MessageCircle, BrainCircuit, Sparkles, Ghost, Phone, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthForm from './AuthForm';

const languages = ['English', 'हिन्दी', 'தமிழ்'];
const slides = [
  {
    icon: <MessageCircle className="w-12 h-12 text-cyan-400 drop-shadow-glow animate-pulse" />, // Vaanee AI Chatbot
    headline: 'Vaanee AI Chatbot',
    subheadline: 'Your AI Legal Assistant',
    desc: 'Ask legal questions, get smart answers — anytime, in any language.',
  },
  {
    icon: <BrainCircuit className="w-12 h-12 text-cyan-400 drop-shadow-glow animate-pulse" />, // Case-based Lawyer Finder
    headline: 'Case-based Lawyer Finder',
    subheadline: 'Find the Right Lawyer Instantly',
    desc: 'Match with experienced lawyers based on your case type and urgency.',
  },
  {
    icon: <Ghost className="w-12 h-12 text-cyan-400 drop-shadow-glow animate-pulse" />, // Ghost Argument Detector
    headline: 'Ghost Argument Detector',
    subheadline: 'Detect Unfounded Claims',
    desc: 'Automatically analyze legal texts for misleading or weak arguments.',
  },
  {
    icon: <FileText className="w-12 h-12 text-cyan-400 drop-shadow-glow animate-pulse" />, // Document Summarizer
    headline: 'Document Summarizer',
    subheadline: 'Summarize Complex Docs in Seconds',
    desc: 'Get clear, simplified summaries of long legal documents.',
  },
  {
    icon: <Phone className="w-12 h-12 text-cyan-400 drop-shadow-glow animate-pulse" />, // Interactive IVR System
    headline: 'Interactive IVR System',
    subheadline: 'Talk to Vaanee Anywhere',
    desc: 'Use our intelligent IVR to interact with your legal assistant via call.',
  },
  {
    icon: <Shield className="w-12 h-12 text-cyan-400 drop-shadow-glow animate-pulse" />, // Privacy & Security
    headline: 'Privacy & Security',
    subheadline: 'Secure & Confidential',
    desc: 'We use encrypted storage and authentication to protect your legal data.',
  },
];

const logoSVG = (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
    <defs>
      <radialGradient id="vaanee-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00fff7" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#1e90ff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="vaanee-main" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00fff7" />
        <stop offset="1" stopColor="#1e90ff" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="20" fill="url(#vaanee-glow)" />
    <rect x="12" y="12" width="24" height="24" rx="8" fill="url(#vaanee-main)" />
    <path d="M18 30L24 18L30 30" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="24" cy="24" r="2.5" fill="#fff" />
  </svg>
);

const AuthPage: React.FC<{ onClose?: () => void; onAuthSuccess?: () => void }> = ({ onClose, onAuthSuccess }) => {
  const [lang, setLang] = useState('English');
  const [slide, setSlide] = useState(0);
  const slideInterval = useRef<NodeJS.Timeout | null>(null);
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [showForgot, setShowForgot] = useState(false);
  const [role, setRole] = useState<'user' | 'lawyer'>('user');
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    slideInterval.current = setInterval(() => {
      setSlide(s => (s + 1) % slides.length);
    }, 4000);
    return () => { if (slideInterval.current) clearInterval(slideInterval.current); };
  }, []);

  useEffect(() => {
    if (leftPanelRef.current) {
      leftPanelRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [tab, role]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen h-screen w-screen overflow-y-auto bg-black font-inter">
      {/* Neon Blue Animated Particles/Glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="neon-particle neon-particle1" />
        <div className="neon-particle neon-particle2" />
        <div className="neon-particle neon-particle3" />
      </div>
      {/* Split Panel Container */}
      <div className="relative flex flex-col md:flex-row w-full max-w-4xl mx-auto my-auto min-h-screen md:min-h-[540px] md:h-[80vh] shadow-2xl rounded-3xl overflow-hidden z-10 bg-black/60 backdrop-blur-2xl" style={{boxShadow: '0 8px 48px 0 #00fff7cc'}}>
        {/* Left: Glassmorphic Neon Auth Panel */}
        <motion.div
          ref={leftPanelRef}
          className="flex-1 flex flex-col px-8 py-8 md:py-12 md:px-12 bg-black/60 backdrop-blur-2xl relative overflow-y-auto max-h-screen"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* All content (header, welcome, social logins, form) is now scrollable as one, flex-1 restored for layout */}
          {/* Top Row: Logo & Language */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              {logoSVG}
              <span className="text-xl font-bold text-white tracking-wide drop-shadow-glow">Vaanee</span>
            </div>
            <div className="flex items-center space-x-1 text-cyan-200/80">
              <Globe className="w-5 h-5" />
              <select
                className="bg-transparent text-cyan-200/80 focus:outline-none text-sm"
                value={lang}
                onChange={e => setLang(e.target.value)}
                aria-label="Select language"
              >
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          {/* Branded Welcome Message */}
          <div className="mb-6 pt-4 min-h-[120px] scroll-pt-4">
            <h2 className="text-2xl font-bold text-white mb-2 font-inter animate-glow-text">Welcome to NyayaLog!</h2>
            <p className="text-cyan-100/80 text-sm font-inter">India’s trusted legal platform. {tab === 'signup' ? 'Sign up to connect with top lawyers, get instant legal help, and manage your legal journey with ease.' : 'Sign in to access your dashboard, connect with lawyers, and manage your legal matters securely.'}</p>
          </div>
          {/* Tab Toggle */}
          <div className="flex items-center justify-center w-full mb-4">
            <button
              className={`px-6 py-2 rounded-l-xl font-bold text-base transition-all duration-200 ${tab === 'signin' ? 'bg-cyan-400/20 text-cyan-200 border-b-2 border-cyan-400' : 'bg-transparent text-cyan-400/70'}`}
              onClick={() => setTab('signin')}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`px-6 py-2 rounded-r-xl font-bold text-base transition-all duration-200 ${tab === 'signup' ? 'bg-cyan-400/20 text-cyan-200 border-b-2 border-cyan-400' : 'bg-transparent text-cyan-400/70'}`}
              onClick={() => setTab('signup')}
              type="button"
            >
              Sign Up
            </button>
          </div>
          {/* Role Toggle for both Sign In and Sign Up */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <span className="text-cyan-200 text-sm font-semibold">{tab === 'signup' ? 'Sign up as:' : 'Sign in as:'}</span>
            <button
              type="button"
              className={`px-4 py-2 rounded-xl font-bold text-base transition-all duration-200 border border-cyan-400/40 ${role === 'user' ? 'bg-cyan-400/20 text-cyan-200' : 'bg-transparent text-cyan-400/70'}`}
              onClick={() => setRole('user')}
            >
              User
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-xl font-bold text-base transition-all duration-200 border border-cyan-400/40 ${role === 'lawyer' ? 'bg-cyan-400/20 text-cyan-200' : 'bg-transparent text-cyan-400/70'}`}
              onClick={() => setRole('lawyer')}
            >
              Lawyer
            </button>
          </div>
          {/* Form Area (remains the same, no flex-1) */}
          <AuthForm tab={tab} role={role} onAuthSuccess={onAuthSuccess} />
          {/* Links */}
          <div className="flex items-center justify-between text-xs text-cyan-200/80 font-inter mt-2">
            <button className="underline underline-offset-2 hover:text-cyan-300 transition" onClick={() => setShowForgot(true)}>Forgot Password?</button>
            {tab === 'signin' ? (
              <span>
                Don&apos;t have an account?{' '}
                <button className="underline underline-offset-2 hover:text-cyan-300 transition" onClick={() => setTab('signup')}>Sign up here</button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button className="underline underline-offset-2 hover:text-cyan-300 transition" onClick={() => setTab('signin')}>Sign in</button>
              </span>
            )}
          </div>
        </motion.div>
        {/* Right: Animated Feature Carousel Panel */}
        <motion.div className="flex-1 hidden md:flex flex-col items-center justify-center bg-black relative overflow-hidden p-0" initial={{ x: 200, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
          {/* Neon deep gradient background and animated particles */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1c] via-[#0a223a] to-black z-0" />
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="neon-particle neon-particle4" />
            <div className="neon-particle neon-particle5" />
            {/* Extra glowing line/scale effect */}
            <div className="absolute left-1/2 top-0 w-1 h-32 bg-gradient-to-b from-cyan-400/40 to-transparent rounded-full blur-2xl opacity-60 animate-glowline" />
          </div>
          {/* Carousel Content */}
          <div className="flex flex-col items-center justify-center h-full w-full z-10 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                className="flex flex-col items-center justify-center w-full h-full px-8"
                initial={{ opacity: 0, x: 80, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -80, scale: 0.98 }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
              >
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="mb-4">{slides[slide].icon}</div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 font-inter drop-shadow-glow animate-glow-text tracking-tight">{slides[slide].headline}</h2>
                  <div className="text-cyan-300 text-lg md:text-xl font-semibold mb-2 animate-fade-in font-inter drop-shadow-glow">{slides[slide].subheadline}</div>
                  <p className="text-cyan-100/90 text-base md:text-lg mb-4 text-center font-inter animate-fade-in max-w-xl">{slides[slide].desc}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            {/* Carousel Dots */}
            <div className="flex space-x-2 mt-4">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 ${i === slide ? 'bg-cyan-400 border-cyan-400 shadow-cyan-400/40 shadow-md' : 'bg-transparent border-cyan-700'} transition-all duration-200`}
                  onClick={() => setSlide(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg"
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
              <div className="text-cyan-200 text-lg font-bold mb-2">Forgot Password?</div>
              <div className="mb-4 text-cyan-100 text-sm">Enter your email or phone to reset your password.</div>
              <input
                type="text"
                className="w-full px-4 py-2 mb-4 bg-gray-900/50 border border-cyan-400/30 rounded-xl text-white placeholder-cyan-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all duration-300 font-poppins shadow-lg"
                placeholder="Email or phone"
              />
              <button
                className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-bold shadow-lg hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300 font-orbitron ripple"
                onClick={() => setShowForgot(false)}
              >
                Send Reset Link
              </button>
              <button
                className="mt-4 text-cyan-300 hover:underline text-sm ripple"
                onClick={() => setShowForgot(false)}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Neon Particle CSS and Glassmorphism/Glow */}
      <style>{`
        .font-inter { font-family: 'Inter', 'Poppins', 'Space Grotesk', sans-serif; }
        .neon-particle {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.18;
          pointer-events: none;
        }
        .neon-particle1 { width: 320px; height: 180px; left: -80px; top: 0px; background: #00fff7; animation: neonMove1 12s ease-in-out infinite alternate; }
        .neon-particle2 { width: 200px; height: 120px; right: -60px; top: 40px; background: #1e90ff; animation: neonMove2 16s ease-in-out infinite alternate; }
        .neon-particle3 { width: 180px; height: 100px; left: 40vw; bottom: -60px; background: #00fff7; animation: neonMove3 18s ease-in-out infinite alternate; }
        .neon-particle4 { width: 180px; height: 100px; right: 10vw; bottom: 0px; background: #00fff7; animation: neonMove4 14s ease-in-out infinite alternate; }
        .neon-particle5 { width: 120px; height: 80px; left: 10vw; top: 10vh; background: #1e90ff; animation: neonMove5 20s ease-in-out infinite alternate; }
        @keyframes neonMove1 { 0% { transform: translateY(0) scale(1); } 100% { transform: translateY(40px) scale(1.08); } }
        @keyframes neonMove2 { 0% { transform: translateY(0) scale(1); } 100% { transform: translateY(-60px) scale(1.1); } }
        @keyframes neonMove3 { 0% { transform: translateX(0) scale(1); } 100% { transform: translateX(60px) scale(1.12); } }
        @keyframes neonMove4 { 0% { transform: translateX(0) scale(1); } 100% { transform: translateX(-40px) scale(1.05); } }
        @keyframes neonMove5 { 0% { transform: translateY(0) scale(1); } 100% { transform: translateY(30px) scale(1.12); } }
        .neon-glow { box-shadow: 0 0 16px #00fff7cc, 0 0 2px #00fff7; }
        .neon-glow-input:focus { box-shadow: 0 2px 0 0 #00fff7, 0 0 8px #00fff7cc; border-color: #00fff7; }
        .drop-shadow-glow { filter: drop-shadow(0 0 8px #00fff7cc); }
        .floating-label { transition: all 0.2s cubic-bezier(.4,0,.2,1); }
        input:focus + .floating-label, input:not(:placeholder-shown) + .floating-label {
          top: 0.25rem; left: 1rem; font-size: 0.85rem; color: #00fff7; background: rgba(20,30,40,0.7);
        }
        .ripple { position: relative; overflow: hidden; }
        .ripple:after { content: ''; display: block; position: absolute; border-radius: 50%; pointer-events: none; width: 100px; height: 100px; top: 50%; left: 50%; background: rgba(0,255,247,0.25); transform: translate(-50%, -50%) scale(0); opacity: 0.7; transition: transform 0.4s, opacity 0.8s; }
        .ripple:active:after { transform: translate(-50%, -50%) scale(2.5); opacity: 0; transition: 0s; }
        .animate-glow-text { animation: glowText 2s ease-in-out infinite alternate; }
        @keyframes glowText { 0% { text-shadow: 0 0 8px #00fff7cc; } 100% { text-shadow: 0 0 24px #00fff7; } }
        .animate-fade-in { animation: fadeIn 1.2s cubic-bezier(.4,0,.2,1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .bg-gradient-radial { background: radial-gradient(ellipse at center, #00fff733 0%, #1e90ff22 40%, #000 100%); }
        @keyframes glowline { 0% { opacity: 0.4; } 50% { opacity: 0.9; } 100% { opacity: 0.4; } }
        .animate-glowline { animation: glowline 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default AuthPage; 
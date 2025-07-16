import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Users, FileText, Ghost, Calendar, MessageCircle, Settings, LogOut, Search, Briefcase } from 'lucide-react';
import FloatingChatbot from '../components/FloatingChatbot';
import { useSession } from '../contexts/SessionContext';
import HeroSection from '../components/HeroSection';
import Sidebar from '../components/Sidebar';
import JusticeJourney from '../components/JusticeJourney';
// import Lottie from 'lottie-react'; // Uncomment if you have Lottie files
// import clientAnim from '../assets/client.json';
// import caseAnim from '../assets/case.json';
// import calendarAnim from '../assets/calendar.json';

const sidebarLinks = [
  { icon: <Search />, label: 'Dashboard', route: '/dashboard/lawyer' },
  { icon: <Users />, label: 'Client Requests', route: '/dashboard/lawyer/clients' },
  { icon: <FileText />, label: 'Active Cases', route: '/dashboard/lawyer/cases' },
  { icon: <Briefcase />, label: 'Upload Advice / Documents', route: '/dashboard/lawyer/upload' },
  { icon: <Ghost />, label: 'Vaanee Insights', route: '/dashboard/lawyer/insights' },
  { icon: <Calendar />, label: 'Calendar & Appointments', route: '/dashboard/lawyer/calendar' },
  { icon: <Settings />, label: 'Settings', route: '/dashboard/lawyer/settings' },
  { icon: <LogOut />, label: 'Logout', route: '/logout' },
];

const quickAccess = [
  {
    icon: <Users className="w-8 h-8 text-cyan-400" />,
    label: 'Client Requests',
    // lottie: clientAnim,
    color: 'from-cyan-400 to-cyan-600',
    avatar: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=128&h=128&q=80',
  },
  {
    icon: <FileText className="w-8 h-8 text-cyan-400" />,
    label: 'Active Cases',
    // lottie: caseAnim,
    color: 'from-pink-400 to-cyan-400',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=128&h=128&q=80',
  },
  {
    icon: <Calendar className="w-8 h-8 text-cyan-400" />,
    label: 'Calendar & Appointments',
    // lottie: calendarAnim,
    color: 'from-cyan-400 to-blue-500',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=128&h=128&q=80',
  },
];

const activityTimeline = [
  {
    time: '09:30 AM',
    desc: 'You received a new client request',
    // lottie: clientAnim,
    avatar: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=64&h=64&q=80',
  },
  {
    time: '10:00 AM',
    desc: 'You updated an active case',
    // lottie: caseAnim,
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=64&h=64&q=80',
  },
  {
    time: '11:15 AM',
    desc: 'You scheduled an appointment',
    // lottie: calendarAnim,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=64&h=64&q=80',
  },
];

const sampleBadges = ['Justice Pro', 'Case Mentor'];

const LawyerDashboard: React.FC = () => {
  const { name } = useSession();
  const [activeRoute, setActiveRoute] = useState('/dashboard/lawyer');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const avatarUrl = undefined; // Replace with user avatar if available

  const handleNavigate = (route: string) => {
    setActiveRoute(route);
    // Add navigation logic here (e.g., useNavigate from react-router)
  };

  // 3D tilt effect for cards
  const Card3D = ({ children }: { children: React.ReactNode }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [0, 1], [8, -8]);
    const rotateY = useTransform(x, [0, 1], [-8, 8]);
    return (
      <motion.div
        className="w-full h-full"
        style={{ perspective: 1200 }}
        onMouseMove={e => {
          const card = e.currentTarget.getBoundingClientRect();
          const px = (e.clientX - card.left) / card.width;
          const py = (e.clientY - card.top) / card.height;
          x.set(px);
          y.set(py);
        }}
        onMouseLeave={() => {
          x.set(0.5);
          y.set(0.5);
        }}
      >
        <motion.div
          style={{ rotateX, rotateY }}
          className="w-full h-full"
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          {children}
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#0e0e0e] font-poppins">
      {/* Sidebar (desktop) */}
      <Sidebar
        links={sidebarLinks}
        active={activeRoute}
        onNavigate={handleNavigate}
        avatarUrl={avatarUrl}
        name={name}
        badges={sampleBadges}
      />
      {/* Main Panel */}
      <main className="flex-1 flex flex-col items-center px-2 md:px-8 py-8 bg-gradient-to-br from-[#0e0e0e] to-[#101F2F] min-h-screen relative overflow-x-hidden">
        {/* Dynamic Animated Background */}
        <motion.div
          className="absolute inset-0 w-full h-full -z-20 pointer-events-none"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
        >
          {/* Morphing gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 via-pink-400/10 to-cyan-400/10 animate-pulse"
            style={{ filter: 'blur(80px)' }}
            animate={{ scale: [1, 1.04, 1], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 16, repeat: Infinity }}
          />
          {/* Parallax SVG blob */}
          <motion.svg
            viewBox="0 0 400 400"
            className="absolute top-[-80px] left-[-80px] w-[480px] h-[480px] opacity-60"
            style={{ filter: 'blur(16px)' }}
            animate={{ x: [0, 40, -40, 0], y: [0, 30, -30, 0] }}
            transition={{ duration: 18, repeat: Infinity }}
          >
            <defs>
              <radialGradient id="lawyerDashBlob" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#00ffe7" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#0e0e0e" stopOpacity="0.1" />
              </radialGradient>
            </defs>
            <motion.path
              d="M320,180Q340,220,300,260Q260,300,200,320Q140,340,100,300Q60,260,80,200Q100,140,140,100Q180,60,240,80Q300,100,320,180Z"
              fill="url(#lawyerDashBlob)"
              animate={{ d: [
                'M320,180Q340,220,300,260Q260,300,200,320Q140,340,100,300Q60,260,80,200Q100,140,140,100Q180,60,240,80Q300,100,320,180Z',
                'M320,180Q360,220,320,260Q260,320,200,320Q140,320,100,300Q60,260,80,200Q100,140,140,120Q180,80,240,100Q300,120,320,180Z',
                'M320,180Q340,220,300,260Q260,300,200,320Q140,340,100,300Q60,260,80,200Q100,140,140,100Q180,60,240,80Q300,100,320,180Z',
              ] }}
              transition={{ duration: 18, repeat: Infinity }}
            />
          </motion.svg>
        </motion.div>
        {/* Hero Section */}
        <HeroSection
          name={name}
          subtitle="Here’s your legal dashboard. Stay on top of your cases and appointments."
          quote="The power of the lawyer is in the uncertainty of the law."
        />
        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-8">
          {quickAccess.map((action, i) => (
            <Card3D key={action.label}>
              <motion.div
                className={`glassmorphism rounded-xl p-6 border border-cyan-400/20 shadow-lg flex flex-col items-center hover:shadow-cyan-400/30 transition-all duration-300 cursor-pointer bg-gradient-to-br ${action.color} relative overflow-hidden`}
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.09, boxShadow: '0 0 40px #00FFE7', rotate: 1.5 }}
              >
                {/* {action.lottie && <Lottie animationData={action.lottie} loop className="w-14 h-14 mb-2" />} */}
                <span className="mb-2 z-10">{action.icon}</span>
                <span className="font-poppins text-lg text-cyan-100 text-center drop-shadow-md z-10">{action.label}</span>
                {/* Avatar chip for parallax effect */}
                <img src={action.avatar} alt="avatar" className="absolute -top-6 -right-6 w-16 h-16 rounded-full border-4 border-cyan-400 shadow-lg opacity-70" style={{ filter: 'blur(0.5px)' }} />
                {/* Glassmorphic overlay */}
                <div className="absolute inset-0 rounded-xl bg-white/5 backdrop-blur-[2px] pointer-events-none" />
              </motion.div>
            </Card3D>
          ))}
        </div>
        {/* Activity Timeline */}
        <motion.div
          className="w-full max-w-4xl glassmorphism rounded-xl p-6 border border-cyan-400/20 shadow-lg mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <h2 className="text-xl font-orbitron text-cyan-300 mb-4 tracking-wide">Recent Activity Timeline</h2>
          <div className="flex flex-col space-y-4">
            {activityTimeline.map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center space-x-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
              >
                {/* {item.lottie && <Lottie animationData={item.lottie} loop className="w-8 h-8" />} */}
                <img src={item.avatar} alt="avatar" className="w-10 h-10 rounded-full border-2 border-cyan-400 shadow-md" />
                <span className="text-cyan-100 font-poppins flex-1">{item.desc}</span>
                <span className="text-cyan-300 text-xs font-mono">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        {/* Justice Journey */}
        <JusticeJourney currentStage={4} />
        {/* Floating Vaanee Chatbot */}
        <FloatingChatbot />
      </main>
      {/* Bottom Navbar (mobile) */}
      <AnimatePresence>
        {isMobile && (
          <motion.nav
            className="fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center bg-black/70 backdrop-blur-lg border-t border-cyan-400/20 py-2 glassmorphism md:hidden"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 80 }}
          >
            {sidebarLinks.slice(0, 5).map((link, i) => (
              <motion.button
                key={link.label}
                className="flex flex-col items-center text-cyan-200 hover:text-cyan-100 transition-all duration-200 font-poppins group"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-cyan-400 group-hover:animate-bounce">{link.icon}</span>
                <span className="text-xs font-poppins mt-1">{link.label}</span>
              </motion.button>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LawyerDashboard; 
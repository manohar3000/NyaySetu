import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Users, FileText, Ghost, Phone, MessageCircle, Settings, LogOut, Search,
  Upload, BarChart3, Activity, Clock, Bell, Zap, Shield, Calendar, Menu
} from 'lucide-react';
import FloatingChatbot from '../components/FloatingChatbot';
import { useSession } from '../contexts/SessionContext';
import HeroSection from '../components/HeroSection';
import JusticeJourney from '../components/JusticeJourney';
import ChatLauncherButton from '../components/ChatLauncherButton';
import Chatbot from '../components/Chatbot';
import NyayaLogSidebar from '../components/NyayaLogSidebar';

const navigationItems = [
  { icon: <Search className="w-5 h-5" />, label: 'Dashboard', route: '/dashboard/user' },
  { icon: <Users className="w-5 h-5" />, label: 'Find a Lawyer', route: '/dashboard/user/find-lawyer' },
  { icon: <FileText className="w-5 h-5" />, label: 'My Cases', route: '/dashboard/user/cases' },
  { icon: <Upload className="w-5 h-5" />, label: 'Document Summarizer', route: '/dashboard/user/summarizer' },
  { icon: <Phone className="w-5 h-5" />, label: 'IVR Callback', route: '/dashboard/user/ivr' },
  { icon: <MessageCircle className="w-5 h-5" />, label: 'Chat with Vaanee', route: '/dashboard/user/chat' },
];

const quickActions = [
  {
    icon: <Upload className="w-8 h-8 text-cyan-400" />,
    label: 'Upload & Summarize',
    description: 'Get instant summaries of legal documents',
    color: 'from-cyan-400/20 to-cyan-600/20',
    borderColor: 'border-cyan-400/50',
    stats: '24 docs processed',
  },
  {
    icon: <MessageCircle className="w-8 h-8 text-pink-400" />,
    label: 'Talk to Vaanee',
    description: 'Your AI legal assistant',
    color: 'from-pink-400/20 to-purple-600/20',
    borderColor: 'border-pink-400/50',
    stats: '15 conversations',
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-blue-400" />,
    label: 'Track Cases',
    description: 'Monitor your legal proceedings',
    color: 'from-blue-400/20 to-indigo-600/20',
    borderColor: 'border-blue-400/50',
    stats: '3 active cases',
  },
];

const statsCards = [
  { icon: <Activity className="w-6 h-6" />, label: 'Active Cases', value: '03', trend: '+1 this week' },
  { icon: <Clock className="w-6 h-6" />, label: 'Hours Saved', value: '47', trend: '+5 this week' },
  { icon: <Shield className="w-6 h-6" />, label: 'Success Rate', value: '92%', trend: '+2.5% this month' },
  { icon: <Zap className="w-6 h-6" />, label: 'AI Interactions', value: '156', trend: '+23 this week' },
];

const activityTimeline = [
  {
    time: '10:45 AM',
    date: 'Today',
    type: 'document',
    title: 'Contract Review Complete',
    desc: 'AI analysis found 3 potential issues',
    icon: <FileText className="w-5 h-5 text-cyan-400" />,
    color: 'border-cyan-400',
  },
  {
    time: '09:30 AM',
    date: 'Today',
    type: 'chat',
    title: 'Consultation with Vaanee',
    desc: 'Discussed case strategy and next steps',
    icon: <MessageCircle className="w-5 h-5 text-pink-400" />,
    color: 'border-pink-400',
  },
  {
    time: 'Yesterday',
    date: '2:15 PM',
    type: 'case',
    title: 'Case Status Updated',
    desc: 'New hearing date scheduled',
    icon: <Calendar className="w-5 h-5 text-purple-400" />,
    color: 'border-purple-400',
  },
];

const UserDashboard: React.FC = () => {
  const { name } = useSession();
  const [activeRoute, setActiveRoute] = useState('/dashboard/user');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const Card3D = ({ children }: { children: React.ReactNode }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-0.5, 0.5], [7, -7]);
    const rotateY = useTransform(x, [-0.5, 0.5], [-7, 7]);

    return (
      <motion.div
        className="w-full h-full"
        style={{ perspective: 1200 }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          x.set((e.clientX - rect.left) / rect.width - 0.5);
          y.set((e.clientY - rect.top) / rect.height - 0.5);
        }}
        onMouseLeave={() => {
          x.set(0);
          y.set(0);
        }}
      >
        <motion.div
          style={{ rotateX, rotateY }}
          className="w-full h-full"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {children}
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] font-poppins flex">
      {/* Sidebar always visible */}
      <NyayaLogSidebar />
      <div className="flex-1">
        {/* IVR Support Number */}
        <div className="flex items-center justify-center mt-6 mb-4">
          <div className="bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl shadow-lg px-6 py-4 flex items-center space-x-4">
            <span className="text-white font-bold text-lg">Call our IVR for instant help:</span>
            <a href="tel:+12622052416" className="text-black bg-white rounded-lg px-4 py-2 font-bold text-xl hover:bg-cyan-100 transition-all duration-200 shadow-md">
              +1 262-205-2416
            </a>
          </div>
        </div>
        {/* Top Navigation Bar */}
        <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-cyan-400/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo and User Info */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">{name}</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-cyan-400">Legal Explorer</span>
                    <span className="text-xs text-cyan-400">•</span>
                    <span className="text-xs text-cyan-400">Case Starter</span>
                  </div>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                {navigationItems.map((item) => (
                  <motion.button
                    key={item.label}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeRoute === item.route
                        ? 'text-cyan-400 bg-cyan-400/10'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                    onClick={() => setActiveRoute(item.route)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex items-center space-x-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center space-x-4">
                <motion.button
                  className="p-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bell className="w-5 h-5" />
                </motion.button>
                <motion.button
                  className="p-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20 transition-all md:hidden"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Menu className="w-5 h-5" />
                </motion.button>
                <motion.button
                  className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold hover:opacity-90 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                className="md:hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {navigationItems.map((item) => (
                    <motion.button
                      key={item.label}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeRoute === item.route
                          ? 'text-cyan-400 bg-cyan-400/10'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                      onClick={() => {
                        setActiveRoute(item.route);
                        setShowMobileMenu(false);
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center space-x-2">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-6 md:p-8 relative">
          {/* Animated Background */}
          <div className="absolute inset-0 w-full h-full -z-10">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-pink-900/10 to-purple-900/20"
              animate={{
                background: [
                  'radial-gradient(circle at 0% 0%, rgba(0,255,231,0.1) 0%, rgba(0,0,0,0) 50%)',
                  'radial-gradient(circle at 100% 100%, rgba(0,255,231,0.1) 0%, rgba(0,0,0,0) 50%)',
                  'radial-gradient(circle at 0% 100%, rgba(0,255,231,0.1) 0%, rgba(0,0,0,0) 50%)',
                  'radial-gradient(circle at 100% 0%, rgba(0,255,231,0.1) 0%, rgba(0,0,0,0) 50%)',
                ],
              }}
              transition={{ duration: 10, repeat: Infinity }}
            />
          </div>

          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {name}</h1>
            <p className="text-cyan-400">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} |{' '}
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="p-6 rounded-xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/50 hover:border-cyan-400/50 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-cyan-400/10">{stat.icon}</div>
                  <span className="text-xs text-cyan-400">{stat.trend}</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions Section (restore 'Talk to Vaanee') */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {quickActions.map((action, idx) => (
              <motion.div
                key={action.label}
                className={`rounded-2xl p-6 border-2 ${action.borderColor} bg-gradient-to-br ${action.color} shadow-xl flex flex-col items-center hover:scale-105 transition-transform duration-300 cursor-pointer`}
                whileHover={{ scale: 1.07 }}
                onClick={() => {
                  if (action.label === 'Talk to Vaanee') setIsChatbotOpen(true);
                  // Add logic for other quick actions if needed
                }}
              >
                {action.icon}
                <h3 className="text-lg font-bold text-white mt-4 mb-2">{action.label}</h3>
                <p className="text-sm text-gray-300 mb-2 text-center">{action.description}</p>
                <span className="text-xs text-cyan-400 font-semibold">{action.stats}</span>
              </motion.div>
            ))}
          </section>

          {/* Activity Timeline */}
          <div className="rounded-xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-cyan-400" />
              Recent Activity
            </h2>
            <div className="space-y-6">
              {activityTimeline.map((activity, i) => (
                <motion.div
                  key={i}
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className={`relative flex items-center justify-center p-2 rounded-lg bg-gray-800/50 border ${activity.color}`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-white">{activity.title}</h4>
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                    <p className="text-sm text-gray-400">{activity.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </main>
        {/* Floating Chatbot Launcher */}
        <ChatLauncherButton onClick={() => setIsChatbotOpen(v => !v)} isOpen={isChatbotOpen} />
        {/* Main Chatbot Modal */}
        <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
      </div>
    </div>
  );
};

export default UserDashboard; 
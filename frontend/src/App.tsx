import React from 'react';
import { motion } from 'framer-motion';
import { 
  Scale, 
  Bot, 
  Search, 
  FileText, 
  Users, 
  MessageCircle, 
  Star,
  Menu,
  X,
  ChevronRight,
  Linkedin,
  Github,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import AuthPage from './components/auth/AuthPage';
import WelcomeScreen from './components/WelcomeScreen';
import SplashScreen from './components/SplashScreen';
import { useSession } from './contexts/SessionContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import UserDashboard from './pages/UserDashboard';
import LawyerDashboard from './pages/LawyerDashboard';
import DashboardPage from './pages/DashboardPage';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = React.useState(false);
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const glowHover = {
    initial: { boxShadow: "0 0 0 rgba(0, 255, 255, 0)" },
    hover: { 
      boxShadow: "0 0 30px rgba(0, 255, 255, 0.6)",
      scale: 1.05,
      transition: { duration: 0.3 }
    }
  };

  const features = [
    {
      icon: <Search className="w-8 h-8" />,
      title: "Find a Lawyer",
      description: "Filter by location, fee, and case type to find the perfect legal representation for your needs."
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: "Vaanee - Your AI Legal Voice",
      description: "Voice-to-voice, multilingual AI companion available 24/7. Just speak naturally and get instant legal guidance."
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Document Summarizer",
      description: "Instantly summarize complex legal documents and extract key insights with AI-powered analysis."
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Appointment Booking",
      description: "Schedule consultations with lawyers seamlessly with our intelligent appointment scheduling system."
    },
    {
      icon: <Scale className="w-8 h-8" />,
      title: "AI Court",
      description: "Practice your legal cases in a virtual courtroom environment with AI-powered simulations."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Legal Community",
      description: "Connect with legal professionals and get expert advice from our network of verified lawyers."
    }
  ];

  const testimonials = [
    {
      name: "Advocate Sarah Patel",
      role: "Senior Lawyer",
      content: "NyayaSetu has revolutionized how I research legal precedents. Vaanee understands context like a human colleague.",
      rating: 5
    },
    {
      name: "Rahul Sharma",
      role: "Small Business Owner",
      content: "The appointment booking system is seamless! I found a lawyer and scheduled a consultation in minutes.",
      rating: 5
    },
    {
      name: "Dr. Priya Gupta",
      role: "Legal Researcher",
      content: "AI Court helped me practice my arguments before the real trial. The simulation was incredibly realistic.",
      rating: 5
    }
  ];

  const { name, role, firstLogin } = useSession();

  return (
    <Router>
      <Routes>
        <Route path="/splash" element={<SplashScreen name={name} isNewUser={firstLogin} onFinish={() => window.location.replace('/welcome')} />} />
        <Route path="/welcome" element={<WelcomeScreen name={name} role={role || 'user'} firstLogin={firstLogin} />} />
        <Route path="/dashboard/user" element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        } />
        <Route path="/dashboard/lawyer" element={
          <PrivateRoute>
            <LawyerDashboard />
          </PrivateRoute>
        } />
        <Route path="/dashboard/new" element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        } />
        <Route path="/*" element={
          <div className="bg-black text-white overflow-x-hidden">
            {/* Header */}
            <motion.header 
              className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-cyan-500/20"
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  {/* Logo */}
                  <motion.div 
                    className="flex items-center space-x-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Scale className="w-8 h-8 text-cyan-400" />
                    <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
                      NyayaSetu
                    </span>
                  </motion.div>

                  {/* Desktop Navigation */}
                  <nav className="hidden md:flex items-center space-x-8">
                    {['Home', 'Features', 'About', 'Contact'].map((item) => (
                      <motion.a
                        key={item}
                        href={`#${item.toLowerCase()}`}
                        className="text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                        whileHover={{ scale: 1.1 }}
                      >
                        {item}
                      </motion.a>
                    ))}
                  </nav>

                  {/* Auth Buttons */}
                  <div className="hidden md:flex items-center space-x-4">
                    <motion.button
                      className="px-4 py-2 text-cyan-400 border border-cyan-400 rounded-lg hover:bg-cyan-400 hover:text-black transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsAuthOpen(true)}
                    >
                      Sign In
                    </motion.button>
                    <motion.button
                      className="px-4 py-2 bg-cyan-400 text-black rounded-lg font-semibold hover:bg-cyan-300 transition-all duration-300"
                      variants={glowHover}
                      initial="initial"
                      whileHover="hover"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsAuthOpen(true)}
                    >
                      Sign Up
                    </motion.button>
                  </div>

                  {/* Mobile Menu Button */}
                  <motion.button
                    className="md:hidden"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </motion.button>
                </div>
              </div>

              {/* Mobile Menu */}
              {isMenuOpen && (
                <motion.div
                  className="md:hidden bg-black/95 backdrop-blur-md border-t border-cyan-500/20"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="container mx-auto px-4 py-4 space-y-4">
                    {['Home', 'Features', 'About', 'Contact'].map((item) => (
                      <a
                        key={item}
                        href={`#${item.toLowerCase()}`}
                        className="block text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item}
                      </a>
                    ))}
                    <div className="flex space-x-4 pt-4">
                      <button className="px-4 py-2 text-cyan-400 border border-cyan-400 rounded-lg hover:bg-cyan-400 hover:text-black transition-all duration-300" onClick={() => { setIsAuthOpen(true); setIsMenuOpen(false); }}>
                        Sign In
                      </button>
                      <button className="px-4 py-2 bg-cyan-400 text-black rounded-lg font-semibold hover:bg-cyan-300 transition-all duration-300" onClick={() => { setIsAuthOpen(true); setIsMenuOpen(false); }}>
                        Sign Up
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.header>

            {/* Auth Modal Overlay */}
            {isAuthOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
                <div className="absolute top-6 right-6 z-60">
                  <button onClick={() => setIsAuthOpen(false)} className="p-3 rounded-full bg-gray-900/80 text-cyan-400 hover:bg-gray-800 hover:text-white transition-all duration-300 shadow-lg border border-cyan-400/30">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <AuthPage onAuthSuccess={() => { 
                  console.log('Closing modal from onAuthSuccess');
                  setIsAuthOpen(false);
                }} />
              </div>
            )}

            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,255,255,0.1)_0%,_transparent_50%)]"></div>
              
              <motion.div
                className="text-center z-10 max-w-4xl mx-auto px-4"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                <motion.div
                  className="mb-8"
                  variants={fadeInUp}
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.8 }}
                >
                  <Scale className="w-24 h-24 text-cyan-400 mx-auto mb-6" />
                </motion.div>
                
                <motion.h1
                  className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-400 to-white bg-clip-text text-transparent"
                  variants={fadeInUp}
                >
                  Your Bridge to Justice
                </motion.h1>
                
                <motion.p
                  className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto"
                  variants={fadeInUp}
                >
                  Speak. Understand. Resolve.
                </motion.p>
                
                <motion.button
                  className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-bold rounded-lg text-lg hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300 inline-flex items-center space-x-2"
                  variants={glowHover}
                  initial="initial"
                  whileHover="hover"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAuthOpen(true)}
                >
                  <span>Get Started</span>
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-gradient-to-b from-black to-gray-900">
              <div className="container mx-auto px-4">
                <motion.div
                  className="text-center mb-16"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">
                    Powerful Features
                  </h2>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    Discover how our AI-powered tools can revolutionize your legal experience
                  </p>
                </motion.div>

                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  variants={staggerContainer}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                >
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      className="relative group"
                      variants={fadeInUp}
                    >
                      <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-xl p-6 h-full backdrop-blur-sm hover:border-cyan-400/50 transition-all duration-300">
                        <div className="text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-white">
                          {feature.title}
                        </h3>
                        <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </section>

            {/* Chatbot Preview Section */}
            <section className="py-20 bg-black">
              <div className="container mx-auto px-4">
                <motion.div
                  className="text-center max-w-4xl mx-auto"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">
                    Meet Vaanee, Your AI Legal Companion
                  </h2>
                  
                  <motion.div
                    className="relative mb-8"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-400/30">
                      <MessageCircle className="w-16 h-16 text-black" />
                    </div>
                    
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full opacity-30 animate-pulse"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  
                  <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    Ask questions, upload documents, book appointments, or practice in AI Court — we'll help you navigate the legal system with confidence.
                  </p>
                  
                  <motion.button
                    className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-bold rounded-lg text-lg hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300 inline-flex items-center space-x-2"
                    variants={glowHover}
                    initial="initial"
                    whileHover="hover"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAuthOpen(true)}
                  >
                    <span>Explore Features</span>
                    <Bot className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-gradient-to-b from-black to-gray-900">
              <div className="container mx-auto px-4">
                <motion.div
                  className="text-center mb-16"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">
                    Trusted by Legal Professionals
                  </h2>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    See what our users are saying about NyayaSetu
                  </p>
                </motion.div>

                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-8"
                  variants={staggerContainer}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                >
                  {testimonials.map((testimonial, index) => (
                    <motion.div
                      key={index}
                      className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-xl p-6 backdrop-blur-sm hover:border-cyan-400/50 transition-all duration-300"
                      variants={fadeInUp}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="flex items-center mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-gray-300 mb-4">"{testimonial.content}"</p>
                      <div>
                        <p className="font-semibold text-white">{testimonial.name}</p>
                        <p className="text-cyan-400 text-sm">{testimonial.role}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </section>

            {/* Appointment Booking Section */}
            <section className="py-20 bg-black">
              <div className="container mx-auto px-4">
                <motion.div
                  className="text-center max-w-4xl mx-auto"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">
                    Book Appointments with Ease
                  </h2>
                  
                  <motion.div
                    className="relative mb-8"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-400/30">
                      <Calendar className="w-16 h-16 text-black" />
                    </div>
                    
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full opacity-30 animate-pulse"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  
                  <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    Schedule consultations with verified lawyers using our intelligent booking system. Get instant availability and secure your legal consultation.
                  </p>
                  
                  <motion.button
                    className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-bold rounded-lg text-lg hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300 inline-flex items-center space-x-2"
                    variants={glowHover}
                    initial="initial"
                    whileHover="hover"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAuthOpen(true)}
                  >
                    <span>Book Appointment</span>
                    <Calendar className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              </div>
            </section>

            {/* AI Court Section */}
            <section className="py-20 bg-gradient-to-b from-black to-gray-900">
              <div className="container mx-auto px-4">
                <motion.div
                  className="text-center max-w-4xl mx-auto"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">
                    Practice in AI Court
                  </h2>
                  
                  <motion.div
                    className="relative mb-8"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-400/30">
                      <Scale className="w-16 h-16 text-black" />
                    </div>
                    
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full opacity-30 animate-pulse"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  
                  <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    Experience virtual courtroom simulations with AI-powered judges and opposing counsel. Perfect for practicing your legal arguments and case preparation.
                  </p>
                  
                  <motion.button
                    className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-bold rounded-lg text-lg hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300 inline-flex items-center space-x-2"
                    variants={glowHover}
                    initial="initial"
                    whileHover="hover"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAuthOpen(true)}
                  >
                    <span>Enter AI Court</span>
                    <Scale className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              </div>
            </section>

            {/* Document Summarizer Section */}
            <section className="py-20 bg-black">
              <div className="container mx-auto px-4">
                <motion.div
                  className="text-center max-w-4xl mx-auto"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">
                    AI-Powered Document Analysis
                  </h2>
                  
                  <motion.div
                    className="relative mb-8"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-400/30">
                      <FileText className="w-16 h-16 text-black" />
                    </div>
                    
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full opacity-30 animate-pulse"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  
                  <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    Upload legal documents and get instant AI-powered summaries, key insights, and analysis. Save hours of reading with our intelligent document processing.
                  </p>
                  
                  <motion.button
                    className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-bold rounded-lg text-lg hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300 inline-flex items-center space-x-2"
                    variants={glowHover}
                    initial="initial"
                    whileHover="hover"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAuthOpen(true)}
                  >
                    <span>Analyze Documents</span>
                    <FileText className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              </div>
            </section>

            {/* Footer */}
            <footer className="bg-black border-t border-cyan-500/20 py-12">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Scale className="w-8 h-8 text-cyan-400" />
                      <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
                        NyayaSetu
                      </span>
                    </div>
                    <p className="text-gray-400">
                      Revolutionizing legal services with AI-powered solutions for everyone.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-cyan-400">Quick Links</h3>
                    <ul className="space-y-2">
                      {['Home', 'Features', 'About', 'Contact'].map((item) => (
                        <li key={item}>
                          <a href={`#${item.toLowerCase()}`} className="text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                            {item}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-cyan-400">Contact</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-2 text-gray-400">
                        <Mail className="w-4 h-4" />
                        <span>info@nyayasetu.com</span>
                      </li>
                      <li className="flex items-center space-x-2 text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>+91 123 456 7890</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-cyan-400">Follow Us</h3>
                    <div className="flex space-x-4">
                      <motion.a
                        href="#"
                        className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Linkedin className="w-6 h-6" />
                      </motion.a>
                      <motion.a
                        href="#"
                        className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Github className="w-6 h-6" />
                      </motion.a>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-cyan-500/20 mt-8 pt-8 text-center text-gray-400">
                  <p>&copy; 2024 NyayaSetu. All rights reserved.</p>
                </div>
              </div>
            </footer>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;
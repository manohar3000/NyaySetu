import React, { useState } from 'react';
import { motion } from 'framer-motion';
// import Lottie from 'lottie-react'; // Uncomment if you have Lottie icons

interface SidebarLink {
  icon: React.ReactNode;
  label: string;
  route: string;
  lottieIcon?: any; // Lottie animation data
  badge?: string;
}

interface SidebarProps {
  links: SidebarLink[];
  active: string;
  onNavigate: (route: string) => void;
  avatarUrl?: string;
  name?: string;
  badges?: string[];
}

const defaultAvatar =
  'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=256&h=256&facepad=2&q=80';

const Sidebar: React.FC<SidebarProps> = ({ links, active, onNavigate, avatarUrl, name, badges }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <motion.aside
      className="fixed top-8 left-8 z-40 w-20 md:w-72 bg-black/60 glassmorphism rounded-3xl shadow-2xl flex flex-col items-center py-8 px-2 md:px-6 border border-cyan-400/30 backdrop-blur-lg"
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 80 }}
      style={{ minHeight: '80vh' }}
    >
      {/* Avatar + Name */}
      <motion.div
        className="flex flex-col items-center mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
      >
        <div className="relative mb-2">
          <img
            src={avatarUrl || defaultAvatar}
            alt="User Avatar"
            className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-cyan-400 shadow-xl bg-black/30"
          />
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </div>
        {name && <span className="font-orbitron text-cyan-200 text-lg font-bold tracking-wide mb-1">{name}</span>}
        {/* Gamified badges */}
        {badges && badges.length > 0 && (
          <div className="flex space-x-2 mt-1">
            {badges.map((badge, i) => (
              <motion.span
                key={badge}
                className="px-2 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-pink-400 text-black text-xs font-bold shadow-md border border-cyan-200 animate-bounce"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
              >
                {badge}
              </motion.span>
            ))}
          </div>
        )}
      </motion.div>
      {/* Sidebar Links */}
      <nav className="flex flex-col space-y-3 w-full mt-2">
        {links.map((link, i) => (
          <motion.button
            key={link.label}
            className={`group flex items-center w-full px-3 py-3 rounded-xl font-poppins text-cyan-200 hover:bg-cyan-400/10 hover:text-cyan-100 transition-all duration-200 relative overflow-hidden ${active === link.route ? 'bg-cyan-400/20 shadow-lg border-l-4 border-cyan-400' : ''}`}
            whileHover={{ scale: 1.08, boxShadow: '0 0 16px #00FFE7' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(link.route)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* {link.lottieIcon && <Lottie animationData={link.lottieIcon} loop className="w-7 h-7 mr-3" />} */}
            <span className="mr-0 md:mr-3 text-cyan-400 group-hover:animate-bounce text-xl md:text-2xl">
              {link.icon}
            </span>
            <span className="hidden md:inline-block text-base font-medium font-poppins group-hover:text-cyan-300 transition-all duration-200">
              {link.label}
            </span>
            {link.badge && (
              <span className="ml-2 px-2 py-1 rounded-full bg-pink-400 text-white text-xs font-bold animate-pulse">
                {link.badge}
              </span>
            )}
            {/* Custom tooltip for mobile/icon-only */}
            {hovered === i && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1 rounded-lg bg-cyan-900/90 text-cyan-100 text-xs shadow-lg font-poppins whitespace-nowrap z-50">
                {link.label}
              </div>
            )}
          </motion.button>
        ))}
      </nav>
    </motion.aside>
  );
};

export default Sidebar; 
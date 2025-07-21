import React from 'react';

const Welcome: React.FC = () => {
  const name = localStorage.getItem('vaanee_user_name');
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-cyan-200">
      <h1 className="text-4xl font-bold mb-4 animate-glow-text">
        {name ? `Welcome, ${name}!` : 'Welcome!'}
      </h1>
      <p className="text-lg mb-8">{name ? 'Your account has been created. You are now signed in.' : 'You are now signed in.'}</p>
      <a href="/" className="px-6 py-3 rounded-xl bg-cyan-400 text-black font-bold text-lg shadow-lg hover:bg-cyan-300 transition-all duration-300">Go to Home</a>
    </div>
  );
};

export default Welcome; 
import React, { useState, useRef } from 'react';
import SocialAuthButtons from './SocialAuthButtons';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import AlertMessage from './AlertMessage';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { authApi } from '../../services/api';

interface AuthFormProps {
  tab: 'signin' | 'signup';
  role: 'user' | 'lawyer';
  onAuthSuccess?: () => void;
}

const initialFields = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  profile_picture: null as File | null,
  acceptTerms: false,
};

const AuthForm: React.FC<AuthFormProps> = ({ tab, role, onAuthSuccess }) => {
  const [fields, setFields] = useState(initialFields);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setSession } = useSession();

  // Password strength logic
  function getPasswordStrength(password: string) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }
  const passwordStrength = getPasswordStrength(fields.password);
  const strengthColors = [
    'bg-red-500',
    'bg-yellow-400',
    'bg-blue-400',
    'bg-green-400',
    'bg-cyan-400',
  ];

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked, files } = e.target as any;
    if (type === 'checkbox') {
      setFields(f => ({ ...f, [name]: checked }));
    } else if (type === 'file') {
      const file = files[0];
      setFields(f => ({ ...f, profile_picture: file }));
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    } else {
      setFields(f => ({ ...f, [name]: value }));
    }
  };

  // Handle submit with backend integration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      if (tab === 'signup') {
        // Validate fields
        if (!fields.username || !fields.email || !fields.password || !fields.confirmPassword || !fields.acceptTerms) {
          setAlert({ type: 'error', message: 'Please fill all required fields and accept terms.' });
          return;
        }
        if (fields.password !== fields.confirmPassword) {
          setAlert({ type: 'error', message: 'Passwords do not match.' });
          return;
        }

        const response = await authApi.signup({
          username: fields.username,
          email: fields.email,
          password: fields.password,
          profile_picture: preview || undefined,
        });

        setSession({
          name: response.user.username,
          role: role,
          isAuthenticated: true,
          firstLogin: true,
        });

        setAlert({ type: 'success', message: 'Registration successful! Redirecting...' });
        setTimeout(() => {
          navigate(role === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/user');
          if (onAuthSuccess) onAuthSuccess();
        }, 1200);
      } else {
        // Login
        if (!fields.email || !fields.password) {
          setAlert({ type: 'error', message: 'Please enter your email and password.' });
          return;
        }

        const response = await authApi.login({
          email: fields.email,
          password: fields.password,
        });

        setSession({
          name: response.user.username,
          role: role,
          isAuthenticated: true,
          firstLogin: false,
        });

        setAlert({ type: 'success', message: 'Sign in successful! Redirecting...' });
        setTimeout(() => {
          navigate(role === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/user');
          if (onAuthSuccess) onAuthSuccess();
        }, 1200);
      }
    } catch (err: any) {
      setAlert({ 
        type: 'error', 
        message: err.response?.data?.message || 'An error occurred. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Animated checkbox
  const Checkbox = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <motion.button
      type="button"
      onClick={onChange}
      className="w-6 h-6 rounded border border-cyan-400 flex items-center justify-center bg-black/30 mr-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
      animate={{ backgroundColor: checked ? '#22d3ee' : 'rgba(0,0,0,0.3)' }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <AnimatePresence>
        {checked && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="block w-3 h-3 bg-cyan-400 rounded"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );

  // Toast auto-dismiss
  React.useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  return (
    <form className="w-full flex flex-col items-center space-y-4" onSubmit={handleSubmit}>
      {/* Animated Alert Message / Toast */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs pointer-events-none">
        <AlertMessage message={alert?.message ?? null} />
      </div>
      <SocialAuthButtons />
      {/* Divider */}
      <div className="flex items-center w-full my-2">
        <div className="flex-1 h-px bg-cyan-400/30" />
        <span className="mx-3 text-cyan-200/70 text-sm">or</span>
        <div className="flex-1 h-px bg-cyan-400/30" />
      </div>

      {/* Sign Up Form */}
      {tab === 'signup' && (
        <div className="w-full space-y-4">
          <div className="relative">
            <input
              type="text"
              name="username"
              value={fields.username}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-transparent border border-cyan-400/40 rounded-xl text-white placeholder-cyan-200/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
              placeholder="Username"
              required
            />
          </div>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={fields.email}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-transparent border border-cyan-400/40 rounded-xl text-white placeholder-cyan-200/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
              placeholder="Email"
              required
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={fields.password}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-transparent border border-cyan-400/40 rounded-xl text-white placeholder-cyan-200/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/70"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={fields.confirmPassword}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-transparent border border-cyan-400/40 rounded-xl text-white placeholder-cyan-200/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
              placeholder="Confirm Password"
              required
            />
          </div>
          <div className="flex items-center">
            <Checkbox
              checked={fields.acceptTerms}
              onChange={() => setFields(f => ({ ...f, acceptTerms: !f.acceptTerms }))}
            />
            <label className="text-cyan-200/70 text-sm">
              I accept the terms and conditions
            </label>
          </div>
        </div>
      )}

      {/* Sign In Form */}
      {tab === 'signin' && (
        <div className="w-full space-y-4">
          <div className="relative">
            <input
              type="email"
              name="email"
              value={fields.email}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-transparent border border-cyan-400/40 rounded-xl text-white placeholder-cyan-200/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
              placeholder="Email"
              required
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={fields.password}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-transparent border border-cyan-400/40 rounded-xl text-white placeholder-cyan-200/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/70"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 rounded-xl bg-cyan-400 text-black font-semibold transition-all duration-300 ${
          loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-300'
        }`}
      >
        {loading ? 'Processing...' : tab === 'signin' ? 'Sign In' : 'Sign Up'}
      </button>
    </form>
  );
};

export default AuthForm; 
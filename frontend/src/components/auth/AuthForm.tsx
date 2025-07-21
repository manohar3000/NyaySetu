import React, { useState, useRef } from 'react';
import SocialAuthButtons from './SocialAuthButtons';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import AlertMessage from './AlertMessage';
import axiosInstance from '../../utils/axios';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';

interface AuthFormProps {
  tab: 'signin' | 'signup';
  role: 'user' | 'lawyer';
  onAuthSuccess?: () => void;
}

const initialFields = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  specialization: '',
  licenseNumber: '',
  profileImage: null as File | null,
  acceptTerms: false,
  identifier: '',
};

const AuthForm: React.FC<AuthFormProps> = ({ tab, role, onAuthSuccess }) => {
  const [fields, setFields] = useState(initialFields);
  // REMOVE: const [step, setStep] = useState(1); // For 2-step sign in
  const [showForgot, setShowForgot] = useState(false);
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
      setFields(f => ({ ...f, profileImage: file }));
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

  // Drag & drop for profile image
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFields(f => ({ ...f, profileImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
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
        if (!fields.name || !fields.email || !fields.password || !fields.confirmPassword || !fields.acceptTerms) {
          setAlert({ type: 'error', message: 'Please fill all required fields and accept terms.' });
          setLoading(false);
          return;
        }
        if (fields.password !== fields.confirmPassword) {
          setAlert({ type: 'error', message: 'Passwords do not match.' });
          setLoading(false);
          return;
        }
        
        let profileImageBase64 = null;
        if (fields.profileImage) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            profileImageBase64 = reader.result as string;
            const payload: any = {
              email: fields.email,
              username: fields.name,
              password: fields.password,
              role,
            };
            if (role === 'lawyer') {
              payload.specialization = fields.specialization;
              payload.license_number = fields.licenseNumber;
              payload.profile_image = profileImageBase64;
            }
            try {
              const res = await axiosInstance.post('/api/signup', payload);
              if (res.data) {
                // After successful signup, automatically sign in
                const signinPayload = new FormData();
                signinPayload.append('username', fields.name);
                signinPayload.append('password', fields.password);
                
                const loginRes = await axiosInstance.post('/api/signin', signinPayload, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                });
                
                if (loginRes.data && loginRes.data.access_token) {
                  localStorage.setItem('vaanee_jwt', loginRes.data.access_token);
                  localStorage.setItem('vaanee_user_name', fields.name);
                  localStorage.setItem('vaanee_user_role', role);
                  localStorage.setItem('vaanee_first_login', 'true');
                  
                  setSession({
                    name: fields.name,
                    role: role,
                    firstLogin: true,
                    isAuthenticated: true,
                  });
                  
                  setAlert({ type: 'success', message: 'Registration successful! Redirecting...' });
                  setTimeout(() => {
                    navigate('/splash');
                    if (onAuthSuccess) onAuthSuccess();
                  }, 1200);
                }
              }
            } catch (err: any) {
              const errorMessage = err.response?.data?.detail || 'Registration failed. Please try again.';
              setAlert({ type: 'error', message: errorMessage });
            }
          };
          reader.readAsDataURL(fields.profileImage);
        } else {
          const payload: any = {
            email: fields.email,
            username: fields.name,
            password: fields.password,
            role,
          };
          if (role === 'lawyer') {
            payload.specialization = fields.specialization;
            payload.license_number = fields.licenseNumber;
            payload.profile_image = null;
          }
          try {
            const res = await axiosInstance.post('/api/signup', payload);
            if (res.data) {
              // After successful signup, automatically sign in
              const signinPayload = new FormData();
              signinPayload.append('username', fields.name);
              signinPayload.append('password', fields.password);
              
              const loginRes = await axiosInstance.post('/api/signin', signinPayload, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              });
              
              if (loginRes.data && loginRes.data.access_token) {
                localStorage.setItem('vaanee_jwt', loginRes.data.access_token);
                localStorage.setItem('vaanee_user_name', fields.name);
                localStorage.setItem('vaanee_user_role', role);
                
                setSession({
                  name: fields.name,
                  role: role,
                  firstLogin: false,
                  isAuthenticated: true,
                });
                
                setAlert({ type: 'success', message: 'Registration successful! Redirecting...' });
                setTimeout(() => {
                  navigate('/splash');
                  if (onAuthSuccess) onAuthSuccess();
                }, 1200);
              }
            }
          } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Registration failed. Please try again.';
            setAlert({ type: 'error', message: errorMessage });
          }
        }
      } else {
        // SIGN IN LOGIC
        if (!fields.identifier || !fields.password) {
          setAlert({ type: 'error', message: 'Please enter your username and password.' });
          setLoading(false);
          return;
        }

        try {
          const formData = new FormData();
          formData.append('username', fields.identifier);
          formData.append('password', fields.password);

          const res = await axiosInstance.post('/api/signin', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          if (res.data && res.data.access_token) {
            localStorage.setItem('vaanee_jwt', res.data.access_token);
            localStorage.setItem('vaanee_user_name', fields.identifier);
            localStorage.setItem('vaanee_user_role', role);
            
            setSession({
              name: fields.identifier,
              role: role,
              firstLogin: false,
              isAuthenticated: true,
            });
            
            setAlert({ type: 'success', message: 'Sign in successful! Redirecting...' });
            setTimeout(() => {
              if (onAuthSuccess) onAuthSuccess();
              navigate('/splash');
            }, 1200);
          }
        } catch (err: any) {
          let errorMessage = 'Sign in failed. Please check your credentials.';
          if (err.response?.data?.detail) {
            errorMessage = typeof err.response.data.detail === 'string' 
              ? err.response.data.detail 
              : 'Invalid username or password.';
          }
          setAlert({ type: 'error', message: errorMessage });
        }
      }
    } catch (err: any) {
      let errorMessage = 'An error occurred. Please try again.';
      if (err.response?.data?.detail) {
        errorMessage = typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : 'An unexpected error occurred.';
      }
      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // REMOVE: 2-step sign in logic
  // const handleNext = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setStep(2);
  // };

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
      {/* Sign In */}
      {tab === 'signin' && (
        <motion.div key="signin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="w-full">
          <div className="relative w-full mb-2">
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={fields.identifier}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-transparent border border-cyan-400/40 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all duration-300 font-poppins shadow-lg glow-input"
              placeholder=" "
              autoComplete="username"
            />
            <label htmlFor="identifier" className="floating-label">Phone, email or username</label>
          </div>
          <div className="relative w-full mb-2">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={fields.password}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-transparent border border-cyan-400/40 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all duration-300 font-poppins shadow-lg glow-input pr-12"
              placeholder=" "
              autoComplete="current-password"
            />
            <label htmlFor="password" className="floating-label">Password</label>
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300 hover:text-cyan-100 focus:outline-none"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <motion.span initial={{ opacity: 0.7 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </motion.span>
            </button>
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-bold text-lg shadow-lg hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300 font-orbitron mt-2 ripple">{loading ? <span className="spinner" /> : 'Sign In'}</button>
          <button type="button" className="w-full py-3 rounded-xl bg-transparent text-cyan-200 font-semibold text-base hover:bg-cyan-400/10 transition-all duration-300 border-none mt-2 ripple" onClick={() => setShowForgot(true)}>Forgot Password?</button>
          <div className="w-full text-center mt-2 text-cyan-200/80 text-sm">
            Don't have an account? <span className="text-cyan-300 hover:underline cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('switch-auth-tab', { detail: 'signup' }))}>Sign up</span>
          </div>
        </motion.div>
      )}
      {/* Sign Up */}
      {tab === 'signup' && (
        <motion.div key={role} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="w-full">
          <div className="relative w-full mb-2">
            <input
              type="text"
              id="name"
              name="name"
              value={fields.name}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-transparent border border-cyan-400/40 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all duration-300 font-poppins shadow-lg glow-input"
              placeholder=" "
              autoComplete="name"
            />
            <label htmlFor="name" className="floating-label">Name</label>
          </div>
          <div className="relative w-full mb-2">
            <input
              type="email"
              id="email"
              name="email"
              value={fields.email}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-transparent border border-cyan-400/40 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all duration-300 font-poppins shadow-lg glow-input"
              placeholder=" "
              autoComplete="email"
            />
            <label htmlFor="email" className="floating-label">Email</label>
          </div>
          <div className="relative w-full mb-2">
            <input
              type="tel"
              id="phone"
              name="phone"
              value={fields.phone}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-transparent border border-cyan-400/40 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all duration-300 font-poppins shadow-lg glow-input"
              placeholder=" "
              autoComplete="tel"
            />
            <label htmlFor="phone" className="floating-label">Phone</label>
          </div>
          <div className="relative w-full mb-2">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={fields.password}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-transparent border border-cyan-400/40 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all duration-300 font-poppins shadow-lg glow-input pr-12"
              placeholder=" "
              autoComplete="new-password"
            />
            <label htmlFor="password" className="floating-label">Password</label>
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300 hover:text-cyan-100 focus:outline-none"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <motion.span initial={{ opacity: 0.7 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </motion.span>
            </button>
          </div>
          <div className="relative w-full mb-2">
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={fields.confirmPassword}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-transparent border border-cyan-400/40 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all duration-300 font-poppins shadow-lg glow-input pr-12"
              placeholder=" "
              autoComplete="new-password"
            />
            <label htmlFor="confirmPassword" className="floating-label">Confirm Password</label>
          </div>
          {/* Password Strength Meter */}
          <motion.div
            className="w-full h-2 rounded-full bg-cyan-400/10 mb-2 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: fields.password ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className={`h-2 rounded-full transition-all duration-300 ${strengthColors[passwordStrength]}`}
              initial={{ width: 0 }}
              animate={{ width: `${(passwordStrength / 4) * 100}%` }}
              transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
            />
          </motion.div>
          {/* Lawyer extra fields */}
          {role === 'lawyer' && (
            <>
              <div className="relative w-full mb-2">
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={fields.specialization}
                  onChange={handleChange}
                  className="w-full px-5 py-3 bg-transparent border border-cyan-400/40 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all duration-300 font-poppins shadow-lg glow-input"
                  placeholder=" "
                />
                <label htmlFor="specialization" className="floating-label">Specialization</label>
              </div>
              <div className="relative w-full mb-2">
                <input
                  type="text"
                  id="licenseNumber"
                  name="licenseNumber"
                  value={fields.licenseNumber}
                  onChange={handleChange}
                  className="w-full px-5 py-3 bg-transparent border border-cyan-400/40 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all duration-300 font-poppins shadow-lg glow-input"
                  placeholder=" "
                />
                <label htmlFor="licenseNumber" className="floating-label">License Number</label>
              </div>
              {/* Profile Image Upload */}
              <div
                className="mb-2 w-full flex flex-col items-center"
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                style={{ cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleChange}
                />
                <div className="w-full h-28 flex items-center justify-center border-2 border-dashed border-cyan-400/40 rounded-xl bg-black/30 hover:border-cyan-400 transition-all duration-300">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <span className="text-cyan-400">Drag & drop or click to upload profile image</span>
                  )}
                </div>
              </div>
            </>
          )}
          {/* Accept Terms */}
          <div className="flex items-center mt-2 mb-2">
            <Checkbox checked={fields.acceptTerms} onChange={() => setFields(f => ({ ...f, acceptTerms: !f.acceptTerms }))} />
            <span className="text-cyan-200 text-sm">Accept Terms & Conditions</span>
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-bold text-lg shadow-lg hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300 font-orbitron mt-2 ripple">
            {loading ? <span className="spinner" /> : 'Sign Up'}
          </button>
          <div className="w-full text-center mt-2 text-cyan-200/80 text-sm">
            Already have an account? <span className="text-cyan-300 hover:underline cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('switch-auth-tab', { detail: 'signin' }))}>Sign in</span>
          </div>
        </motion.div>
      )}
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
    </form>
  );
};

export default AuthForm; 
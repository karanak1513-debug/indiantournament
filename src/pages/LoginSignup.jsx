import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Gamepad2, Mail, Lock, LogIn, UserPlus } from 'lucide-react';

export default function LoginSignup() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  if (currentUser) {
    return <Navigate to="/profile" />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate('/profile');
    } catch (err) {
      setError('Failed to authenticate. ' + err.message);
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/profile');
    } catch (err) {
      console.error("Google Login Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError("Google Login blocked. Add this exact domain in Firebase Authentication authorized domains: indiantournament-hit5.vercel.app");
      } else {
        setError('Failed to log in with Google. ' + err.message);
      }
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="glass-card w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue to-neon-purple"></div>
        <div className="text-center mb-8">
          <Gamepad2 className="w-12 h-12 text-neon-blue mx-auto mb-2" />
          <h2 className="text-3xl font-black uppercase italic text-glow">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-brand-light mt-2 text-sm">Join the ultimate esports arena</p>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-light" />
              <input type="email" required placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-brand-light focus:outline-none focus:border-neon-blue transition-colors" />
            </div>
          </div>
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-light" />
              <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-brand-light focus:outline-none focus:border-neon-blue transition-colors" />
            </div>
          </div>
          <button disabled={loading} className="w-full neon-button neon-button-blue py-3 flex items-center justify-center gap-2">
            {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-sm text-brand-light">OR</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <button disabled={loading} onClick={handleGoogleLogin} className="w-full mt-6 bg-white text-brand-darker font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <div className="mt-8 text-center text-sm text-brand-light">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-neon-blue font-bold hover:underline focus:outline-none">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
}
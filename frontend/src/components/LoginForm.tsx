import React, { useState } from 'react';
import { Leaf, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError('Incorrect email or password. Please try again.');
        return;
      }

      login(data.access_token); // ✅ token, not email
    } catch {
      setError('Could not connect to the server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-leaf-50 to-leaf-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-leaf-600 rounded-full p-3"><Leaf size={32} className="text-white" /></div>
          </div>
          <h1 className="text-2xl font-display font-bold text-leaf-800 mb-2">Welcome back</h1>
          <p className="text-gray-500 text-sm">Sign in to check on your plants</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={18} className="text-gray-400" /></div>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-500 focus:border-transparent transition-all"
                placeholder="you@example.com" disabled={isLoading} autoComplete="email" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400" /></div>
              <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-500 focus:border-transparent transition-all"
                placeholder="Enter your password" disabled={isLoading} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute inset-y-0 right-0 pr-3 flex items-center" disabled={isLoading}>
                {showPassword ? <EyeOff size={18} className="text-gray-400 hover:text-gray-600" /> : <Eye size={18} className="text-gray-400 hover:text-gray-600" />}
              </button>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <button type="submit" disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-leaf-600 text-white hover:bg-leaf-700 focus:ring-2 focus:ring-leaf-500 focus:ring-offset-2'}`}>
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />Signing in…
              </div>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <button onClick={onSwitchToSignup} className="text-leaf-600 font-medium hover:text-leaf-700 hover:underline transition-colors">
              Create one — it's free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
import React, { useState } from 'react';
import { Leaf, Eye, EyeOff, Mail, Lock, CheckCircle} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();

  const passwordStrength = passwordRules.filter(r => r.test(password)).length;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][passwordStrength];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-leaf-500'][passwordStrength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (passwordStrength < 2) {
      setError('Please choose a stronger password');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Signup response:", data); // 👈

      if (!res.ok) {
        // Backend returns {"detail": "User exists"} on 400
        setError(
          data.detail === 'User exists'
            ? 'An account with this email already exists. Try signing in instead.'
            : data.detail ?? 'Something went wrong. Please try again.'
        );
        return;
      }

      // Auto-login after successful signup
      setSuccess(true);
      login(data.access_token);

    } catch {
      setError('Could not connect to the server. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-leaf-50 to-leaf-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center animate-slide-up">
          <div className="flex justify-center mb-4">
            <div className="bg-leaf-100 rounded-full p-4">
              <CheckCircle size={40} className="text-leaf-600" />
            </div>
          </div>
          <h2 className="text-2xl font-display font-bold text-leaf-800 mb-2">You're all set!</h2>
          <p className="text-gray-600 mb-2">Welcome to Leafy 🌿</p>
          <p className="text-sm text-gray-500">Signing you in automatically…</p>
          <div className="mt-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-leaf-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-leaf-50 to-leaf-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md animate-slide-up">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-leaf-600 rounded-full p-3">
              <Leaf size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold text-leaf-800 mb-2">Create your account</h1>
          <p className="text-gray-500 text-sm">Start taking care of your plants today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leaf-500 focus:border-transparent transition-all"
                placeholder="Create a strong password"
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={isSubmitting}
              >
                {showPassword
                  ? <EyeOff size={18} className="text-gray-400 hover:text-gray-600" />
                  : <Eye size={18} className="text-gray-400 hover:text-gray-600" />}
              </button>
            </div>

            {/* Strength bar — only shows once the user starts typing */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i < passwordStrength ? strengthColor : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${
                  passwordStrength === 3 ? 'text-leaf-600' :
                  passwordStrength === 2 ? 'text-yellow-600' : 'text-red-500'
                }`}>{strengthLabel} password</p>
              </div>
            )}

            {/* Password rules checklist */}
            {password.length > 0 && (
              <ul className="mt-2 space-y-1">
                {passwordRules.map(rule => (
                  <li key={rule.label} className={`flex items-center gap-1.5 text-xs transition-colors ${
                    rule.test(password) ? 'text-leaf-600' : 'text-gray-400'
                  }`}>
                    <CheckCircle size={12} className={rule.test(password) ? 'opacity-100' : 'opacity-30'} />
                    {rule.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="signup-confirm" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                id="signup-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-leaf-500 focus:border-transparent transition-all ${
                  confirmPassword.length > 0 && confirmPassword !== password
                    ? 'border-red-300 bg-red-50'
                    : confirmPassword.length > 0 && confirmPassword === password
                    ? 'border-leaf-400 bg-leaf-50'
                    : 'border-gray-300'
                }`}
                placeholder="Type your password again"
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(s => !s)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={isSubmitting}
              >
                {showConfirm
                  ? <EyeOff size={18} className="text-gray-400 hover:text-gray-600" />
                  : <Eye size={18} className="text-gray-400 hover:text-gray-600" />}
              </button>
            </div>
            {confirmPassword.length > 0 && confirmPassword !== password && (
              <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-leaf-600 text-white hover:bg-leaf-700 focus:ring-2 focus:ring-leaf-500 focus:ring-offset-2'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                Creating your account…
              </div>
            ) : 'Create Account'}
          </button>
        </form>

        {/* Switch to login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-leaf-600 font-medium hover:text-leaf-700 hover:underline transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default SignupForm;
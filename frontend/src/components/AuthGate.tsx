import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

/**
 * AuthGate
 * Drop this in wherever you currently render <LoginForm /> in App.tsx.
 * It owns the login ↔ signup toggle so neither child needs to know about routing.
 *
 * Usage in App.tsx:
 *   if (!isAuthenticated) return <AuthGate />;
 */
const AuthGate: React.FC = () => {
  const [view, setView] = useState<'login' | 'signup'>('login');

  if (view === 'signup') {
    return <SignupForm onSwitchToLogin={() => setView('login')} />;
  }

  return <LoginForm onSwitchToSignup={() => setView('signup')} />;
};

export default AuthGate;
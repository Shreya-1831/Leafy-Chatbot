import React from 'react';
import { Leaf, LogOut, User, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-leaf-600 dark:bg-leaf-800 text-white shadow-md">
      <div className="container mx-auto py-4 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Leaf size={32} className="text-leaf-100" />
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold">Leafy</h1>
            <p className="text-xs md:text-sm text-leaf-100">Your Garden Companion</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-leaf-700 dark:bg-leaf-900 hover:bg-leaf-800 dark:hover:bg-leaf-950 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <div className="flex items-center space-x-2 text-leaf-100">
            <User size={18} />
            <span className="text-sm font-medium hidden sm:inline">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-1 bg-leaf-700 dark:bg-leaf-900 text-white px-3 py-1 rounded-full text-sm hover:bg-leaf-800 dark:hover:bg-leaf-950 transition-colors"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
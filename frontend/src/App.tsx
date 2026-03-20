import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthGate from './components/AuthGate';
import ChatInterface from './components/ChatInterface';
import DragDropUpload from './components/DragDropUpload';
import SummaryCard from './components/SummaryCard';
import Dashboard from './components/Dashboard';
import ScanHistory from './components/ScanHistory';
import WeatherWidget from './components/WeatherWidget';
import {
  Leaf, BarChart3, History, Upload, Sun, Moon,
  LogOut, Menu, X, ChevronRight, User
} from 'lucide-react';
import { useTheme } from './context/ThemeContext';

// ── Sidebar nav items ────────────────────────────────────────────────────────
type Tab = 'chat' | 'upload' | 'analytics' | 'history';

const NAV: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: 'chat', icon: <Leaf size={18} />, label: 'Chat' },
  { id: 'upload', icon: <Upload size={18} />, label: 'Upload' },
  { id: 'analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  { id: 'history', icon: <History size={18} />, label: 'History' },
];

// ── Theme toggle ──────────────────────────────────────────────────────────────
const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

// ── Main app shell ────────────────────────────────────────────────────────────
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-leaf-600/20 flex items-center justify-center">
            <Leaf size={24} className="text-leaf-400 animate-pulse" />
          </div>
          <p className="text-sm text-gray-500 tracking-wide">Loading Leafy…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <AuthGate />;

  const username = user?.email?.split('@')[0] ?? 'Gardener';

  return (
    <ChatProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden font-sans">

        {/* ── Mobile overlay ─────────────────────────────────────────────── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 flex flex-col
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>

          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200 dark:border-gray-800">
            <div className="w-9 h-9 bg-leaf-600 rounded-xl flex items-center justify-center shadow-md shadow-leaf-600/30">
              <Leaf size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Leafy</h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Your Garden Companion</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>

          {/* Weather widget — compact */}
          <div className="px-3 pt-3">
            <WeatherWidget compact />
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-3 mb-2">Menu</p>
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 group
                  ${activeTab === item.id
                    ? 'bg-leaf-600 text-white shadow-md shadow-leaf-600/25'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <span className={activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}>
                  {item.icon}
                </span>
                {item.label}
                {activeTab === item.id && (
                  <ChevronRight size={14} className="ml-auto opacity-70" />
                )}
              </button>
            ))}
          </nav>

          {/* User section */}
          <div className="px-3 pb-4 border-t border-gray-200 dark:border-gray-800 pt-3">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800">
              <div className="w-8 h-8 rounded-full bg-leaf-100 dark:bg-leaf-900/40 flex items-center justify-center">
                <User size={14} className="text-leaf-600 dark:text-leaf-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{username}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main area ──────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top bar */}
          <header className="flex items-center justify-between px-4 lg:px-6 py-3.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Menu size={18} />
              </button>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white capitalize">
                  {activeTab === 'chat' ? 'Chat with Leafy 🌿' :
                    activeTab === 'upload' ? 'Plant Analysis' :
                      activeTab === 'analytics' ? 'Analytics Dashboard' : 'Scan History'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  {activeTab === 'chat' ? 'Ask anything about your plants' :
                    activeTab === 'upload' ? 'Upload a photo for AI diagnosis' :
                      activeTab === 'analytics' ? 'Your plant health overview' : 'Previous scan results'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-hidden">

            {/* ── CHAT tab ── */}
            {activeTab === 'chat' && (
              <div className="h-full bg-white dark:bg-gray-900">
                <ChatInterface />
              </div>
            )}

            {/* ── UPLOAD tab ── */}
            {activeTab === 'upload' && (
              <div className="h-full overflow-y-auto p-4 lg:p-6">
                <div className="max-w-2xl mx-auto space-y-4">
                  <DragDropUpload onScanComplete={() => setActiveTab('chat')} />  {/* ✅ */}
                  <SummaryCard />
                </div>
              </div>
            )}

            {/* ── ANALYTICS tab ── */}
            {activeTab === 'analytics' && (
              <div className="h-full overflow-y-auto p-4 lg:p-6">
                <div className="max-w-4xl mx-auto">
                  <Dashboard />
                </div>
              </div>
            )}

            {/* ── HISTORY tab ── */}
            {activeTab === 'history' && (
              <div className="h-full overflow-y-auto p-4 lg:p-6">
                <div className="max-w-4xl mx-auto">
                  <ScanHistory />
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </ChatProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--toast-bg, #fff)',
              color: 'var(--toast-color, #333)',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#3c914a', secondary: '#fff' } },
            error: { iconTheme: { primary: '#e94e79', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
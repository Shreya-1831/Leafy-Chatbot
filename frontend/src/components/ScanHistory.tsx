import React, { useEffect, useState } from 'react';
import { History, Eye, Calendar, TrendingUp, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchHistory, ScanRecord } from '../services/api';

// ==============================
// HELPERS
// ==============================

const normalizeContent = (text: string): string => {
  return text
    .split('\n')
    .map(line => {
      const stripped = line.trim();
      if (/^[-—=]{2,}$/.test(stripped)) return '';
      if (stripped.startsWith('•')) return '- ' + stripped.slice(1).trim();
      if (stripped.startsWith('- •')) return '- ' + stripped.slice(3).trim();
      return line;
    })
    .join('\n');
};

const renderInline = (text: string): React.ReactNode => {
  // ✅ Remove leading/trailing single * (italic wrapper)
  let cleaned = text.replace(/^\*(.+)\*$/, '$1');
  // ✅ Remove leading/trailing single * that wrap the whole line e.g. *🌱 What's Happening:*
  cleaned = cleaned.replace(/^\*\s*(.+?)\s*\*$/, '$1');

  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    // ✅ Strip any remaining lone * characters
    return <span key={i}>{part.replace(/\*/g, '')}</span>;
  });
};

const ScanAnalysisContent: React.FC<{ content: string }> = ({ content }) => {
  const lines = normalizeContent(content).split('\n');
  return (
    <div className="text-sm space-y-1">
      {lines.map((line, i) => {
        const stripped = line.trim();
        if (!stripped) return <div key={i} className="h-1" />;

        if (stripped.startsWith('- ')) {
          return (
            <div key={i} className="flex items-start gap-2 py-0.5 pl-2">
              <span className="text-leaf-500 dark:text-leaf-400 mt-[3px] flex-shrink-0 text-base leading-none">●</span>
              <span className="leading-relaxed text-gray-700 dark:text-gray-200">
                {renderInline(stripped.slice(2))}
              </span>
            </div>
          );
        }

        if (stripped.startsWith('**') && stripped.includes('**')) {
          return (
            <p key={i} className="font-semibold text-gray-900 dark:text-white mt-2 mb-0.5">
              {renderInline(stripped)}
            </p>
          );
        }

        return (
          <p key={i} className="leading-relaxed text-gray-700 dark:text-gray-200">
            {renderInline(stripped)}
          </p>
        );
      })}
    </div>
  );
};

// ==============================
// MAIN COMPONENT
// ==============================

const ScanHistory: React.FC = () => {
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);

  const loadHistory = () => {
    setLoading(true);
    fetchHistory()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadHistory(); }, []);

  const sortedHistory = [...history].sort((a, b) => {
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? -diff : diff;
  });

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    const days = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getConfidenceColor = (c: number) => {
    if (c >= 0.8) return 'text-leaf-600 dark:text-leaf-400';
    if (c >= 0.5) return 'text-sunshine-600 dark:text-sunshine-400';
    return 'text-blossom-600 dark:text-blossom-400';
  };

  const emptyState = (message: string) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <History size={24} className="text-leaf-600 mr-2" />
        <h3 className="text-lg font-display font-semibold text-leaf-800 dark:text-leaf-300">Scan History</h3>
      </div>
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );

  if (loading) return emptyState('Loading scan history...');
  if (history.length === 0) return emptyState('No scan history yet. Your recent scans will appear here.');

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <History size={24} className="text-leaf-600 dark:text-leaf-400 mr-2" />
            <h3 className="text-lg font-display font-semibold text-leaf-800 dark:text-leaf-300">Scan History</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}
              className="text-sm text-leaf-600 dark:text-leaf-400 hover:text-leaf-700 dark:hover:text-leaf-300 flex items-center"
            >
              <Calendar size={14} className="mr-1" />
              {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
            </button>
            <button
              onClick={loadHistory}
              className="text-gray-400 hover:text-leaf-600 dark:hover:text-leaf-400 transition-colors"
              aria-label="Refresh history"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {sortedHistory.map((scan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => setSelectedScan(scan)}
            >
              <div className="w-16 h-16 rounded-lg bg-leaf-100 dark:bg-leaf-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🌿</span>
              </div>
              <div className="flex-1 ml-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{scan.disease}</p>
                  <Eye size={14} className="text-gray-400" />
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <TrendingUp size={12} className="mr-1" />
                  <span className={`font-medium ${getConfidenceColor(scan.confidence)}`}>
                    {(scan.confidence * 100).toFixed(1)}%
                  </span>
                  <span className="mx-2">•</span>
                  <span>{formatDate(scan.created_at)}</span>
                  {scan.severity && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="capitalize">{scan.severity}</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedScan && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedScan(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                <h3 className="text-lg font-display font-semibold text-leaf-800 dark:text-leaf-300">Scan Details</h3>
                <button onClick={() => setSelectedScan(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Diagnosis</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedScan.disease}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confidence Level</p>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-3">
                      <div
                        className="h-2 rounded-full bg-leaf-500"
                        style={{ width: `${selectedScan.confidence * 100}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${getConfidenceColor(selectedScan.confidence)}`}>
                      {(selectedScan.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {selectedScan.severity && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Severity</p>
                    <p className="text-sm capitalize text-gray-900 dark:text-gray-100">{selectedScan.severity}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Scan Date</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(selectedScan.created_at).toLocaleString()}
                  </p>
                </div>

                {selectedScan.chatbot_response && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">AI Analysis</p>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <ScanAnalysisContent content={selectedScan.chatbot_response} />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScanHistory;
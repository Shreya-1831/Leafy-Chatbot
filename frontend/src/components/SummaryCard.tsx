import React from 'react';
import { Download, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChat } from '../context/ChatContext';
import toast from 'react-hot-toast';
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SummaryCard: React.FC = () => {
  const { predictionResult } = useChat();
  const { token } = useAuth();

  if (!predictionResult) return null;

  const severity =
    predictionResult.confidence > 0.8
      ? 'High'
      : predictionResult.confidence > 0.5
        ? 'Medium'
        : 'Low';

  const isHealthy = predictionResult.predicted_class === 'Healthy';

  const extractKeyInsights = (response: string = ''): string[] => {
    if (!response) return [];
    const cleaned = response
      .replace(/[*#]/g, '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const sentences = cleaned
      .split(/[.!?]+/)
      .filter((s) => s.length > 30);

    return sentences.slice(0, 3);
  };

  const keyInsights = extractKeyInsights(predictionResult.plant_chatbot_response ?? '');

  const handleDownloadPDF = async () => {
    if (!predictionResult) return;

    const formData = new FormData();
    formData.append('disease', predictionResult.predicted_class);
    formData.append('confidence', String(predictionResult.confidence));
    formData.append('severity', predictionResult.severity);
    formData.append('chatbot_response', predictionResult.plant_chatbot_response ?? '');

    if (predictionResult.imageFile) {
      formData.append('image', predictionResult.imageFile);
    }

    try {
      const res = await fetch(`${API_URL}/download`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) { toast.error('Failed to generate report'); return; }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date_str = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
      a.href = url;
      a.download = `plant-report_${date_str}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not connect to server');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
    >
      <div className="p-5">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-semibold text-leaf-800 dark:text-leaf-300">
            Analysis Summary
          </h3>

          {isHealthy ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-leaf-100 dark:bg-leaf-900/30 text-leaf-800 dark:text-leaf-300">
              <CheckCircle size={16} className="mr-1" /> Healthy
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blossom-100 dark:bg-blossom-900/30 text-blossom-800 dark:text-blossom-300">
              <AlertCircle size={16} className="mr-1" /> Needs Attention
            </span>
          )}
        </div>

        {/* DATA */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-leaf-50 dark:bg-leaf-900/20 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Condition</p>
              <p className="font-semibold text-leaf-900 dark:text-leaf-200">
                {predictionResult.predicted_class}
              </p>
            </div>

            <div className="bg-leaf-50 dark:bg-leaf-900/20 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Confidence</p>
              <p className="font-semibold text-leaf-900 dark:text-leaf-200">
                {(predictionResult.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* SEVERITY */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Activity size={16} className="text-gray-600 dark:text-gray-400 mr-2" />
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Severity Level</p>
            </div>

            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-3">
                <div
                  className={`h-2 rounded-full ${
                    severity === 'High'
                      ? 'bg-blossom-500'
                      : severity === 'Medium'
                        ? 'bg-sunshine-500'
                        : 'bg-leaf-500'
                  }`}
                  style={{ width: `${predictionResult.confidence * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{severity}</span>
            </div>
          </div>

          {/* INSIGHTS */}
          {keyInsights.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Insights</h4>
              <ul className="space-y-2">
                {keyInsights.map((insight, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                    <span className="inline-block w-1.5 h-1.5 bg-leaf-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    <span className="leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ACTION */}
          <div className="bg-leaf-50 dark:bg-leaf-900/20 rounded-lg p-3">
            <h4 className="text-sm font-medium text-leaf-800 dark:text-leaf-300 mb-2">
              Recommended Actions
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {isHealthy
                ? 'Continue your current care routine. Monitor regularly for any changes.'
                : 'Follow the treatment advice provided in the chat. Isolate affected plants if possible.'}
            </p>
          </div>
        </div>
      </div>

      {/* BUTTON */}
      <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-t border-gray-200 dark:border-gray-700">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDownloadPDF}
          className="w-full bg-leaf-600 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center hover:bg-leaf-700 transition-colors shadow-sm"
        >
          <Download size={16} className="mr-2" />
          Download PDF Report
        </motion.button>
      </div>
    </motion.div>
  );
};

export default SummaryCard;
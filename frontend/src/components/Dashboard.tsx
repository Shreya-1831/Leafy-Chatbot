import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchAnalytics, AnalyticsData } from '../services/api';

const COLORS = ['#3c914a', '#e94e79', '#f59e0b', '#0da2e7', '#96754f'];

const Dashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <BarChart3 size={24} className="text-leaf-600 mr-2" />
          <h3 className="text-lg font-display font-semibold text-leaf-800 dark:text-leaf-300">Analytics Dashboard</h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  const diseaseData = data
    ? Object.entries(data.disease_frequency).map(([name, value]) => ({ name, value }))
    : [];

  const confidenceData = data
    ? data.confidence_trend.slice(-10).map((item, i) => ({
        scan: `Scan ${i + 1}`,
        confidence: parseFloat((item.confidence * 100).toFixed(1)),
        date: new Date(item.date).toLocaleDateString(),
      }))
    : [];

  const totalScans = diseaseData.reduce((sum, d) => sum + d.value, 0);
  const healthyCount = data?.disease_frequency['Healthy'] ?? data?.disease_frequency['healthy'] ?? 0;
  const issueCount = totalScans - healthyCount;
  const avgConfidence = data
    ? (data.confidence_trend.reduce((s, i) => s + i.confidence, 0) / (data.confidence_trend.length || 1) * 100).toFixed(1)
    : '0';

  if (!data || totalScans === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <BarChart3 size={24} className="text-leaf-600 mr-2" />
          <h3 className="text-lg font-display font-semibold text-leaf-800 dark:text-leaf-300">Analytics Dashboard</h3>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No scan data yet. Upload plant images to see analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
    >
      <div className="flex items-center mb-6">
        <BarChart3 size={24} className="text-leaf-600 dark:text-leaf-400 mr-2" />
        <h3 className="text-lg font-display font-semibold text-leaf-800 dark:text-leaf-300">Analytics Dashboard</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disease distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
            <div className="w-2 h-2 bg-leaf-500 rounded-full mr-2" />
            Disease Distribution
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={diseaseData}
                cx="50%" cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {diseaseData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {diseaseData.map((d, i) => (
              <div key={i} className="flex items-center text-sm">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-gray-700 dark:text-gray-300">{d.name}</span>
                <span className="ml-auto text-gray-500 dark:text-gray-400">{d.value} scans</span>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence trend */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
            <TrendingUp size={16} className="text-leaf-600 dark:text-leaf-400 mr-2" />
            Confidence Trend
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={confidenceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="scan" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="confidence" stroke="#3c914a" strokeWidth={2}
                dot={{ fill: '#3c914a', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 bg-leaf-50 dark:bg-leaf-900/20 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Average Confidence:</strong> {avgConfidence}%
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-leaf-50 dark:bg-leaf-900/20 rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Scans</p>
          <p className="text-2xl font-bold text-leaf-800 dark:text-leaf-300">{totalScans}</p>
        </div>
        <div className="bg-blossom-50 dark:bg-blossom-900/20 rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Issues Found</p>
          <p className="text-2xl font-bold text-blossom-800 dark:text-blossom-300">{issueCount}</p>
        </div>
        <div className="bg-sunshine-50 dark:bg-sunshine-900/20 rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Healthy Plants</p>
          <p className="text-2xl font-bold text-sunshine-800 dark:text-sunshine-300">{healthyCount}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
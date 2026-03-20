import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { useChat } from '../context/ChatContext';

const ResultsDisplay: React.FC = () => {
  const { predictionResult } = useChat();

  if (!predictionResult) return null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-leaf-600';
    if (confidence >= 0.5) return 'text-sunshine-500';
    return 'text-blossom-500';
  };

  const getStatusBadge = () => {
    if (predictionResult.predicted_class === 'Healthy') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-leaf-100 text-leaf-800">
          <Check size={12} className="mr-1" /> Healthy
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blossom-100 text-blossom-800">
        <AlertCircle size={12} className="mr-1" /> {predictionResult.predicted_class}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4 animate-fade-in">
      <div className="bg-leaf-50 px-4 py-3 border-b border-leaf-100">
        <h3 className="text-leaf-800 font-medium font-display flex items-center">
          Plant Analysis Results {getStatusBadge()}
        </h3>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Condition:</span>
            <span className="font-medium">{predictionResult.predicted_class}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Confidence:</span>
            <span className={`font-medium ${getConfidenceColor(predictionResult.confidence)}`}>
              {(predictionResult.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full ${
              predictionResult.predicted_class === 'Healthy' 
                ? 'bg-leaf-500' 
                : 'bg-blossom-500'
            }`}
            style={{ width: `${predictionResult.confidence * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
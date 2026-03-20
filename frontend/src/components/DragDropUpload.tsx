import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../context/ChatContext';
import { predictDiseaseStream, savePredictionToSession, saveBotReplyToSession } from '../services/api';
import toast from 'react-hot-toast';

interface DragDropUploadProps {
  onScanComplete?: () => void;  // ✅ navigate to chat tab after scan
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({ onScanComplete }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    addMessage, updateMessage, setIsLoading, isLoading,
    setPredictionResult, currentSessionId, setCurrentSessionId,
  } = useChat();

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) { toast.error('Please upload a valid image file (JPG, PNG, GIF, WEBP)'); return false; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File size must be less than 5MB'); return false; }
    return true;
  };

  const processFile = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) processFile(file);
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) processFile(file);
  };
  const handleUploadClick = () => fileInputRef.current?.click();
  const clearSelectedImage = () => {
    setSelectedImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!selectedImage || !preview) return;

    setIsLoading(true);
    // ✅ Use base64 preview as imageUrl so it persists (not a blob URL)
    addMessage("I've uploaded an image of my plant for diagnosis.", 'user', preview);
    const toastId = toast.loading('Analyzing your plant...');

    const botMsgId = addMessage('', 'bot');
    let accumulated = '';

    try {
      for await (const event of predictDiseaseStream(selectedImage)) {

        if (event.type === 'prediction') {
          try {
            const { session_id } = await savePredictionToSession(
              event.predicted_class,
              event.confidence,
              event.severity,
              currentSessionId,
              preview,  // ✅ pass base64 image — saved to DB, restored on history load
            );
            setCurrentSessionId(session_id);
          } catch {
            // non-fatal
          }

          setPredictionResult({
            predicted_class: event.predicted_class,
            confidence: event.confidence,
            severity: event.severity,
            plant_chatbot_response: '',
            success: true,
            imageFile: selectedImage,
            imageUrl: preview,  // ✅ base64, not blob URL
          });
          toast.success('Plant identified!', { id: toastId });
        }

        if (event.type === 'chat_chunk') {
          accumulated += event.chunk;
          updateMessage(botMsgId, accumulated);
          setPredictionResult(prev =>
            prev ? { ...prev, plant_chatbot_response: accumulated } : prev
          );
        }

        if (event.type === 'done') {
          // ✅ Save the bot's full response to the session
          if (accumulated && currentSessionId) {
            try {
              await saveBotReplyToSession(currentSessionId, accumulated);
            } catch {
              // non-fatal
            }
          }
          clearSelectedImage();
          setIsLoading(false);
          onScanComplete?.();
        }
      }
    } catch (err) {
      console.error('Predict stream error:', err);
      toast.error('Failed to analyze plant. Please try again.', { id: toastId });
      updateMessage(botMsgId, 'I apologize, but I encountered an error analyzing your plant. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <h3 className="text-leaf-800 dark:text-leaf-300 font-medium mb-2 font-display">Plant Image Analysis</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Upload or drag & drop a clear image of your plant</p>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleUploadClick}
              className={`w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging
                  ? 'border-leaf-500 bg-leaf-50 dark:bg-leaf-900/20 scale-105'
                  : 'border-leaf-300 dark:border-leaf-700 hover:bg-leaf-50 dark:hover:bg-leaf-900/10 hover:border-leaf-500'
                }`}
            >
              <Upload size={40} className={`mb-3 ${isDragging ? 'text-leaf-600' : 'text-leaf-500'}`} />
              <span className="text-sm font-medium text-leaf-700 dark:text-leaf-400">
                {isDragging ? 'Drop your image here' : 'Click to upload or drag & drop'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">JPG, PNG, GIF, or WEBP up to 5MB</span>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative"
            >
              <div className="relative h-64 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                <img src={preview} alt="Plant preview" className="object-contain w-full h-full" />
                <button
                  onClick={clearSelectedImage}
                  className="absolute top-3 right-3 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={18} className="text-gray-700 dark:text-gray-300" />
                </button>
                {selectedImage && (
                  <div className="absolute bottom-3 left-3 bg-white dark:bg-gray-800 rounded-lg px-3 py-1 shadow-md flex items-center">
                    <CheckCircle size={14} className="text-leaf-600 mr-1" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{selectedImage.name}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={`bg-leaf-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium flex items-center shadow-md transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-leaf-700 hover:shadow-lg'
                    }`}
                >
                  {isLoading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Analyzing...</>
                  ) : (
                    <><ImageIcon size={16} className="mr-2" />Analyze Plant</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DragDropUpload;
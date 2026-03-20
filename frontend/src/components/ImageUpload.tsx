import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { predictDisease } from '../services/api';

const ImageUpload: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    addMessage,
    setIsLoading,
    setError,
    setPredictionResult
  } = useChat();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) return;
    
    try {
      setIsLoading(true);
      addMessage(`I've uploaded an image of my plant for diagnosis.`, 'user');
      
      const result = await predictDisease(selectedImage);
      
      setPredictionResult(result);
      addMessage(result.plant_chatbot_response, 'bot');
      
      clearSelectedImage();
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      addMessage('I apologize, but I encountered an error analyzing your plant. Please try again.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-4 bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <h3 className="text-leaf-800 font-medium mb-2 font-display">Plant Image Analysis</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload a clear image of your plant's leaves or stems for diagnosis
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        
        {!preview ? (
          <button
            onClick={handleUploadClick}
            className="w-full h-40 border-2 border-dashed border-leaf-300 rounded-lg flex flex-col items-center justify-center text-leaf-500 hover:bg-leaf-50 hover:border-leaf-500 transition-all"
          >
            <Upload size={32} className="mb-2" />
            <span className="text-sm">Click to upload an image</span>
            <span className="text-xs text-gray-500 mt-1">JPG, PNG, or GIF up to 5MB</span>
          </button>
        ) : (
          <div className="relative">
            <div className="relative h-48 overflow-hidden rounded-lg bg-gray-100">
              <img 
                src={preview} 
                alt="Plant preview" 
                className="object-contain w-full h-full"
              />
              <button 
                onClick={clearSelectedImage}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
                aria-label="Remove image"
              >
                <X size={16} className="text-gray-700" />
              </button>
            </div>
            <div className="mt-3 flex justify-center">
              <button
                onClick={handleSubmit}
                className="bg-leaf-600 text-white rounded-lg px-4 py-2 text-sm flex items-center hover:bg-leaf-700 transition-colors"
              >
                <ImageIcon size={16} className="mr-1" />
                Analyze Plant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  imageUrl?: string;
}

export interface PredictionResult {
  predicted_class: string;
  confidence: number;
  severity: string;
  plant_chatbot_response: string;
  success: boolean;
  imageFile?: File;
  imageUrl?: string;
}

export interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  predictionResult: PredictionResult | null;
  currentSessionId: string | null;
  addMessage: (content: string, sender: 'user' | 'bot', imageUrl?: string) => string;
  updateMessage: (id: string, content: string) => void;
  setPredictionResult: (
    result: PredictionResult | null | ((prev: PredictionResult | null) => PredictionResult | null)
  ) => void;
  setCurrentSessionId: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
  clearMessages: () => void;  // ✅ added
}

export interface User {
  email: string;
  username?: string;
  token?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}
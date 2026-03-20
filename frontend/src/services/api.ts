const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface PredictionEvent {
  type: 'prediction';
  predicted_class: string;
  confidence: number;
  severity: string;
}

export interface ChatChunkEvent {
  type: 'chat_chunk';
  chunk: string;
}

export interface DoneEvent {
  type: 'done';
}

export type StreamEvent = PredictionEvent | ChatChunkEvent | DoneEvent;

export interface ChatStreamChunk {
  chunk?: string;
  done?: boolean;
  session_id?: string;
}

export interface ChatSession {
  _id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface SavedMessage {
  role: 'user' | 'bot';
  content: string;
  type?: string;
  predicted_class?: string;
  confidence?: number;
  severity?: string;
  image_data_url?: string;  // ✅ restored on session load
  created_at: string;
}

async function* readSSE(response: Response): AsyncGenerator<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data: ')) yield line.slice(6).trim();
    }
  }
}

export async function* predictDiseaseStream(file: File): AsyncGenerator<StreamEvent> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_URL}/predict/stream`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (!response.ok) throw new Error(`Predict failed: ${response.status} ${response.statusText}`);
  for await (const data of readSSE(response)) {
    if (!data) continue;
    try { yield JSON.parse(data) as StreamEvent; } catch { }
  }
}

export async function* sendChatStream(
  message: string,
  predicted_class?: string | null,
  confidence?: number | null,
  session_id?: string | null,
): AsyncGenerator<ChatStreamChunk> {
  const response = await fetch(`${API_URL}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ message, predicted_class, confidence, session_id }),
  });
  if (!response.ok) throw new Error(`Chat failed: ${response.status} ${response.statusText}`);
  for await (const data of readSSE(response)) {
    if (!data) continue;
    try { yield JSON.parse(data) as ChatStreamChunk; } catch { }
  }
}

// ✅ now accepts image_data_url
export const savePredictionToSession = async (
  predicted_class: string,
  confidence: number,
  severity: string,
  session_id?: string | null,
  image_data_url?: string | null,
): Promise<{ session_id: string }> => {
  const res = await fetch(`${API_URL}/chat/sessions/prediction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ predicted_class, confidence, severity, session_id, image_data_url }),
  });
  if (!res.ok) throw new Error('Failed to save prediction to session');
  return res.json();
};

export const fetchSessions = async (): Promise<ChatSession[]> => {
  const res = await fetch(`${API_URL}/chat/sessions`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch sessions');
  const data = await res.json();
  return data.sessions ?? [];
};

export const fetchSessionMessages = async (sessionId: string): Promise<SavedMessage[]> => {
  const res = await fetch(`${API_URL}/chat/sessions/${sessionId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch session');
  const data = await res.json();
  return data.messages ?? [];
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
};

export interface ScanRecord {
  disease: string;
  confidence: number;
  severity: string;
  chatbot_response?: string;
  created_at: string;
}

export const fetchHistory = async (): Promise<ScanRecord[]> => {
  const res = await fetch(`${API_URL}/history/`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);
  const data = await res.json();
  return data.history ?? [];
};

export interface AnalyticsData {
  disease_frequency: Record<string, number>;
  confidence_trend: { date: string; confidence: number }[];
}

export const fetchAnalytics = async (): Promise<AnalyticsData> => {
  const res = await fetch(`${API_URL}/analytics/`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Analytics fetch failed: ${res.status}`);
  return res.json();
};

export const fetchWithAuth = async (url: string, options: any = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) { localStorage.removeItem('token'); window.location.reload(); }
  return res;
};

export const saveBotReplyToSession = async (
  session_id: string,
  content: string,
): Promise<void> => {
  const res = await fetch(`${API_URL}/chat/sessions/bot-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ session_id, content }),
  });
  if (!res.ok) throw new Error('Failed to save bot reply');
};
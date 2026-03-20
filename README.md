# 🌿 Leafy — AI Plant Health Companion

Leafy is a full-stack AI-powered plant disease detection and chat platform. Upload a photo of your plant, get an instant diagnosis powered by a deep learning model, and chat with an AI assistant for treatment advice — all saved to your personal history.

---

## ✨ Features

- 🔍 **AI Plant Diagnosis** — Upload a plant image and get instant disease detection with confidence scores
- 💬 **Streaming Chat** — Real-time AI responses streamed token-by-token via Server-Sent Events
- 📁 **Chat History** — All conversations and scans are saved per-user and restorable
- 🖼️ **Image in Chat** — Uploaded plant images appear inline in the chat interface and are persisted in history
- 📊 **Analytics Dashboard** — Disease frequency charts and confidence trend graphs per user
- 🕒 **Scan History** — Browse all previous plant scans with diagnosis results
- 📄 **PDF Report** — Download a detailed plant health report with the scan image included
- 🌤️ **Weather Widget** — Local weather with fungal disease risk alerts based on humidity
- 🌙 **Dark Mode** — Full dark/light theme toggle
- 🔐 **Auth** — JWT-based signup/login with bcrypt password hashing

---

## 🗂️ Project Structure

```
leafy/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthGate.tsx
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DragDropUpload.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── ScanHistory.tsx
│   │   │   ├── SummaryCard.tsx
│   │   │   └── WeatherWidget.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ChatContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── App.tsx
│   ├── .env
│   └── package.json
│
└── leafy-backend/           # FastAPI + Python
    ├── routes/
    │   ├── auth.py          # /signup, /login, /me
    │   ├── chat.py          # /chat/stream, /chat/sessions/*
    │   ├── predict.py       # /predict/stream
    │   ├── history.py       # /history/
    │   ├── analytics.py     # /analytics/
    │   └── report.py        # /download
    ├── services/
    │   ├── chatbot_service.py
    │   ├── model_service.py
    │   └── pdf_service.py
    ├── utils/
    │   └── severity.py
    ├── db.py
    ├── main.py
    └── .env
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)

---

### Backend Setup

```bash
cd leafy-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn motor pymongo python-jose passlib bcrypt
pip install python-dotenv pydantic[email] reportlab python-multipart

# Create .env file
echo "MONGO_URI=mongodb://localhost:27017" >> .env
echo "SECRET_KEY=your-super-secret-key-here" >> .env

# Run the server
uvicorn main:app --reload --port 8000
```

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" >> .env

# Start dev server
npm run dev
```

App runs at `http://localhost:5173`

---

## 🔑 Environment Variables

### Backend `.env`

| Variable       | Description                            |
| -------------- | -------------------------------------- |
| `GROQ_API_KEY` | Your Groq API Key |
| `MONGO_URI`  | MongoDB connection string              |
| `SECRET_KEY` | JWT signing secret (keep this private) |

### Frontend `.env`

| Variable         | Description                                     |
| ---------------- | ----------------------------------------------- |
| `VITE_API_URL` | Backend URL (default:`http://localhost:8000`) |
| `VITE_OPENWEATHER_API_KEY` | Your OpenWeatherAPI Key |

---

## 🛠️ Tech Stack

### Frontend

| Tool                  | Purpose              |
| --------------------- | -------------------- |
| React 18 + TypeScript | UI framework         |
| Vite                  | Build tool           |
| Tailwind CSS          | Styling              |
| Framer Motion         | Animations           |
| React Hot Toast       | Notifications        |
| ReactMarkdown         | Render bot responses |
| Lucide React          | Icons                |
| Recharts              | Analytics charts     |

### Backend

| Tool                 | Purpose              |
| -------------------- | -------------------- |
| FastAPI              | API framework        |
| Motor                | Async MongoDB driver |
| python-jose          | JWT tokens           |
| passlib + bcrypt     | Password hashing     |
| ReportLab            | PDF generation       |
| TensorFlow / PyTorch | Plant disease model  |

### Database

| Collection   | Purpose                   |
| ------------ | ------------------------- |
| `users`    | Auth credentials          |
| `scans`    | Plant scan results        |
| `chats`    | Chat messages per session |
| `sessions` | Chat session metadata     |

---

## 📡 API Endpoints

### Auth

| Method | Endpoint    | Description             |
| ------ | ----------- | ----------------------- |
| POST   | `/signup` | Register — returns JWT |
| POST   | `/login`  | Login — returns JWT    |
| GET    | `/me`     | Get current user        |

### Plant Analysis

| Method | Endpoint            | Description                            |
| ------ | ------------------- | -------------------------------------- |
| POST   | `/predict/stream` | SSE stream: prediction + chat response |

### Chat

| Method | Endpoint                      | Description               |
| ------ | ----------------------------- | ------------------------- |
| POST   | `/chat/stream`              | SSE stream: chat response |
| GET    | `/chat/sessions`            | List user's sessions      |
| POST   | `/chat/sessions`            | Create new session        |
| GET    | `/chat/sessions/{id}`       | Get messages for session  |
| DELETE | `/chat/sessions/{id}`       | Delete session            |
| POST   | `/chat/sessions/prediction` | Save scan to session      |

### Data

| Method | Endpoint        | Description                           |
| ------ | --------------- | ------------------------------------- |
| GET    | `/history/`   | User's scan history                   |
| GET    | `/analytics/` | Disease frequency + confidence trends |
| POST   | `/download`   | Generate and download PDF report      |

---

## 🔒 Security

- Passwords are pre-hashed with SHA-256 before bcrypt (avoids 72-byte bcrypt limit)
- JWT tokens expire after 24 hours
- All protected routes require `Authorization: Bearer <token>`
- Analytics and history are filtered by authenticated user — no cross-user data leakage

---

## 📄 PDF Report

The downloadable report includes:

- Plant image (embedded)
- Diagnosed condition + severity + confidence
- Full AI chatbot analysis
- Recommended care actions
- Generated timestamp and user email

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📝 License

MIT License — feel free to use, modify, and distribute.

---

> Built with 🌱 for plant lovers everywhere

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import predict, chat, history, auth, analytics, report
from services.model_service import load_model

app = FastAPI(title="🌿 Leafy Garden Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://leafy-chatbot.vercel.app",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    load_model()

app.include_router(predict.router)
app.include_router(chat.router)
app.include_router(history.router)
app.include_router(auth.router)
app.include_router(analytics.router)
app.include_router(report.router)

@app.get("/")
async def root():
    return {"message": "🌿 Leafy Backend Running"}

@app.get("/health")
def health():
    return {"status": "ok"}
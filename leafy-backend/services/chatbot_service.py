import asyncio
from services.chatbot import plant_chat, plant_chat_stream


# ==============================
# NON-STREAMING (backward compat)
# Used by: report.py, any non-SSE route
# ==============================
def generate_chat(message, predicted_class=None, confidence=None):
    return plant_chat(message, predicted_class, confidence)


# ==============================
# STREAMING
# Used by: chat.py /chat/stream
#          predict.py /predict/stream
#
# Groq's SDK is synchronous, so we wrap the sync generator
# in an async generator using asyncio.to_thread so FastAPI's
# event loop is never blocked while waiting for the next chunk.
# ==============================
async def generate_chat_stream(message, predicted_class=None, confidence=None):
    """
    Async generator — yields text chunks one at a time.
    Each chunk is a raw string (no JSON wrapping — that happens in the route).

    Usage in a FastAPI StreamingResponse:

        async def event_generator():
            async for chunk in generate_chat_stream(msg, cls, conf):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
    """
    loop = asyncio.get_event_loop()

    # Collect the sync generator into a queue via a thread so we
    # don't block the event loop between chunks.
    queue: asyncio.Queue[str | None] = asyncio.Queue()

    def _run():
        try:
            for chunk in plant_chat_stream(message, predicted_class, confidence):
                # put_nowait is thread-safe with asyncio.Queue
                loop.call_soon_threadsafe(queue.put_nowait, chunk)
        finally:
            loop.call_soon_threadsafe(queue.put_nowait, None)  # sentinel

    # Run the blocking Groq call in a thread pool
    asyncio.ensure_future(loop.run_in_executor(None, _run))

    while True:
        chunk = await queue.get()
        if chunk is None:
            break
        yield chunk
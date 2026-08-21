# ============================================================
# HIMI HOLO AI
# MAIN BACKEND
# ============================================================

import logging
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai import ask_ai, get_ai_status

from memory import (
    get_memories,
    add_memory,
    delete_memory,
    clear_memories
)


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger("HIMI")


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="HIMI HOLO AI",
    description="HIMI Holographic AI Assistant",
    version="2.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ============================================================
# SERVER STATE
# ============================================================

START_TIME = datetime.now().isoformat()

REQUEST_COUNT = 0


# ============================================================
# DATA MODELS
# ============================================================

class HistoryMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[list[HistoryMessage]] = None


class MemoryRequest(BaseModel):
    text: str


# ============================================================
# ROOT
# ============================================================

@app.get("/")
async def root():

    return {
        "name": "HIMI HOLO AI",
        "status": "online",
        "version": "2.0.0",
        "message": "HIMI backend is running."
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
async def health():

    return {
        "status": "ok",
        "service": "HIMI HOLO AI",
        "ai": get_ai_status(),
        "started": START_TIME,
        "requests": REQUEST_COUNT
    }


# ============================================================
# SYSTEM
# ============================================================

@app.get("/system")
async def system():

    memories = get_memories()

    return {
        "system": "HIMI HOLO AI",
        "backend": "FastAPI",
        "status": "online",
        "ai": get_ai_status(),
        "memory": {
            "enabled": True,
            "count": len(memories)
        },
        "requests": REQUEST_COUNT
    }


# ============================================================
# CHAT
# ============================================================

@app.post("/chat")
async def chat(request: ChatRequest):

    global REQUEST_COUNT

    REQUEST_COUNT += 1

    message = request.message.strip()

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not message:

        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    if len(message) > 12000:

        raise HTTPException(
            status_code=400,
            detail="Message is too long."
        )

    # --------------------------------------------------------
    # HISTORY
    # --------------------------------------------------------

    history = []

    if request.history:

        history = [
            {
                "role": item.role,
                "content": item.content
            }
            for item in request.history[-20:]
        ]

    # --------------------------------------------------------
    # MEMORY
    # --------------------------------------------------------

    memories = get_memories()

    # Keep prompt size reasonable
    memories = memories[-20:]

    logger.info(
        "Chat request | history=%d | memories=%d",
        len(history),
        len(memories)
    )

    # --------------------------------------------------------
    # AI
    # --------------------------------------------------------

    try:

        response = await ask_ai(
            message,
            history,
            memories
        )

        return {
            "success": True,
            "response": response,
            "message": response,
            "memory_count": len(memories)
        }

    except Exception as error:

        logger.exception(
            "Chat request failed."
        )

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# TEST AI
# ============================================================

@app.get("/test-ai")
async def test_ai():

    try:

        response = await ask_ai(
            "Reply with exactly: HIMI AI ONLINE",
            [],
            []
        )

        return {
            "success": True,
            "response": response
        }

    except Exception as error:

        logger.exception(
            "AI test failed."
        )

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# GET ALL MEMORIES
# ============================================================

@app.get("/memory")
async def memory_list():

    memories = get_memories()

    return {
        "success": True,
        "count": len(memories),
        "memories": memories
    }


# ============================================================
# ADD MEMORY
# ============================================================

@app.post("/memory")
async def memory_add(
    request: MemoryRequest
):

    text = request.text.strip()

    if not text:

        raise HTTPException(
            status_code=400,
            detail="Memory text is required."
        )

    if len(text) > 2000:

        raise HTTPException(
            status_code=400,
            detail="Memory is too long."
        )

    memory = add_memory(text)

    return {
        "success": True,
        "memory": memory
    }


# ============================================================
# DELETE ONE MEMORY
# ============================================================

@app.delete("/memory/{memory_id}")
async def memory_delete(
    memory_id: str
):

    deleted = delete_memory(
        memory_id
    )

    if not deleted:

        raise HTTPException(
            status_code=404,
            detail="Memory not found."
        )

    return {
        "success": True,
        "message": "Memory deleted."
    }


# ============================================================
# DELETE ALL MEMORIES
# ============================================================

@app.delete("/memory")
async def memory_clear():

    clear_memories()

    return {
        "success": True,
        "message": "All memories cleared."
    }


# ============================================================
# MEMORY SEARCH
# ============================================================

@app.get("/memory/search")
async def memory_search(
    q: str = ""
):

    query = q.strip().lower()

    memories = get_memories()

    if not query:

        return {
            "success": True,
            "memories": memories
        }

    results = []

    for memory in memories:

        text = memory.get(
            "text",
            ""
        ).lower()

        if query in text:

            results.append(
                memory
            )

    return {
        "success": True,
        "query": query,
        "count": len(results),
        "memories": results
    }


# ============================================================
# MEMORY TEST
# ============================================================

@app.get("/test-memory")
async def test_memory():

    test = add_memory(
        "HIMI memory system test."
    )

    return {
        "success": True,
        "created": test,
        "total": len(
            get_memories()
        )
    }


# ============================================================
# GLOBAL ERROR HANDLER
# ============================================================

@app.exception_handler(Exception)
async def global_error_handler(
    request,
    error
):

    logger.exception(
        "Unhandled server error."
    )

    return {
        "success": False,
        "error": "Internal server error.",
        "detail": str(error)
    }


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
async def startup_event():

    logger.info("")
    logger.info(
        "========================================"
    )
    logger.info(
        "        HIMI HOLO AI BACKEND"
    )
    logger.info(
        "========================================"
    )
    logger.info(
        "Backend      : ONLINE"
    )
    logger.info(
        "AI           : %s",
        get_ai_status()
    )
    logger.info(
        "Memory       : %d",
        len(get_memories())
    )
    logger.info(
        "Host         : 127.0.0.1"
    )
    logger.info(
        "Port         : 8000"
    )
    logger.info(
        "Health       : /health"
    )
    logger.info(
        "Chat         : /chat"
    )
    logger.info(
        "Memory       : /memory"
    )
    logger.info(
        "Docs         : /docs"
    )
    logger.info(
        "========================================"
    )


# ============================================================
# SHUTDOWN
# ============================================================

@app.on_event("shutdown")
async def shutdown_event():

    logger.info(
        "HIMI HOLO AI backend stopped."
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )
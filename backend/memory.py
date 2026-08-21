import json
import os
import threading
from datetime import datetime


MEMORY_FILE = os.path.join(
    os.path.dirname(__file__),
    "himi_memory.json"
)

_lock = threading.Lock()


def _load():
    if not os.path.exists(MEMORY_FILE):
        return []

    try:
        with open(
            MEMORY_FILE,
            "r",
            encoding="utf-8"
        ) as file:
            data = json.load(file)

        return data if isinstance(data, list) else []

    except Exception:
        return []


def _save(memories):
    with open(
        MEMORY_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            memories,
            file,
            indent=2,
            ensure_ascii=False
        )


def get_memories():
    with _lock:
        return _load()


def add_memory(text):
    text = str(text).strip()

    if not text:
        return None

    memory = {
        "id": datetime.now().strftime(
            "%Y%m%d%H%M%S%f"
        ),
        "text": text,
        "created_at": datetime.now().isoformat()
    }

    with _lock:
        memories = _load()
        memories.append(memory)
        _save(memories)

    return memory


def delete_memory(memory_id):
    with _lock:
        memories = _load()

        new_memories = [
            item
            for item in memories
            if item.get("id") != memory_id
        ]

        deleted = len(new_memories) != len(memories)

        if deleted:
            _save(new_memories)

        return deleted


def clear_memories():
    with _lock:
        _save([])

    return True


def search_memories(query):
    query = str(query).lower().strip()

    if not query:
        return get_memories()

    memories = get_memories()

    return [
        item
        for item in memories
        if query in item.get(
            "text",
            ""
        ).lower()
    ]
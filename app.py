import sqlite3
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "notes.db"

app = FastAPI(title="Quick Notes MVP")


class NotePayload(BaseModel):
    content: str = Field(..., min_length=1)


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    connection = get_connection()
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    connection.commit()
    connection.close()


def row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "content": row["content"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


@app.on_event("startup")
def on_startup() -> None:
    init_db()


app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


@app.get("/")
def home() -> FileResponse:
    return FileResponse(BASE_DIR / "static" / "index.html")


@app.get("/notes")
def get_notes() -> list[dict]:
    connection = get_connection()
    rows = connection.execute(
        (
            "SELECT id, content, created_at, updated_at "
            "FROM notes ORDER BY id DESC"
        )
    ).fetchall()
    connection.close()
    return [row_to_dict(row) for row in rows]


@app.post("/notes")
def create_note(payload: NotePayload) -> dict:
    content = payload.content.strip()
    if not content:
        raise HTTPException(
            status_code=400,
            detail="Note content cannot be empty",
        )

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    connection = get_connection()
    cursor = connection.execute(
        "INSERT INTO notes (content, created_at, updated_at) VALUES (?, ?, ?)",
        (content, now, now),
    )
    connection.commit()
    note_id = cursor.lastrowid
    row = connection.execute(
        "SELECT id, content, created_at, updated_at FROM notes WHERE id = ?",
        (note_id,),
    ).fetchone()
    connection.close()

    return row_to_dict(row)


@app.put("/notes/{note_id}")
def update_note(note_id: int, payload: NotePayload) -> dict:
    content = payload.content.strip()
    if not content:
        raise HTTPException(
            status_code=400,
            detail="Note content cannot be empty",
        )

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    connection = get_connection()
    cursor = connection.execute(
        "UPDATE notes SET content = ?, updated_at = ? WHERE id = ?",
        (content, now, note_id),
    )
    connection.commit()

    if cursor.rowcount == 0:
        connection.close()
        raise HTTPException(status_code=404, detail="Note not found")

    row = connection.execute(
        "SELECT id, content, created_at, updated_at FROM notes WHERE id = ?",
        (note_id,),
    ).fetchone()
    connection.close()
    return row_to_dict(row)


@app.delete("/notes/{note_id}")
def delete_note(note_id: int) -> dict:
    connection = get_connection()
    cursor = connection.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    connection.commit()
    connection.close()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Note not found")

    return {"message": "Note deleted"}

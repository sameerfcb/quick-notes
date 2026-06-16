---
title: Quick Notes
emoji: 📝
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# Quick Notes MVP

Quick Notes is a beginner-friendly portfolio project that demonstrates full CRUD with a FastAPI backend, SQLite database, and a vanilla HTML/CSS/JavaScript frontend.

## Stack

- Backend: FastAPI
- Database: SQLite
- Frontend: HTML, CSS, Vanilla JavaScript
- Deployment target: Hugging Face Spaces (Docker)

## Core Features

- Create note
- View all notes (latest first)
- Edit note
- Delete note
- Store and display timestamps (`created_at`, `updated_at`)

## Nice Features

- Search notes by keyword
- Character counter
- Copy note button
- Dark mode toggle

## Database Schema

`notes(id, content, created_at, updated_at)`

## API Endpoints

- `POST /notes`
- `GET /notes`
- `PUT /notes/{id}`
- `DELETE /notes/{id}`

## Run Locally

```bash
pip install -r requirements.txt
uvicorn app:app --reload
```

Open `http://127.0.0.1:8000`.

## Docker

```bash
docker build -t quick-notes .
docker run -p 7860:7860 quick-notes
```

Open `http://127.0.0.1:7860`.
# quick-notes
# quick-notes

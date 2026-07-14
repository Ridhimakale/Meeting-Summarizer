# MeetWise AI

MeetWise AI is an AI productivity app for turning meeting audio into transcripts, structured summaries, decisions, action items, risks, and exportable reports.

The project is built as a production-style full-stack demo:

- Frontend: React, TypeScript, Tailwind CSS, React Router, Axios, Lucide icons
- Backend: FastAPI, SQLAlchemy, SQLite, Pydantic
- AI: Groq speech-to-text and Groq structured-output summarization
- Storage: local uploads, transcripts, summaries, and SQLite metadata

## Features

- Drag-and-drop meeting audio upload
- Audio type and size validation
- Groq Whisper transcription
- Strict JSON summary extraction with Groq `openai/gpt-oss-20b`
- Pydantic validation for LLM output
- Persistent meeting history
- Search across meetings, transcripts, and summaries
- Transcript viewer with local search
- Structured summary dashboard
- Action item table with owner/task/deadline
- TXT transcript export
- TXT structured summary export
- PDF meeting report export
- Delete workflow with database and local-file cleanup
- Dark mode and responsive layout

## Architecture

```text
User
  |
  | uploads audio
  v
React + TypeScript Frontend
  |
  | REST API
  v
FastAPI API Layer
  |
  | delegates
  v
Service Layer
  |-- StorageService saves uploads/transcripts/summaries
  |-- WhisperService calls Groq transcription
  |-- SummaryService calls Groq structured output
  |-- MeetingService handles history/export/delete
  |
  v
SQLite + Local Files
```

## Backend Structure

```text
backend/
  app/
    api/
    core/
    database/
    models/
    prompts/
    schemas/
    services/
    utils/
  uploads/
  transcripts/
  summaries/
  main.py
```

## Frontend Structure

```text
frontend/src/
  components/
  pages/
  services/
  types/
  utils/
```

## Environment

Create `.env` from `.env.example`:

```bash
GROQ_API_KEY=
DATABASE_URL=sqlite:///./database.db
FRONTEND_ORIGIN=http://localhost:5173
MAX_UPLOAD_MB=25
TRANSCRIPTION_MODEL=whisper-large-v3-turbo
SUMMARY_MODEL=openai/gpt-oss-20b
```

`GROQ_API_KEY` is used for both transcription and summarization.

## Setup

Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

Run the backend:

```bash
cd backend
python -m uvicorn main:app --reload
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Run the frontend:

```bash
npm run dev
```

Open:

- Dashboard: `http://127.0.0.1:5173`
- History: `http://127.0.0.1:5173/history`
- Backend health: `http://127.0.0.1:8000/health`

## API

- `GET /health`
- `POST /upload`
- `GET /meetings`
- `GET /meetings?search=term`
- `GET /meeting/{meeting_id}`
- `DELETE /meeting/{meeting_id}`
- `POST /meeting/{meeting_id}/summary`
- `GET /meeting/{meeting_id}/summary`
- `GET /download/transcript/{meeting_id}`
- `GET /download/summary/{meeting_id}`
- `GET /download/pdf/{meeting_id}`

## Structured Summary Schema

LLM output is required to match this schema:

```json
{
  "executive_summary": "string",
  "discussion_points": ["string"],
  "decisions": ["string"],
  "action_items": [
    {
      "owner": "string",
      "task": "string",
      "deadline": "string"
    }
  ],
  "risks": ["string"],
  "next_meeting": ["string"]
}
```

The backend validates the response with Pydantic before storing it.

## Verification

Backend syntax check:

```bash
python -m compileall backend
```

Frontend production build:

```bash
cd frontend
npm run build
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

## Demo Flow

1. Open the dashboard.
2. Upload a short meeting audio file.
3. Wait for the transcript to appear.
4. Generate the structured summary.
5. Show executive summary, decisions, risks, and action item table.
6. Open History.
7. Search for a transcript phrase.
8. Open the saved meeting.
9. Download transcript TXT, summary TXT, and PDF report.
10. Delete the meeting to show cleanup.

## Troubleshooting

- If uploads fail with a Groq error, verify `GROQ_API_KEY`.
- If direct uploads fail due to size, keep files under `MAX_UPLOAD_MB`.
- If frontend cannot reach backend, confirm FastAPI is running on `127.0.0.1:8000`.
- If CORS blocks requests, confirm `FRONTEND_ORIGIN` matches the frontend URL.
- If summarization fails with schema/model errors, keep `SUMMARY_MODEL=openai/gpt-oss-20b` for strict structured output support.

# MeetWise AI Demo Script

## 2-3 Minute Recording Flow

1. Start on `http://127.0.0.1:5173`.
2. Point out the dashboard, dark mode toggle, and system status.
3. Upload a short meeting audio file.
4. Show the processing state and transcript result.
5. Click `Generate Summary`.
6. Walk through:
   - executive summary
   - discussion points
   - decisions
   - action item table
   - risks
   - next meeting
7. Open `History`.
8. Search for a word from the transcript.
9. Select the saved meeting.
10. Download:
    - transcript TXT
    - summary TXT
    - PDF report
11. Delete the meeting and show the history list updates.

## Evaluation Talking Points

- API routes stay thin; services own business logic.
- Groq handles transcription and structured summarization.
- LLM output is not free-form text; it is schema-constrained JSON and Pydantic-validated.
- SQLite stores meeting, transcript, and summary metadata.
- Local folders store uploaded audio, transcript TXT, and summary JSON.
- The history page demonstrates persistence, search, export, and delete workflows.

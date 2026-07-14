import json
import textwrap
from datetime import datetime

from app.models.meeting import Meeting


def build_transcript_text(meeting: Meeting) -> str:
    transcript = meeting.transcript.transcript if meeting.transcript else ""
    return "\n".join(
        [
            "MeetWise AI Transcript",
            f"Meeting: {meeting.original_filename}",
            f"Status: {meeting.status}",
            f"Created: {meeting.created_at.isoformat() if meeting.created_at else ''}",
            "",
            transcript,
        ]
    )


def build_summary_text(meeting: Meeting) -> str:
    if not meeting.summary:
        return "No summary available for this meeting."

    summary = meeting.summary
    payload = {
        "executive_summary": summary.executive_summary,
        "discussion_points": summary.discussion_points,
        "decisions": summary.decisions,
        "action_items": summary.action_items,
        "risks": summary.risks,
        "next_meeting": summary.next_meeting,
    }

    return "\n".join(
        [
            "MeetWise AI Structured Summary",
            f"Meeting: {meeting.original_filename}",
            f"Created: {summary.created_at.isoformat() if summary.created_at else ''}",
            "",
            json.dumps(payload, indent=2),
        ]
    )


def build_meeting_report_pdf(meeting: Meeting) -> bytes:
    lines = [
        "MeetWise AI Meeting Report",
        f"Generated: {datetime.utcnow().isoformat()} UTC",
        f"Meeting: {meeting.original_filename}",
        f"Status: {meeting.status}",
        "",
        "Summary",
    ]

    if meeting.summary:
        lines.extend(
            [
                meeting.summary.executive_summary or "No executive summary.",
                "",
                "Decisions",
                *[f"- {item}" for item in meeting.summary.decisions],
                "",
                "Action Items",
                *[
                    f"- {item.get('owner', '')}: {item.get('task', '')} ({item.get('deadline', '')})"
                    for item in meeting.summary.action_items
                ],
                "",
                "Risks",
                *[f"- {item}" for item in meeting.summary.risks],
                "",
                "Next Meeting",
                *[f"- {item}" for item in meeting.summary.next_meeting],
            ]
        )
    else:
        lines.append("No summary available.")

    lines.extend(["", "Transcript"])
    lines.extend((meeting.transcript.transcript if meeting.transcript else "No transcript available.").splitlines())

    return _simple_pdf(lines)


def _simple_pdf(lines: list[str]) -> bytes:
    wrapped_lines: list[str] = []
    for line in lines:
        wrapped = textwrap.wrap(line, width=92) or [""]
        wrapped_lines.extend(wrapped)

    pages = [wrapped_lines[index : index + 46] for index in range(0, len(wrapped_lines), 46)] or [[]]
    objects: list[bytes] = [b"<< /Type /Catalog /Pages 2 0 R >>"]
    kids = " ".join(f"{3 + index * 2} 0 R" for index in range(len(pages)))
    objects.append(f"<< /Type /Pages /Kids [{kids}] /Count {len(pages)} >>".encode("ascii"))

    for page_index, page_lines in enumerate(pages):
        page_object_id = 3 + page_index * 2
        content_object_id = page_object_id + 1
        objects.append(
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents {content_object_id} 0 R >>".encode(
                "ascii"
            )
        )
        stream = _page_stream(page_lines)
        objects.append(f"<< /Length {len(stream)} >>\nstream\n".encode("ascii") + stream + b"\nendstream")

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("ascii"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode(
            "ascii"
        )
    )
    return bytes(pdf)


def _page_stream(lines: list[str]) -> bytes:
    stream_lines = ["BT", "/F1 10 Tf", "50 750 Td", "14 TL"]
    for line in lines:
        stream_lines.append(f"({_escape_pdf_text(line)}) Tj")
        stream_lines.append("T*")
    stream_lines.append("ET")
    return "\n".join(stream_lines).encode("latin-1", errors="replace")


def _escape_pdf_text(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

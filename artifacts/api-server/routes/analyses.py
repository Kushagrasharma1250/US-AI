import json
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from database import SELECT_COLS, get_conn, release_conn, row_to_analysis
from lib.ai import analyze_content
from lib.file_parser import parse_file

router = APIRouter()

# Bounded pool — limits concurrent LLM+parsing jobs so the DB pool (max 10)
# and memory stay under control. Each job only holds a DB connection during
# short writes, not across the full LLM call.
_executor = ThreadPoolExecutor(max_workers=4)


# ── GET /analyses ────────────────────────────────────────────────────────────

@router.get("/analyses")
def list_analyses():
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(f"SELECT {SELECT_COLS} FROM analyses ORDER BY created_at DESC")
        rows = cur.fetchall()
        return [row_to_analysis(r) for r in rows]
    finally:
        release_conn(conn)


# ── POST /analyses ───────────────────────────────────────────────────────────

@router.post("/analyses", status_code=201)
async def create_analysis(
    files: list[UploadFile] = File(...),
    prompt: Optional[str] = Form(None),
):
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required.")

    file_names = [f.filename or "unnamed" for f in files]
    file_types = [f.content_type or "application/octet-stream" for f in files]
    title = _derive_title(file_names)

    # Read all file bytes now (before the async context closes)
    file_data = [(await f.read(), f.filename or "unnamed", f.content_type or "") for f in files]

    # Insert placeholder row
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            f"""
            INSERT INTO analyses (title, status, file_names, file_types)
            VALUES (%s, %s, %s, %s)
            RETURNING {SELECT_COLS}
            """,
            (title, "processing", json.dumps(file_names), json.dumps(file_types)),
        )
        row = cur.fetchone()
        conn.commit()
    finally:
        release_conn(conn)

    analysis = row_to_analysis(row)

    # Submit to bounded pool so we return immediately
    _executor.submit(_process_analysis, analysis["id"], file_data, prompt)

    return analysis


# ── GET /analyses/{id} ───────────────────────────────────────────────────────

@router.get("/analyses/{analysis_id}")
def get_analysis(analysis_id: int):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT {SELECT_COLS} FROM analyses WHERE id = %s",
            (analysis_id,),
        )
        row = cur.fetchone()
    finally:
        release_conn(conn)

    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return row_to_analysis(row)


# ── DELETE /analyses/{id} ────────────────────────────────────────────────────

@router.delete("/analyses/{analysis_id}", status_code=204)
def delete_analysis(analysis_id: int):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM analyses WHERE id = %s RETURNING id",
            (analysis_id,),
        )
        deleted = cur.fetchone()
        conn.commit()
    finally:
        release_conn(conn)

    if not deleted:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return Response(status_code=204)


# ── helpers ──────────────────────────────────────────────────────────────────

def _derive_title(file_names: list[str]) -> str:
    if len(file_names) == 1:
        name = file_names[0]
        return name.rsplit(".", 1)[0] if "." in name else name
    return f"Analysis of {len(file_names)} files"


def _db_write(sql: str, params: tuple) -> None:
    """Acquire a connection, run one write, release immediately."""
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        conn.commit()
    finally:
        release_conn(conn)


def _process_analysis(
    analysis_id: int,
    file_data: list[tuple[bytes, str, str]],
    custom_prompt: Optional[str],
) -> None:
    try:
        # ── parse files (no DB connection held) ──────────────────────────────
        parsed = [parse_file(data, name, mime) for data, name, mime in file_data]

        # Replace image data URIs with a text fallback for text-only models
        contents = []
        for p in parsed:
            if p["type"] == "Image" and p["content"].startswith("data:"):
                contents.append({
                    **p,
                    "content": (
                        f"[Image file: {p['name']} — describe what an analyst "
                        "would infer from a chart or image if visible]"
                    ),
                })
            else:
                contents.append(p)

        # ── call LLM (no DB connection held) ─────────────────────────────────
        result = analyze_content(contents, custom_prompt)

        # ── short write: mark complete ────────────────────────────────────────
        _db_write(
            """
            UPDATE analyses
            SET status = %s, title = %s, summary = %s,
                key_points = %s, key_metrics = %s, nodes = %s
            WHERE id = %s
            """,
            (
                "complete",
                result.get("title", "Untitled"),
                result.get("summary"),
                json.dumps(result.get("keyPoints", [])),
                json.dumps(result.get("keyMetrics", [])),
                json.dumps(result.get("nodes", [])),
                analysis_id,
            ),
        )

    except Exception as exc:
        # ── short write: mark error ───────────────────────────────────────────
        try:
            _db_write(
                "UPDATE analyses SET status = %s, error_message = %s WHERE id = %s",
                ("error", str(exc), analysis_id),
            )
        except Exception:
            pass

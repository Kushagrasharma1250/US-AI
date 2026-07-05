import os
import json
import psycopg2
import psycopg2.pool
from datetime import datetime

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be set.")

pool = psycopg2.pool.ThreadedConnectionPool(1, 10, DATABASE_URL)


def get_conn():
    return pool.getconn()


def release_conn(conn):
    pool.putconn(conn)


def row_to_analysis(row) -> dict:
    """Convert a DB row tuple to a dict matching the Analysis schema."""
    return {
        "id": row[0],
        "title": row[1],
        "status": row[2],
        "fileNames": row[3] if isinstance(row[3], list) else json.loads(row[3]),
        "fileTypes": row[4] if isinstance(row[4], list) else json.loads(row[4]),
        "summary": row[5],
        "keyPoints": row[6] if row[6] is None or isinstance(row[6], list) else json.loads(row[6]),
        "keyMetrics": row[7] if row[7] is None or isinstance(row[7], list) else json.loads(row[7]),
        "nodes": row[8] if row[8] is None or isinstance(row[8], list) else json.loads(row[8]),
        "errorMessage": row[9],
        "createdAt": row[10].isoformat() if isinstance(row[10], datetime) else str(row[10]),
    }


SELECT_COLS = "id, title, status, file_names, file_types, summary, key_points, key_metrics, nodes, error_message, created_at"

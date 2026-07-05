import io
import base64
from typing import Optional


def parse_file(data: bytes, filename: str, mimetype: str) -> dict:
    """Return {"name", "type", "content"} for any supported file type."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if mimetype == "application/pdf" or ext == "pdf":
        return _parse_pdf(data, filename)

    if mimetype in (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
    ) or ext in ("xlsx", "xls"):
        return _parse_excel(data, filename)

    if mimetype == "text/csv" or ext == "csv":
        return {"name": filename, "type": "CSV", "content": data.decode("utf-8", errors="replace")}

    if mimetype.startswith("image/") or ext in ("png", "jpg", "jpeg", "gif", "webp"):
        return _parse_image(data, filename, mimetype)

    if mimetype == "text/plain" or ext in ("txt", "md"):
        return {"name": filename, "type": "Text", "content": data.decode("utf-8", errors="replace")}

    return {
        "name": filename,
        "type": "Unknown",
        "content": f"[Binary file: {filename} — content not extractable]",
    }


def _parse_pdf(data: bytes, filename: str) -> dict:
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=data, filetype="pdf")
        pages = []
        for page in doc:
            text = page.get_text()
            if text.strip():
                pages.append(text)
        doc.close()
        content = "\n\n".join(pages).strip()
        return {
            "name": filename,
            "type": "PDF",
            "content": content or "[PDF with no extractable text — may be scanned/image-based]",
        }
    except Exception as e:
        return {"name": filename, "type": "PDF", "content": f"[Could not parse PDF: {e}]"}


def _parse_excel(data: bytes, filename: str) -> dict:
    try:
        import pandas as pd

        xl = pd.ExcelFile(io.BytesIO(data))
        sheets = []
        for sheet_name in xl.sheet_names:
            df = xl.parse(sheet_name)
            csv_text = df.to_csv(index=False)
            if csv_text.strip():
                sheets.append(f"--- Sheet: {sheet_name} ---\n{csv_text}")
        content = "\n\n".join(sheets) if sheets else "[Empty spreadsheet]"
        return {"name": filename, "type": "Excel", "content": content}
    except Exception as e:
        return {"name": filename, "type": "Excel", "content": f"[Could not parse Excel: {e}]"}


def _parse_image(data: bytes, filename: str, mimetype: str) -> dict:
    # Encode as base64 data URI; vision-capable models can use it.
    # Text-only models (llama3:8b) receive a descriptive fallback in the route.
    b64 = base64.b64encode(data).decode()
    return {
        "name": filename,
        "type": "Image",
        "content": f"data:{mimetype};base64,{b64}",
    }

import io
import json
from typing import Any

from pypdf import PdfReader

_TEXT_EXTENSIONS = {"txt", "md", "markdown", "text"}


def _extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def _from_pdf(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    return "\n\n".join((page.extract_text() or "") for page in reader.pages)


def _flatten_json(node: Any, prefix: str = "") -> list[str]:
    """Flatten arbitrary JSON into 'key.path: value' lines for embedding."""
    lines: list[str] = []
    if isinstance(node, dict):
        for key, value in node.items():
            lines.extend(_flatten_json(value, f"{prefix}{key}."))
    elif isinstance(node, list):
        for i, value in enumerate(node):
            lines.extend(_flatten_json(value, f"{prefix}{i}."))
    else:
        lines.append(f"{prefix.rstrip('.')}: {node}")
    return lines


def _from_json(data: bytes) -> str:
    return "\n".join(_flatten_json(json.loads(data.decode("utf-8"))))


def extract_text(filename: str, data: bytes) -> str:
    """Extract plain text from an uploaded file based on its extension."""
    ext = _extension(filename)
    if ext == "pdf":
        return _from_pdf(data)
    if ext == "json":
        return _from_json(data)
    if ext in _TEXT_EXTENSIONS:
        return data.decode("utf-8", errors="replace")
    raise ValueError(f"Unsupported file type '.{ext}' — supported: PDF, TXT, MD, JSON")

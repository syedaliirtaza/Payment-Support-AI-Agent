def chunk_text(text: str, chunk_size: int = 900, overlap: int = 150) -> list[str]:
    """Split text into overlapping chunks suitable for embedding.

    Whitespace is normalized and the text is sliced into windows of
    ``chunk_size`` characters that overlap by ``overlap`` characters, so a
    passage split across a boundary is still captured whole in one chunk.
    """
    normalized = " ".join(text.split())
    if not normalized:
        return []
    if len(normalized) <= chunk_size:
        return [normalized]

    step = max(1, chunk_size - overlap)
    chunks: list[str] = []
    start = 0
    while start < len(normalized):
        chunk = normalized[start : start + chunk_size].strip()
        if chunk:
            chunks.append(chunk)
        start += step
    return chunks

"""Semantic embedding generation for material descriptions."""

from __future__ import annotations

import os

# Set environment variables before importing sentence_transformers to optimize performance
# and avoid tokenizer parallelism warnings.
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from sentence_transformers import SentenceTransformer

# We use all-MiniLM-L6-v2 as a fast, reasonable baseline for semantic similarity.
# It produces 384-dimensional embeddings.
MODEL_NAME = "all-MiniLM-L6-v2"

# Lazy load model to avoid heavy initialization at import time.
_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def generate_embedding(text: str) -> list[float]:
    """Deterministically generate a 384-dimensional embedding for the given text.

    Args:
        text: The normalized description of the material.

    Returns:
        A list of floats representing the embedding vector.
    """
    model = _get_model()
    # Ensure it's a 1D float list
    embedding = model.encode(text, convert_to_numpy=True).tolist()
    return [float(x) for x in embedding]

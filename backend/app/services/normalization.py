"""Pure, deterministic normalization for material descriptions.

This module deliberately contains no LLM, embedding, database, or matching logic.
It produces a stable lexical representation for later deterministic parsing and
AI-assisted candidate generation, while retaining the original description.
"""

from __future__ import annotations

from dataclasses import dataclass
import re

NORMALIZER_VERSION = "v1"


@dataclass(frozen=True)
class NormalizationResult:
    """Original and deterministic normalized forms of one material description."""

    original_description: str
    normalized_description: str
    normalizer_version: str = NORMALIZER_VERSION


# Abbreviations are intentionally conservative: every substitution has one stable,
# unambiguous canonical form used by the demo material domain.
ABBREVIATION_RULES: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\bstainless[\s-]*steel\b|\bss\b"), "stainless steel"),
    (re.compile(r"\bm\s*\.\s*s\s*\.?\b|\bms\b"), "mild steel"),
    (re.compile(r"\bg\s*\.\s*i\s*\.?\b|\bgi\b"), "galvanized iron"),
    (re.compile(r"\bc\s*\.\s*i\s*\.?\b|\bci\b"), "cast iron"),
    (re.compile(r"\bdia\.?\b|\bdia meter\b"), "diameter"),
    (re.compile(r"\bqty\.?\b"), "quantity"),
    (re.compile(r"\bno\.?s?\b|\bpcs?\b"), "each"),
    (re.compile(r"\bvlv\b"), "valve"),
    (re.compile(r"\bflg\b"), "flanged"),
)

UNIT_RULES: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\bmillimet(?:er|re)s?\b|\bmm\b"), "mm"),
    (re.compile(r"\bcentimet(?:er|re)s?\b|\bcm\b"), "cm"),
    (re.compile(r"\bmet(?:er|re)s?\b|\bmtrs?\b"), "m"),
    (re.compile(r"\bkilograms?\b|\bkgs?\b"), "kg"),
    (re.compile(r"\bgrams?\b|\bgms?\b"), "g"),
    (re.compile(r"\blit(?:er|re)s?\b|\bltrs?\b"), "l"),
    (re.compile(r"\binches?\b"), "in"),
)

TERMINOLOGY_RULES: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\bgalvanised\b"), "galvanized"),
    (re.compile(r"\bhexagonal\s+(?:head\s+)?(?:bolt|screw)\b"), "hex head bolt"),
    (re.compile(r"\bhex[\s-]*head\b"), "hex head"),
    (re.compile(r"\bcarbon[\s-]*steel\b"), "carbon steel"),
    (re.compile(r"\bcast[\s-]*iron\b"), "cast iron"),
)

# A metric thread designation is semantic content, so x and hyphen are normalized
# to the same dimension separator before remaining hyphens are treated as punctuation.
THREAD_DIMENSION_PATTERN = re.compile(
    r"\b(?P<thread>m\s*\d+(?:\.\d+)?)\s*(?:x|×|-)\s*(?P<length>\d+(?:\.\d+)?)\b"
)
LINEAR_DIMENSION_PATTERN = re.compile(
    r"\b(?P<first>\d+(?:\.\d+)?)\s*(?P<unit>mm|cm|m)\s*(?:x|×)\s*"
    r"(?P<second>\d+(?:\.\d+)?)\s*(?P=unit)\b"
)


def _apply_rules(value: str, rules: tuple[tuple[re.Pattern[str], str], ...]) -> str:
    """Apply ordered lexical substitutions without external state."""
    for pattern, replacement in rules:
        value = pattern.sub(replacement, value)
    return value


def _normalize_thread_dimensions(value: str) -> str:
    """Normalize M10X50, M10 x 50, M10×50, and M10-50 to `m10 x 50`."""

    def replace_dimension(match: re.Match[str]) -> str:
        thread = re.sub(r"\s+", "", match.group("thread"))
        return f"{thread} x {match.group('length')}"

    return THREAD_DIMENSION_PATTERN.sub(replace_dimension, value)


def _normalize_linear_dimensions(value: str) -> str:
    """Normalize repeated-unit dimensions such as `50MMx25mm`."""
    return LINEAR_DIMENSION_PATTERN.sub(
        lambda match: f"{match.group('first')} {match.group('unit')} x "
        f"{match.group('second')} {match.group('unit')}",
        value,
    )


def _separate_attached_units(value: str) -> str:
    """Insert a separator in conventional compact values such as `10MM` or `5KG`."""
    return re.sub(r"(?<=\d)(?=(?:mm|cm|kg|g|m|in)\b)", " ", value)


def _remove_irrelevant_punctuation(value: str) -> str:
    """Remove separator punctuation while retaining decimal points until token cleanup."""
    value = re.sub(r"[^a-z0-9.\s-]", " ", value)
    # Dots that are not part of a decimal number are punctuation, not data.
    value = re.sub(r"\.(?!\d)|(?<!\d)\.", " ", value)
    return value.replace("-", " ")


def normalize_description(description: str) -> NormalizationResult:
    """Normalize one description using only deterministic lexical rules.

    The original input is never mutated. Empty descriptions are valid and normalize
    to an empty string; callers may apply their own ingestion-level required-field policy.
    """
    if not isinstance(description, str):
        raise TypeError("description must be a string")

    normalized = description.casefold().replace("\u00d7", "x").replace("–", "-").replace("—", "-")
    normalized = _apply_rules(normalized, ABBREVIATION_RULES)
    normalized = _separate_attached_units(normalized)
    normalized = _apply_rules(normalized, UNIT_RULES)
    normalized = _normalize_thread_dimensions(normalized)
    normalized = _normalize_linear_dimensions(normalized)
    normalized = _apply_rules(normalized, TERMINOLOGY_RULES)
    normalized = _remove_irrelevant_punctuation(normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()

    return NormalizationResult(
        original_description=description,
        normalized_description=normalized,
    )

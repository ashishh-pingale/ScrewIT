"""Deterministic technical attribute extraction for industrial material descriptions.

The extractor is deliberately limited to regexes and version-controlled dictionaries.
It never calls an LLM and returns ``None`` when an attribute is not explicitly
present or supported by a documented engineering notation.
"""

from __future__ import annotations

from dataclasses import dataclass
import re

from app.services.normalization import NORMALIZER_VERSION, normalize_description

ATTRIBUTE_EXTRACTOR_VERSION = "v1"


@dataclass(frozen=True)
class ExtractedAttributes:
    """Structured attributes supported by the deterministic extraction rules."""

    category: str | None = None
    material: str | None = None
    grade: str | None = None
    diameter: str | None = None
    length: str | None = None
    width: str | None = None
    height: str | None = None
    unit: str | None = None
    manufacturer: str | None = None
    part_number: str | None = None
    normalizer_version: str = NORMALIZER_VERSION
    extractor_version: str = ATTRIBUTE_EXTRACTOR_VERSION


# These dictionaries intentionally map only explicit, unambiguous vocabulary to a
# stable canonical value. Extend them through tests when new verified terms appear.
CATEGORY_DICTIONARY: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("bolt", ("hex bolt", "hex head bolt", "bolt")),
    ("screw", ("socket cap screw", "machine screw", "screw")),
    ("nut", ("lock nut", "hex nut", "nut")),
    ("washer", ("spring washer", "plain washer", "washer")),
    ("valve", ("gate valve", "globe valve", "ball valve", "butterfly valve", "valve")),
    ("bearing", ("roller bearing", "ball bearing", "bearing")),
    ("gasket", ("spiral wound gasket", "flange gasket", "gasket")),
    ("cable", ("control cable", "power cable", "armoured cable", "cable")),
    ("pipe", ("pipe" ,)),
    ("flange", ("flange",)),
    ("plate", ("plate",)),
    ("pump", ("pump",)),
    ("filter", ("filter",)),
    ("coupling", ("coupling",)),
    ("electrode", ("electrode",)),
)

MATERIAL_DICTIONARY: tuple[tuple[str, tuple[re.Pattern[str], ...]], ...] = (
    (
        "stainless steel",
        (
            re.compile(r"\bstainless steel\b"),
            re.compile(r"\bss\s*-?\s*\d{3}[a-z]?\b"),
            re.compile(r"\bss\b"),
        ),
    ),
    ("mild steel", (re.compile(r"\bmild steel\b"), re.compile(r"\bms\b"))),
    ("galvanized iron", (re.compile(r"\bgalvanized iron\b"), re.compile(r"\bgi\b"))),
    ("cast iron", (re.compile(r"\bcast iron\b"), re.compile(r"\bci\b"))),
    ("carbon steel", (re.compile(r"\bcarbon steel\b"), re.compile(r"\bcs\b"))),
    ("copper", (re.compile(r"\bcopper\b"),)),
    ("aluminium", (re.compile(r"\baluminium\b"), re.compile(r"\baluminum\b"))),
    ("chrome steel", (re.compile(r"\bchrome steel\b"),)),
    ("brass", (re.compile(r"\bbrass\b"),)),
    ("ptfe", (re.compile(r"\bptfe\b"),)),
    ("graphite", (re.compile(r"\bgraphite\b"),)),
    ("rubber", (re.compile(r"\brubber\b"),)),
)

GRADE_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\b(?:ss|stainless steel)\s*-?\s*(?P<grade>3\d{2}l?)\b"),
    re.compile(r"\bgrade\s*[-:]?\s*(?P<grade>\d+(?:\.\d+)?[a-z]?)\b"),
    re.compile(r"\bproperty class\s*(?P<grade>\d+(?:\.\d+)?)\b"),
    re.compile(r"\bastm\s+(?P<grade>a\d{3,4}\s+[a-z0-9]+)\b"),
    re.compile(r"\bis\s*2062\s*(?P<grade>[a-z]+\d*)?\b"),
)

THREAD_DIMENSION_PATTERN = re.compile(
    r"\bm\s*(?P<diameter>\d+(?:\.\d+)?)\s*x\s*"
    r"(?P<length>\d+(?:\.\d+)?)(?:\s*(?P<unit>mm|cm|m))?\b"
)
THREE_DIMENSION_PATTERN = re.compile(
    r"\b(?P<length>\d+(?:\.\d+)?)\s*(?P<unit>mm|cm|m)\s*x\s*"
    r"(?P<width>\d+(?:\.\d+)?)\s*(?P=unit)\s*x\s*"
    r"(?P<height>\d+(?:\.\d+)?)\s*(?P=unit)\b"
)
TWO_DIMENSION_PATTERN = re.compile(
    r"\b(?P<length>\d+(?:\.\d+)?)\s*(?P<unit>mm|cm|m)\s*x\s*"
    r"(?P<width>\d+(?:\.\d+)?)\s*(?P=unit)\b"
)
LABELED_DIMENSION_PATTERN = re.compile(
    r"\b(?P<label>diameter|length|width|height)\s*[:=-]?\s*"
    r"(?P<value>\d+(?:\.\d+)?)\s*(?P<unit>mm|cm|m|in)\b"
)
NOMINAL_DIAMETER_PATTERN = re.compile(r"\b(?P<prefix>dn|nps)\s*(?P<value>\d+(?:\.\d+)?)\b")
EXPLICIT_UNIT_PATTERN = re.compile(
    r"\b(?:uom|unit)\s*(?:[:=-]\s*)?(?P<unit>each|kg|g|m|mm|cm|l|in)\b"
)
MANUFACTURER_PATTERN = re.compile(
    r"\b(?:manufacturer|mfr|make)\s*[:=-]\s*(?P<manufacturer>[^,;|]+)", re.IGNORECASE
)
PART_NUMBER_PATTERN = re.compile(
    r"\b(?:part\s*(?:no|number)|p/n|pn)\s*[:=-]\s*(?P<part_number>[a-z0-9][a-z0-9._/-]*)",
    re.IGNORECASE,
)


def _find_category(normalized_description: str) -> str | None:
    """Return the first configured category whose term occurs in normalized text."""
    for category, terms in CATEGORY_DICTIONARY:
        if any(re.search(rf"\b{re.escape(term)}\b", normalized_description) for term in terms):
            return category
    return None


def _find_material(normalized_description: str) -> str | None:
    """Return a configured material only when its explicit pattern is present."""
    for material, patterns in MATERIAL_DICTIONARY:
        if any(pattern.search(normalized_description) for pattern in patterns):
            return material
    return None


def _find_grade(normalized_description: str) -> str | None:
    """Extract documented material-grade formats without guessing from context."""
    for pattern in GRADE_PATTERNS:
        match = pattern.search(normalized_description)
        if match:
            grade = match.group("grade")
            return grade.upper() if grade else "IS 2062"
    return None


def _clean_captured_value(value: str) -> str | None:
    """Trim an explicitly labelled identifier while retaining meaningful punctuation."""
    cleaned = re.sub(r"\s+", " ", value).strip(" .,:;|-_")
    return cleaned or None


def _find_identifier(pattern: re.Pattern[str], description: str, group_name: str) -> str | None:
    match = pattern.search(description)
    return _clean_captured_value(match.group(group_name)) if match else None


def _format_dimension(value: str, unit: str) -> str:
    """Create a stable readable dimension value from explicit numeric text and unit."""
    return f"{value} {unit}"


def _extract_dimensions(normalized_description: str) -> tuple[
    str | None, str | None, str | None, str | None, str | None
]:
    """Return diameter, length, width, height, and the dimension unit when explicit."""
    diameter = length = width = height = unit = None

    # M prefix explicitly denotes a metric thread. Its conventional second dimension
    # is millimetres, so M10 x 50 deterministically means M10 and 50 mm.
    thread_match = THREAD_DIMENSION_PATTERN.search(normalized_description)
    if thread_match:
        unit = thread_match.group("unit") or "mm"
        return (
            f"M{thread_match.group('diameter')}",
            _format_dimension(thread_match.group("length"), unit),
            None,
            None,
            unit,
        )

    for match in LABELED_DIMENSION_PATTERN.finditer(normalized_description):
        value = _format_dimension(match.group("value"), match.group("unit"))
        unit = unit or match.group("unit")
        label = match.group("label")
        if label == "diameter":
            diameter = value
        elif label == "length":
            length = value
        elif label == "width":
            width = value
        else:
            height = value
    if any(value is not None for value in (diameter, length, width, height)):
        return diameter, length, width, height, unit

    three_dimension_match = THREE_DIMENSION_PATTERN.search(normalized_description)
    if three_dimension_match:
        unit = three_dimension_match.group("unit")
        return (
            None,
            _format_dimension(three_dimension_match.group("length"), unit),
            _format_dimension(three_dimension_match.group("width"), unit),
            _format_dimension(three_dimension_match.group("height"), unit),
            unit,
        )

    two_dimension_match = TWO_DIMENSION_PATTERN.search(normalized_description)
    if two_dimension_match:
        unit = two_dimension_match.group("unit")
        return (
            None,
            _format_dimension(two_dimension_match.group("length"), unit),
            _format_dimension(two_dimension_match.group("width"), unit),
            None,
            unit,
        )

    nominal_match = NOMINAL_DIAMETER_PATTERN.search(normalized_description)
    if nominal_match:
        return f"{nominal_match.group('prefix').upper()} {nominal_match.group('value')}", None, None, None, None

    return None, None, None, None, None


def extract_attributes(description: str) -> ExtractedAttributes:
    """Extract only explicitly supported attributes from one material description."""
    normalized = normalize_description(description).normalized_description
    diameter, length, width, height, dimension_unit = _extract_dimensions(normalized)
    explicit_unit = _find_identifier(EXPLICIT_UNIT_PATTERN, normalized, "unit")

    return ExtractedAttributes(
        category=_find_category(normalized),
        material=_find_material(normalized),
        grade=_find_grade(normalized),
        diameter=diameter,
        length=length,
        width=width,
        height=height,
        unit=dimension_unit or explicit_unit,
        manufacturer=_find_identifier(MANUFACTURER_PATTERN, description, "manufacturer"),
        part_number=_find_identifier(PART_NUMBER_PATTERN, description, "part_number"),
    )

"""Unit tests for deterministic material-description normalization."""

import pytest

from app.services.normalization import NORMALIZER_VERSION, normalize_description


@pytest.mark.parametrize(
    ("source", "expected"),
    [
        ("SS PIPE 50 MM", "stainless steel pipe 50 mm"),
        ("MS Plate 10MM", "mild steel plate 10 mm"),
        ("GI SHEET, 2 mm", "galvanized iron sheet 2 mm"),
        ("CI flange dia. 100 MM", "cast iron flange diameter 100 mm"),
        ("Stainless-Steel valve", "stainless steel valve"),
        ("Galvanised Iron Pipe", "galvanized iron pipe"),
        ("HEXAGONAL HEAD BOLT", "hex head bolt"),
    ],
)
def test_normalizes_engineering_abbreviations_and_terminology(source: str, expected: str) -> None:
    assert normalize_description(source).normalized_description == expected


@pytest.mark.parametrize(
    ("source", "expected"),
    [
        ("M10X50", "m10 x 50"),
        ("M10 x 50", "m10 x 50"),
        ("M10×50", "m10 x 50"),
        ("M10-50", "m10 x 50"),
        ("Bolt M 10 X 50 grade 8.8", "bolt m10 x 50 grade 8.8"),
        ("Plate 50MMx25mm", "plate 50 mm x 25 mm"),
    ],
)
def test_normalizes_dimensional_formats(source: str, expected: str) -> None:
    assert normalize_description(source).normalized_description == expected


@pytest.mark.parametrize(
    ("source", "expected"),
    [
        ("Cable 25 MM / 10 KG", "cable 25 mm 10 kg"),
        ("WIRE 2 millimetres; 5 KGS", "wire 2 mm 5 kg"),
        ("Pipe 2 inches x 3 metres", "pipe 2 in x 3 m"),
        ("100 MTRS, Qty. 5 PCS", "100 m quantity 5 each"),
    ],
)
def test_normalizes_common_units(source: str, expected: str) -> None:
    assert normalize_description(source).normalized_description == expected


def test_removes_irrelevant_punctuation_and_normalizes_whitespace() -> None:
    result = normalize_description("  SS,,  VALVE / DN-50   (RF)  ")

    assert result.normalized_description == "stainless steel valve dn 50 rf"


def test_preserves_original_description_and_version() -> None:
    source = "SS Bolt M10X50"

    result = normalize_description(source)

    assert result.original_description == source
    assert result.normalized_description == "stainless steel bolt m10 x 50"
    assert result.normalizer_version == NORMALIZER_VERSION


def test_is_deterministic_for_identical_input() -> None:
    source = " GI plate; M10×50 / 2 KGS "

    assert normalize_description(source) == normalize_description(source)


@pytest.mark.parametrize("source", [None, 42, ["SS bolt"]])
def test_rejects_non_string_descriptions(source: object) -> None:
    with pytest.raises(TypeError, match="description must be a string"):
        normalize_description(source)  # type: ignore[arg-type]

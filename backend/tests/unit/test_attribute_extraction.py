"""Tests for deterministic industrial material attribute extraction."""

import pytest

from app.services.attribute_extraction import extract_attributes


@pytest.mark.parametrize(
    ("description", "expected"),
    [
        ("SS304 HEX BOLT M10 X 50", {"category": "bolt", "material": "stainless steel", "grade": "304", "diameter": "M10", "length": "50 mm", "unit": "mm"}),
        ("SS 316L socket cap screw M8x30 mm", {"category": "screw", "material": "stainless steel", "grade": "316L", "diameter": "M8", "length": "30 mm"}),
        ("MS hex bolt M12-60 grade 8.8", {"category": "bolt", "material": "mild steel", "grade": "8.8", "diameter": "M12", "length": "60 mm"}),
        ("GI hex nut M16", {"category": "nut", "material": "galvanized iron"}),
        ("CI gate valve DN 50 class 150", {"category": "valve", "material": "cast iron", "diameter": "DN 50"}),
        ("Carbon steel ball valve DN25", {"category": "valve", "material": "carbon steel", "diameter": "DN 25"}),
        ("ASTM A216 WCB globe valve DN 80", {"category": "valve", "grade": "A216 WCB", "diameter": "DN 80"}),
        ("Copper PVC power cable 3C x 4 sq mm UOM: m", {"category": "cable", "material": "copper", "unit": "m"}),
        ("Aluminium armoured cable 4C x 16 sq mm", {"category": "cable", "material": "aluminium"}),
        ("Deep groove ball bearing 6205", {"category": "bearing"}),
        ("Taper roller bearing, make: Demo Bearings Ltd; PN: TRB-32205", {"category": "bearing", "manufacturer": "Demo Bearings Ltd", "part_number": "TRB-32205"}),
        ("Spiral wound SS316 gasket DN 40 class 300", {"category": "gasket", "material": "stainless steel", "grade": "316", "diameter": "DN 40"}),
        ("PTFE flange gasket DN15", {"category": "gasket", "material": "ptfe", "diameter": "DN 15"}),
        ("Graphite gasket DN 50", {"category": "gasket", "material": "graphite", "diameter": "DN 50"}),
        ("Rubber coupling length: 120 mm width: 60 mm height: 40 mm", {"category": "coupling", "material": "rubber", "length": "120 mm", "width": "60 mm", "height": "40 mm", "unit": "mm"}),
        ("MS plate 500 mm x 250 mm x 12 mm", {"category": "plate", "material": "mild steel", "length": "500 mm", "width": "250 mm", "height": "12 mm", "unit": "mm"}),
        ("SS plate 50MMx25mm", {"category": "plate", "material": "stainless steel", "length": "50 mm", "width": "25 mm", "unit": "mm"}),
        ("Brass pipe diameter: 20 mm length: 3 m", {"category": "pipe", "material": "brass", "diameter": "20 mm", "length": "3 m", "unit": "mm"}),
        ("Carbon steel flange NPS 2", {"category": "flange", "material": "carbon steel", "diameter": "NPS 2"}),
        ("Chrome steel needle roller bearing", {"category": "bearing", "material": "chrome steel"}),
        ("Welding electrode grade E6013 UOM: kg", {"category": "electrode", "unit": "kg"}),
        ("Centrifugal pump; manufacturer: Demo Process Pumps; part number: CPP-50/25", {"category": "pump", "manufacturer": "Demo Process Pumps", "part_number": "CPP-50/25"}),
        ("Cartridge filter make=Demo Filters Inc; P/N=CF.10-SS", {"category": "filter", "manufacturer": "Demo Filters Inc", "part_number": "CF.10-SS"}),
        ("Mild steel washer M10", {"category": "washer", "material": "mild steel"}),
        ("Stainless steel spring washer M12", {"category": "washer", "material": "stainless steel"}),
        ("IS 2062 E250 plate 1000 mm x 500 mm", {"category": "plate", "grade": "E250", "length": "1000 mm", "width": "500 mm"}),
        ("GI pipe 2 inches", {"category": "pipe", "material": "galvanized iron"}),
        ("Butterfly valve DN 100", {"category": "valve", "diameter": "DN 100"}),
        ("CS hex bolt M20×100 property class 10.9", {"category": "bolt", "material": "carbon steel", "grade": "10.9", "diameter": "M20", "length": "100 mm"}),
        ("SS 304 flange diameter 150 mm", {"category": "flange", "material": "stainless steel", "grade": "304", "diameter": "150 mm", "unit": "mm"}),
        ("Aluminum control cable UOM: m", {"category": "cable", "material": "aluminium", "unit": "m"}),
    ],
)
def test_extracts_supported_attributes_from_realistic_descriptions(
    description: str, expected: dict[str, str]
) -> None:
    extracted = extract_attributes(description)

    for attribute, value in expected.items():
        assert getattr(extracted, attribute) == value


def test_unknown_attributes_are_null_and_not_invented() -> None:
    extracted = extract_attributes("Unclassified industrial component")

    assert extracted.category is None
    assert extracted.material is None
    assert extracted.grade is None
    assert extracted.diameter is None
    assert extracted.length is None
    assert extracted.width is None
    assert extracted.height is None
    assert extracted.unit is None
    assert extracted.manufacturer is None
    assert extracted.part_number is None


def test_originally_labelled_identifiers_preserve_meaningful_punctuation() -> None:
    extracted = extract_attributes("Bolt M10x50; Make: Demo-Fastener Co.; Part No: BX-10.50/SS")

    assert extracted.manufacturer == "Demo-Fastener Co"
    assert extracted.part_number == "BX-10.50/SS"

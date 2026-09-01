"""Generate deterministic, clearly labelled synthetic ScrewIT demo data.

This generator creates fictional industrial-material records for product demos and
matching evaluation. It must not be used as, or described as, CPSE procurement data.
"""

from __future__ import annotations

import csv
import random
from dataclasses import asdict, dataclass
from pathlib import Path

SEED = 20260901
RECORDS_PER_CANONICAL = 5
DEMO_ORGANISATIONS = (
    "Astra Petrochem Demo Corporation",
    "Bharat Thermal Demo Enterprise",
    "Dakshin Steel Demo Works",
    "Narmada Power Demo Limited",
    "Vindhya Engineering Demo Services",
)
ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIRECTORY = ROOT / "data" / "demo"


@dataclass(frozen=True)
class CanonicalMaterial:
    """One fictional standard material identity used as evaluation ground truth."""

    standard_material_id: str
    standard_code: str
    canonical_name: str
    category: str
    material: str
    grade: str
    specifications: str
    canonical_unit: str
    synthetic_data_notice: str = "SYNTHETIC_DEMO_DATA_ONLY"


@dataclass(frozen=True)
class MaterialRecord:
    """One fictional local material-master record with auditable evaluation labels."""

    record_id: str
    cpse_name: str
    local_material_code: str
    description: str
    category: str
    supplied_unit: str
    manufacturer: str
    part_number: str
    ground_truth_standard_material_id: str
    ground_truth_standard_code: str
    description_variant: str
    hard_negative_standard_material_id: str
    hard_negative_reason: str
    synthetic_data_notice: str = "SYNTHETIC_DEMO_DATA_ONLY"


def build_canonical_materials() -> list[CanonicalMaterial]:
    """Create exactly 200 realistic but fictional canonical material identities."""
    materials: list[CanonicalMaterial] = []

    # 40 fasteners: same terminology, deliberately different diameters and grades.
    for diameter in (6, 8, 10, 12, 14, 16, 18, 20, 22, 24):
        for grade, length in (
            ("4.6", diameter * 4),
            ("8.8", diameter * 5),
            ("10.9", diameter * 6),
            ("12.9", diameter * 7),
        ):
            materials.append(
                CanonicalMaterial(
                    standard_material_id=f"SYN-CAN-{len(materials) + 1:03d}",
                    standard_code=f"SYN-FST-M{diameter}-{length}-G{grade.replace('.', '')}",
                    canonical_name=f"Hex Head Bolt M{diameter} x {length} mm Grade {grade}",
                    category="Fasteners",
                    material="Carbon Steel",
                    grade=grade,
                    specifications=f"ISO 4014; thread M{diameter}; length {length} mm; property class {grade}",
                    canonical_unit="each",
                )
            )

    # 40 valves: nominal diameter and pressure class create close but non-equivalent items.
    for valve_type in ("Gate", "Globe", "Ball", "Butterfly"):
        for nominal_diameter in (15, 25, 40, 50, 80):
            for pressure_class in (150, 300):
                materials.append(
                    CanonicalMaterial(
                        standard_material_id=f"SYN-CAN-{len(materials) + 1:03d}",
                        standard_code=f"SYN-VLV-{valve_type[:3].upper()}-DN{nominal_diameter}-CL{pressure_class}",
                        canonical_name=(
                            f"{valve_type} Valve DN {nominal_diameter} Class {pressure_class} RF Flanged"
                        ),
                        category="Piping Valves",
                        material="Carbon Steel",
                        grade="ASTM A216 WCB",
                        specifications=(
                            f"ASME B16.34; DN {nominal_diameter}; Class {pressure_class}; RF flange"
                        ),
                        canonical_unit="each",
                    )
                )

    # 40 electrical cables: core count, conductor area, and voltage are intentional discriminators.
    cable_types = (
        ("Copper PVC Cable", "Copper"),
        ("Aluminium XLPE Cable", "Aluminium"),
        ("Copper Control Cable", "Copper"),
        ("Aluminium Armoured Cable", "Aluminium"),
    )
    for cable_name, conductor in cable_types:
        for core_area in ("2C x 2.5", "3C x 4", "3C x 6", "4C x 10", "4C x 16"):
            for voltage in ("1.1 kV", "3.3 kV"):
                materials.append(
                    CanonicalMaterial(
                        standard_material_id=f"SYN-CAN-{len(materials) + 1:03d}",
                        standard_code=(
                            f"SYN-CBL-{conductor[:3].upper()}-{core_area.replace(' ', '').replace('x', 'X').replace('.', 'P')}"
                            f"-{voltage.replace(' ', '').replace('.', 'P')}"
                        ),
                        canonical_name=f"{cable_name} {core_area} sq mm {voltage}",
                        category="Electrical Cables",
                        material=conductor,
                        grade="IEC 60502",
                        specifications=f"{core_area} sq mm; rated voltage {voltage}; insulated cable",
                        canonical_unit="metre",
                    )
                )

    # 40 bearings: series and bore size are near-neighbour identifiers.
    for bearing_type in ("Deep Groove Ball Bearing", "Taper Roller Bearing", "Spherical Roller Bearing", "Needle Roller Bearing"):
        for bore in (20, 25, 30, 35, 40):
            for clearance in ("Normal", "C3"):
                series = {"Deep Groove Ball Bearing": "62", "Taper Roller Bearing": "32", "Spherical Roller Bearing": "22", "Needle Roller Bearing": "NA"}[bearing_type]
                materials.append(
                    CanonicalMaterial(
                        standard_material_id=f"SYN-CAN-{len(materials) + 1:03d}",
                        standard_code=f"SYN-BRG-{series}-{bore}-{clearance}",
                        canonical_name=f"{bearing_type} Series {series} Bore {bore} mm {clearance} Clearance",
                        category="Bearings",
                        material="Chrome Steel",
                        grade="ISO 15",
                        specifications=f"Series {series}; bore {bore} mm; radial clearance {clearance}",
                        canonical_unit="each",
                    )
                )

    # 40 gaskets: nominal diameter and pressure class remain meaningful compatibility constraints.
    for gasket_material in ("Graphite", "PTFE", "Spiral Wound SS316", "CAF"):
        for nominal_diameter in (15, 25, 40, 50, 80):
            for pressure_class in (150, 300):
                code_material = gasket_material.replace(" ", "").replace("316", "")[:5].upper()
                materials.append(
                    CanonicalMaterial(
                        standard_material_id=f"SYN-CAN-{len(materials) + 1:03d}",
                        standard_code=f"SYN-GSK-{code_material}-DN{nominal_diameter}-CL{pressure_class}",
                        canonical_name=(
                            f"{gasket_material} Flange Gasket DN {nominal_diameter} Class {pressure_class}"
                        ),
                        category="Sealing",
                        material=gasket_material,
                        grade="ASME B16.20",
                        specifications=f"DN {nominal_diameter}; Class {pressure_class}; raised-face flange gasket",
                        canonical_unit="each",
                    )
                )

    assert len(materials) == 200
    return materials


def make_description(material: CanonicalMaterial, variant: int, rng: random.Random) -> tuple[str, str, str]:
    """Return a local description, variation label, and local unit for one source record."""
    if material.category == "Fasteners":
        size = material.specifications.split("; ")[1].replace("thread ", "")
        length = material.specifications.split("; ")[2].replace("length ", "")
        if variant == 0:
            return material.canonical_name, "canonical_case", "each"
        if variant == 1:
            return f"HEX BOLT {size} X {length.replace(' mm', 'MM')} CL {material.grade}", "abbreviation_capitalization", "nos"
        if variant == 2:
            return f"bolt, hex-head; {length}; {size}; grade-{material.grade}", "punctuation_reordered", "No."
        if variant == 3:
            return f"{material.grade} property class carbon steel hexagonal screw {size} {length}", "equivalent_terminology", "each"
        return f"Hex bolt {size} length {length}; verify grade {material.grade}", "near_duplicate_dimension", "pcs"

    if material.category == "Piping Valves":
        valve_type, _, tail = material.canonical_name.partition(" Valve")
        dn = material.specifications.split("; ")[1]
        pressure = material.specifications.split("; ")[2]
        if variant == 0:
            return material.canonical_name, "canonical_case", "each"
        if variant == 1:
            return f"{valve_type.upper()} VLV {dn.upper()} {pressure.upper()} RF FLG", "abbreviation_capitalization", "nos"
        if variant == 2:
            return f"valve; {pressure}; RF flange; {dn}; {valve_type.lower()}", "punctuation_reordered", "No."
        if variant == 3:
            return f"ASME B16.34 {valve_type.lower()} type, raised-face flanged, {dn}, {pressure}", "equivalent_terminology", "each"
        return f"{valve_type} valve {dn} RF; pressure rating {pressure}", "near_duplicate_pressure_class", "pcs"

    if material.category == "Electrical Cables":
        core_area, voltage, _ = material.specifications.split("; ")
        if variant == 0:
            return material.canonical_name, "canonical_case", "metre"
        if variant == 1:
            return f"{material.material.upper()} {core_area.replace(' sq mm', ' SQMM')} {voltage.upper()} CBL", "abbreviation_capitalization", "mtr"
        if variant == 2:
            return f"cable, {voltage}; {core_area}; {material.material.lower()} conductor", "punctuation_reordered", "M"
        if variant == 3:
            return f"{core_area} square millimetre {material.material.lower()} conductor insulated cable rated {voltage}", "equivalent_terminology", "metres"
        return f"{material.material} cable {core_area}, voltage rating {voltage}", "near_duplicate_voltage", "meter"

    if material.category == "Bearings":
        series, bore, clearance = material.specifications.split("; ")
        bearing_type = material.canonical_name.split(" Series")[0]
        if variant == 0:
            return material.canonical_name, "canonical_case", "each"
        if variant == 1:
            return f"{bearing_type.upper()} {series.upper().replace('SERIES ', 'SER. ')} {bore.upper().replace('BORE ', 'B')} {clearance.upper()}", "abbreviation_capitalization", "nos"
        if variant == 2:
            return f"bearing; {clearance}; {bore}; {series}; {bearing_type.lower()}", "punctuation_reordered", "No."
        if variant == 3:
            return f"{bearing_type.lower()} with {clearance} radial clearance, {series}, {bore}", "equivalent_terminology", "each"
        return f"{bearing_type} {series}, {bore}, clearance {clearance}", "near_duplicate_bore", "pcs"

    gasket_material = material.material
    dn, pressure, _ = material.specifications.split("; ")
    if variant == 0:
        return material.canonical_name, "canonical_case", "each"
    if variant == 1:
        return f"{gasket_material.upper()} GSKT {dn.upper()} {pressure.upper()} RF", "abbreviation_capitalization", "nos"
    if variant == 2:
        return f"gasket; {pressure}; {dn}; {gasket_material.lower()} flange", "punctuation_reordered", "No."
    if variant == 3:
        return f"raised-face flange sealing ring, {gasket_material}, {dn}, pressure {pressure}", "equivalent_terminology", "each"
    return f"{gasket_material} flange gasket {dn}; {pressure} rating", "near_duplicate_nominal_size", "pcs"


def choose_hard_negative(index: int, materials: list[CanonicalMaterial]) -> CanonicalMaterial:
    """Select a close same-family but non-equivalent material as a known distractor."""
    source = materials[index]
    same_category = [
        item
        for item in materials
        if item.category == source.category and item.standard_material_id != source.standard_material_id
    ]
    same_material = [item for item in same_category if item.material == source.material]
    return same_material[(index + 1) % len(same_material)]


def build_material_records(materials: list[CanonicalMaterial]) -> list[MaterialRecord]:
    """Create five controlled local-description variants for each canonical identity."""
    rng = random.Random(SEED)
    records: list[MaterialRecord] = []
    manufacturers = ("DemoForge Industries", "Synthetic Process Systems", "Prototype Engineering Supply")

    for material_index, material in enumerate(materials):
        hard_negative = choose_hard_negative(material_index, materials)
        for variant in range(RECORDS_PER_CANONICAL):
            description, variant_name, unit = make_description(material, variant, rng)
            record_number = len(records) + 1
            records.append(
                MaterialRecord(
                    record_id=f"SYN-REC-{record_number:04d}",
                    cpse_name=DEMO_ORGANISATIONS[(material_index + variant) % len(DEMO_ORGANISATIONS)],
                    local_material_code=f"{material.standard_code.replace('SYN-', 'LOC-')}-{variant + 1}",
                    description=description,
                    category=material.category,
                    supplied_unit=unit,
                    manufacturer=manufacturers[rng.randrange(len(manufacturers))],
                    part_number=f"DEMO-PN-{material_index + 1:03d}-{variant + 1}",
                    ground_truth_standard_material_id=material.standard_material_id,
                    ground_truth_standard_code=material.standard_code,
                    description_variant=variant_name,
                    hard_negative_standard_material_id=hard_negative.standard_material_id,
                    hard_negative_reason=(
                        "Same material family/category but differing technical specification; not equivalent."
                    ),
                )
            )
    assert len(records) == 1000
    return records


def write_csv(path: Path, rows: list[CanonicalMaterial] | list[MaterialRecord]) -> None:
    """Write UTF-8 CSV with a stable column order defined by the dataclass."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=list(asdict(rows[0]).keys()))
        writer.writeheader()
        writer.writerows(asdict(row) for row in rows)


def main() -> None:
    """Generate the canonical catalogue and source-record evaluation fixture."""
    materials = build_canonical_materials()
    records = build_material_records(materials)
    write_csv(OUTPUT_DIRECTORY / "canonical_materials.csv", materials)
    write_csv(OUTPUT_DIRECTORY / "material_records.csv", records)
    print(f"Generated {len(materials)} canonical materials and {len(records)} source records using seed {SEED}.")


if __name__ == "__main__":
    main()

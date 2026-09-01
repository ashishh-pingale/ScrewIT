"""Regression checks for deterministic synthetic demo dataset generation."""

import importlib.util
from pathlib import Path
import sys


def load_generator_module():
    """Load the standard-library dataset generator without adding a package dependency."""
    generator_path = Path(__file__).resolve().parents[3] / "scripts" / "generate_demo_dataset.py"
    spec = importlib.util.spec_from_file_location("generate_demo_dataset", generator_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_demo_dataset_has_expected_ground_truth_and_counts() -> None:
    generator = load_generator_module()

    canonical_materials = generator.build_canonical_materials()
    records = generator.build_material_records(canonical_materials)

    canonical_ids = {material.standard_material_id for material in canonical_materials}
    assert len(canonical_materials) == 200
    assert len(records) == 1000
    assert {record.ground_truth_standard_material_id for record in records} == canonical_ids
    assert all(record.synthetic_data_notice == "SYNTHETIC_DEMO_DATA_ONLY" for record in records)
    assert all(
        record.ground_truth_standard_material_id != record.hard_negative_standard_material_id
        for record in records
    )


def test_demo_dataset_generation_is_deterministic() -> None:
    generator = load_generator_module()

    first = generator.build_material_records(generator.build_canonical_materials())
    second = generator.build_material_records(generator.build_canonical_materials())

    assert first == second

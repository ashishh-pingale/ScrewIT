# ScrewIT synthetic demo dataset

`canonical_materials.csv` and `material_records.csv` are deterministic, synthetic demonstration and evaluation fixtures. They do not contain, represent, or imply real CPSE procurement, material-master, supplier, or manufacturer data.

The dataset contains 200 fictional canonical material identities and 1,000 fictional local records. Every local record has an explicit ground-truth canonical ID. `hard_negative_standard_material_id` identifies a close, non-equivalent canonical item within the same category; it is an evaluation distractor, not a recommended mapping.

Regenerate the files from the repository root:

```powershell
python scripts/generate_demo_dataset.py
```

The generator uses fixed seed `20260901`; repeated runs produce byte-identical CSV files.

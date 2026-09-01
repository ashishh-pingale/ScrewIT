import { ColumnMapping, ImportSummaryResponse, PreviewResponse } from "../types/ingestion";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export async function uploadPreview(file: File): Promise<PreviewResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/materials/upload-preview`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload for preview.");
  }

  return res.json();
}

export async function importMaterials(
  file: File,
  mapping: ColumnMapping,
  cpseName: string
): Promise<ImportSummaryResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mapping", JSON.stringify(mapping));
  formData.append("cpse_name", cpseName);

  const res = await fetch(`${API_BASE_URL}/materials/import`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to import materials.");
  }

  return res.json();
}

// Types for Material Ingestion

export interface PreviewResponse {
  filename: string;
  headers: string[];
  preview_data: Record<string, string | number>[];
  total_rows: number;
}

export interface ColumnMapping {
  original_code: string;
  description: string;
  category?: string | null;
  unit?: string | null;
  manufacturer?: string | null;
  part_number?: string | null;
}

export interface ImportSummaryResponse {
  records_uploaded: number;
  valid_records: number;
  invalid_records: number;
  duplicates_detected: number;
  records_requiring_review: number;
}

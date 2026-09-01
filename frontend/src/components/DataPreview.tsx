"use client";

import React from "react";
import { PreviewResponse } from "../types/ingestion";

interface DataPreviewProps {
  preview: PreviewResponse;
}

export function DataPreview({ preview }: DataPreviewProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Data Preview</h3>
        <span className="text-sm text-gray-500">Showing {preview.preview_data.length} of {preview.total_rows} rows</span>
      </div>
      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {preview.headers.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {preview.preview_data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {preview.headers.map((h) => (
                  <td key={h} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row[h] !== null && row[h] !== undefined ? String(row[h]) : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

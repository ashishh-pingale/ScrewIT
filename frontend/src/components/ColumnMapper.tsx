"use client";

import React from "react";
import { ColumnMapping } from "../types/ingestion";

interface ColumnMapperProps {
  headers: string[];
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
}

const TARGET_FIELDS = [
  { key: "original_code", label: "Local Material Code (Required)", required: true },
  { key: "description", label: "Material Description (Required)", required: true },
  { key: "category", label: "Category", required: false },
  { key: "unit", label: "Unit", required: false },
  { key: "manufacturer", label: "Manufacturer", required: false },
  { key: "part_number", label: "Part Number", required: false },
] as const;

export function ColumnMapper({ headers, mapping, onChange }: ColumnMapperProps) {
  const handleSelect = (key: keyof ColumnMapping, value: string) => {
    onChange({ ...mapping, [key]: value === "" ? null : value });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Map Columns</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TARGET_FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <select
              className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              value={(mapping[field.key as keyof ColumnMapping] as string) || ""}
              onChange={(e) => handleSelect(field.key as keyof ColumnMapping, e.target.value)}
            >
              <option value="">-- Ignore this field --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

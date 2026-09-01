"use client";

import React, { useCallback } from "react";
import { UploadCloud } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function UploadZone({ onFileSelect, isLoading }: UploadZoneProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isLoading) return;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    },
    [onFileSelect, isLoading]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-center transition-colors ${
        isLoading ? "bg-gray-100 cursor-not-allowed" : "hover:bg-blue-50 cursor-pointer"
      }`}
      onClick={() => !isLoading && document.getElementById("file-upload")?.click()}
    >
      <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
      <p className="text-gray-700 mb-2 font-medium">
        Drag and drop your file here, or click to browse
      </p>
      <p className="text-sm text-gray-500">Supports CSV and XLSX</p>
      <input
        id="file-upload"
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />
    </div>
  );
}

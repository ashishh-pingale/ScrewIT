"use client";

import React, { useState } from "react";
import { UploadZone } from "../src/components/UploadZone";
import { ColumnMapper } from "../src/components/ColumnMapper";
import { DataPreview } from "../src/components/DataPreview";
import { ImportSummary } from "../src/components/ImportSummary";
import { importMaterials, uploadPreview } from "../src/services/api";
import { ColumnMapping, ImportSummaryResponse, PreviewResponse } from "../src/types/ingestion";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [cpseName, setCpseName] = useState("Demo CPSE");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    original_code: "",
    description: "",
  });
  const [summary, setSummary] = useState<ImportSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsLoading(true);
    try {
      const data = await uploadPreview(selectedFile);
      setPreview(data);
      // Auto-map if possible
      setMapping({
        original_code: data.headers.find(h => h.toLowerCase().includes("code")) || "",
        description: data.headers.find(h => h.toLowerCase().includes("desc")) || "",
      });
    } catch (err: any) {
      setError(err.message);
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !mapping.original_code || !mapping.description) {
      setError("Please map the required original_code and description columns.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const data = await importMaterials(file, mapping, cpseName);
      setSummary(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setSummary(null);
    setMapping({ original_code: "", description: "" });
    setError(null);
  };

  if (summary) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <ImportSummary summary={summary} onReset={handleReset} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Material Ingestion</h1>
          <p className="text-gray-600 mb-6">Upload CPSE material masters to standardize and harmonize records.</p>
          
          <div className="mb-6 max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">CPSE Organization Name</label>
            <input 
              type="text" 
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              value={cpseName}
              onChange={(e) => setCpseName(e.target.value)}
            />
          </div>

          {!preview && (
            <UploadZone onFileSelect={handleFileSelect} isLoading={isLoading} />
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
              {error}
            </div>
          )}
        </div>

        {preview && (
          <>
            <ColumnMapper headers={preview.headers} mapping={mapping} onChange={setMapping} />
            
            <div className="flex justify-end space-x-4">
              <button 
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center"
                disabled={isLoading}
              >
                {isLoading ? "Importing..." : "Run Import"}
              </button>
            </div>

            <DataPreview preview={preview} />
          </>
        )}
      </div>
    </main>
  );
}

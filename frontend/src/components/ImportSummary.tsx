"use client";

import React from "react";
import { ImportSummaryResponse } from "../types/ingestion";
import { CheckCircle, AlertTriangle, XCircle, FileText, RefreshCw } from "lucide-react";

interface ImportSummaryProps {
  summary: ImportSummaryResponse;
  onReset: () => void;
}

export function ImportSummary({ summary, onReset }: ImportSummaryProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 text-center max-w-2xl mx-auto">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Import Complete</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 text-left">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
            <FileText className="w-4 h-4 mr-2" /> Rows Processed
          </div>
          <div className="text-2xl font-bold text-gray-900">{summary.records_uploaded}</div>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center text-sm font-medium text-green-600 mb-1">
            <CheckCircle className="w-4 h-4 mr-2" /> Valid Records
          </div>
          <div className="text-2xl font-bold text-green-700">{summary.valid_records}</div>
        </div>
        
        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-center text-sm font-medium text-red-600 mb-1">
            <XCircle className="w-4 h-4 mr-2" /> Invalid Rows
          </div>
          <div className="text-2xl font-bold text-red-700">{summary.invalid_records}</div>
        </div>
        
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="flex items-center text-sm font-medium text-yellow-600 mb-1">
            <AlertTriangle className="w-4 h-4 mr-2" /> Duplicates
          </div>
          <div className="text-2xl font-bold text-yellow-700">{summary.duplicates_detected}</div>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 md:col-span-2">
          <div className="flex items-center text-sm font-medium text-blue-600 mb-1">
            <RefreshCw className="w-4 h-4 mr-2" /> Requires Review
          </div>
          <div className="text-2xl font-bold text-blue-700">{summary.records_requiring_review}</div>
          <p className="text-xs text-blue-500 mt-1">Pending manual harmonization</p>
        </div>
      </div>

      <button
        onClick={onReset}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
      >
        Upload Another File
      </button>
    </div>
  );
}

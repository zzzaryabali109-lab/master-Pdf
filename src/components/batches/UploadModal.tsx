import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog';
import { Button } from '@/components/arc/button/button';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { uploadBatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    type: string;
    containerCount: number;
    validRows: number;
    errorCount: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectSimulatedFile = (name = 'IMPORT_MANIFEST_300_NEW.xlsx', size = '1.68 MB', count = 300) => {
    setSelectedFile({
      name,
      size,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      containerCount: count,
      validRows: count,
      errorCount: 0,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      handleSelectSimulatedFile(file.name, sizeMB, 300);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      handleSelectSimulatedFile(file.name, sizeMB, 300);
    } else {
      handleSelectSimulatedFile('DROPPED_MANIFEST_SHEET.xlsx', '1.45 MB', 300);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    // Simulate brief processing
    setTimeout(async () => {
      await uploadBatch({
        name: selectedFile.name,
        size: selectedFile.size,
        count: selectedFile.containerCount,
      });
      setIsProcessing(false);
      setSelectedFile(null);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        title="Upload Import Excel"
        description="Select or drop your container import manifest (.xlsx or .csv)"
        className="max-w-lg"
      >
        <div className="space-y-4 py-2">
          {!selectedFile ? (
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-black bg-neutral-50 scale-[0.99]'
                  : 'border-neutral-200 hover:border-neutral-400 bg-white'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-800">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-neutral-900">
                Drag & Drop Excel File
              </h4>
              <p className="text-xs text-neutral-500 mt-1 mb-3">
                or <span className="font-semibold text-black underline">Browse File</span> from your computer
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 rounded-full border border-neutral-200 text-[11px] text-neutral-500">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Supports .xlsx, .xls, .csv manifests up to 25 MB
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleSelectSimulatedFile('SAMPLE_Q4_300_IMPORT.xlsx', '1.42 MB', 300);
                  }}
                  className="text-xs text-neutral-500 hover:text-black hover:underline"
                >
                  Load 300-Container Sample Sheet &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-xl p-4 bg-white space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 font-mono">
                      {selectedFile.name}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      {selectedFile.size} &bull; Excel Worksheet
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-neutral-400 hover:text-neutral-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Validation Feedback Box */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-neutral-600">Validation Status</span>
                  <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% Passed
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-200/60 text-center">
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase">Rows Found</div>
                    <div className="font-semibold text-neutral-900">{selectedFile.containerCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase">Valid Keys</div>
                    <div className="font-semibold text-emerald-700">{selectedFile.validRows}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase">Conflicts</div>
                    <div className="font-semibold text-neutral-900">{selectedFile.errorCount}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
            <Button
              size="sm"
              variant="secondary"
              onClick={onClose}
              disabled={isProcessing}
              className="text-xs border border-neutral-200"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!selectedFile || isProcessing}
              loading={isProcessing}
              onClick={handleProcess}
              className="text-xs bg-black text-white hover:bg-neutral-800"
            >
              Upload & Process
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

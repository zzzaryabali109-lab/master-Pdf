import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/arc/button/button';
import { Badge } from '@/components/arc/badge/badge';
import {
  FileSpreadsheet,
  Upload,
  Eye,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import { UploadModal } from './UploadModal';
import { ExcelPreviewModal } from './ExcelPreviewModal';

export const BatchesView: React.FC = () => {
  const { batches, setCurrentPage, inspectBatchId, setInspectBatchId } = useApp();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-100">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Import Batches
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Upload and manage your import container sheets.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          className="text-xs h-8 bg-black text-white hover:bg-neutral-800"
          onClick={() => setIsUploadModalOpen(true)}
        >
          <Upload className="w-3.5 h-3.5 mr-1" />
          Upload Excel
        </Button>
      </div>

      {/* Batch Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Total Manifests
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            {batches.length} Batches
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Active import archives
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Manifest Units
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            {batches.reduce((sum, b) => sum + b.totalContainers, 0)} Containers
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Processed via batch parser
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Parsing Engine
          </div>
          <div className="text-2xl font-bold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            100% Verified
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Auto-checks ISO-6346 checksums
          </div>
        </div>
      </div>

      {/* Batch Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">Import Batch List</h3>
          <span className="text-xs text-neutral-500">
            Showing all ingested Excel workbooks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50/80 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-100">
              <tr>
                <th className="py-2.5 px-4">File</th>
                <th className="py-2.5 px-4">Upload Date</th>
                <th className="py-2.5 px-4 text-right">Containers</th>
                <th className="py-2.5 px-4 text-right">Allocated</th>
                <th className="py-2.5 px-4 text-right">Available</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {batches.map(batch => (
                <tr key={batch.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900 font-mono text-[11px]">
                          {batch.fileName}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {batch.fileSize} &bull; By {batch.uploadedBy}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-neutral-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{batch.uploadDate}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-neutral-900 font-mono">
                    {batch.totalContainers}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-neutral-800 font-mono">
                    {batch.allocatedCount}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700 font-mono">
                    {batch.availableCount}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge size="sm" tone="success">
                      {batch.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setInspectBatchId(batch.id)}
                        className="h-7 px-2 text-[11px] border border-neutral-200"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setCurrentPage('allocate')}
                        className="h-7 px-2 text-[11px] bg-black text-white hover:bg-neutral-800"
                      >
                        <ArrowRightLeft className="w-3 h-3 mr-1" />
                        Allocate
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Excel Preview Modal */}
      <ExcelPreviewModal
        batchId={inspectBatchId}
        onClose={() => setInspectBatchId(null)}
      />
    </div>
  );
};

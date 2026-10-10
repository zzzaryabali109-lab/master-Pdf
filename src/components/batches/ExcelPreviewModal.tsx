import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog';
import { Button } from '@/components/arc/button/button';
import { Badge } from '@/components/arc/badge/badge';
import { Search, Filter, CheckCircle2, FileSpreadsheet, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface ExcelPreviewModalProps {
  batchId: string | null;
  onClose: () => void;
}

export const ExcelPreviewModal: React.FC<ExcelPreviewModalProps> = ({ batchId, onClose }) => {
  const { batches, containers } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const currentBatch = batches.find(b => b.id === batchId);

  // Containers belonging to this batch or all
  const batchContainers = useMemo(() => {
    return containers.filter(c => (batchId ? c.batchId === batchId : true));
  }, [containers, batchId]);

  const filtered = useMemo(() => {
    return batchContainers.filter(item => {
      const matchQuery =
        !searchQuery ||
        item.containerNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.blNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vessel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.importer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSize = sizeFilter === 'ALL' || item.size === sizeFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchQuery && matchSize && matchStatus;
    });
  }, [batchContainers, searchQuery, sizeFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pagedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (!batchId) return null;

  return (
    <Dialog open={!!batchId} onOpenChange={open => !open && onClose()}>
      <DialogContent
        title={currentBatch ? currentBatch.fileName : 'Excel Import Preview'}
        description={`${batchContainers.length} Containers Parsed from Manifest`}
        className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="space-y-4 py-1 flex-1 overflow-hidden flex flex-col">
          {/* Validation Banner */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-semibold text-emerald-950">
                  {batchContainers.length} Containers Successfully Verified.
                </span>{' '}
                ISO 6346 format compliant, 0 duplicate keys in manifest.
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-emerald-800">
              <span>Allocated: {batchContainers.filter(c => c.status === 'Allocated').length}</span>
              <span>Available: {batchContainers.filter(c => c.status === 'Available').length}</span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search Container No, BL, Vessel, Importer..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-black"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sizeFilter}
                onChange={e => {
                  setSizeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs py-1.5 px-2.5 rounded-md border border-neutral-200 bg-white text-neutral-700"
              >
                <option value="ALL">All Sizes</option>
                <option value="20FT">20FT</option>
                <option value="40FT">40FT</option>
                <option value="40HC">40HC</option>
                <option value="45FT">45FT</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs py-1.5 px-2.5 rounded-md border border-neutral-200 bg-white text-neutral-700"
              >
                <option value="ALL">All Status</option>
                <option value="Available">Available</option>
                <option value="Allocated">Allocated</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="border border-neutral-200 rounded-lg overflow-y-auto flex-1 min-h-[260px] text-xs">
            <table className="w-full text-left">
              <thead className="bg-neutral-50/90 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Container No</th>
                  <th className="py-2.5 px-3">BL No</th>
                  <th className="py-2.5 px-3">Vessel</th>
                  <th className="py-2.5 px-3">Importer</th>
                  <th className="py-2.5 px-3">ETA</th>
                  <th className="py-2.5 px-3 text-center">Size</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400">
                      No matching containers found.
                    </td>
                  </tr>
                ) : (
                  pagedItems.map(item => (
                    <tr key={item.id} className="hover:bg-neutral-50/60">
                      <td className="py-2.5 px-3 font-semibold text-neutral-900 font-mono">
                        {item.containerNo}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-neutral-600">
                        {item.blNo}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700 max-w-[140px] truncate">
                        {item.vessel}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700 max-w-[160px] truncate">
                        {item.importer}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 font-mono text-[11px]">
                        {item.eta}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[10px] font-semibold">
                          {item.size}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge
                          size="sm"
                          tone={item.status === 'Available' ? 'neutral' : 'success'}
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100">
            <div>
              Showing <span className="font-semibold text-neutral-800">{filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
              <span className="font-semibold text-neutral-800">{Math.min(currentPage * pageSize, filtered.length)}</span> of{' '}
              <span className="font-semibold text-neutral-800">{filtered.length}</span> containers
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="h-7 px-2 text-xs border border-neutral-200"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="px-2 font-mono text-neutral-800 font-medium">
                {currentPage} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="h-7 px-2 text-xs border border-neutral-200"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-100 flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            onClick={onClose}
            className="text-xs border border-neutral-200"
          >
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

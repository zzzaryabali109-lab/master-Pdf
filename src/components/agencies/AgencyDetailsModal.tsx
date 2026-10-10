import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog';
import { Button } from '@/components/arc/button/button';
import { Badge } from '@/components/arc/badge/badge';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Boxes,
  Download,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AgencyDetailsModalProps {
  agencyId: string | null;
  onClose: () => void;
  onOpenExport: (agencyId: string) => void;
}

export const AgencyDetailsModal: React.FC<AgencyDetailsModalProps> = ({
  agencyId,
  onClose,
  onOpenExport,
}) => {
  const { agencies, containers } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const agency = agencies.find(a => a.id === agencyId);

  const assignedContainers = useMemo(() => {
    if (!agencyId) return [];
    return containers.filter(c => c.agencyId === agencyId);
  }, [containers, agencyId]);

  const filteredContainers = useMemo(() => {
    return assignedContainers.filter(
      c =>
        !searchQuery ||
        c.containerNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.blNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.vessel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.importer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assignedContainers, searchQuery]);

  const totalPages = Math.ceil(filteredContainers.length / pageSize) || 1;
  const pagedItems = filteredContainers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (!agencyId || !agency) return null;

  return (
    <Dialog open={!!agencyId} onOpenChange={open => !open && onClose()}>
      <DialogContent
        title={agency.name}
        description={`Clearing Agency Profile & Container Portfolio (${assignedContainers.length} Allocated)`}
        className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="space-y-4 py-1 flex-1 overflow-hidden flex flex-col text-xs">
          {/* Agency Information Card */}
          <div className="bg-neutral-50 rounded-xl border border-neutral-200/80 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-neutral-900 text-white font-bold flex items-center justify-center text-xs">
                  {agency.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">{agency.name}</h4>
                  <span className="text-[11px] text-neutral-500">Contact: {agency.contactPerson}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge size="sm" tone={agency.status === 'Active' ? 'success' : 'neutral'}>
                  {agency.status}
                </Badge>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onOpenExport(agency.id)}
                  className="h-7 text-[11px] bg-black text-white hover:bg-neutral-800"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export Excel
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <span className="text-neutral-400 block font-medium uppercase text-[10px]">Total Allocated</span>
                <span className="font-bold font-mono text-neutral-900 text-sm">
                  {assignedContainers.length} containers
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block font-medium uppercase text-[10px]">Last Allocation</span>
                <span className="font-medium text-neutral-800">{agency.lastAllocation}</span>
              </div>
              <div>
                <span className="text-neutral-400 block font-medium uppercase text-[10px]">Phone</span>
                <span className="font-medium text-neutral-800 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-neutral-400" />
                  {agency.phone}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block font-medium uppercase text-[10px]">Email</span>
                <span className="font-medium text-neutral-800 flex items-center gap-1 truncate" title={agency.email}>
                  <Mail className="w-3 h-3 text-neutral-400" />
                  {agency.email}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 pt-1">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>{agency.address}</span>
            </div>
          </div>

          {/* Assigned Containers Section */}
          <div className="flex-1 overflow-hidden flex flex-col space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Assigned Containers ({assignedContainers.length})
              </h4>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filter containers..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full text-xs pl-8 pr-2.5 py-1 rounded-md border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-black"
                />
              </div>
            </div>

            {/* Containers Table */}
            <div className="border border-neutral-200 rounded-lg overflow-y-auto flex-1 min-h-[220px]">
              <table className="w-full text-left">
                <thead className="bg-neutral-50/90 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200 sticky top-0 z-10 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Container No</th>
                    <th className="py-2 px-3">BL No</th>
                    <th className="py-2 px-3">Vessel</th>
                    <th className="py-2 px-3">Importer</th>
                    <th className="py-2 px-3">ETA</th>
                    <th className="py-2 px-3 text-center">Size</th>
                    <th className="py-2 px-3">Allocated Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {pagedItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-neutral-400">
                        {assignedContainers.length === 0
                          ? 'No containers assigned to this agency yet.'
                          : 'No containers matching search filter.'}
                      </td>
                    </tr>
                  ) : (
                    pagedItems.map(c => (
                      <tr key={c.id} className="hover:bg-neutral-50/60">
                        <td className="py-2.5 px-3 font-mono font-semibold text-neutral-900">
                          {c.containerNo}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-600">
                          {c.blNo}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-700 max-w-[130px] truncate">
                          {c.vessel}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-700 max-w-[150px] truncate">
                          {c.importer}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-600">
                          {c.eta}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-neutral-100 font-semibold text-[10px]">
                            {c.size}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-neutral-500 text-[11px]">
                          {c.allocatedAt || '2026-10-05 14:32'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredContainers.length > pageSize && (
              <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-100">
                <div>
                  Showing {Math.min(currentPage * pageSize, filteredContainers.length)} of {filteredContainers.length} units
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="h-6 px-2 text-xs border border-neutral-200"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <span className="px-2 font-mono text-neutral-800 font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="h-6 px-2 text-xs border border-neutral-200"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-neutral-100 flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={onClose}
              className="text-xs border border-neutral-200"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

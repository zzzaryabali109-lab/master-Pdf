import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog';
import { Button } from '@/components/arc/button/button';
import { Badge } from '@/components/arc/badge/badge';
import {
  Calendar,
  Building2,
  Boxes,
  User,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

interface AllocationDetailsModalProps {
  allocationId: string | null;
  onClose: () => void;
}

export const AllocationDetailsModal: React.FC<AllocationDetailsModalProps> = ({
  allocationId,
  onClose,
}) => {
  const { allocations, containers } = useApp();

  const allocation = allocations.find(a => a.id === allocationId);

  const assignedContainers = useMemo(() => {
    if (!allocation) return [];
    return containers.filter(c => allocation.containerIds.includes(c.id));
  }, [allocation, containers]);

  if (!allocationId || !allocation) return null;

  return (
    <Dialog open={!!allocationId} onOpenChange={open => !open && onClose()}>
      <DialogContent
        title={`Allocation Audit: ${allocation.id.toUpperCase()}`}
        description={`${allocation.containerCount} Containers released to ${allocation.agencyName}`}
        className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col text-xs"
      >
        <div className="space-y-4 py-2 flex-1 overflow-hidden flex flex-col">
          {/* Summary Box */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-neutral-400 font-medium uppercase block">Agency</span>
                <span className="font-bold text-neutral-900">{allocation.agencyName}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 font-medium uppercase block">Date & Time</span>
                <span className="font-medium text-neutral-800 font-mono text-[11px]">{allocation.date}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 font-medium uppercase block">Allocated Count</span>
                <span className="font-extrabold text-neutral-900 font-mono text-sm">{allocation.containerCount} units</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 font-medium uppercase block">Authorized By</span>
                <span className="font-medium text-neutral-800">{allocation.user}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between">
              <div className="text-[11px] text-neutral-500">
                <span className="font-medium text-neutral-700">Method:</span>{' '}
                {allocation.method === 'Quantity' ? 'Automated FIFO Quantity Allocation' : 'Manual Manifest Selection'}
              </div>
              <Badge size="sm" tone="success">
                {allocation.status}
              </Badge>
            </div>

            {allocation.notes && (
              <div className="p-2 bg-white rounded border border-neutral-200 text-[11px] text-neutral-600">
                <span className="font-semibold text-neutral-800">Note: </span>
                {allocation.notes}
              </div>
            )}
          </div>

          {/* Assigned Container Units */}
          <div className="flex-1 overflow-hidden flex flex-col space-y-2">
            <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              Allocated Container List ({assignedContainers.length})
            </h4>

            <div className="border border-neutral-200 rounded-lg overflow-y-auto flex-1 min-h-[180px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/90 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Container No</th>
                    <th className="py-2 px-3">BL No</th>
                    <th className="py-2 px-3">Vessel</th>
                    <th className="py-2 px-3">Size</th>
                    <th className="py-2 px-3">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {assignedContainers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-neutral-400">
                        {allocation.containerIds.length} container records locked in system audit.
                      </td>
                    </tr>
                  ) : (
                    assignedContainers.map(c => (
                      <tr key={c.id} className="hover:bg-neutral-50/60">
                        <td className="py-2 px-3 font-mono font-semibold text-neutral-900">
                          {c.containerNo}
                        </td>
                        <td className="py-2 px-3 font-mono text-neutral-600">
                          {c.blNo}
                        </td>
                        <td className="py-2 px-3 text-neutral-700 truncate max-w-[140px]">
                          {c.vessel}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          <span className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-semibold">
                            {c.size}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-neutral-600 text-[11px]">
                          {c.eta}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={onClose}
              className="text-xs border border-neutral-200"
            >
              Close Audit Record
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

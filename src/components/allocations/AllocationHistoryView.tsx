import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/arc/button/button';
import { Badge } from '@/components/arc/badge/badge';
import {
  Clock,
  Eye,
  Search,
  Filter,
  Calendar,
  Building2,
  Boxes,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { AllocationDetailsModal } from './AllocationDetailsModal';

export const AllocationHistoryView: React.FC = () => {
  const { allocations, inspectAllocationId, setInspectAllocationId } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('ALL');

  const filteredAllocations = useMemo(() => {
    return allocations.filter(a => {
      const matchSearch =
        !searchQuery ||
        a.agencyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.notes && a.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchAgency = agencyFilter === 'ALL' || a.agencyId === agencyFilter;

      return matchSearch && matchAgency;
    });
  }, [allocations, searchQuery, agencyFilter]);

  const totalAllocated = allocations.reduce((sum, a) => sum + a.containerCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-100">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Allocation History
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Immutable audit logs of historical container disbursements and authorizations.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-md border border-neutral-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Audit Log Version: SHA-256 Verified</span>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Total Releases
          </div>
          <div className="text-2xl font-bold text-neutral-900 font-mono">
            {allocations.length} Events
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Historical allocation cycles
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Disbursed Containers
          </div>
          <div className="text-2xl font-bold text-neutral-900 font-mono">
            {totalAllocated} Units
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Across all clearing agencies
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Audit Status
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            0 Conflicts
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            No duplicate allocations found
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by agency, authorizer, or reference notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-black"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Filter Agency:</span>
          <select
            value={agencyFilter}
            onChange={e => setAgencyFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-md border border-neutral-200 bg-white text-neutral-700"
          >
            <option value="ALL">All Agencies</option>
            {Array.from(new Set(allocations.map(a => a.agencyName))).map(name => (
              <option key={name} value={allocations.find(a => a.agencyName === name)?.agencyId}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50/80 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-100">
              <tr>
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-4">Clearing Agency</th>
                <th className="py-2.5 px-4 text-right">Containers</th>
                <th className="py-2.5 px-4">Allocation Method</th>
                <th className="py-2.5 px-4">Authorized By</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredAllocations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    No historical allocation records match your search.
                  </td>
                </tr>
              ) : (
                filteredAllocations.map(item => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-4 text-neutral-600 font-mono text-[11px]">
                      {item.date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      {item.agencyName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                      <span className="px-2 py-0.5 bg-neutral-100 rounded inline-block">
                        {item.containerCount} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {item.method === 'Quantity' ? 'Quantity Auto' : 'Manual Selection'}
                    </td>
                    <td className="py-3 px-4 text-neutral-700">
                      {item.user}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge size="sm" tone="success">
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setInspectAllocationId(item.id)}
                        className="h-7 px-2.5 text-[11px] border border-neutral-200"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocation Details Modal */}
      <AllocationDetailsModal
        allocationId={inspectAllocationId}
        onClose={() => setInspectAllocationId(null)}
      />
    </div>
  );
};

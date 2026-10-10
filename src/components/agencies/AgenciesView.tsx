import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/arc/button/button';
import { Badge } from '@/components/arc/badge/badge';
import {
  Building2,
  Plus,
  Eye,
  ArrowRightLeft,
  Download,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Edit2,
} from 'lucide-react';
import { AddAgencyModal } from './AddAgencyModal';
import { AgencyDetailsModal } from './AgencyDetailsModal';
import { ExportColumnsModal } from './ExportColumnsModal';

export const AgenciesView: React.FC = () => {
  const {
    agencies,
    containers,
    setCurrentPage,
    inspectAgencyId,
    setInspectAgencyId,
  } = useApp();

  const [isAddAgencyOpen, setIsAddAgencyOpen] = useState(false);
  const [exportAgencyId, setExportAgencyId] = useState<string | null>(null);

  const totalAllocatedAll = containers.filter(c => c.status === 'Allocated').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-100">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Clearing Agencies
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage clearing partners, performance metrics, and container quotas.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsAddAgencyOpen(true)}
          className="text-xs h-8 bg-black text-white hover:bg-neutral-800"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          + Add Agency
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Active Partners
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            {agencies.filter(a => a.status === 'Active').length} Clearing Houses
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Registered with port authority
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Total Distributed
          </div>
          <div className="text-2xl font-bold text-neutral-900 font-mono">
            {totalAllocatedAll} Containers
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Across active agency allocations
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Average Allocation
          </div>
          <div className="text-2xl font-bold text-neutral-900 font-mono">
            {agencies.length > 0 ? Math.round(totalAllocatedAll / agencies.length) : 0} units
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Per clearing house partner
          </div>
        </div>
      </div>

      {/* Agencies Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">Partner Clearing Agencies</h3>
          <span className="text-xs text-neutral-500">
            {agencies.length} registered partners
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50/80 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-100">
              <tr>
                <th className="py-2.5 px-4">Agency</th>
                <th className="py-2.5 px-4">Primary Contact</th>
                <th className="py-2.5 px-4 text-right">Allocated Containers</th>
                <th className="py-2.5 px-4">Last Allocation</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {agencies.map(agency => (
                <tr key={agency.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center font-bold text-neutral-700 text-xs shrink-0">
                        {agency.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900">
                          {agency.name}
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate max-w-[200px]">
                          {agency.address}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-neutral-800">
                      {agency.contactPerson}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {agency.phone} &bull; {agency.email}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                    <span className="px-2 py-0.5 rounded bg-neutral-100 inline-block">
                      {agency.allocatedCount} units
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-600 font-mono text-[11px]">
                    {agency.lastAllocation}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      size="sm"
                      tone={agency.status === 'Active' ? 'success' : 'neutral'}
                    >
                      {agency.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setInspectAgencyId(agency.id)}
                        className="h-7 px-2 text-[11px] border border-neutral-200"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setExportAgencyId(agency.id)}
                        className="h-7 px-2 text-[11px] border border-neutral-200"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export
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

      {/* Add Agency Modal */}
      <AddAgencyModal
        isOpen={isAddAgencyOpen}
        onClose={() => setIsAddAgencyOpen(false)}
      />

      {/* Agency Details Modal */}
      <AgencyDetailsModal
        agencyId={inspectAgencyId}
        onClose={() => setInspectAgencyId(null)}
        onOpenExport={id => setExportAgencyId(id)}
      />

      {/* Export Columns Modal */}
      <ExportColumnsModal
        agencyId={exportAgencyId}
        onClose={() => setExportAgencyId(null)}
      />
    </div>
  );
};

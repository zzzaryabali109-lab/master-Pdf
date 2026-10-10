import React from 'react';
import { useApp } from '../../context/AppContext';
import { MetricCard } from '@/components/arc/metric-card/metric-card';
import { Progress } from '@/components/arc/progress/progress';
import { Badge } from '@/components/arc/badge/badge';
import { Button } from '@/components/arc/button/button';
import {
  Boxes,
  CheckCircle2,
  PackageOpen,
  Building2,
  ArrowRight,
  Eye,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    containers,
    agencies,
    allocations,
    setCurrentPage,
    setInspectAllocationId,
    setInspectAgencyId,
  } = useApp();

  const totalContainers = containers.length;
  const allocatedContainers = containers.filter(c => c.status === 'Allocated').length;
  const availableContainers = totalContainers - allocatedContainers;
  const agencyCount = agencies.length;

  const allocatedPercentage = totalContainers > 0
    ? Math.round((allocatedContainers / totalContainers) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-100">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Container Allocation
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Monitor imports, allocations and clearing agency assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="text-xs h-8 border border-neutral-200"
            onClick={() => setCurrentPage('batches')}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-neutral-600" />
            View Import Batches
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="text-xs h-8 bg-black text-white hover:bg-neutral-800"
            onClick={() => setCurrentPage('allocate')}
          >
            Start Allocation
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* 4 Summary Cards using UIARC MetricCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Containers</span>
            <Boxes className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-neutral-900 mb-1">
            {totalContainers}
          </div>
          <div className="text-[11px] text-neutral-500 flex items-center gap-1">
            <span className="font-medium text-neutral-700">100%</span> active import manifests
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Allocated</span>
            <CheckCircle2 className="w-4 h-4 text-neutral-800" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-neutral-900 mb-1">
            {allocatedContainers}
          </div>
          <div className="text-[11px] text-neutral-500 flex items-center justify-between">
            <span>{allocatedPercentage}% of total stock</span>
            <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Assigned
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Available</span>
            <PackageOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-emerald-700 mb-1">
            {availableContainers}
          </div>
          <div className="text-[11px] text-neutral-500 flex items-center justify-between">
            <span>{100 - allocatedPercentage}% ready for allocation</span>
            <span className="text-neutral-700 font-semibold text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded">
              Unassigned
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Agencies</span>
            <Building2 className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-neutral-900 mb-1">
            {agencyCount}
          </div>
          <div className="text-[11px] text-neutral-500 flex items-center justify-between">
            <span>Clearing partners active</span>
            <button
              onClick={() => setCurrentPage('agencies')}
              className="text-neutral-900 font-medium hover:underline text-[11px]"
            >
              Manage &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Agency Overview & Inventory Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agency Allocation Overview (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Agency Allocation Overview
              </h3>
              <p className="text-xs text-neutral-500">
                Quota distribution and assignment percentages per clearing house.
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-neutral-600 hover:text-black"
              onClick={() => setCurrentPage('agencies')}
            >
              View All Agencies
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50/80 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-100">
                <tr>
                  <th className="py-2.5 px-4">Agency</th>
                  <th className="py-2.5 px-4 text-right">Containers</th>
                  <th className="py-2.5 px-4">Distribution Progress</th>
                  <th className="py-2.5 px-4 text-right">Percentage</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-normal">
                {agencies.map(agency => {
                  const pct = totalContainers > 0
                    ? Math.round((agency.allocatedCount / totalContainers) * 100)
                    : 0;

                  return (
                    <tr key={agency.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-neutral-900">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-neutral-100 flex items-center justify-center font-semibold text-[10px] text-neutral-700">
                            {agency.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{agency.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-neutral-900">
                        {agency.allocatedCount}
                      </td>
                      <td className="py-3 px-4 min-w-[130px]">
                        <Progress value={pct} max={100} className="h-1.5" />
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-neutral-600">
                        {pct}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          size="sm"
                          tone={agency.allocatedCount > 0 ? 'success' : 'neutral'}
                        >
                          {agency.allocatedCount > 0 ? 'Allocated' : 'Available'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setInspectAgencyId(agency.id)}
                          className="text-neutral-500 hover:text-black font-medium text-xs inline-flex items-center gap-1 hover:underline"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manifest Inventory Summary Box */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-900">Inventory Status</h3>
              <span className="text-[11px] font-medium text-neutral-500">Live Manifest</span>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-neutral-600 font-medium">Allocation Completion</span>
                  <span className="font-semibold text-neutral-900">{allocatedPercentage}%</span>
                </div>
                <Progress value={allocatedPercentage} max={100} className="h-2" />
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-neutral-50 rounded border border-neutral-100">
                  <span className="text-neutral-600">Total Manifest Rows</span>
                  <span className="font-semibold text-neutral-900">{totalContainers}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-neutral-50 rounded border border-neutral-100">
                  <span className="text-neutral-600">Assigned Units</span>
                  <span className="font-semibold text-neutral-900">{allocatedContainers}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-emerald-50/50 rounded border border-emerald-100 text-emerald-950">
                  <span className="font-medium text-emerald-800">Unallocated Balance</span>
                  <span className="font-bold text-emerald-700">{availableContainers}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100">
            <Button
              size="sm"
              variant="primary"
              className="w-full bg-black text-white hover:bg-neutral-800 text-xs h-9"
              onClick={() => setCurrentPage('allocate')}
            >
              Allocate Remaining Containers ({availableContainers})
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Allocations Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Recent Allocations</h3>
            <p className="text-xs text-neutral-500">
              Audit trails of latest clearing house container releases.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="text-xs border border-neutral-200"
            onClick={() => setCurrentPage('history')}
          >
            View Full Audit Log
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50/80 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-100">
              <tr>
                <th className="py-2.5 px-4">Agency</th>
                <th className="py-2.5 px-4 text-right">Containers</th>
                <th className="py-2.5 px-4">Allocation Date</th>
                <th className="py-2.5 px-4">Authorized By</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {allocations.slice(0, 5).map(alloc => (
                <tr key={alloc.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-neutral-900">
                    {alloc.agencyName}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-neutral-900">
                    <span className="inline-block px-2 py-0.5 bg-neutral-100 rounded text-neutral-800 font-semibold">
                      {alloc.containerCount} units
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-600">
                    {alloc.date}
                  </td>
                  <td className="py-3 px-4 text-neutral-600">
                    {alloc.user}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge size="sm" tone="success">
                      {alloc.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setInspectAllocationId(alloc.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-black hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

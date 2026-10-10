import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/arc/button/button';
import { Badge } from '@/components/arc/badge/badge';
import {
  Search,
  Filter,
  Download,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Building2,
  Layers,
} from 'lucide-react';

export const ContainersView: React.FC = () => {
  const { containers, setCurrentPage, setInspectAgencyId, addToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Allocated'>('All');
  const [sizeFilter, setSizeFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPageNum] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    return containers.filter(item => {
      const matchSearch =
        !searchQuery ||
        item.containerNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.blNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vessel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.importer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.agencyName && item.agencyName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === 'All' || item.status === statusFilter;

      const matchSize = sizeFilter === 'ALL' || item.size === sizeFilter;

      return matchSearch && matchStatus && matchSize;
    });
  }, [containers, searchQuery, statusFilter, sizeFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pagedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportFiltered = () => {
    const headers = 'Container No,BL No,Vessel,Importer,ETA,Size,Weight,Port,Shipping Line,Agency,Status\n';
    const rows = filtered.map(c =>
      [
        c.containerNo,
        c.blNo,
        `"${c.vessel}"`,
        `"${c.importer}"`,
        c.eta,
        c.size,
        c.weight,
        `"${c.port}"`,
        `"${c.shippingLine}"`,
        `"${c.agencyName || 'Unassigned'}"`,
        c.status,
      ].join(',')
    );

    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Containers_Inventory_Export_${statusFilter}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast('success', 'Export Generated', `Exported ${filtered.length} container records to CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-100">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Containers
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Master container records with real-time agency allocation verification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportFiltered}
            className="text-xs h-8 border border-neutral-200"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setCurrentPage('allocate')}
            className="text-xs h-8 bg-black text-white hover:bg-neutral-800"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
            Allocate Available
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Pill Filters */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
          {(['All', 'Available', 'Allocated'] as const).map(tab => {
            const count =
              tab === 'All'
                ? containers.length
                : tab === 'Available'
                ? containers.filter(c => c.status === 'Available').length
                : containers.filter(c => c.status === 'Allocated').length;

            const isActive = statusFilter === tab;

            return (
              <button
                key={tab}
                onClick={() => {
                  setStatusFilter(tab);
                  setCurrentPageNum(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-black shadow-xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? tab === 'Available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-200 text-neutral-800'
                      : 'bg-neutral-200/70 text-neutral-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Size Filter */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search Container, BL, Vessel, Agency..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPageNum(1);
              }}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-black"
            />
          </div>

          <select
            value={sizeFilter}
            onChange={e => {
              setSizeFilter(e.target.value);
              setCurrentPageNum(1);
            }}
            className="text-xs py-1.5 px-2.5 rounded-md border border-neutral-200 bg-white text-neutral-700 font-medium"
          >
            <option value="ALL">All Sizes</option>
            <option value="20FT">20FT</option>
            <option value="40FT">40FT</option>
            <option value="40HC">40HC</option>
            <option value="45FT">45FT</option>
          </select>
        </div>
      </div>

      {/* Main Containers Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50/80 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-100">
              <tr>
                <th className="py-2.5 px-4">Container No</th>
                <th className="py-2.5 px-4">BL No</th>
                <th className="py-2.5 px-4">Vessel</th>
                <th className="py-2.5 px-4">Importer</th>
                <th className="py-2.5 px-4">ETA</th>
                <th className="py-2.5 px-4 text-center">Size</th>
                <th className="py-2.5 px-4">Clearing Agency</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-400">
                    No containers match the selected filters.
                  </td>
                </tr>
              ) : (
                pagedItems.map(item => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-neutral-900">
                      {item.containerNo}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-600">
                      {item.blNo}
                    </td>
                    <td className="py-3 px-4 text-neutral-700 max-w-[150px] truncate" title={item.vessel}>
                      {item.vessel}
                    </td>
                    <td className="py-3 px-4 text-neutral-700 max-w-[160px] truncate" title={item.importer}>
                      {item.importer}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-600">
                      {item.eta}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 text-[10px] font-semibold">
                        {item.size}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.agencyName ? (
                        <button
                          onClick={() => item.agencyId && setInspectAgencyId(item.agencyId)}
                          className="font-medium text-neutral-900 hover:underline flex items-center gap-1.5"
                        >
                          <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{item.agencyName}</span>
                        </button>
                      ) : (
                        <span className="text-neutral-400 italic">None assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        size="sm"
                        tone={item.status === 'Available' ? 'neutral' : 'success'}
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.status === 'Available' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setCurrentPage('allocate')}
                          className="h-6 px-2 text-[10px] bg-black text-white hover:bg-neutral-800"
                        >
                          Allocate
                        </Button>
                      ) : (
                        <button
                          onClick={() => item.agencyId && setInspectAgencyId(item.agencyId)}
                          className="text-[11px] text-neutral-500 hover:text-black hover:underline"
                        >
                          View Agency
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-3.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <div>
            Showing{' '}
            <span className="font-semibold text-neutral-800">
              {filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-neutral-800">
              {Math.min(currentPage * pageSize, filtered.length)}
            </span>{' '}
            of <span className="font-semibold text-neutral-800">{filtered.length}</span> containers
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))}
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
              onClick={() => setCurrentPageNum(p => Math.min(totalPages, p + 1))}
              className="h-7 px-2 text-xs border border-neutral-200"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

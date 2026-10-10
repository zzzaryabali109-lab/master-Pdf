import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/arc/button/button';
import { Badge } from '@/components/arc/badge/badge';
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog';
import { Alert } from '@/components/arc/alert/alert';
import {
  Building2,
  Plus,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  CheckSquare,
  Square,
  ShieldCheck,
  ArrowRight,
  Info,
  Layers,
  ListFilter,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AddAgencyModal } from '../agencies/AddAgencyModal';

export const AllocateView: React.FC = () => {
  const {
    containers,
    agencies,
    allocateByQuantity,
    allocateBySelection,
    setCurrentPage,
    addToast,
  } = useApp();

  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [allocationMethod, setAllocationMethod] = useState<'quantity' | 'manual'>('quantity');
  const [quantityInput, setQuantityInput] = useState<number>(50);
  const [notesInput, setNotesInput] = useState<string>('');
  const [isAddAgencyOpen, setIsAddAgencyOpen] = useState(false);

  // Manual Selection state
  const [selectedContainerIds, setSelectedContainerIds] = useState<string[]>([]);
  const [manualSearch, setManualSearch] = useState<string>('');
  const [manualSizeFilter, setManualSizeFilter] = useState<string>('ALL');
  const [manualStatusView, setManualStatusView] = useState<'ALL' | 'AVAILABLE_ONLY'>('ALL');
  const [manualPage, setManualPage] = useState<number>(1);
  const pageSize = 10;

  // Confirmation modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableContainers = useMemo(
    () => containers.filter(c => c.status === 'Available'),
    [containers]
  );
  const availableCount = availableContainers.length;

  const activeAgency = agencies.find(a => a.id === selectedAgencyId);

  // Manual selection filtered list
  const filteredManualContainers = useMemo(() => {
    return containers.filter(c => {
      const matchSearch =
        !manualSearch ||
        c.containerNo.toLowerCase().includes(manualSearch.toLowerCase()) ||
        c.blNo.toLowerCase().includes(manualSearch.toLowerCase()) ||
        c.vessel.toLowerCase().includes(manualSearch.toLowerCase()) ||
        (c.agencyName && c.agencyName.toLowerCase().includes(manualSearch.toLowerCase()));

      const matchSize = manualSizeFilter === 'ALL' || c.size === manualSizeFilter;
      const matchStatus =
        manualStatusView === 'ALL' || c.status === 'Available';

      return matchSearch && matchSize && matchStatus;
    });
  }, [containers, manualSearch, manualSizeFilter, manualStatusView]);

  const totalManualPages = Math.ceil(filteredManualContainers.length / pageSize) || 1;
  const pagedManualContainers = filteredManualContainers.slice(
    (manualPage - 1) * pageSize,
    manualPage * pageSize
  );

  const handleToggleSelectContainer = (containerId: string) => {
    const target = containers.find(c => c.id === containerId);
    if (!target) return;

    // Critical protection
    if (target.status === 'Allocated') {
      addToast(
        'error',
        'Duplicate Allocation Blocked',
        `Container ${target.containerNo} is already allocated to ${target.agencyName || 'another agency'}.`
      );
      return;
    }

    setSelectedContainerIds(prev =>
      prev.includes(containerId)
        ? prev.filter(id => id !== containerId)
        : [...prev, containerId]
    );
  };

  const handleSelectAllVisibleAvailable = () => {
    const visibleAvailableIds = pagedManualContainers
      .filter(c => c.status === 'Available')
      .map(c => c.id);

    const allSelected = visibleAvailableIds.every(id => selectedContainerIds.includes(id));

    if (allSelected) {
      setSelectedContainerIds(prev =>
        prev.filter(id => !visibleAvailableIds.includes(id))
      );
    } else {
      setSelectedContainerIds(prev => [
        ...prev,
        ...visibleAvailableIds.filter(id => !prev.includes(id)),
      ]);
    }
  };

  const handlePreConfirm = () => {
    if (!selectedAgencyId) {
      addToast('warning', 'Agency Required', 'Please select a clearing agency first.');
      return;
    }

    if (allocationMethod === 'quantity') {
      if (quantityInput <= 0) {
        addToast('warning', 'Invalid Quantity', 'Please specify a quantity greater than zero.');
        return;
      }
      if (quantityInput > availableCount) {
        addToast(
          'warning',
          'Insufficient Inventory',
          `Only ${availableCount} containers are currently available.`
        );
        return;
      }
    } else {
      if (selectedContainerIds.length === 0) {
        addToast('warning', 'No Containers Selected', 'Please check at least one available container.');
        return;
      }
    }

    setIsConfirmOpen(true);
  };

  const handleExecuteAllocation = () => {
    if (!selectedAgencyId || !activeAgency) return;
    setIsSubmitting(true);

    setTimeout(() => {
      let result;
      if (allocationMethod === 'quantity') {
        result = allocateByQuantity(selectedAgencyId, quantityInput, notesInput);
      } else {
        result = allocateBySelection(selectedAgencyId, selectedContainerIds, notesInput);
      }

      setIsSubmitting(false);
      setIsConfirmOpen(false);

      if (result.success) {
        setSelectedContainerIds([]);
        setNotesInput('');
      }
    }, 600);
  };

  const finalAllocCount =
    allocationMethod === 'quantity' ? quantityInput : selectedContainerIds.length;
  const remainingCount = Math.max(0, availableCount - finalAllocCount);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-100">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Allocate Containers
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Assign imported inventory to clearing agencies with automated duplicate locks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-md text-xs font-medium text-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Anti-Duplicate Guard Active</span>
          </div>
        </div>
      </div>

      {/* Step 1: Select Agency */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">
              1
            </span>
            <h3 className="text-sm font-semibold text-neutral-900">
              Select Clearing Agency
            </h3>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsAddAgencyOpen(true)}
            className="text-xs h-7 border border-neutral-200"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            + Add New Agency
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Clearing Agency <span className="text-neutral-400">*</span>
            </label>
            <select
              value={selectedAgencyId}
              onChange={e => setSelectedAgencyId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-md border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-black font-medium"
            >
              <option value="">-- Select Agency --</option>
              {agencies.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.allocatedCount} allocated currently)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Agency Contact Person
            </label>
            <div className="text-xs py-2 px-3 rounded-md border border-neutral-100 bg-neutral-50 text-neutral-600 truncate">
              {activeAgency ? `${activeAgency.contactPerson} (${activeAgency.phone})` : 'Select an agency'}
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Choose Allocation Method */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">
            2
          </span>
          <h3 className="text-sm font-semibold text-neutral-900">
            Choose Allocation Method
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Quantity Allocation Option */}
          <div
            onClick={() => setAllocationMethod('quantity')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              allocationMethod === 'quantity'
                ? 'border-black bg-neutral-50/70 shadow-xs'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-neutral-900">
                  Quantity Allocation
                </h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Automatically allocate a specific number of available containers.
                </p>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  allocationMethod === 'quantity'
                    ? 'border-black bg-black'
                    : 'border-neutral-300'
                }`}
              >
                {allocationMethod === 'quantity' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
          </div>

          {/* Manual Selection Option */}
          <div
            onClick={() => setAllocationMethod('manual')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              allocationMethod === 'manual'
                ? 'border-black bg-neutral-50/70 shadow-xs'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-neutral-900">
                  Manual Selection
                </h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Select the exact containers you want to allocate.
                </p>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  allocationMethod === 'manual'
                    ? 'border-black bg-black'
                    : 'border-neutral-300'
                }`}
              >
                {allocationMethod === 'manual' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* METHOD 1: Quantity Allocation Form */}
        {allocationMethod === 'quantity' && (
          <div className="pt-4 border-t border-neutral-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200/80">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Available Containers
                </span>
                <div className="text-3xl font-extrabold text-emerald-700 mt-1 font-mono">
                  {availableCount}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  Eligible for instant automated allocation
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-900 mb-1">
                  Number of Containers
                </label>
                <input
                  type="number"
                  min={1}
                  max={availableCount}
                  value={quantityInput}
                  onChange={e => setQuantityInput(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-bold font-mono py-2.5 px-3 rounded-md border border-neutral-300 bg-white focus:outline-none focus:border-black"
                />
                <div className="flex items-center gap-2 mt-2">
                  {[25, 50, 75, 100].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      disabled={preset > availableCount}
                      onClick={() => setQuantityInput(preset)}
                      className="px-2 py-1 text-[11px] font-medium rounded border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40"
                    >
                      {preset} units
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setQuantityInput(availableCount)}
                    className="px-2 py-1 text-[11px] font-medium rounded border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  >
                    All Available ({availableCount})
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Allocation Reference / Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Q4 Priority Express Clearing - Gate 4"
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-md border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-black"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                size="md"
                variant="primary"
                onClick={handlePreConfirm}
                disabled={!selectedAgencyId || quantityInput <= 0 || quantityInput > availableCount}
                className="bg-black text-white hover:bg-neutral-800 text-xs px-5 h-9"
              >
                Allocate Containers &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* METHOD 2: Manual Selection Form */}
        {allocationMethod === 'manual' && (
          <div className="pt-4 border-t border-neutral-100 space-y-4">
            {/* Top Bar for Manual Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-neutral-900">
                  Selected:{' '}
                  <span className="font-mono text-emerald-800 font-bold px-1.5 py-0.5 bg-emerald-100/80 rounded">
                    {selectedContainerIds.length} containers
                  </span>
                </span>
                <span className="text-neutral-300">|</span>
                <span className="text-xs text-neutral-500">
                  {availableCount} available in stock
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSelectAllVisibleAvailable}
                  className="text-[11px] h-7 px-2.5 border border-neutral-200 bg-white"
                >
                  Select / Deselect Page
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handlePreConfirm}
                  disabled={!selectedAgencyId || selectedContainerIds.length === 0}
                  className="bg-black text-white hover:bg-neutral-800 text-[11px] h-7 px-3"
                >
                  Allocate Selected ({selectedContainerIds.length})
                </Button>
              </div>
            </div>

            {/* Table Filters */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filter container number, vessel, BL..."
                  value={manualSearch}
                  onChange={e => {
                    setManualSearch(e.target.value);
                    setManualPage(1);
                  }}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={manualStatusView}
                  onChange={e => {
                    setManualStatusView(e.target.value as 'ALL' | 'AVAILABLE_ONLY');
                    setManualPage(1);
                  }}
                  className="text-xs py-1.5 px-2.5 rounded-md border border-neutral-200 bg-white text-neutral-700"
                >
                  <option value="ALL">Show All (View Locks)</option>
                  <option value="AVAILABLE_ONLY">Available Only</option>
                </select>

                <select
                  value={manualSizeFilter}
                  onChange={e => {
                    setManualSizeFilter(e.target.value);
                    setManualPage(1);
                  }}
                  className="text-xs py-1.5 px-2.5 rounded-md border border-neutral-200 bg-white text-neutral-700"
                >
                  <option value="ALL">All Sizes</option>
                  <option value="20FT">20FT</option>
                  <option value="40FT">40FT</option>
                  <option value="40HC">40HC</option>
                  <option value="45FT">45FT</option>
                </select>
              </div>
            </div>

            {/* Manual Selection Table */}
            <div className="border border-neutral-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-neutral-50/80 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">Select</th>
                    <th className="py-2.5 px-3">Container No</th>
                    <th className="py-2.5 px-3">BL No</th>
                    <th className="py-2.5 px-3">Vessel</th>
                    <th className="py-2.5 px-3">ETA</th>
                    <th className="py-2.5 px-3 text-center">Size</th>
                    <th className="py-2.5 px-3">Status / Agency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pagedManualContainers.map(item => {
                    const isAllocated = item.status === 'Allocated';
                    const isSelected = selectedContainerIds.includes(item.id);

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isAllocated
                            ? 'bg-neutral-50/80 text-neutral-400 cursor-not-allowed select-none'
                            : isSelected
                            ? 'bg-emerald-50/40 hover:bg-emerald-50/60 cursor-pointer'
                            : 'hover:bg-neutral-50/60 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (!isAllocated) handleToggleSelectContainer(item.id);
                        }}
                      >
                        <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isAllocated}
                            onChange={() => handleToggleSelectContainer(item.id)}
                            className="rounded border-neutral-300 text-black focus:ring-0 w-3.5 h-3.5 disabled:opacity-30 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-neutral-900">
                          <span className={isAllocated ? 'line-through opacity-70' : ''}>
                            {item.containerNo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-600">
                          {item.blNo}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-700 max-w-[150px] truncate">
                          {item.vessel}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-600">
                          {item.eta}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {item.size}
                        </td>
                        <td className="py-2.5 px-3">
                          {isAllocated ? (
                            <div className="flex items-center gap-1.5 text-neutral-600">
                              <Badge size="sm" tone="warning">
                                Allocated
                              </Badge>
                              <span className="text-[11px] font-medium text-neutral-600">
                                {item.agencyName}
                              </span>
                            </div>
                          ) : (
                            <Badge size="sm" tone="neutral">
                              Available
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100">
              <div>
                Showing{' '}
                <span className="font-semibold text-neutral-800">
                  {filteredManualContainers.length > 0 ? (manualPage - 1) * pageSize + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-neutral-800">
                  {Math.min(manualPage * pageSize, filteredManualContainers.length)}
                </span>{' '}
                of <span className="font-semibold text-neutral-800">{filteredManualContainers.length}</span> containers
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={manualPage <= 1}
                  onClick={() => setManualPage(p => Math.max(1, p - 1))}
                  className="h-7 px-2 text-xs border border-neutral-200"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="px-2 font-mono text-neutral-800 font-medium">
                  {manualPage} / {totalManualPages}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={manualPage >= totalManualPages}
                  onClick={() => setManualPage(p => Math.min(totalManualPages, p + 1))}
                  className="h-7 px-2 text-xs border border-neutral-200"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={open => !open && setIsConfirmOpen(false)}>
        <DialogContent
          title="Confirm Allocation"
          description={`Review and authorize container allocation to ${activeAgency?.name || 'Clearing Agency'}`}
          className="max-w-md"
        >
          <div className="space-y-4 py-2 text-xs">
            <p className="text-neutral-700 leading-relaxed">
              You are about to allocate{' '}
              <span className="font-bold text-neutral-900 font-mono text-sm px-1.5 py-0.5 bg-neutral-100 rounded">
                {finalAllocCount} available containers
              </span>{' '}
              to <strong className="text-neutral-900">{activeAgency?.name}</strong>.
            </p>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">Clearing Agency:</span>
                <span className="font-semibold text-neutral-900">{activeAgency?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">Number of Containers:</span>
                <span className="font-semibold text-neutral-900 font-mono">{finalAllocCount} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">Allocation Method:</span>
                <span className="font-semibold text-neutral-900">
                  {allocationMethod === 'quantity' ? 'Quantity Auto-Allocation' : 'Manual Manifest Selection'}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-neutral-200">
                <span className="text-neutral-500 font-medium">Remaining Available Inventory:</span>
                <span className="font-bold text-emerald-700 font-mono">{remainingCount} units</span>
              </div>
            </div>

            <div className="p-2.5 bg-amber-50 rounded border border-amber-200/80 text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-snug">
                Once confirmed, these containers will be locked and cannot be assigned to another agency without explicit administrative deallocation.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <Button
                size="sm"
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => setIsConfirmOpen(false)}
                className="text-xs border border-neutral-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                loading={isSubmitting}
                onClick={handleExecuteAllocation}
                className="text-xs bg-black text-white hover:bg-neutral-800"
              >
                Confirm Allocation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Agency Modal */}
      <AddAgencyModal
        isOpen={isAddAgencyOpen}
        onClose={() => setIsAddAgencyOpen(false)}
        onCreated={agency => setSelectedAgencyId(agency.id)}
      />
    </div>
  );
};

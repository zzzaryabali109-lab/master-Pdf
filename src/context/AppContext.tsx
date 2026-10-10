import React, { createContext, useContext, useState, useMemo } from 'react';
import { Agency, Allocation, Container, ExportColumnOption, ImportBatch, NavigationPage, SystemUser } from '../types';
import { CURRENT_USER, INITIAL_AGENCIES, INITIAL_ALLOCATIONS, INITIAL_BATCHES, INITIAL_CONTAINERS } from '../services/mockData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface AppContextType {
  currentPage: NavigationPage;
  setCurrentPage: (page: NavigationPage) => void;
  currentUser: SystemUser;
  containers: Container[];
  agencies: Agency[];
  batches: ImportBatch[];
  allocations: Allocation[];
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
  // Business logic
  allocateByQuantity: (agencyId: string, quantity: number, notes?: string) => { success: boolean; error?: string; allocatedCount?: number };
  allocateBySelection: (agencyId: string, containerIds: string[], notes?: string) => { success: boolean; error?: string; conflictingContainers?: Container[] };
  createAgency: (agency: Omit<Agency, 'id' | 'allocatedCount' | 'lastAllocation'>) => Agency;
  uploadBatch: (file: File | { name: string; size: string; count: number }) => Promise<ImportBatch>;
  exportAgencyContainers: (agencyId: string, selectedColumns: string[]) => void;
  // Selected agency modal helper
  inspectAgencyId: string | null;
  setInspectAgencyId: (id: string | null) => void;
  // Selected batch preview helper
  inspectBatchId: string | null;
  setInspectBatchId: (id: string | null) => void;
  // Selected allocation modal helper
  inspectAllocationId: string | null;
  setInspectAllocationId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const DEFAULT_EXPORT_COLUMNS: ExportColumnOption[] = [
  { id: 'containerNo', label: 'Container No', defaultSelected: true },
  { id: 'blNo', label: 'BL No', defaultSelected: true },
  { id: 'vessel', label: 'Vessel', defaultSelected: true },
  { id: 'importer', label: 'Importer', defaultSelected: true },
  { id: 'eta', label: 'ETA', defaultSelected: true },
  { id: 'size', label: 'Size', defaultSelected: true },
  { id: 'weight', label: 'Weight', defaultSelected: false },
  { id: 'port', label: 'Port', defaultSelected: false },
  { id: 'shippingLine', label: 'Shipping Line', defaultSelected: false },
  { id: 'remarks', label: 'Remarks', defaultSelected: false },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [containers, setContainers] = useState<Container[]>(INITIAL_CONTAINERS);
  const [agencies, setAgencies] = useState<Agency[]>(INITIAL_AGENCIES);
  const [batches, setBatches] = useState<ImportBatch[]>(INITIAL_BATCHES);
  const [allocations, setAllocations] = useState<Allocation[]>(INITIAL_ALLOCATIONS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [inspectAgencyId, setInspectAgencyId] = useState<string | null>(null);
  const [inspectBatchId, setInspectBatchId] = useState<string | null>(null);
  const [inspectAllocationId, setInspectAllocationId] = useState<string | null>(null);

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const allocateByQuantity = (agencyId: string, quantity: number, notes?: string) => {
    const agency = agencies.find(a => a.id === agencyId);
    if (!agency) {
      addToast('error', 'Agency Not Found', 'Please choose a valid clearing agency.');
      return { success: false, error: 'Agency not found' };
    }

    const availableContainers = containers.filter(c => c.status === 'Available');
    if (quantity <= 0) {
      addToast('warning', 'Invalid Quantity', 'Please enter a container quantity greater than 0.');
      return { success: false, error: 'Quantity must be > 0' };
    }

    if (quantity > availableContainers.length) {
      addToast(
        'warning',
        'Insufficient Inventory',
        `Only ${availableContainers.length} containers are currently available for allocation.`
      );
      return { success: false, error: `Only ${availableContainers.length} containers available` };
    }

    const selectedToAllocate = availableContainers.slice(0, quantity);
    const selectedIds = new Set(selectedToAllocate.map(c => c.id));
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Update containers
    setContainers(prev =>
      prev.map(c => {
        if (selectedIds.has(c.id)) {
          return {
            ...c,
            status: 'Allocated',
            agencyId: agency.id,
            agencyName: agency.name,
            allocatedAt: now,
            allocatedBy: CURRENT_USER.name,
          };
        }
        return c;
      })
    );

    // Update agency stats
    setAgencies(prev =>
      prev.map(a => {
        if (a.id === agency.id) {
          return {
            ...a,
            allocatedCount: a.allocatedCount + quantity,
            lastAllocation: now,
          };
        }
        return a;
      })
    );

    // Record allocation
    const newAllocation: Allocation = {
      id: `alloc-${Date.now()}`,
      date: now,
      agencyId: agency.id,
      agencyName: agency.name,
      containerCount: quantity,
      containerIds: selectedToAllocate.map(c => c.id),
      user: CURRENT_USER.name,
      status: 'Completed',
      method: 'Quantity',
      notes: notes || `Bulk quantity allocation of ${quantity} units.`,
    };

    setAllocations(prev => [newAllocation, ...prev]);

    // Update batch stats
    setBatches(prev =>
      prev.map(b => {
        if (b.id === 'batch-2026-001') {
          return {
            ...b,
            allocatedCount: b.allocatedCount + quantity,
            availableCount: Math.max(0, b.availableCount - quantity),
          };
        }
        return b;
      })
    );

    addToast(
      'success',
      'Allocation Completed',
      `${quantity} containers successfully allocated to ${agency.name}.`
    );

    return { success: true, allocatedCount: quantity };
  };

  const allocateBySelection = (agencyId: string, containerIds: string[], notes?: string) => {
    const agency = agencies.find(a => a.id === agencyId);
    if (!agency) {
      addToast('error', 'Agency Not Found', 'Please choose a valid clearing agency.');
      return { success: false, error: 'Agency not found' };
    }

    if (containerIds.length === 0) {
      addToast('warning', 'No Containers Selected', 'Select at least one available container to allocate.');
      return { success: false, error: 'No containers selected' };
    }

    // DUPLICATE ALLOCATION PROTECTION CHECK
    const targetContainers = containers.filter(c => containerIds.includes(c.id));
    const alreadyAllocated = targetContainers.filter(c => c.status === 'Allocated');

    if (alreadyAllocated.length > 0) {
      const conflictNames = alreadyAllocated.map(c => `${c.containerNo} (${c.agencyName})`).join(', ');
      addToast(
        'error',
        'Duplicate Allocation Blocked',
        `Allocation blocked: ${alreadyAllocated.length} container(s) are already allocated: ${conflictNames}`
      );
      return {
        success: false,
        error: 'Duplicate allocation detected',
        conflictingContainers: alreadyAllocated,
      };
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const idSet = new Set(containerIds);

    // Update containers
    setContainers(prev =>
      prev.map(c => {
        if (idSet.has(c.id)) {
          return {
            ...c,
            status: 'Allocated',
            agencyId: agency.id,
            agencyName: agency.name,
            allocatedAt: now,
            allocatedBy: CURRENT_USER.name,
          };
        }
        return c;
      })
    );

    // Update agency stats
    setAgencies(prev =>
      prev.map(a => {
        if (a.id === agency.id) {
          return {
            ...a,
            allocatedCount: a.allocatedCount + containerIds.length,
            lastAllocation: now,
          };
        }
        return a;
      })
    );

    // Record allocation
    const newAllocation: Allocation = {
      id: `alloc-${Date.now()}`,
      date: now,
      agencyId: agency.id,
      agencyName: agency.name,
      containerCount: containerIds.length,
      containerIds: [...containerIds],
      user: CURRENT_USER.name,
      status: 'Completed',
      method: 'Manual',
      notes: notes || `Manual allocation of ${containerIds.length} designated containers.`,
    };

    setAllocations(prev => [newAllocation, ...prev]);

    // Update batch stats
    setBatches(prev =>
      prev.map(b => {
        if (b.id === 'batch-2026-001') {
          return {
            ...b,
            allocatedCount: b.allocatedCount + containerIds.length,
            availableCount: Math.max(0, b.availableCount - containerIds.length),
          };
        }
        return b;
      })
    );

    addToast(
      'success',
      'Allocation Completed',
      `${containerIds.length} containers successfully allocated to ${agency.name}.`
    );

    return { success: true };
  };

  const createAgency = (agencyData: Omit<Agency, 'id' | 'allocatedCount' | 'lastAllocation'>): Agency => {
    const newAgency: Agency = {
      ...agencyData,
      id: `ag-${Date.now()}`,
      allocatedCount: 0,
      lastAllocation: 'No allocations yet',
    };

    setAgencies(prev => [...prev, newAgency]);
    addToast('success', 'Agency Created', `${newAgency.name} has been added to clearing agencies.`);
    return newAgency;
  };

  const uploadBatch = async (
    fileInfo: File | { name: string; size: string; count: number }
  ): Promise<ImportBatch> => {
    const fileName = 'name' in fileInfo ? fileInfo.name : 'NEW_IMPORT_MANIFEST.xlsx';
    const fileSize = 'size' in fileInfo && typeof fileInfo.size === 'string' ? fileInfo.size : '1.85 MB';
    const totalContainers = 'count' in fileInfo ? fileInfo.count : 300;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newBatch: ImportBatch = {
      id: `batch-${Date.now()}`,
      fileName,
      fileSize,
      uploadDate: now,
      totalContainers,
      allocatedCount: 0,
      availableCount: totalContainers,
      status: 'Processed',
      uploadedBy: CURRENT_USER.name,
    };

    setBatches(prev => [newBatch, ...prev]);
    addToast('success', 'Import Processed', `Successfully processed ${fileName} with ${totalContainers} containers.`);
    return newBatch;
  };

  const exportAgencyContainers = (agencyId: string, selectedColumns: string[]) => {
    const agency = agencies.find(a => a.id === agencyId);
    if (!agency) return;

    const assignedContainers = containers.filter(c => c.agencyId === agencyId);
    if (assignedContainers.length === 0) {
      addToast('warning', 'No Containers Assigned', `No containers currently assigned to ${agency.name}.`);
      return;
    }

    const columnHeaders: Record<string, string> = {
      containerNo: 'Container No',
      blNo: 'BL No',
      vessel: 'Vessel',
      importer: 'Importer',
      eta: 'ETA',
      size: 'Size',
      weight: 'Weight',
      port: 'Port of Discharge',
      shippingLine: 'Shipping Line',
      remarks: 'Remarks',
      allocatedAt: 'Allocated Date',
      allocatedBy: 'Allocated By',
      agencyName: 'Clearing Agency',
    };

    const activeCols = selectedColumns.filter(c => c in columnHeaders);
    const headers = activeCols.map(c => columnHeaders[c]).join(',');
    const rows = assignedContainers.map(item => {
      return activeCols
        .map(col => {
          const val = (item as unknown as Record<string, unknown>)[col] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${agency.name.replace(/\s+/g, '_')}_Allocated_Containers.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast('success', 'Excel Generated', `Exported ${assignedContainers.length} containers for ${agency.name}.`);
  };

  const value = useMemo(
    () => ({
      currentPage,
      setCurrentPage,
      currentUser: CURRENT_USER,
      containers,
      agencies,
      batches,
      allocations,
      toasts,
      addToast,
      removeToast,
      allocateByQuantity,
      allocateBySelection,
      createAgency,
      uploadBatch,
      exportAgencyContainers,
      inspectAgencyId,
      setInspectAgencyId,
      inspectBatchId,
      setInspectBatchId,
      inspectAllocationId,
      setInspectAllocationId,
    }),
    [
      currentPage,
      containers,
      agencies,
      batches,
      allocations,
      toasts,
      inspectAgencyId,
      inspectBatchId,
      inspectAllocationId,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

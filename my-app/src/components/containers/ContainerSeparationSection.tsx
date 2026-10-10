import { useState, useMemo } from "react";
import {
  Boxes,
  Eye,
  Download,
  Building2,
  Check,
  Plus,
  Trash2,
  Search,
  AlertCircle,
  X,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { DataColumn } from "@/components/arc/sortable-data-table/sortable-data-table";
import type { ExcelRow } from "@/services/excelEngine";
import MorphSelect from "@/components/arc/morph-select/morph-select";

export interface ContainerAllocation {
  id: string;
  agencyName: string;
  allocatedAt: string;
  containerKeys: string[];
  containerNumbers: string[];
  selectedColumns: string[];
  batchFileName: string;
}

interface ContainerSeparationSectionProps {
  rows: ExcelRow[];
  columns: DataColumn<ExcelRow>[];
  fileName: string;
}

const DEFAULT_AGENCIES = [
  "FastTrack Logistics & Customs",
  "Apex Global Clearing Agency",
  "Oceanic Port Handlers Ltd",
  "TransWorld Customs Brokers",
];

export function getRowContainerId(row: ExcelRow, columns: DataColumn<ExcelRow>[]): string {
  // 1. Look for explicit container column
  const containerCol = columns.find((c) =>
    /container|cntr|unit\s*no|box\s*no|equipment/i.test(c.label || c.key)
  );
  if (containerCol && row[containerCol.key] != null && String(row[containerCol.key]).trim() !== "") {
    return String(row[containerCol.key]).trim();
  }

  // 2. Look for SKU, tracking, or ID column
  const idCol = columns.find((c) =>
    /sku|tracking|serial|code|id|no|num/i.test(c.label || c.key)
  );
  if (idCol && row[idCol.key] != null && String(row[idCol.key]).trim() !== "") {
    return String(row[idCol.key]).trim();
  }

  // 3. Fallback to first non-empty column value
  for (const col of columns) {
    const val = row[col.key];
    if (val != null && String(val).trim() !== "") {
      return String(val).trim();
    }
  }

  return row.__id;
}

export default function ContainerSeparationSection({
  rows,
  columns,
  fileName,
}: ContainerSeparationSectionProps) {
  // State for allocations
  const [allocations, setAllocations] = useState<ContainerAllocation[]>([]);
  const [agencies, setAgencies] = useState<string[]>(DEFAULT_AGENCIES);

  // Dialog visibility states
  const [isSeparateModalOpen, setIsSeparateModalOpen] = useState(false);
  const [isViewAllocationsOpen, setIsViewAllocationsOpen] = useState(false);
  const [isExportAgencyOpen, setIsExportAgencyOpen] = useState(false);

  // Form states for Separate Containers modal
  const [selectedAgency, setSelectedAgency] = useState<string>(DEFAULT_AGENCIES[0]);
  const [newAgencyInput, setNewAgencyInput] = useState("");
  const [isAddingNewAgency, setIsAddingNewAgency] = useState(false);

  const [quantityInput, setQuantityInput] = useState<number | "">("");
  const [allocationMethod, setAllocationMethod] = useState<"auto" | "manual">("auto");
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(() =>
    columns.map((c) => c.key)
  );
  const [manualSelectedContainerKeys, setManualSelectedContainerKeys] = useState<string[]>([]);
  const [manualSearchQuery, setManualSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Export agency modal state
  const [exportTargetAgency, setExportTargetAgency] = useState<string>("");

  // Compute set of already-allocated container keys (BUSINESS RULE: STRICT NO DUPLICATES)
  const allocatedContainerKeyMap = useMemo(() => {
    const map = new Map<string, string>(); // containerKey -> agencyName
    for (const alloc of allocations) {
      for (const key of alloc.containerKeys) {
        map.set(key, alloc.agencyName);
      }
    }
    return map;
  }, [allocations]);

  // Available containers (excluding already allocated)
  const availableContainers = useMemo(() => {
    return rows.filter((r) => !allocatedContainerKeyMap.has(r.__id));
  }, [rows, allocatedContainerKeyMap]);

  // Total container count
  const totalContainersCount = rows.length;
  const allocatedCount = allocatedContainerKeyMap.size;
  const availableCount = availableContainers.length;

  // Filtered available containers for manual search
  const filteredAvailableContainers = useMemo(() => {
    if (!manualSearchQuery.trim()) return availableContainers;
    const q = manualSearchQuery.toLowerCase();
    return availableContainers.filter((r) => {
      const containerId = getRowContainerId(r, columns).toLowerCase();
      if (containerId.includes(q)) return true;
      return Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [availableContainers, manualSearchQuery, columns]);

  // Open Separate Modal
  const handleOpenSeparateModal = () => {
    setIsSeparateModalOpen(true);
    setErrorMessage(null);
    setQuantityInput("");
    setManualSelectedContainerKeys([]);
    setSelectedColumnKeys(columns.map((c) => c.key));
    if (!agencies.includes(selectedAgency) && agencies.length > 0) {
      setSelectedAgency(agencies[0]);
    }
  };

  // Add a new agency
  const handleAddNewAgency = () => {
    const trimmed = newAgencyInput.trim();
    if (!trimmed) return;
    if (!agencies.includes(trimmed)) {
      setAgencies((prev) => [...prev, trimmed]);
    }
    setSelectedAgency(trimmed);
    setNewAgencyInput("");
    setIsAddingNewAgency(false);
  };

  // Column selection helpers
  const handleToggleColumn = (key: string) => {
    setSelectedColumnKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllColumns = () => {
    setSelectedColumnKeys(columns.map((c) => c.key));
  };

  const handleDeselectAllColumns = () => {
    setSelectedColumnKeys([]);
  };

  // Manual container checkbox toggle
  const handleToggleManualContainer = (key: string) => {
    setManualSelectedContainerKeys((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      setQuantityInput(next.length);
      return next;
    });
  };

  const handleSelectAllManualContainers = () => {
    const allKeys = filteredAvailableContainers.map((r) => r.__id);
    setManualSelectedContainerKeys(allKeys);
    setQuantityInput(allKeys.length);
  };

  const handleDeselectAllManualContainers = () => {
    setManualSelectedContainerKeys([]);
    setQuantityInput(0);
  };

  // Execute Allocation
  const handleExecuteAllocation = () => {
    setErrorMessage(null);

    if (!selectedAgency) {
      setErrorMessage("Please select a clearing agency.");
      return;
    }

    if (selectedColumnKeys.length === 0) {
      setErrorMessage("Please select at least one column for export.");
      return;
    }

    let targetKeys: string[] = [];

    if (allocationMethod === "auto") {
      const qty = typeof quantityInput === "number" ? quantityInput : Number(quantityInput);
      if (!qty || qty <= 0) {
        setErrorMessage("Please enter a valid number of containers to allocate.");
        return;
      }
      if (qty > availableCount) {
        setErrorMessage(
          `Requested quantity (${qty}) exceeds available containers (${availableCount}).`
        );
        return;
      }
      // Take first N available containers
      targetKeys = availableContainers.slice(0, qty).map((r) => r.__id);
    } else {
      if (manualSelectedContainerKeys.length === 0) {
        setErrorMessage("Please select at least one container from the list.");
        return;
      }
      targetKeys = manualSelectedContainerKeys;
    }

    // STRICT PREVENT DUPLICATE ALLOCATION: Check if any chosen key is already allocated
    const conflict = targetKeys.find((k) => allocatedContainerKeyMap.has(k));
    if (conflict) {
      const assignedAgency = allocatedContainerKeyMap.get(conflict);
      setErrorMessage(
        `Critical Rule Violation: Container ${conflict} is already allocated to "${assignedAgency}".`
      );
      return;
    }

    const containerNumberMap = new Map(rows.map((r) => [r.__id, getRowContainerId(r, columns)]));
    const targetNumbers = targetKeys.map((k) => containerNumberMap.get(k) || k);

    const newAllocation: ContainerAllocation = {
      id: `alloc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      agencyName: selectedAgency,
      allocatedAt: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      containerKeys: targetKeys,
      containerNumbers: targetNumbers,
      selectedColumns: selectedColumnKeys,
      batchFileName: fileName || "Import Batch",
    };

    setAllocations((prev) => [newAllocation, ...prev]);
    setIsSeparateModalOpen(false);
    setErrorMessage(null);
  };

  // Release/Delete an allocation
  const handleReleaseAllocation = (allocationId: string) => {
    setAllocations((prev) => prev.filter((a) => a.id !== allocationId));
  };

  // Export specific agency's allocation to Excel
  const handleExportAgencyExcel = (allocation: ContainerAllocation) => {
    try {
      const targetRows = rows.filter((r) => allocation.containerKeys.includes(r.__id));
      const exportJson = targetRows.map((r) => {
        const item: Record<string, unknown> = {};
        for (const colKey of allocation.selectedColumns) {
          item[colKey] = r[colKey] ?? "";
        }
        return item;
      });

      const ws = XLSX.utils.json_to_sheet(exportJson);
      const wb = XLSX.utils.book_new();
      const sanitizedSheetName = allocation.agencyName.replace(/[\\/?*[\]]/g, "_").slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sanitizedSheetName || "Allocated Containers");

      const cleanFileName = `${allocation.agencyName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Containers.xlsx`;
      XLSX.writeFile(wb, cleanFileName);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export Excel file. Please try again.");
    }
  };

  // MorphSelect options format
  const morphAgencyOptions = useMemo(() => {
    return agencies.map((a) => ({
      value: a,
      label: a,
      icon: <Building2 className="w-4 h-4 text-muted-foreground" />,
    }));
  }, [agencies]);

  return (
    <div className="w-full mt-4 flex flex-col gap-4">
      {/* Container Management & Separation Action Bar directly below table */}
      <div className="w-full bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold tracking-tight">
              Container Separation & Clearing Agency Allocations
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              Total: <strong className="text-foreground">{totalContainersCount}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Allocated:{" "}
              <strong className={allocatedCount > 0 ? "text-amber-500 font-medium" : "text-foreground"}>
                {allocatedCount}
              </strong>
            </span>
            <span>&bull;</span>
            <span>
              Available: <strong className="text-emerald-500 font-medium">{availableCount}</strong>
            </span>
          </div>
        </div>

        {/* 3 Main Action Buttons Requested */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {/* Button 1: Separate Containers (Black Primary Button) */}
          <button
            type="button"
            onClick={handleOpenSeparateModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Boxes className="w-3.5 h-3.5" />
            Separate Containers
          </button>

          {/* Button 2: View Allocations */}
          <button
            type="button"
            onClick={() => setIsViewAllocationsOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-border bg-background hover:bg-accent text-foreground transition-colors cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            View Allocations
            {allocations.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                {allocations.length}
              </span>
            )}
          </button>

          {/* Button 3: Export Agency Excel */}
          <button
            type="button"
            onClick={() => {
              if (allocations.length === 0) {
                alert("No containers have been allocated to any clearing agency yet.");
                return;
              }
              setExportTargetAgency(allocations[0].agencyName);
              setIsExportAgencyOpen(true);
            }}
            disabled={allocations.length === 0}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-border bg-background hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed text-foreground transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            Export Agency Excel
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SEPARATE CONTAINERS MODAL                                              */}
      {/* ========================================================================= */}
      {isSeparateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl p-5 sm:p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight">
                    Separate Containers for Clearing Agency
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Available:{" "}
                    <strong className="text-emerald-500 font-medium">{availableCount}</strong> of{" "}
                    {totalContainersCount} containers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSeparateModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Content */}
            <div className="flex flex-col gap-4 text-xs">
              {/* Field 1: Select Clearing Agency */}
              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-foreground flex items-center justify-between">
                  <span>Select Clearing Agency</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewAgency(!isAddingNewAgency)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {isAddingNewAgency ? "Select existing agency" : "Add New Agency"}
                  </button>
                </label>

                {isAddingNewAgency ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newAgencyInput}
                      onChange={(e) => setNewAgencyInput(e.target.value)}
                      placeholder="Enter new clearing agency name..."
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddNewAgency();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddNewAgency}
                      className="px-3 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg text-xs font-medium cursor-pointer"
                    >
                      Save Agency
                    </button>
                  </div>
                ) : (
                  <div className="w-full">
                    <MorphSelect
                      label="Clearing Agency"
                      hideLabel
                      items={morphAgencyOptions}
                      value={selectedAgency}
                      onValueChange={(val) => setSelectedAgency(val)}
                      placeholder="Choose clearing agency..."
                      searchable="auto"
                      panelWidth={380}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Field 2: Allocation Method */}
              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-foreground">Allocation Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAllocationMethod("auto")}
                    className={`p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition-colors cursor-pointer ${
                      allocationMethod === "auto"
                        ? "border-emerald-500 bg-emerald-500/5 text-foreground font-medium"
                        : "border-border bg-background hover:bg-accent/50 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs">Automatic Allocation</span>
                      {allocationMethod === "auto" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                    <span className="text-[11px] opacity-75">
                      Fastest: specify quantity to take from available queue
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAllocationMethod("manual")}
                    className={`p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition-colors cursor-pointer ${
                      allocationMethod === "manual"
                        ? "border-emerald-500 bg-emerald-500/5 text-foreground font-medium"
                        : "border-border bg-background hover:bg-accent/50 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs">Manual Selection</span>
                      {allocationMethod === "manual" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                    <span className="text-[11px] opacity-75">
                      Search and check off individual container numbers
                    </span>
                  </button>
                </div>
              </div>

              {/* Field 3: Number of Containers (Auto or Manual) */}
              {allocationMethod === "auto" ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-foreground">Number of Containers</label>
                    <span className="text-[11px] text-muted-foreground">
                      Max available: {availableCount}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={availableCount}
                    value={quantityInput}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      setQuantityInput(val);
                    }}
                    placeholder={`e.g. 10 (up to ${availableCount})`}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring text-xs"
                  />
                </div>
              ) : (
                /* Manual Container Selection with Searchable List */
                <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={manualSearchQuery}
                        onChange={(e) => setManualSearchQuery(e.target.value)}
                        placeholder="Search container ID / details..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleSelectAllManualContainers}
                        className="text-[11px] px-2 py-1 rounded border border-border hover:bg-accent text-foreground cursor-pointer"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllManualContainers}
                        className="text-[11px] px-2 py-1 rounded border border-border hover:bg-accent text-foreground cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>
                      Selected:{" "}
                      <strong className="text-foreground">
                        {manualSelectedContainerKeys.length}
                      </strong>{" "}
                      of {availableCount} available
                    </span>
                  </div>

                  {/* Scrollable Container Checkboxes */}
                  <div className="max-h-48 overflow-y-auto flex flex-col gap-1 border border-border rounded-md p-1.5 bg-background">
                    {filteredAvailableContainers.length > 0 ? (
                      filteredAvailableContainers.map((r) => {
                        const id = r.__id;
                        const containerNum = getRowContainerId(r, columns);
                        const isChecked = manualSelectedContainerKeys.includes(id);

                        return (
                          <div
                            key={id}
                            onClick={() => handleToggleManualContainer(id)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors text-xs ${
                              isChecked
                                ? "bg-emerald-500/10 text-foreground font-medium"
                                : "hover:bg-accent text-muted-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Square className="w-4 h-4 opacity-40" />
                              )}
                              <span className="font-mono">{containerNum}</span>
                            </div>
                            <span className="text-[10px] opacity-60">Available</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-4 text-center text-xs text-muted-foreground">
                        No available containers match search.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Field 4: Select Columns to Include in Agency's Export */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                    Select Columns for Agency File
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllColumns}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span>&bull;</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllColumns}
                      className="text-muted-foreground hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-lg border border-border bg-background">
                  {columns.map((col) => {
                    const isSelected = selectedColumnKeys.includes(col.key);
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => handleToggleColumn(col.key)}
                        className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? "bg-black text-white dark:bg-white dark:text-black border-transparent font-medium"
                            : "border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        {col.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsSeparateModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-xs font-medium text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {/* Primary Black Button as requested */}
              <button
                type="button"
                onClick={handleExecuteAllocation}
                disabled={availableCount === 0}
                className="px-5 py-2 rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Allocate Containers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW ALLOCATIONS MODAL                                                 */}
      {/* ========================================================================= */}
      {isViewAllocationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl p-5 sm:p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight">
                    Clearing Agency Allocations
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {allocations.length} {allocations.length === 1 ? "agency record" : "agency records"} &bull;{" "}
                    {allocatedCount} total containers allocated
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsViewAllocationsOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {allocations.length > 0 ? (
              <div className="flex flex-col gap-3">
                {allocations.map((alloc) => (
                  <div
                    key={alloc.id}
                    className="p-4 rounded-xl border border-border bg-background flex flex-col gap-3 hover:border-border/80 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-sm font-semibold text-foreground">
                          {alloc.agencyName}
                        </h4>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                          {alloc.containerKeys.length} Containers
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          Allocated: {alloc.allocatedAt}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleExportAgencyExcel(alloc)}
                          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-black text-white dark:bg-white dark:text-black font-medium transition-colors cursor-pointer"
                          title="Download this agency's Excel file"
                        >
                          <Download className="w-3 h-3" />
                          Export Excel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReleaseAllocation(alloc.id)}
                          className="p-1 rounded text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                          title="Release allocation (returns containers to available pool)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Allocated Containers List */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Allocated Container Numbers:
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 rounded-md bg-muted/30 border border-border/60">
                        {alloc.containerNumbers.map((num, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-foreground"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Selected Columns */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Export Columns ({alloc.selectedColumns.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {alloc.selectedColumns.map((colKey) => (
                          <span
                            key={colKey}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                          >
                            {colKey}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <Boxes className="w-10 h-10 text-muted-foreground/40" />
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-semibold text-foreground">No Allocations Created Yet</h4>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Click "Separate Containers" below the table to allocate containers to clearing agencies.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsViewAllocationsOpen(false);
                    handleOpenSeparateModal();
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create First Allocation
                </button>
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsViewAllocationsOpen(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-xs font-medium text-foreground transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EXPORT AGENCY EXCEL MODAL                                              */}
      {/* ========================================================================= */}
      {isExportAgencyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <h3 className="text-base font-semibold tracking-tight">Export Agency Excel</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExportAgencyOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <label className="font-medium text-foreground">
                Select Agency to Download Container File:
              </label>

              <div className="flex flex-col gap-2">
                {allocations.map((alloc) => (
                  <div
                    key={alloc.id}
                    onClick={() => setExportTargetAgency(alloc.agencyName)}
                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                      exportTargetAgency === alloc.agencyName
                        ? "border-emerald-500 bg-emerald-500/5 font-medium text-foreground"
                        : "border-border hover:bg-accent/50 text-muted-foreground"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold">{alloc.agencyName}</span>
                      <span className="text-[11px] opacity-75">
                        {alloc.containerKeys.length} Containers &bull; {alloc.selectedColumns.length} Columns
                      </span>
                    </div>
                    {exportTargetAgency === alloc.agencyName && (
                      <Check className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsExportAgencyOpen(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-xs font-medium text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = allocations.find((a) => a.agencyName === exportTargetAgency);
                  if (target) {
                    handleExportAgencyExcel(target);
                    setIsExportAgencyOpen(false);
                  }
                }}
                disabled={!exportTargetAgency}
                className="px-4 py-2 rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Excel File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

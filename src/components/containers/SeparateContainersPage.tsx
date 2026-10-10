import { useState, useMemo, useDeferredValue } from "react";
import {
  ArrowLeft,
  Boxes,
  Building2,
  Check,
  Plus,
  Search,
  AlertCircle,
  CheckSquare,
  Square,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
} from "lucide-react";
import type { DataColumn } from "@/components/arc/sortable-data-table/sortable-data-table";
import type { ExcelRow } from "@/services/excelEngine";

export interface ContainerAllocation {
  id: string;
  agencyName: string;
  allocatedAt: string;
  containerKeys: string[];
  containerNumbers: string[];
  selectedColumns: string[];
  batchFileName: string;
}

interface SeparateContainersPageProps {
  rows: ExcelRow[];
  columns: DataColumn<ExcelRow>[];
  fileName: string;
  agencies: string[];
  onAddAgency: (agency: string) => void;
  allocations: ContainerAllocation[];
  onAllocate: (allocation: ContainerAllocation) => void;
  onBack: () => void;
  onViewAllocations: () => void;
}

export default function SeparateContainersPage({
  rows,
  columns,
  fileName,
  agencies,
  onAddAgency,
  allocations,
  onAllocate,
  onBack,
  onViewAllocations,
}: SeparateContainersPageProps) {
  // Agency Selection
  const [selectedAgency, setSelectedAgency] = useState<string>(agencies[0] || "");
  const [isAddingNewAgency, setIsAddingNewAgency] = useState(false);
  const [newAgencyInput, setNewAgencyInput] = useState("");

  // Allocation Method: Auto vs Manual
  const [allocationMethod, setAllocationMethod] = useState<"auto" | "manual">("auto");
  const [quantityInput, setQuantityInput] = useState<number | "">("");

  // Column Selection
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(() =>
    columns.map((c) => c.key)
  );

  // Manual Selection with High-Performance Set & Pagination
  const [manualSelectedKeys, setManualSelectedKeys] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [manualPageIndex, setManualPageIndex] = useState(1);
  const MANUAL_PAGE_SIZE = 30;

  // Feedback & Validation
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // High-Speed Container Column Identification
  const containerColKey = useMemo(() => {
    const cCol = columns.find((c) =>
      /container|cntr|unit\s*no|box\s*no|equipment/i.test(c.label || c.key)
    );
    if (cCol) return cCol.key;
    const idCol = columns.find((c) =>
      /sku|tracking|serial|code|id|no|num/i.test(c.label || c.key)
    );
    if (idCol) return idCol.key;
    return columns[0]?.key || "__id";
  }, [columns]);

  const getContainerNum = (row: ExcelRow) => {
    const val = row[containerColKey];
    return val != null && String(val).trim() !== "" ? String(val).trim() : row.__id;
  };

  // STRICT RULE: Map and Set of already allocated containers (NO DUPLICATES ALLOWED)
  const allocatedContainerKeyMap = useMemo(() => {
    const map = new Map<string, string>(); // containerId -> agencyName
    for (const alloc of allocations) {
      for (const k of alloc.containerKeys) {
        map.set(k, alloc.agencyName);
      }
    }
    return map;
  }, [allocations]);

  // Available containers (strictly excluding all already-allocated containers)
  const availableContainers = useMemo(() => {
    return rows.filter((r) => !allocatedContainerKeyMap.has(r.__id));
  }, [rows, allocatedContainerKeyMap]);

  const totalCount = rows.length;
  const allocatedCount = allocatedContainerKeyMap.size;
  const availableCount = availableContainers.length;

  // Filtered available containers for manual selection (memoized + deferred)
  const filteredAvailableContainers = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return availableContainers;
    return availableContainers.filter((r) => {
      const containerNum = getContainerNum(r).toLowerCase();
      if (containerNum.includes(q)) return true;
      return Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [availableContainers, deferredSearch, containerColKey]);

  // Paginate manual list to guarantee 0% browser lag
  const manualTotalPages = Math.max(1, Math.ceil(filteredAvailableContainers.length / MANUAL_PAGE_SIZE));
  const paginatedManualContainers = useMemo(() => {
    const start = (manualPageIndex - 1) * MANUAL_PAGE_SIZE;
    return filteredAvailableContainers.slice(start, start + MANUAL_PAGE_SIZE);
  }, [filteredAvailableContainers, manualPageIndex]);

  // Handlers
  const handleAddNewAgencySubmit = () => {
    const trimmed = newAgencyInput.trim();
    if (!trimmed) return;
    onAddAgency(trimmed);
    setSelectedAgency(trimmed);
    setNewAgencyInput("");
    setIsAddingNewAgency(false);
  };

  const handleToggleColumn = (key: string) => {
    setSelectedColumnKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleToggleManualContainer = (id: string) => {
    setManualSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setQuantityInput(next.size);
      return next;
    });
  };

  const handleSelectCurrentPageManual = () => {
    setManualSelectedKeys((prev) => {
      const next = new Set(prev);
      paginatedManualContainers.forEach((r) => next.add(r.__id));
      setQuantityInput(next.size);
      return next;
    });
  };

  const handleSelectAllFilteredManual = () => {
    const next = new Set<string>();
    filteredAvailableContainers.forEach((r) => next.add(r.__id));
    setManualSelectedKeys(next);
    setQuantityInput(next.size);
  };

  const handleClearManualSelection = () => {
    setManualSelectedKeys(new Set());
    setQuantityInput(0);
  };

  // Execute Allocation
  const handleAllocate = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const agency = selectedAgency.trim();
    if (!agency) {
      setErrorMessage("Please choose or enter a clearing agency.");
      return;
    }

    if (selectedColumnKeys.length === 0) {
      setErrorMessage("Please select at least one column to include in the agency file.");
      return;
    }

    let targetKeys: string[] = [];

    if (allocationMethod === "auto") {
      const qty = typeof quantityInput === "number" ? quantityInput : Number(quantityInput);
      if (!qty || isNaN(qty) || qty <= 0) {
        setErrorMessage("Please enter a valid container quantity greater than 0.");
        return;
      }
      if (qty > availableCount) {
        setErrorMessage(
          `Requested quantity (${qty}) exceeds the available containers (${availableCount}).`
        );
        return;
      }
      // Pick first N available containers
      targetKeys = availableContainers.slice(0, qty).map((r) => r.__id);
    } else {
      if (manualSelectedKeys.size === 0) {
        setErrorMessage("Please select at least one container from the list.");
        return;
      }
      targetKeys = Array.from(manualSelectedKeys);
    }

    // STRICT BUSINESS RULE: Double-check that none of the chosen containers are already allocated
    for (const key of targetKeys) {
      if (allocatedContainerKeyMap.has(key)) {
        const conflictAgency = allocatedContainerKeyMap.get(key);
        setErrorMessage(
          `Security Conflict: Container is already allocated to "${conflictAgency}". Duplicate allocations are prevented.`
        );
        return;
      }
    }

    // Prepare container numbers
    const rowMap = new Map(rows.map((r) => [r.__id, r]));
    const targetNumbers = targetKeys.map((k) => {
      const r = rowMap.get(k);
      return r ? getContainerNum(r) : k;
    });

    const newAllocation: ContainerAllocation = {
      id: `alloc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      agencyName: agency,
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
      batchFileName: fileName || "Container Manifest",
    };

    onAllocate(newAllocation);
    setSuccessMessage(
      `Successfully allocated ${targetKeys.length} container(s) to "${agency}".`
    );
    setManualSelectedKeys(new Set());
    setQuantityInput("");
  };

  return (
    <div className="w-full max-w-[97vw] xl:max-w-[1750px] mx-auto px-3 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg border border-border hover:bg-accent text-foreground transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Return to Container Table"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Table</span>
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Boxes className="w-5 h-5 text-emerald-500" />
              Separate Containers for Clearing Agency
            </h1>
            <p className="text-xs text-muted-foreground">
              Allocate import batch containers with strict duplicate prevention
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAllocations}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-xs font-medium text-foreground transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          View Allocations ({allocations.length})
        </button>
      </div>

      {/* Real-time Status Badge Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-border bg-card shadow-sm text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground font-medium">Total Manifest Containers</span>
          <span className="text-base font-semibold text-foreground">{totalCount}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground font-medium">Currently Allocated</span>
          <span className="text-base font-semibold text-amber-500">
            {allocatedCount} {totalCount > 0 ? `(${Math.round((allocatedCount / totalCount) * 100)}%)` : ""}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground font-medium">Available for Allocation</span>
          <span className="text-base font-semibold text-emerald-500 font-mono">{availableCount}</span>
        </div>
      </div>

      {/* Error & Success Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={onViewAllocations}
            className="text-[11px] underline font-medium cursor-pointer"
          >
            View Allocations &rarr;
          </button>
        </div>
      )}

      {/* Main Allocation Form */}
      <div className="w-full bg-card border border-border rounded-xl p-5 sm:p-7 flex flex-col gap-6 shadow-sm">
        {/* Step 1: Select Clearing Agency */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              1. Select Clearing Agency
            </label>
            <button
              type="button"
              onClick={() => setIsAddingNewAgency(!isAddingNewAgency)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingNewAgency ? "Choose Existing Agency" : "Add New Agency"}
            </button>
          </div>

          {isAddingNewAgency ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={newAgencyInput}
                onChange={(e) => setNewAgencyInput(e.target.value)}
                placeholder="Enter clearing agency name..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNewAgencySubmit();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddNewAgencySubmit}
                className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg text-xs font-medium cursor-pointer"
              >
                Save Agency
              </button>
            </div>
          ) : (
            <div className="relative mt-1">
              <select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                {agencies.map((agency) => (
                  <option key={agency} value={agency}>
                    {agency}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Step 2: Allocation Method */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <label className="text-xs font-semibold text-foreground">
            2. Allocation Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAllocationMethod("auto")}
              className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                allocationMethod === "auto"
                  ? "border-emerald-500 bg-emerald-500/5 shadow-xs"
                  : "border-border bg-background hover:bg-accent/40 text-muted-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">
                  Automatic Allocation
                </span>
                {allocationMethod === "auto" && (
                  <span className="p-0.5 rounded-full bg-emerald-500 text-white">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Specify a number of containers to pull directly from the available manifest queue.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAllocationMethod("manual")}
              className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                allocationMethod === "manual"
                  ? "border-emerald-500 bg-emerald-500/5 shadow-xs"
                  : "border-border bg-background hover:bg-accent/40 text-muted-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">
                  Manual Selection
                </span>
                {allocationMethod === "manual" && (
                  <span className="p-0.5 rounded-full bg-emerald-500 text-white">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Search and check individual container numbers with live selection filters.
              </span>
            </button>
          </div>
        </div>

        {/* Step 3: Quantity or Searchable Container Selection */}
        {allocationMethod === "auto" ? (
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                3. Number of Containers to Allocate
              </label>
              <span className="text-[11px] text-muted-foreground">
                Max available: <strong className="text-emerald-500">{availableCount}</strong>
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
              placeholder={`Enter quantity (1 to ${availableCount})...`}
              className="w-full sm:w-72 px-3.5 py-2.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-2 border-t border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <label className="text-xs font-semibold text-foreground">
                3. Select Available Containers ({manualSelectedKeys.size} selected)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectCurrentPageManual}
                  className="text-[11px] px-2.5 py-1 rounded border border-border hover:bg-accent text-foreground transition-colors cursor-pointer"
                >
                  Select Page ({paginatedManualContainers.length})
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllFilteredManual}
                  className="text-[11px] px-2.5 py-1 rounded border border-border hover:bg-accent text-foreground transition-colors cursor-pointer"
                >
                  Select All Filtered ({filteredAvailableContainers.length})
                </button>
                <button
                  type="button"
                  onClick={handleClearManualSelection}
                  className="text-[11px] px-2.5 py-1 rounded border border-border hover:bg-accent text-muted-foreground transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Fast Container Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setManualPageIndex(1);
                }}
                placeholder="Search container number, cargo, port, status..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Paginated Container List (Guaranteed 0% DOM Stutter) */}
            <div className="border border-border rounded-xl overflow-hidden bg-background">
              <div className="max-h-64 overflow-y-auto divide-y divide-border/60">
                {paginatedManualContainers.length > 0 ? (
                  paginatedManualContainers.map((row) => {
                    const id = row.__id;
                    const containerNum = getContainerNum(row);
                    const isChecked = manualSelectedKeys.has(id);

                    return (
                      <div
                        key={id}
                        onClick={() => handleToggleManualContainer(id)}
                        className={`flex items-center justify-between px-3.5 py-2.5 text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-emerald-500/10 text-foreground font-medium"
                            : "hover:bg-accent/50 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 opacity-40 shrink-0" />
                          )}
                          <span className="font-mono text-xs font-semibold">{containerNum}</span>
                          <span className="text-[11px] text-muted-foreground hidden sm:inline">
                            {Object.entries(row)
                              .filter(([k]) => k !== "__id" && k !== containerColKey)
                              .slice(0, 2)
                              .map(([, v]) => String(v ?? ""))
                              .join(" • ")}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
                          Available
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No available containers match your search query.
                  </div>
                )}
              </div>

              {/* Fast Pagination Footer for Manual List */}
              {filteredAvailableContainers.length > MANUAL_PAGE_SIZE && (
                <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-card text-xs text-muted-foreground">
                  <span>
                    Showing {(manualPageIndex - 1) * MANUAL_PAGE_SIZE + 1} to{" "}
                    {Math.min(manualPageIndex * MANUAL_PAGE_SIZE, filteredAvailableContainers.length)} of{" "}
                    {filteredAvailableContainers.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={manualPageIndex <= 1}
                      onClick={() => setManualPageIndex((p) => Math.max(1, p - 1))}
                      className="p-1 rounded border border-border hover:bg-accent disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[11px]">
                      {manualPageIndex} / {manualTotalPages}
                    </span>
                    <button
                      type="button"
                      disabled={manualPageIndex >= manualTotalPages}
                      onClick={() => setManualPageIndex((p) => Math.min(manualTotalPages, p + 1))}
                      className="p-1 rounded border border-border hover:bg-accent disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Select Columns for Export */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-muted-foreground" />
              4. Select Columns to Include in Agency's Export File ({selectedColumnKeys.length} selected)
            </label>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedColumnKeys(columns.map((c) => c.key))}
                className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-medium"
              >
                Select All
              </button>
              <span>&bull;</span>
              <button
                type="button"
                onClick={() => setSelectedColumnKeys([])}
                className="text-muted-foreground hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-border bg-background">
            {columns.map((col) => {
              const isSelected = selectedColumnKeys.includes(col.key);
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => handleToggleColumn(col.key)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-black text-white dark:bg-white dark:text-black border-transparent font-medium shadow-xs"
                      : "border-border text-muted-foreground hover:bg-accent/60"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {col.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Action Button (Black Primary Button as requested) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium rounded-lg border border-border hover:bg-accent text-foreground transition-colors cursor-pointer"
          >
            Cancel & Return
          </button>

          <button
            type="button"
            onClick={handleAllocate}
            disabled={availableCount === 0}
            className="w-full sm:w-auto px-7 py-2.5 rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Allocate Containers
          </button>
        </div>
      </div>
    </div>
  );
}
